import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { devotionalsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

import type { DevotionalPost } from '@/types/api'

export default function Devotionals() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const isAdmin = user?.role === 'ADMIN'
  const [devotionals, setDevotionals] = useState<DevotionalPost[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [query, setQuery] = useState('')
  const [freqFilter, setFreqFilter] = useState<'WEEKLY' | 'MONTHLY' | ''>('')

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY' | ''>('')
  const [publishedAt, setPublishedAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editItem, setEditItem] = useState<DevotionalPost | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editFrequency, setEditFrequency] = useState<'WEEKLY' | 'MONTHLY' | ''>('')
  const [editPublishedAt, setEditPublishedAt] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchDevotionals = async () => {
      try {
        const res = await devotionalsApi.getAll({ page, limit, q: query || undefined, frequency: freqFilter || undefined })
        setDevotionals(res.data || [])
        setTotal(res.pagination.total || 0)
        setPages(res.pagination.pages || 1)
      } catch (error) {
        console.error('Erro ao buscar devocionais:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchDevotionals()
  }, [page, limit, query, freqFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const excerpt = (text: string, len = 160) => {
    const clean = (text || '').replace(/\s+/g, ' ').trim()
    if (clean.length <= len) return clean
    return clean.substring(0, len) + '…'
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!title.trim() || !content.trim() || !frequency) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, conteúdo e frequência.',
        variant: 'destructive'
      })
      return
    }
    setSubmitting(true)
    try {
      const payload: { title: string; content: string; frequency: 'WEEKLY' | 'MONTHLY'; publishedAt?: string } = {
        title: title.trim(),
        content: content.trim(),
        frequency: frequency as 'WEEKLY' | 'MONTHLY',
      }
      if (publishedAt) payload.publishedAt = publishedAt
      const res = await devotionalsApi.create(payload)
      // prepend newly created devotional
      setDevotionals((prev) => [res.devotional, ...prev])
      // reset form
      setTitle('')
      setContent('')
      setFrequency('')
      setPublishedAt('')
      toast({ title: 'Devocional publicado', description: 'Seu devocional foi criado com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro ao criar devocional', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const openEdit = (item: DevotionalPost) => {
    setEditItem(item)
    setEditTitle(item.title)
    setEditContent(item.content)
    setEditFrequency(item.frequency)
    setEditPublishedAt(toInputDateTime(item.publishedAt))
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !editItem) return
    if (!editTitle.trim() || !editContent.trim() || !editFrequency) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha título, conteúdo e frequência.',
        variant: 'destructive'
      })
      return
    }
    setEditing(true)
    try {
      const payload = {
        title: editTitle.trim(),
        content: editContent.trim(),
        frequency: editFrequency as 'WEEKLY' | 'MONTHLY',
        publishedAt: editPublishedAt || undefined
      }
      const res = await devotionalsApi.update(editItem.id, payload)
      setDevotionals((prev) => prev.map((d) => (d.id === editItem.id ? res.devotional : d)))
      setIsEditOpen(false)
      setEditItem(null)
      toast({ title: 'Devocional atualizado', description: 'As alterações foram salvas.' })
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
      await devotionalsApi.delete(id)
      setDevotionals((prev) => prev.filter((d) => d.id !== id))
      setTotal((t) => Math.max(0, t - 1))
      toast({ title: 'Devocional excluído', description: 'O devocional foi removido.' })
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
      description: 'Tem certeza que deseja excluir este devocional?',
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
        <h1 className="text-2xl font-bold text-gray-900">Devocionais</h1>
        <p className="text-gray-600">Veja os devocionais publicados e, se for administrador, adicione novos conteúdos.</p>
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
              <Label>Frequência</Label>
              <Select value={freqFilter} onValueChange={(v) => { setPage(1); setFreqFilter(v === 'ALL' ? '' : (v as 'WEEKLY' | 'MONTHLY')) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
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
            <CardTitle>Novo Devocional</CardTitle>
            <CardDescription>Preencha os campos para publicar um devocional.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreate}>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Fé que move montanhas" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <textarea id="content" value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Escreva o devocional aqui..." />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Frequência</Label>
                  <Select value={frequency} onValueChange={(v) => setFrequency(v as 'WEEKLY' | 'MONTHLY')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="publishedAt">Data de Publicação (opcional)</Label>
                  <Input id="publishedAt" type="datetime-local" value={publishedAt} onChange={(e) => setPublishedAt(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Publicando...' : 'Publicar Devocional'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Devocionais Recentes</CardTitle>
          <CardDescription>Últimos devocionais publicados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Carregando devocionais...</p>
          ) : (devotionals || []).length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum devocional publicado</p>
          ) : (
            <div className="space-y-4">
              {(devotionals || []).map((d) => (
                <div key={d.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium leading-none">{d.title}</p>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => openEdit(d)}>Editar</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleDelete(d.id)} disabled={deletingId === d.id}>Excluir</Button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">Publicado em {formatDate(d.publishedAt || d.createdAt)} • {d.frequency === 'WEEKLY' ? 'Semanal' : 'Mensal'}</p>
                  <p className="text-sm text-muted-foreground">{excerpt(d.content)}</p>
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
            <DialogTitle>Editar Devocional</DialogTitle>
            <DialogDescription>Atualize os campos do devocional selecionado.</DialogDescription>
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
                <Label>Frequência</Label>
                <Select value={editFrequency} onValueChange={(v) => setEditFrequency(v as 'WEEKLY' | 'MONTHLY')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-publishedAt">Data de Publicação</Label>
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

// Edit Dialog
// Add dialog at the end of component render
// Note: We place it just before closing container