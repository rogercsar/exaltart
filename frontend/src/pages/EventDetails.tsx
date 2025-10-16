import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { eventsApi } from '@/lib/api'
import type { Event } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, MapPin, User, MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function EventDetails() {
  const { id } = useParams()
  const { toast } = useToast()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      if (!id) return
      try {
        const res = await eventsApi.getById(id)
        setEvent(res.event)
      } catch (error: any) {
        toast({ title: 'Erro', description: error?.message || 'Falha ao carregar evento.', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [id])

  const getWhatsAppLinkFromMessage = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const composeShareMessage = () => {
    if (!event) return ''
    const title = `📣 ${event.title}`
    const description = event.description ? `${event.description}` : ''
    const location = event.location ? `📍 ${event.location}` : ''
    const when = `🗓️ ${formatDateTime(event.startTime)}`
    const link = typeof window !== 'undefined' ? `🔗 ${window.location.href}` : ''
    const footer = 'Vamos juntos?'
    return [title, description, location, when, link, footer].filter(Boolean).join('\n')
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }
  const formatTime = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando evento...</p>
  }
  if (!event) {
    return <p className="text-sm text-red-600">Evento não encontrado.</p>
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-muted-foreground">
        <Link to="/events" className="text-primary hover:underline">Eventos</Link>
        <span className="mx-1">/</span>
        <span>Detalhes</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Detalhes do Evento</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/events">Voltar</Link>
          </Button>
          <Button asChild>
            <a href={getWhatsAppLinkFromMessage(composeShareMessage())} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 mr-1" /> Compartilhar
            </a>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{event.title}</CardTitle>
          <CardDescription>
            {event.location ? (
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>
            ) : 'Sem local definido'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {event.description ? (
            <div>
              <h3 className="text-sm font-medium">Descrição</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Início</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(event.startTime)} • {formatTime(event.startTime)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> Término</p>
              <p className="text-sm text-muted-foreground inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDate(event.endTime)} • {formatTime(event.endTime)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium inline-flex items-center gap-1"><User className="h-4 w-4" /> Autor</p>
              <p className="text-sm text-muted-foreground">{event.author?.name || 'Desconhecido'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}