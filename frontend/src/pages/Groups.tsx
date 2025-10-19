import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { usersApi, groupsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import type { User, Group } from '@/types/api'
import { Plus, Users as UsersIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Groups() {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'
  const { toast } = useToast()

  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const [groups, setGroups] = useState<Group[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    memberIds: [] as string[],
  })

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoadingMembers(true)
        const res = await usersApi.getAll()
        setMembers(res.users)
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro', description: 'Falha ao carregar membros', variant: 'destructive' })
      } finally {
        setLoadingMembers(false)
      }
    }
    const loadGroups = async () => {
      try {
        const res = await groupsApi.getAll()
        setGroups(res.groups)
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro', description: 'Falha ao carregar grupos', variant: 'destructive' })
      }
    }
    loadMembers()
    loadGroups()
  }, [])

  const toggleMember = (id: string) => {
    setForm(prev => {
      const exists = prev.memberIds.includes(id)
      return {
        ...prev,
        memberIds: exists ? prev.memberIds.filter(m => m !== id) : [...prev.memberIds, id]
      }
    })
  }

  const resetForm = () => setForm({ name: '', description: '', memberIds: [] })

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    const name = form.name.trim()
    if (!name) {
      toast({ title: 'Nome obrigatório', description: 'Informe um nome para o grupo.', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const res = await groupsApi.create({ name, description: form.description.trim() || '', memberIds: [...form.memberIds] })
      setGroups(prev => [res.group, ...prev])
      toast({ title: 'Grupo criado', description: `"${res.group.name}" foi criado com ${res.group.memberIds.length} participante(s).` })
      resetForm()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao criar grupo', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Grupos</h2>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Criar novo grupo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="group-name">Nome do grupo</Label>
                  <Input id="group-name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Louvor Manhã" />
                </div>
                <div>
                  <Label htmlFor="group-desc">Descrição (opcional)</Label>
                  <textarea id="group-desc" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Objetivo ou observações" rows={2} />
                </div>
              </div>

              <div>
                <Label>Selecionar membros</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-auto border rounded-md p-3">
                  {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Carregando membros...</p>
                  ) : (
                    (members || []).map(m => (
                      <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={form.memberIds.includes(m.id)} onChange={() => toggleMember(m.id)} />
                        <span>{m.name} <span className="text-muted-foreground">({m.role === 'ADMIN' ? 'Admin' : 'Membro'})</span></span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Grupo'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            Meus grupos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum grupo criado ainda.</p>
          ) : (
            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      {group.description && (
                        <p className="text-sm text-muted-foreground">{group.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(group.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(group.members || []).map(m => (
                      <span key={m.id} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                        {m.name}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button asChild>
                      <Link to={`/groups/${group.id}`}>Detalhes</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}