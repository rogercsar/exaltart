import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { eventsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Calendar, MapPin, Clock, MessageCircle } from 'lucide-react'
import type { Event } from '@/types/api'

export default function Events() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [shareEvent, setShareEvent] = useState<Event | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: ''
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventsApi.getAll()
      setEvents(response.events)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar eventos",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    // Validate that end time is after start time
    if (new Date(formData.endTime) <= new Date(formData.startTime)) {
      toast({
        title: "Erro de validação",
        description: "A data de término deve ser posterior à data de início",
        variant: "destructive"
      })
      return
    }

    try {
      if (editingEvent) {
        await eventsApi.update(editingEvent.id, formData)
        toast({
          title: "Sucesso",
          description: "Evento atualizado com sucesso!",
        })
      } else {
        await eventsApi.create(formData)
        toast({
          title: "Sucesso",
          description: "Evento criado com sucesso!",
        })
      }
      
      setIsDialogOpen(false)
      setEditingEvent(null)
      resetForm()
      fetchEvents()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar evento'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      location: event.location || '',
      startTime: event.startTime.split('T')[0] + 'T' + event.startTime.split('T')[1].substring(0, 5),
      endTime: event.endTime.split('T')[0] + 'T' + event.endTime.split('T')[1].substring(0, 5)
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!isAdmin || !confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      await eventsApi.delete(eventId)
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso!",
      })
      fetchEvents()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao excluir evento'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      startTime: '',
      endTime: ''
    })
  }

  const handleOpenDialog = () => {
    setEditingEvent(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const composeShareMessage = (event: Event) => {
    const title = `📣 ${event.title}`
    const description = event.description ? `${event.description}` : ''
    const location = event.location ? `📍 ${event.location}` : ''
    const date = new Date(event.startTime).toLocaleString('pt-BR')
    const when = `🗓️ ${date}`
    const footer = 'Vamos juntos?'
    return [title, description, location, when, footer].filter(Boolean).join('\n')
  }

  const getWhatsAppLinkFromMessage = (message: string) => {
    return `https://wa.me/?text=${encodeURIComponent(message)}`
  }

  const handleOpenShareDialog = (event: Event) => {
    const defaultMessage = composeShareMessage(event)
    setShareEvent(event)
    setShareMessage(defaultMessage)
    setIsShareDialogOpen(true)
  }

  const handleCopyShareMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
      toast({ title: 'Copiado!', description: 'Mensagem copiada para a área de transferência.' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao copiar mensagem.', variant: 'destructive' })
    }
  }

  const filteredEvents = (events || []).filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )


  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const isPast = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-600">Gerencie os eventos do ministério</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                </DialogTitle>
                <DialogDescription>
                  {editingEvent 
                    ? 'Atualize as informações do evento' 
                    : 'Crie um novo evento para o ministério'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Evento</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    placeholder="Ex: Ensaio Geral, Apresentação, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Descrição detalhada do evento..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Ex: Igreja Central, Auditório, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Data e Hora de Início</Label>
                    <Input
                      id="startTime"
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Data e Hora de Término</Label>
                    <Input
                      id="endTime"
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingEvent ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compartilhar evento via WhatsApp</DialogTitle>
            <DialogDescription>Edite a mensagem antes de enviar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="shareMessage">Mensagem</Label>
            <textarea
              id="shareMessage"
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              className="flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Escreva a mensagem a ser compartilhada..."
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCopyShareMessage}>Copiar mensagem</Button>
              <Button asChild>
                <a href={getWhatsAppLinkFromMessage(shareMessage)} target="_blank" rel="noopener noreferrer">
                  Enviar via WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Eventos</CardTitle>
          <CardDescription>
            Digite para filtrar eventos por título, descrição ou local
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Eventos</CardTitle>
          <CardDescription>
            {filteredEvents.length} evento(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Término</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado por</TableHead>
                {isAdmin && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div className="space-y-1">
                      <div className="font-semibold">{event.title}</div>
                      {event.description && (
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.location ? (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{event.location}</span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(event.startTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.startTime)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>{formatDate(event.endTime)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(event.endTime)}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isUpcoming(event.startTime)
                        ? 'bg-green-100 text-green-800'
                        : isPast(event.endTime)
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {isUpcoming(event.startTime)
                        ? 'Próximo'
                        : isPast(event.endTime)
                        ? 'Finalizado'
                        : 'Em andamento'
                      }
                    </span>
                  </TableCell>
                  <TableCell>{event.author.name}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenShareDialog(event)}
                          title="Compartilhar via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" /> Compartilhar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// WhatsApp share helpers are defined inline above
