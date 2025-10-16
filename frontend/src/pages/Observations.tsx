import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { observationsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

import type { Observation } from '@/types/api'

export default function Observations() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const isAdmin = user?.role === 'ADMIN'
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState<string>('')
  const [publishedAt, setPublishedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editItem, setEditItem] = useState<Observation | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPublishedAt, setEditPublishedAt] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchObservations = async () => {
      try {
        const res = await observationsApi.getAll({ page, limit, q: query || undefined, category: categoryFilter || undefined })
        setObservations(res.data || [])
        setTotal(res.pagination.total || 0)
        setPages(res.pagination.pages || 1)
      } catch (error) {
        console.error('Erro ao buscar observações:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchObservations()
  }, [page, limit, query, categoryFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha título e conteúdo.', variant: 'destructive' })
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        category: category || undefined,
        publishedAt: publishedAt || undefined
      }
      const res = await observationsApi.create(payload)
      setObservations((prev) => [res.observation, ...prev])
      setTitle('')
      setContent('')
      setCategory('')
      setPublishedAt('')
      toast({ title: 'Observação criada', description: 'A observação foi salva com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro ao criar', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const toInputDateTime = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const min = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`
  }

  const openEdit = (item: Observation) => {
    setEditItem(item)
    setEditTitle(item.title)
    setEditContent(item.content)
    setEditCategory(item.category || '')
    setEditPublishedAt(toInputDateTime(item.publishedAt))
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editItem) return
    if (!editTitle.trim() || !editContent.trim()) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha título e conteúdo.', variant: 'destructive' })
      return
    }
    setEditing(true)
    try {
      const payload = {
        title: editTitle.trim(),
        content: editContent.trim(),
        category: editCategory || undefined,
        publishedAt: editPublishedAt || undefined
      }
      const res = await observationsApi.update(editItem.id, payload)
      setObservations((prev) => prev.map((o) => (o.id === editItem.id ? res.observation : o)))
      setIsEditOpen(false)
      setEditItem(null)
      toast({ title: 'Observação atualizada', description: 'As alterações foram salvas.' })
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setEditing(false)
    }
  }

  const performDelete = async (id: string) => {
    if (!isAdmin) return
    setDeletingId(id)
    try {
      await observationsApi.delete(id)
      setObservations((prev) => prev.filter((o) => o.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      toast({ title: 'Observação excluída', description: 'A observação foi removida.' })
    } catch (error: any) {
      toast({ title: 'Erro ao excluir', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setDeletingId(null)
    }
  }

  const handleDelete = (id: string) => {
    if (!isAdmin) return
    toast({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta observação?',
      action: (
        <ToastAction altText="Excluir" onClick={() => performDelete(id)}>
          Excluir
        </ToastAction>
      )
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Observações</h1>
        <p className="text-gray-600">Notas e observações do ministério. Administradores podem adicionar novos registros.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <Input id="search" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value) }} placeholder="Buscar por título ou conteúdo" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={(v) => { setPage(1); setCategoryFilter(v === 'ALL' ? '' : v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="GERAL">Geral</SelectItem>
                  <SelectItem value="EQUIPE">Equipe</SelectItem>
                  <SelectItem value="ESPIRITUAL">Espiritual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Itens por página</Label>
              <Select value={String(limit)} onValueChange={(v) => { setPage(1); setLimit(parseInt(v, 10)) }}>
                <SelectTrigger>
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Nova Observação</CardTitle>
            <CardDescription>Registre uma nova observação para referência futura.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Nota sobre ensaio" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Escreva a observação aqui..." />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GERAL">Geral</SelectItem>
                      <SelectItem value="EQUIPE">Equipe</SelectItem>
                      <SelectItem value="ESPIRITUAL">Espiritual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="publishedAt">Data (opcional)</Label>
                  <Input id="publishedAt" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar Observação'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Observações Recentes</CardTitle>
          <CardDescription>Últimas observações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando observações...</p>
          ) : (observations || []).length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma observação registrada</p>
          ) : (
            <div className="space-y-4">
              {(observations || []).map((o) => (
                <div key={o.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">
                      {o.title} {o.category ? <span className="text-xs text-muted-foreground">• {o.category}</span> : null}
                    </p>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(o)}>Editar</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(o.id)} disabled={deletingId === o.id}>Excluir</Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Registrado em {formatDate(o.publishedAt || o.createdAt)}{o.author?.name ? ` por ${o.author.name}` : ''}</p>
                  <div>
                    <Link to={`/observations/${o.id}`} className="text-xs text-primary hover:underline">Ver detalhes</Link>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-4">
                <p className="text-xs text-muted-foreground">Página {page} de {pages} • Total {total}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</Button>
                  <Button type="button" variant="outline" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages}>Próxima</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(v) => { setIsEditOpen(v); if (!v) setEditItem(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Observação</DialogTitle>
            <DialogDescription>Atualize os campos da observação selecionada.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleUpdate}>
            <div className="space-y-2">
              <Label htmlFor="edit-title">Título</Label>
              <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">Conteúdo</Label>
              <textarea id="edit-content" value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={6} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={editCategory} onValueChange={(v) => setEditCategory(v === 'NONE' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sem categoria</SelectItem>
                    <SelectItem value="GERAL">Geral</SelectItem>
                    <SelectItem value="EQUIPE">Equipe</SelectItem>
                    <SelectItem value="ESPIRITUAL">Espiritual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-publishedAt">Data</Label>
                <Input id="edit-publishedAt" type="datetime-local" value={editPublishedAt} onChange={(e) => setEditPublishedAt(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={editing}>{editing ? 'Salvando...' : 'Salvar alterações'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}