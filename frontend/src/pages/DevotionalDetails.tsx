import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { devotionalsApi } from '@/lib/api'
import type { DevotionalPost } from '@/types/api'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function DevotionalDetails() {
  const { id } = useParams()
  const { toast } = useToast()
  const [devotional, setDevotional] = useState<DevotionalPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItem = async () => {
      if (!id) return
      try {
        const res = await devotionalsApi.getById(id)
        setDevotional(res.devotional)
      } catch (error: any) {
        toast({ title: 'Erro', description: error?.message || 'Falha ao carregar devocional.', variant: 'destructive' })
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
  const composeShareMessage = () => {
    if (!devotional) return ''
    const title = `📖 ${devotional.title}`
    const freq = devotional.frequency === 'WEEKLY' ? 'Semanal' : 'Mensal'
    const header = `Devocional • ${freq}`
    const content = excerpt(devotional.content || '')
    const link = typeof window !== 'undefined' ? `🔗 ${window.location.href}` : ''
    return [title, header, content, link].filter(Boolean).join('\n')
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-'
    const d = new Date(dateString)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' • ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) return <p className="text-sm text-muted-foreground">Carregando devocional...</p>
  if (!devotional) return <p className="text-sm text-red-600">Devocional não encontrado.</p>

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-sm text-muted-foreground">
        <Link to="/devotionals" className="text-primary hover:underline">Devocionais</Link>
        <span className="mx-1">/</span>
        <span>Detalhes</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Devocional</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/devotionals">Voltar</Link>
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
          <CardTitle>{devotional.title}</CardTitle>
          <CardDescription>
            {devotional.frequency === 'WEEKLY' ? 'Semanal' : 'Mensal'} • Publicado em {formatDateTime(devotional.publishedAt || devotional.createdAt)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{devotional.content}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}