import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { observationsApi } from '@/lib/api'
import type { Observation } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ObservationDetails() {
  const { id } = useParams()
  const { toast } = useToast()
  const [observation, setObservation] = useState<Observation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return
      try {
        const res = await observationsApi.getById(id)
        setObservation(res.observation)
      } catch (error: any) {
        toast({ title: 'Erro', description: error?.message || 'Falha ao carregar observação.', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    fetchItem()
  }, [id])

  const getWhatsAppLinkFromMessage = (message: string) => `https://wa.me/?text=${encodeURIComponent(message)}`
  const excerpt = (text: string, len = 180) => {
    const clean = (text || '').replace(/\s+/g, ' ').trim()
    if (clean.length <= len) return clean
    return clean.substring(0, len) + '…'
  }
  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  const composeShareMessage = () => {
    if (!observation) return ''
    const title = `📝 ${observation.title}`
    const category = observation.category ? `Categoria: ${observation.category}` : ''
    const when = `🗓️ ${formatDateTime(observation.publishedAt || observation.createdAt)}`
    const content = excerpt(observation.content || '')
    const link = typeof window !== 'undefined' ? `🔗 ${window.location.href}` : ''
    return [title, category, when, content, link].filter(Boolean).join('\n')
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando observação...</p>
  if (!observation) return <p className="text-sm text-red-600">Observação não encontrada.</p>

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-muted-foreground">
        <Link to="/observations" className="text-primary hover:underline">Observações</Link>
        <span className="mx-1">/</span>
        <span>Detalhes</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Observação</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/observations">Voltar</Link>
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
          <CardTitle>{observation.title}</CardTitle>
          <CardDescription>
            {observation.category ? `${observation.category} • ` : ''}
            Registrado em {formatDateTime(observation.publishedAt || observation.createdAt)}
            {observation.author?.name ? ` • por ${observation.author.name}` : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{observation.content}</p>
        </CardContent>
      </Card>
    </div>
  )
}