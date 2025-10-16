import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { eventsApi, transactionsApi, devotionalsApi, observationsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, TrendingUp, BookOpen, StickyNote } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Event, FinancialSummary, DevotionalPost, Observation } from '@/types/api'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [devotionals, setDevotionals] = useState<DevotionalPost[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, summaryRes, devotionalsRes, observationsRes] = await Promise.allSettled([
          eventsApi.getAll(),
          transactionsApi.getSummary(),
          devotionalsApi.getAll({ limit: 5 }),
          observationsApi.getAll({ limit: 5 })
        ])

        if (eventsRes.status === 'fulfilled') {
          setEvents(((eventsRes.value as any).events || []).slice(0, 5))
        } else {
          console.error('Erro ao carregar eventos no dashboard:', eventsRes.reason)
        }

        if (summaryRes.status === 'fulfilled') {
          setSummary((summaryRes.value as any).summary || null)
        } else {
          console.error('Erro ao carregar resumo financeiro no dashboard:', summaryRes.reason)
        }

        if (devotionalsRes.status === 'fulfilled') {
          setDevotionals(((devotionalsRes.value as any).data || []) as DevotionalPost[])
        } else {
          console.error('Erro ao carregar devocionais no dashboard:', devotionalsRes.reason)
        }

        if (observationsRes.status === 'fulfilled') {
          setObservations(((observationsRes.value as any).data || []) as Observation[])
        } else {
          console.error('Erro ao carregar observações no dashboard:', observationsRes.reason)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo(a), {user?.name}!
        </h1>
        <p className="text-gray-600">
          Aqui está um resumo do que está acontecendo no ministério.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summary ? formatCurrency(summary.totalIncome) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.incomeCount || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary ? formatCurrency(summary.totalExpenses) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.expenseCount || 0} transações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              summary && summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {summary ? formatCurrency(summary.balance) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(events || []).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Eventos agendados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Events and Devotionals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
            <CardDescription>
              Eventos mais recentes do ministério
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(events || []).length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum evento agendado</p>
            ) : (
              <div className="space-y-4">
                {(events || []).map((event) => (
                  <div key={event.id} className="flex items-center space-x-4">
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {event.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {event.location && `${event.location} • `}
                        {formatDate(event.startTime)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo Financeiro</CardTitle>
            <CardDescription>
              Visão geral das finanças do ministério
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Receitas:</span>
                  <span className="text-sm text-green-600">
                    {formatCurrency(summary.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Despesas:</span>
                  <span className="text-sm text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold">Saldo:</span>
                    <span className={`text-sm font-bold ${
                      summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nenhuma transação registrada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Observations and Devotionals Card */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Observações e Devocionais</CardTitle>
              <CardDescription>Últimas observações registradas e devocionais publicados</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-yellow-600" />
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><StickyNote className="h-4 w-4" /> Observações</h4>
                {(observations || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma observação registrada</p>
                ) : (
                  <div className="space-y-4">
                    {(observations || []).map((o) => (
                      <div key={o.id} className="space-y-1">
                        <p className="text-sm font-medium leading-none">{o.title} {o.category ? <span className="text-xs text-muted-foreground">• {o.category}</span> : null}</p>
                        <p className="text-sm text-muted-foreground">Registrado em {formatDate(o.publishedAt || o.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Link to="/observations" className="text-sm text-primary hover:underline">Ver observações</Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/observations" className="text-sm text-primary hover:underline">Inserir observação</Link>
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><BookOpen className="h-4 w-4" /> Devocionais</h4>
                {(devotionals || []).length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhum devocional publicado</p>
                ) : (
                  <div className="space-y-4">
                    {(devotionals || []).map((d) => (
                      <div key={d.id} className="space-y-1">
                        <p className="text-sm font-medium leading-none">{d.title}</p>
                        <p className="text-sm text-muted-foreground">Publicado em {formatDate(d.publishedAt || d.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 flex gap-2">
                  <Link to="/devotionals" className="text-sm text-primary hover:underline">Ver devocionais</Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/devotionals" className="text-sm text-primary hover:underline">Inserir devocional</Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
