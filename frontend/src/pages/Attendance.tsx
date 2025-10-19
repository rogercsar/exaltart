import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { attendanceApi, rehearsalsApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UserCheck, ChevronLeft, Plus, Printer, Share2, Edit, Trash2, Eye } from 'lucide-react'
import type { AttendanceStatus, Rehearsal } from '@/types/api'

export default function Attendance() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const params = useParams()
  const rehearsalIdParam = params.id

  const isAdmin = currentUser?.role === 'ADMIN'

  const [rehearsal, setRehearsal] = useState<Rehearsal | null>(null)
  const [members, setMembers] = useState<{ id: string; name: string; email: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMap, setStatusMap] = useState<Record<string, { status: AttendanceStatus; note?: string }>>({})
const [searchParams] = useSearchParams()
const isReadonly = searchParams.get('readonly') === '1'
const [isNewCallOpen, setIsNewCallOpen] = useState(false)
const [newEventType, setNewEventType] = useState<string>('Ensaio')
const [newEventDate, setNewEventDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
const [newEventTime, setNewEventTime] = useState<string>(() => new Date().toTimeString().slice(0, 5))
const [rehearsalsList, setRehearsalsList] = useState<Rehearsal[]>([])
  const [listLoading, setListLoading] = useState<boolean>(false)
  const [searchText, setSearchText] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  useEffect(() => {
    if (!isAdmin) return
    loadPage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehearsalIdParam])

  const loadPage = async () => {
    try {
      setLoading(true)
      if (rehearsalIdParam) {
        const r = await rehearsalsApi.getById(rehearsalIdParam)
        setRehearsal(r.rehearsal)
      } else {
        setListLoading(true)
        const r = await rehearsalsApi.getAll()
        setRehearsalsList(r.rehearsals || [])
        setListLoading(false)
      }
      const u = await usersApi.getAll()
      setMembers(u.users)
      if (rehearsalIdParam) {
        const a = await attendanceApi.getByRehearsal(rehearsalIdParam)
        const map: Record<string, { status: AttendanceStatus; note?: string }> = {}
        for (const rec of (a.records || [])) {
          map[rec.userId] = { status: rec.status, note: rec.note || '' }
        }
        setStatusMap(map)
      } else {
        setStatusMap({})
      }
    } catch (error) {
      console.error('Erro ao carregar página de presença:', error)
      toast({ title: 'Erro', description: 'Falha ao carregar dados', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangeStatus = (userId: string, status: AttendanceStatus) => {
    setStatusMap(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), status } }))
  }

  const handleChangeNote = (userId: string, note: string) => {
    setStatusMap(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), note } }))
  }

  const saveAttendance = async () => {
    if (!rehearsalIdParam) return
    try {
      const missingJustification = Object.entries(statusMap).some(([, v]) => v.status === 'JUSTIFIED' && (!v.note || !v.note.trim()))
      if (missingJustification) {
        toast({ title: 'Justificativa obrigatória', description: 'Preencha a justificativa para faltas justificadas.', variant: 'destructive' })
        return
      }
      const records = Object.entries(statusMap)
        .filter(([, v]) => !!v.status)
        .map(([userId, v]) => ({ userId, status: v.status, note: v.note }))
      const res = await attendanceApi.setForRehearsal(rehearsalIdParam, records)
      if (res.records) {
        toast({ title: 'Sucesso', description: 'Presença registrada.' })
      } else {
        toast({ title: 'Aviso', description: 'Nenhum registro foi salvo.' })
      }
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao salvar presença', variant: 'destructive' })
    }
  }

  const statusLabel = (s?: AttendanceStatus) => {
    switch (s) {
      case 'PRESENT': return 'Presente'
      case 'ABSENT': return 'Ausente'
      case 'JUSTIFIED': return 'Justificado'
      default: return '—'
    }
  }

  const memberRows = useMemo(() => {
    return (members || []).map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      status: statusMap[m.id]?.status,
      note: statusMap[m.id]?.note || ''
    }))
  }, [members, statusMap])

  const reportSummary = useMemo(() => {
    const total = memberRows.length
    const present = memberRows.filter(r => r.status === 'PRESENT').length
    const justified = memberRows.filter(r => r.status === 'JUSTIFIED').length
    const absent = memberRows.filter(r => r.status === 'ABSENT').length
    const unmarked = memberRows.filter(r => !r.status).length
    const pct = (n: number) => (total ? Math.round((n * 100) / total) : 0)
    return { total, present, justified, absent, unmarked, presentPct: pct(present), justifiedPct: pct(justified), absentPct: pct(absent) }
  }, [memberRows])
 
   const filteredRehearsals = useMemo(() => {
     const q = searchText.trim().toLowerCase()
     return (rehearsalsList || []).filter(r => {
       const matchesQuery = !q || (r.title?.toLowerCase().includes(q) || (r.location || '').toLowerCase().includes(q))
       const d = new Date(r.date).getTime()
       const startOk = !filterStartDate || new Date(filterStartDate).getTime() <= d
       const endOk = !filterEndDate || new Date(filterEndDate).getTime() >= d
       return matchesQuery && startOk && endOk
     })
   }, [rehearsalsList, searchText, filterStartDate, filterEndDate])
 
   const changeJustificationNote = (userId: string, note: string) => {
     handleChangeNote(userId, note)
   }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const saveNewCall = async () => {
    try {
      const missingJustification = Object.entries(statusMap).some(([, v]) => v.status === 'JUSTIFIED' && (!v.note || !v.note.trim()))
      if (missingJustification) {
        toast({ title: 'Justificativa obrigatória', description: 'Preencha a justificativa para faltas justificadas.', variant: 'destructive' })
        return
      }
      const dateIso = new Date(`${newEventDate}T${newEventTime}:00`).toISOString()
      const { rehearsal: created } = await rehearsalsApi.create({
        title: `Chamada de Presença - ${newEventType}`,
        date: dateIso
      })
      const records = Object.entries(statusMap)
        .filter(([, v]) => !!v.status)
        .map(([userId, v]) => ({ userId, status: v.status, note: v.note }))
      if (records.length) {
        await attendanceApi.setForRehearsal(created.id, records)
      }
      setIsNewCallOpen(false)
      toast({ title: 'Chamada criada', description: 'Redirecionando para edição...' })
      navigate(`/attendance/${created.id}`)
    } catch (error: any) {
      toast({ title: 'Erro ao criar chamada', description: error?.message || 'Falha ao criar chamada', variant: 'destructive' })
    }
  }

  const handleDeleteRehearsal = async (id: string) => {
    try {
      await rehearsalsApi.delete(id)
      toast({ title: 'Excluído', description: 'Chamada excluída.' })
      loadPage()
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message || 'Falha ao excluir chamada', variant: 'destructive' })
    }
  }

  const handleShare = async (id: string) => {
    try {
      const url = `${window.location.origin}/attendance/${id}`
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copiado', description: url })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao copiar link', variant: 'destructive' })
    }
  }

  const handleCopyReport = async () => {
    try {
      const s = reportSummary
      const summary = [
        'Relatório de Presença',
        rehearsal ? `Chamada: ${rehearsal.title}` : '',
        rehearsal ? `Data: ${formatDate(rehearsal.date)} ${formatTime(rehearsal.date)}` : '',
        `Total: ${s.total}`,
        `Presentes: ${s.present} (${s.presentPct}%)`,
        `Justificados: ${s.justified} (${s.justifiedPct}%)`,
        `Ausentes: ${s.absent} (${s.absentPct}%)`,
        s.unmarked ? `Não marcados: ${s.unmarked}` : ''
      ].filter(Boolean).join('\n')
      await navigator.clipboard.writeText(summary)
      toast({ title: 'Resumo copiado', description: 'Relatório copiado para a área de transferência.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao copiar resumo', variant: 'destructive' })
    }
  }

  useEffect(() => {
    if (searchParams.get('print') && rehearsal) {
      setTimeout(() => window.print(), 500)
    }
  }, [searchParams, rehearsal])

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamada de Presença</h1>
          <p className="text-gray-600">Acesso restrito ao administrador.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamada de Presença</h1>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!rehearsalIdParam) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chamada de Presença</h1>
            <p className="text-gray-600">Crie novas chamadas e gerencie as existentes</p>
          </div>
          <Dialog open={isNewCallOpen} onOpenChange={setIsNewCallOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Nova Chamada
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Chamada</DialogTitle>
                <DialogDescription>Defina tipo, data e presenças dos membros.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo de evento</Label>
                    <Select value={newEventType} onValueChange={setNewEventType}>
                      <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ensaio">Ensaio</SelectItem>
                        <SelectItem value="Culto">Culto</SelectItem>
                        <SelectItem value="Evento">Evento</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data</Label>
                      <Input type="date" value={newEventDate} onChange={e => setNewEventDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>Hora</Label>
                      <Input type="time" value={newEventTime} onChange={e => setNewEventTime(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Membros</Label>
                  <div className="space-y-3 mt-2">
                    {members.map(m => {
                      const st = statusMap[m.id]?.status
                      const isJustified = st === 'JUSTIFIED'
                      return (
                        <div key={m.id} className="flex items-start justify-between border rounded-md p-3">
                          <div className="space-y-1">
                            <div className="font-medium">{m.name}</div>
                            <div className="text-sm text-gray-600">{m.email}</div>
                          </div>
                          <div className="w-[60%] space-y-2">
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2">
                                <input type="radio" name={`status-${m.id}`} checked={st === 'PRESENT'} onChange={() => handleChangeStatus(m.id, 'PRESENT')} />
                                <span>Presente</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" name={`status-${m.id}`} checked={st === 'JUSTIFIED'} onChange={() => handleChangeStatus(m.id, 'JUSTIFIED')} />
                                <span>Falta com justificativa</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input type="radio" name={`status-${m.id}`} checked={st === 'ABSENT'} onChange={() => handleChangeStatus(m.id, 'ABSENT')} />
                                <span>Falta sem justificativa</span>
                              </label>
                            </div>
                            {isJustified && (
                              <Input placeholder="Justificativa" value={statusMap[m.id]?.note || ''} onChange={e => changeJustificationNote(m.id, e.target.value)} />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewCallOpen(false)}>Cancelar</Button>
                <Button onClick={saveNewCall}><UserCheck className="h-4 w-4 mr-2" /> Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Chamadas realizadas</CardTitle>
            <CardDescription>Visualize e gerencie as chamadas anteriores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="flex-1 min-w-[220px]">
                <Label>Buscar</Label>
                <Input placeholder="Título ou local" value={searchText} onChange={e => setSearchText(e.target.value)} />
              </div>
              <div>
                <Label>Início</Label>
                <Input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Fim</Label>
                <Input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
            </div>
            {listLoading ? (
              <p>Carregando chamadas...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRehearsals.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{formatDate(r.date)} {formatTime(r.date)}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => navigate(`/attendance/${r.id}?print=1`)}>
                          <Printer className="h-4 w-4 mr-2" /> Imprimir
                        </Button>
                        <Button variant="outline" onClick={() => handleShare(r.id)}>
                          <Share2 className="h-4 w-4 mr-2" /> Compartilhar
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/attendance/${r.id}?readonly=1`)}>
                          <Eye className="h-4 w-4 mr-2" /> Visualizar
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/attendance/${r.id}`)}>
                          <Edit className="h-4 w-4 mr-2" /> Editar
                        </Button>
                        <Button variant="destructive" onClick={() => handleDeleteRehearsal(r.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamada de Presença</h1>
          <p className="text-gray-600">Registre a presença dos membros no ensaio</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <Button onClick={saveAttendance} disabled={isReadonly}>
            <UserCheck className="h-4 w-4 mr-2" /> Salvar Presença
          </Button>
        </div>
      </div>

      {rehearsal && (
        <Card>
          <CardHeader>
            <CardTitle>{rehearsal.title}</CardTitle>
            <CardDescription>
              {new Date(rehearsal.date).toLocaleString('pt-BR')} {rehearsal.location ? `• ${rehearsal.location}` : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Attendance table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Membros</CardTitle>
          <CardDescription>Defina o status de presença para cada membro</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell className="w-48">
                    <Select value={row.status || ''} onValueChange={(v) => handleChangeStatus(row.id, v as AttendanceStatus)}>
                      <SelectTrigger disabled={isReadonly}>
                        <SelectValue placeholder={statusLabel(row.status)} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENT">Presente</SelectItem>
                        <SelectItem value="ABSENT">Ausente</SelectItem>
                        <SelectItem value="JUSTIFIED">Justificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Ex: Chegou atrasado, justificativa, etc."
                      value={row.note}
                      onChange={(e) => handleChangeNote(row.id, e.target.value)}
                      disabled={isReadonly}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Relatório de Presença</CardTitle>
          <CardDescription>Resumo desta chamada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-md">
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-xl font-semibold">{reportSummary.total}</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="text-sm text-green-600">Presentes</div>
              <div className="text-xl font-semibold">{reportSummary.present} ({reportSummary.presentPct}%)</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="text-sm text-amber-600">Justificados</div>
              <div className="text-xl font-semibold">{reportSummary.justified} ({reportSummary.justifiedPct}%)</div>
            </div>
            <div className="p-3 border rounded-md">
              <div className="text-sm text-red-600">Ausentes</div>
              <div className="text-xl font-semibold">{reportSummary.absent} ({reportSummary.absentPct}%)</div>
            </div>
          </div>
          {reportSummary.unmarked > 0 && (
            <p className="text-sm text-gray-600 mt-2">Não marcados: {reportSummary.unmarked}</p>
          )}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/attendance/${rehearsalIdParam}?print=1`)}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir relatório
            </Button>
            <Button variant="outline" onClick={handleCopyReport}>
              <Share2 className="h-4 w-4 mr-2" /> Copiar resumo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}