import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { rehearsalsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Clock, UserCheck } from 'lucide-react'
import type { Rehearsal } from '@/types/api'

export default function Rehearsals() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRehearsal, setEditingRehearsal] = useState<Rehearsal | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    date: ''
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchRehearsals()
  }, [])

  const fetchRehearsals = async () => {
    try {
      setLoading(true)
      const response = await rehearsalsApi.getAll()
      setRehearsals(response.rehearsals)
    } catch (error) {
      console.error('Error fetching rehearsals:', error)
      toast({
        title: 'Erro',
        description: 'Falha ao carregar ensaios',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    try {
      if (editingRehearsal) {
        await rehearsalsApi.update(editingRehearsal.id, formData)
        toast({ title: 'Sucesso', description: 'Ensaio atualizado com sucesso!' })
      } else {
        await rehearsalsApi.create(formData)
        toast({ title: 'Sucesso', description: 'Ensaio criado com sucesso!' })
      }
      setIsDialogOpen(false)
      setEditingRehearsal(null)
      resetForm()
      fetchRehearsals()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar ensaio'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const handleEdit = (item: Rehearsal) => {
    setEditingRehearsal(item)
    const dt = new Date(item.date)
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0,16)
    setFormData({
      title: item.title,
      description: item.description || '',
      location: item.location || '',
      date: local
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!isAdmin || !confirm('Tem certeza que deseja excluir este ensaio?')) return
    try {
      await rehearsalsApi.delete(id)
      toast({ title: 'Sucesso', description: 'Ensaio excluído com sucesso!' })
      fetchRehearsals()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao excluir ensaio'
      toast({ title: 'Erro', description: errorMessage, variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({ title: '', description: '', location: '', date: '' })
  }

  const handleOpenDialog = () => {
    setEditingRehearsal(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const filtered = (rehearsals || []).filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const isPast = (dateString: string) => new Date(dateString) < new Date()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ensaios</h1>
          <p className="text-gray-600">Carregando ensaios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ensaios</h1>
          <p className="text-gray-600">Gerencie os ensaios do ministério</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ensaio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingRehearsal ? 'Editar Ensaio' : 'Novo Ensaio'}</DialogTitle>
                <DialogDescription>
                  {editingRehearsal ? 'Atualize as informações do ensaio' : 'Crie um novo ensaio'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Ensaio</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="Ex: Ensaio Geral, Vozes, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Descrição detalhada do ensaio..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Igreja Central, Sala 3, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="date">Data e Hora</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">{editingRehearsal ? 'Atualizar' : 'Criar'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Ensaios</CardTitle>
          <CardDescription>Filtre por título, descrição ou local</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Ensaios</CardTitle>
          <CardDescription>Próximos e passados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(item.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(item.date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{item.location || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {isPast(item.date) ? (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800">Passado</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800">Próximo</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdmin && (
                      <Link to={`/attendance/${item.id}`}>
                        <Button variant="default" size="sm">
                          <UserCheck className="h-4 w-4 mr-1" /> Registrar Presença
                        </Button>
                      </Link>
                    )}
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