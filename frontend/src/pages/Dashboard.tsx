import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { eventsApi, transactionsApi, devotionalsApi, observationsApi, rehearsalsApi, notificationsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, DollarSign, TrendingUp, BookOpen, StickyNote, Bell, Users, Clock, ListChecks } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Event, FinancialSummary, DevotionalPost, Observation, Rehearsal, Notification } from '@/types/api'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [devotionals, setDevotionals] = useState<DevotionalPost[]>([])
  const [observations, setObservations] = useState<Observation[]>([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsRes, summaryRes, devotionalsRes, observationsRes, rehearsalsRes, notificationsRes] = await Promise.allSettled([
          eventsApi.getAll(),
          transactionsApi.getSummary(),
          devotionalsApi.getAll({ limit: 5 }),
          observationsApi.getAll({ limit: 5 }),
          rehearsalsApi.getAll(),
          notificationsApi.getAll({ limit: 10 })
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

        if (rehearsalsRes.status === 'fulfilled') {
          setRehearsals(((rehearsalsRes.value as any).rehearsals || []).slice(0, 5))
        } else {
          console.error('Erro ao carregar ensaios no dashboard:', rehearsalsRes.reason)
        }

        if (notificationsRes.status === 'fulfilled') {
          const notifData = notificationsRes.value as any
          setNotifications((notifData?.notifications || []) as Notification[])
          setUnreadCount(Number(notifData?.unreadCount || 0))
        } else {
          console.error('Erro ao carregar notificações no dashboard:', (notificationsRes as any)?.reason)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const refreshNotifications = async () => {
    try {
      const res = await notificationsApi.getAll({ limit: 10 })
      setNotifications(res.notifications || [])
      setUnreadCount(Number(res.unreadCount || 0))
    } catch (err) {
      console.error('Erro ao atualizar notificações', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      await refreshNotifications()
    } catch (err) {
      console.error('Erro ao marcar todas como lidas', err)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id)
      await refreshNotifications()
    } catch (err) {
      console.error('Erro ao marcar como lida', err)
    }
  }

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bem-vindo(a), {user?.name}!
          </h1>
          <p className="text-gray-600">
            Aqui está um resumo do que está acontecendo no ministério.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="relative"
            onClick={() => document.getElementById('notifications-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            title="Acessar notificações"
            aria-label="Acessar notificações"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                {unreadCount}
              </span>
            )}
          </Button>
          <button
            className="text-sm text-primary hover:underline"
            onClick={() => document.getElementById('notifications-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Ver notificações
          </button>
        </div>
      </div>

      {/* Shortcuts and Notifications */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick Shortcuts */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              Atalhos Rápidos
            </CardTitle>
            <CardDescription>Acesso rápido às ações mais usadas</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link to="/events/create">
              <Button size="sm" variant="secondary" className="gap-2">
                <Calendar className="h-4 w-4" />
                Novo Evento
              </Button>
            </Link>
            <Link to="/devotionals/create">
              <Button size="sm" variant="secondary" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Novo Devocional
              </Button>
            </Link>
            <Link to="/observations/create">
              <Button size="sm" variant="secondary" className="gap-2">
                <StickyNote className="h-4 w-4" />
                Nova Observação
              </Button>
            </Link>
            <Link to="/groups">
              <Button size="sm" variant="secondary" className="gap-2">
                <Users className="h-4 w-4" />
                Grupos
              </Button>
            </Link>
            <Link to="/scales">
              <Button size="sm" variant="secondary" className="gap-2">
                <Clock className="h-4 w-4" />
                Escalas
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card id="notifications-section" className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    {unreadCount} não lidas
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={refreshNotifications} title="Atualizar notificações">
                  Atualizar
                </Button>
                <Button size="sm" variant="secondary" onClick={handleMarkAllRead} disabled={unreadCount === 0} title="Marcar todas como lidas">
                  Marcar todas como lidas
                </Button>
              </div>
            </div>
            <CardDescription>Últimas notificações do sistema</CardDescription>
          </CardHeader>

          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem notificações no momento.</p>
            ) : (
              <ul className="space-y-2">
                {notifications.map(n => (
                  <li key={n.id} className={`flex flex-col md:flex-row items-start justify-between rounded-md border p-3 ${!n.read ? 'border-primary/40 bg-primary/5' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm break-words">
                        {n.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0 flex items-center gap-2 flex-wrap">
                      {!n.read && (
                        <Button size="sm" variant="default" onClick={() => markRead(n.id)}>
                          Marcar como lida
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => deleteNotification(n.id)}>
                        Excluir
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ensaios Agendados</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {(rehearsals || []).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ensaios agendados
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
                        <Link to={`/observations/${o.id}`} className="text-xs text-primary hover:underline">Ver detalhes</Link>
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
                        <Link to={`/devotionals/${d.id}`} className="text-xs text-primary hover:underline">Ler mais</Link>
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
