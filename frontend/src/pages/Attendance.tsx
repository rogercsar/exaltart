import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { attendanceApi, rehearsalsApi, usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UserCheck, ChevronLeft } from 'lucide-react'
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
          <Button onClick={saveAttendance}>
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
                      <SelectTrigger>
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
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}