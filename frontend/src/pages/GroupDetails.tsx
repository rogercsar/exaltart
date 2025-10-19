import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { groupsApi, groupItemsApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Group, GroupItem, GroupItemType } from '@/types/api'
import { Upload, Link as LinkIcon, Trash2, Users as UsersIcon, FolderPlus } from 'lucide-react'

export default function GroupDetails() {
  const { id: groupIdParam } = useParams<{ id: string }>()
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'
  const { toast } = useToast()

  const [group, setGroup] = useState<Group | null>(null)
  const [items, setItems] = useState<GroupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingItem, setCreatingItem] = useState(false)

  const [itemType, setItemType] = useState<GroupItemType>('LINK')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const groupId = useMemo(() => groupIdParam || '', [groupIdParam])

  useEffect(() => {
    const load = async () => {
      if (!groupId) return
      setLoading(true)
      try {
        // Carrega grupos e filtra pelo ID
        const { groups } = await groupsApi.getAll()
        const g = (groups || []).find(x => x.id === groupId) || null
        setGroup(g)

        const { items } = await groupItemsApi.getByGroup(groupId)
        setItems(items)
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro', description: 'Falha ao carregar dados do grupo', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [groupId])

  const resetItemForm = () => {
    setItemType('LINK')
    setTitle('')
    setDescription('')
    setUrl('')
    setFile(null)
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !isAdmin) return

    const cleanTitle = title.trim()
    if (!cleanTitle) {
      toast({ title: 'Título obrigatório', description: 'Informe um título para o item.', variant: 'destructive' })
      return
    }

    try {
      setCreatingItem(true)
      let finalUrl: string | undefined = undefined
      let storagePath: string | undefined = undefined

      if (itemType === 'FILE') {
        if (!file) {
          toast({ title: 'Arquivo obrigatório', description: 'Selecione um arquivo para enviar.', variant: 'destructive' })
          setCreatingItem(false)
          return
        }
        const bucket = 'proofs'
        const baseName = file.name || 'arquivo'
        const path = `groups/${groupId}/${Date.now()}_${baseName}`
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { contentType: file.type })
        if (uploadError) {
          throw new Error('Falha ao enviar arquivo: ' + uploadError.message)
        }
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
        finalUrl = publicData.publicUrl
        storagePath = path
      } else if (itemType === 'LINK') {
        const cleanUrl = url.trim()
        try {
          // Validação simples de URL
          if (!cleanUrl) throw new Error('Informe uma URL válida')
          new URL(cleanUrl)
        } catch (err) {
          toast({ title: 'URL inválida', description: 'Informe uma URL válida para o link.', variant: 'destructive' })
          setCreatingItem(false)
          return
        }
        finalUrl = cleanUrl
      }

      const { item } = await groupItemsApi.create({
        groupId,
        title: cleanTitle,
        description: description.trim() || undefined,
        type: itemType,
        url: finalUrl,
        storagePath
      })

      setItems(prev => [item, ...prev])
      toast({ title: 'Item adicionado', description: 'O item foi compartilhado com o grupo.' })
      resetItemForm()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao adicionar item', variant: 'destructive' })
    } finally {
      setCreatingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string, itemStoragePath?: string) => {
    try {
      await groupItemsApi.delete(itemId)
      // Best-effort: tenta remover o arquivo do storage se houver caminho
      if (itemStoragePath) {
        try {
          await supabase.storage.from('proofs').remove([itemStoragePath])
        } catch (_) {
          // Ignora erro de remoção no storage
        }
      }
      setItems(prev => prev.filter(i => i.id !== itemId))
      toast({ title: 'Item removido', description: 'O item foi removido do grupo.' })
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Falha ao remover item', variant: 'destructive' })
    }
  }

  if (!groupId) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">ID do grupo não informado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/groups" className="text-sm text-primary">← Voltar</Link>
          <h2 className="text-2xl font-bold">Detalhes do Grupo</h2>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando dados do grupo...</p>
      ) : !group ? (
        <p className="text-sm text-muted-foreground">Grupo não encontrado.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5" />
                {group.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {group.description && (
                <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {(group.members || []).map(m => (
                  <span key={m.id} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                    {m.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderPlus className="h-5 w-5" />
                  Compartilhar item com o grupo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="item-title">Título</Label>
                      <Input id="item-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Guia de repertório" />
                    </div>
                    <div>
                      <Label>Tipo</Label>
                      <Select value={itemType} onValueChange={val => setItemType(val as GroupItemType)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LINK">Link</SelectItem>
                          <SelectItem value="FILE">Arquivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="item-desc">Descrição (opcional)</Label>
                    <textarea id="item-desc" value={description} onChange={e => setDescription(e.target.value)} className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Observações sobre o item" rows={2} />
                  </div>

                  {itemType === 'LINK' ? (
                    <div>
                      <Label htmlFor="item-url">URL</Label>
                      <Input id="item-url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="item-file">Arquivo</Label>
                      <Input id="item-file" type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={creatingItem}>
                      {creatingItem ? 'Salvando...' : (itemType === 'FILE' ? (<span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" /> Enviar arquivo</span>) : (<span className="inline-flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Salvar link</span>))}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Itens compartilhados</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum item compartilhado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {items.map(it => (
                    <div key={it.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="font-medium">{it.title}</p>
                        <p className="text-xs text-muted-foreground">{it.type === 'FILE' ? 'Arquivo' : 'Link'} {it.url ? '— ' : ''}{it.url && (<a href={it.url} target="_blank" rel="noreferrer" className="text-primary underline">Abrir</a>)}
                          {it.description ? ` — ${it.description}` : ''}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(it.id, it.storagePath)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}