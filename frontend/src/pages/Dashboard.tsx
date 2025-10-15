import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth'
import { eventsApi, transactionsApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, TrendingUp } from 'lucide-react'
import type { Event, FinancialSummary } from '@/types/api'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [eventsResponse, summaryResponse] = await Promise.all([
          eventsApi.getAll(),
          transactionsApi.getSummary()
        ])
        
        setEvents((eventsResponse.events || []).slice(0, 5)) // Show only next 5 events
        setSummary(summaryResponse.summary)
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

      {/* Recent Events */}
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
    </div>
  )
}
