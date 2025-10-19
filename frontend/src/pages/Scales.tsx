import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { usersApi, scalesApi, groupsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { User, Scale, Group } from '@/types/api'
import { CalendarDays, Share2, Bell, CheckCircle2, Edit, XCircle, Eye, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useSound } from '@/hooks/useSound'

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

export default function Scales() {
  const { user: currentUser } = useAuthStore()
  const isAdmin = currentUser?.role === 'ADMIN'
  const { toast } = useToast()
  const { enabled: soundEnabled, setEnabled: setSoundEnabled, playSuccess, playError } = useSound()

  const [members, setMembers] = useState<User[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)

  const [scales, setScales] = useState<Scale[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    weekStart: '',
    memberIds: [] as string[],
    groupId: '' as string,
  })

  const [monthFilter, setMonthFilter] = useState<string>('') // YYYY-MM
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingScaleId, setEditingScaleId] = useState<string | null>(null)
  const [editMemberIds, setEditMemberIds] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)

  const [groups, setGroups] = useState<Group[]>([])
  const [_loadingGroups, setLoadingGroups] = useState(false)
  const [groupFilter, setGroupFilter] = useState<string>('')
  const [scaleMemberViews, setScaleMemberViews] = useState<Record<string, { id: string; viewedAt?: string | null }[]>>({})
  const [isPublishOpen, setIsPublishOpen] = useState(false)
  const [publishScaleId, setPublishScaleId] = useState<string | null>(null)
  const [publishGroupId, setPublishGroupId] = useState<string>('')
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [viewScale, setViewScale] = useState<Scale | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteScaleId, setDeleteScaleId] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteIsPublished, setDeleteIsPublished] = useState(false)

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
    loadMembers()
  }, [])

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoadingGroups(true)
        const res = await groupsApi.getAll()
        setGroups(res.groups || [])
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro', description: 'Falha ao carregar grupos', variant: 'destructive' })
      } finally {
        setLoadingGroups(false)
      }
    }
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

  const resetForm = () => setForm({ weekStart: '', memberIds: [], groupId: '' })

  const handleCreateScale = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    const weekStart = form.weekStart.trim()
    if (!weekStart) {
      toast({ title: 'Data obrigatória', description: 'Informe a data inicial da semana.', variant: 'destructive' })
      return
    }

    setCreating(true)
    try {
      const res = await scalesApi.create({ weekStart, assignedMemberIds: [...form.memberIds], groupId: form.groupId || undefined })
      const s = res.scale
      const created: Scale = {
        id: s.id,
        weekStart: s.weekStart || weekStart,
        weekEnd: s.weekEnd || undefined,
        assignedMemberIds: Array.isArray(s.members) ? s.members.map((m: any) => m.id) : [...form.memberIds],
        status: s.status || 'DRAFT',
        createdById: s.createdBy || s.createdById || currentUser?.id || 'unknown',
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      }
      setScales(prev => [created, ...prev])
      setScaleMemberViews(prev => ({ ...prev, [created.id]: created.assignedMemberIds.map(id => ({ id, viewedAt: null })) }))
      playSuccess()
      toast({ title: 'Escala criada', description: `Semana ${formatDate(created.weekStart)} a ${formatDate(created.weekEnd || created.weekStart)} com ${created.assignedMemberIds.length} membro(s).` })
      resetForm()
    } catch (err: any) {
      playError()
      toast({ title: 'Erro', description: err.message || 'Falha ao criar escala', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const openPublish = (scaleId: string) => {
    setPublishScaleId(scaleId)
    setPublishGroupId(groupFilter || '')
    setIsPublishOpen(true)
  }

  const publishScale = async () => {
    if (!publishScaleId) return
    try {
      const res = await scalesApi.update(publishScaleId, { status: 'PUBLISHED', groupId: publishGroupId || undefined } as any)
      const updated = res.scale
      setScales(prev => prev.map(s => s.id === publishScaleId ? {
        id: updated.id,
        weekStart: updated.weekStart || s.weekStart,
        weekEnd: updated.weekEnd || s.weekEnd,
        assignedMemberIds: Array.isArray(updated.members) ? updated.members.map((m: any) => m.id) : s.assignedMemberIds,
        status: updated.status || 'PUBLISHED',
        createdById: updated.createdBy || updated.createdById || s.createdById,
        createdAt: updated.createdAt || s.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString(),
      } : s))
      const memberViews = Array.isArray(updated.members) ? updated.members.map((m: any) => ({ id: m.id, viewedAt: m.viewedAt })) : (scaleMemberViews[publishScaleId] || [])
      setScaleMemberViews(prev => ({ ...prev, [publishScaleId]: memberViews }))
      toast({ title: 'Publicado', description: 'Escala publicada para o grupo selecionado.' })
      playSuccess()
      setIsPublishOpen(false)
      setPublishScaleId(null)
    } catch (err) {
      console.error(err)
      playError()
      toast({ title: 'Erro', description: 'Falha ao publicar escala', variant: 'destructive' })
    }
  }

  const unpublishScale = async (id: string) => {
    try {
      const res = await scalesApi.update(id, { status: 'DRAFT' } as any)
      const updated = res.scale
      setScales(prev => prev.map(s => s.id === id ? {
        id: updated.id,
        weekStart: updated.weekStart || s.weekStart,
        weekEnd: updated.weekEnd || s.weekEnd,
        assignedMemberIds: Array.isArray(updated.members) ? updated.members.map((m: any) => m.id) : s.assignedMemberIds,
        status: updated.status || 'DRAFT',
        createdById: updated.createdBy || updated.createdById || s.createdById,
        createdAt: updated.createdAt || s.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString(),
      } : s))
      const memberViews = Array.isArray(updated.members) ? updated.members.map((m: any) => ({ id: m.id, viewedAt: m.viewedAt })) : (scaleMemberViews[id] || [])
      setScaleMemberViews(prev => ({ ...prev, [id]: memberViews }))
      toast({ title: 'Despublicado', description: 'A escala voltou para rascunho.' })
      playSuccess()
    } catch (err) {
      console.error(err)
      playError()
      toast({ title: 'Erro', description: 'Falha ao despublicar escala', variant: 'destructive' })
    }
  }

  const shareWhatsApp = (scale: Scale) => {
    try {
      const memberNames = (members || [])
        .filter(m => scale.assignedMemberIds.includes(m.id))
        .map(m => m.name)
      const msg = `Escala ${formatDate(scale.weekStart)} a ${formatDate(scale.weekEnd || scale.weekStart)}\nParticipantes: ${memberNames.join(', ')}`
      const url = `https://wa.me/?text=${encodeURIComponent(msg)}`
      window.open(url, '_blank')
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao compartilhar no WhatsApp', variant: 'destructive' })
    }
  }

  const notifyMembers = async (scale: Scale) => {
    try {
      const count = Array.isArray(scale.assignedMemberIds) ? scale.assignedMemberIds.length : 0
      toast({ title: 'Notificação enviada', description: `Participantes notificados (simulado): ${count}.` })
      playSuccess()
    } catch (err) {
      playError()
      toast({ title: 'Erro', description: 'Falha ao enviar notificação', variant: 'destructive' })
    }
  }

  const openEdit = (scale: Scale) => {
    setEditingScaleId(scale.id)
    setEditMemberIds([...scale.assignedMemberIds])
    setIsEditOpen(true)
  }

  const openView = (scale: Scale) => {
    setViewScale(scale)
    setIsViewOpen(true)
  }

  const toggleEditMember = (id: string) => {
    setEditMemberIds(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id])
  }

  const saveEdit = async () => {
    if (!editingScaleId) return
    setSavingEdit(true)
    try {
      const res = await scalesApi.update(editingScaleId, { assignedMemberIds: editMemberIds } as any)
      const updated = res.scale
      setScales(prev => prev.map(s => s.id === editingScaleId ? {
        id: updated.id,
        weekStart: updated.weekStart || s.weekStart,
        weekEnd: updated.weekEnd || s.weekEnd,
        assignedMemberIds: Array.isArray(updated.members) ? updated.members.map((m: any) => m.id) : editMemberIds,
        status: updated.status || s.status,
        createdById: updated.createdBy || updated.createdById || s.createdById,
        createdAt: updated.createdAt || s.createdAt,
        updatedAt: updated.updatedAt || new Date().toISOString(),
      } : s))
      setScaleMemberViews(prev => ({ ...prev, [editingScaleId]: editMemberIds.map(id => ({ id, viewedAt: null })) }))
      toast({ title: 'Participantes atualizados', description: 'A escala foi atualizada.' })
      playSuccess()
      setIsEditOpen(false)
      setEditingScaleId(null)
    } catch (err) {
      console.error(err)
      playError()
      toast({ title: 'Erro', description: 'Falha ao atualizar participantes', variant: 'destructive' })
    } finally {
      setSavingEdit(false)
    }
  }

  const openDelete = (id: string) => {
    setDeleteScaleId(id)
    const st = scales.find(s => s.id === id)?.status
    setDeleteIsPublished(st === 'PUBLISHED')
    setDeleteConfirmText('')
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteScaleId) return
    try {
      const res = await scalesApi.delete(deleteScaleId)
      if (res?.success) {
        setScales(prev => prev.filter(s => s.id !== deleteScaleId))
        toast({ title: 'Escala excluída', description: 'A escala foi removida com sucesso.' })
      } else {
        toast({ title: 'Erro', description: 'Falha ao excluir escala', variant: 'destructive' })
      }
    } catch (err) {
      console.error(err)
      toast({ title: 'Erro', description: 'Falha ao excluir escala', variant: 'destructive' })
    } finally {
      setIsDeleteOpen(false)
      setDeleteScaleId(null)
      setDeleteConfirmText('')
      setDeleteIsPublished(false)
    }
  }

  useEffect(() => {
    const loadScales = async () => {
      try {
        const res = await scalesApi.getAll({ month: monthFilter || undefined, groupId: groupFilter || undefined })
        const mapped: Scale[] = (res.scales || []).map((s: any) => ({
          id: s.id,
          weekStart: s.weekStart,
          weekEnd: s.weekEnd,
          assignedMemberIds: Array.isArray(s.members) ? s.members.map((m: any) => m.id) : (s.assignedMemberIds || []),
          status: s.status || 'DRAFT',
          createdById: s.createdBy || s.createdById || '',
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          groupId: s.groupId || undefined,
        }))
        setScales(mapped)
        const viewsMap: Record<string, { id: string; viewedAt?: string | null }[]> = {}
        ;(res.scales || []).forEach((s: any) => {
          viewsMap[s.id] = Array.isArray(s.members) ? s.members.map((m: any) => ({ id: m.id, viewedAt: m.viewedAt })) : []
        })
        setScaleMemberViews(viewsMap)
      } catch (err) {
        console.error(err)
        toast({ title: 'Erro', description: 'Falha ao carregar escalas', variant: 'destructive' })
      }
    }
    loadScales()
  }, [monthFilter, groupFilter])

  const monthScales = useMemo(() => {
    if (!monthFilter) return scales
    return scales.filter(s => (s.weekStart || '').slice(0, 7) === monthFilter)
  }, [scales, monthFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Escalas</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soundEnabled} onChange={e => setSoundEnabled(e.target.checked)} />
          <span>Som</span>
        </label>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Criar escala semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateScale} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="week-start">Data inicial da semana</Label>
                  <Input id="week-start" type="date" value={form.weekStart} onChange={e => setForm({ ...form, weekStart: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Selecionar membros</Label>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-auto border rounded-md p-3">
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Publicar em grupo (opcional)</Label>
                  <Select value={form.groupId || 'NONE'} onValueChange={(v) => setForm({ ...form, groupId: v === 'NONE' ? '' : v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Nenhum</SelectItem>
                      {(groups || []).map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Escala'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Escala do mês
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="month">Filtrar mês</Label>
              <Input id="month" type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={groupFilter || 'ALL'} onValueChange={(v) => setGroupFilter(v === 'ALL' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  {(groups || []).map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {monthScales.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma escala para o mês selecionado.</p>
          ) : (
            <div className="space-y-4">
              {monthScales.map(scale => (
                <div key={scale.id} className="rounded-md border p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium break-words">Semana {formatDate(scale.weekStart)} a {formatDate(scale.weekEnd || scale.weekStart)}</p>
                      <p className="text-xs text-muted-foreground break-words">Status: {scale.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'} {scale.groupId ? `• Grupo: ${(groups.find(g => g.id === scale.groupId)?.name) || '—'}` : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                      <Button variant="outline" size="sm" onClick={() => shareWhatsApp(scale)} title="Compartilhar pelo WhatsApp">
                        <Share2 className="h-4 w-4 mr-1" /> WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => notifyMembers(scale)} title="Enviar notificação">
                        <Bell className="h-4 w-4 mr-1" /> Notificar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openView(scale)} title="Visualizar escala">
                        <Eye className="h-4 w-4 mr-1" /> Visualizar
                      </Button>
                      {isAdmin && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEdit(scale)} title="Editar participantes">
                            <Edit className="h-4 w-4 mr-1" /> Editar
                          </Button>
                          {scale.status === 'PUBLISHED' ? (
                            <Button variant="outline" size="sm" onClick={() => unpublishScale(scale.id)} title="Despublicar escala">
                              <XCircle className="h-4 w-4 mr-1" /> Despublicar
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" onClick={() => openPublish(scale.id)} title="Publicar escala">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Publicar
                            </Button>
                          )}
                          <Button variant="destructive" size="sm" onClick={() => openDelete(scale.id)} title="Excluir escala">
                            <Trash2 className="h-4 w-4 mr-1" /> Excluir
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(members || []).filter(m => scale.assignedMemberIds.includes(m.id)).map(m => {
                      const viewObj = (scaleMemberViews[scale.id] || []).find(v => v.id === m.id)
                      const viewed = !!(viewObj?.viewedAt)
                      return (
                        <span key={m.id} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 text-xs" title={viewed ? (viewObj?.viewedAt ? `Viu em ${formatDate(viewObj.viewedAt)}` : 'Visualizou') : undefined}>
                          {m.name}
                          {viewed && <Eye className="h-3 w-3 ml-1 text-green-600" />}
                        </span>
                      )
                    })}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Visualizado por {(scaleMemberViews[scale.id] || []).filter(v => !!v.viewedAt).length}/{scale.assignedMemberIds.length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar participantes</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Selecionar membros</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-auto border rounded-md p-3">
              {(members || []).map(m => (
                <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={editMemberIds.includes(m.id)} onChange={() => toggleEditMember(m.id)} />
                  <span>{m.name} <span className="text-muted-foreground">({m.role === 'ADMIN' ? 'Admin' : 'Membro'})</span></span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
            <Button onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish dialog */}
      <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publicar escala em um grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Selecionar grupo</Label>
            <Select value={publishGroupId || 'NONE'} onValueChange={(v) => setPublishGroupId(v === 'NONE' ? '' : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhum</SelectItem>
                {(groups || []).map(g => (
                  <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishOpen(false)}>Cancelar</Button>
            <Button onClick={publishScale}>Publicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da escala</DialogTitle>
          </DialogHeader>
          {viewScale && (
            <div className="space-y-2 text-sm">
              <p><strong>Semana:</strong> {formatDate(viewScale.weekStart)} a {formatDate(viewScale.weekEnd || viewScale.weekStart)}</p>
              <p><strong>Status:</strong> {viewScale.status === 'PUBLISHED' ? 'Publicado' : 'Rascunho'}</p>
              <p><strong>Grupo:</strong> {viewScale.groupId ? (groups.find(g => g.id === viewScale.groupId)?.name || '—') : '—'}</p>
              <div>
                <Label>Participantes</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(members || []).filter(m => viewScale.assignedMemberIds.includes(m.id)).map(m => (
                    <span key={m.id} className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-1 text-xs">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir escala</DialogTitle>
          </DialogHeader>
          {deleteIsPublished ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Esta escala está publicada. A exclusão removerá todas as referências e não pode ser desfeita.
              </p>
              <p className="text-sm">Para confirmar, digite <span className="font-semibold">EXCLUIR</span> abaixo.</p>
              <Input
                placeholder="EXCLUIR"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. Confirma a exclusão?
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteIsPublished && deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR'}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

}