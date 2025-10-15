import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { transactionsApi, eventsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown
} from 'lucide-react'
import type { FinancialTransaction, FinancialSummary, Event } from '@/types/api'

export default function Reports() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const [transactionsResponse, eventsResponse, summaryResponse] = await Promise.all([
        transactionsApi.getAll({
          page: 1,
          limit: 1000,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }),
        eventsApi.getAll(),
        transactionsApi.getSummary({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        })
      ])
      
      setTransactions(transactionsResponse.data || [])
      setEvents(eventsResponse.events || [])
      setSummary(summaryResponse.summary)
    } catch (error) {
      console.error('Error fetching report data:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar dados do relatório",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Autor'],
      ...(transactions || []).map(transaction => [
        formatDate(transaction.date),
        transaction.description,
        transaction.type === 'INCOME' ? 'Receita' : 'Despesa',
        transaction.category || '',
        transaction.amount.toString(),
        transaction.author.name
      ])
    ].map(row => row.join(',')).join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `relatorio-financeiro-${dateRange.startDate}-${dateRange.endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Exportação realizada",
      description: "Relatório exportado com sucesso!",
    })
  }

  // Calculate category totals
  const categoryTotals = (transactions || []).reduce((acc, transaction) => {
    const category = transaction.category || 'Sem categoria'
    if (!acc[category]) {
      acc[category] = { income: 0, expense: 0 }
    }
    if (transaction.type === 'INCOME') {
      acc[category].income += transaction.amount
    } else {
      acc[category].expense += transaction.amount
    }
    return acc
  }, {} as Record<string, { income: number; expense: number }>)

  // Filter events by date range
  const filteredEvents = (events || []).filter(event => {
    const eventDate = new Date(event.startTime)
    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)
    return eventDate >= startDate && eventDate <= endDate
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600">Análise financeira e de eventos do ministério</p>
        </div>
        <Button onClick={handleExport} disabled={!isAdmin}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Período do Relatório</CardTitle>
          <CardDescription>
            Selecione o período para análise dos dados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Inicial</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.incomeCount} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Despesas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.expenseCount} transações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                summary.balance >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(summary.balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receitas - Despesas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos no Período</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {filteredEvents.length}
              </div>
              <p className="text-xs text-muted-foreground">
                eventos realizados
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo por Categoria</CardTitle>
          <CardDescription>
            Análise detalhada das transações por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryTotals).map(([category, totals]) => (
              <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <h4 className="font-medium">{category}</h4>
                  <div className="flex space-x-4 text-sm text-gray-500">
                    <span>Receitas: {formatCurrency(totals.income)}</span>
                    <span>Despesas: {formatCurrency(totals.expense)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    totals.income - totals.expense >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(totals.income - totals.expense)}
                  </div>
                  <div className="text-xs text-gray-500">Saldo</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Recentes</CardTitle>
          <CardDescription>
            Últimas transações do período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Autor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(transactions || []).slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'INCOME' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.category || '-'}</TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.author.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Events in Period */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos do Período</CardTitle>
          <CardDescription>
            Eventos realizados no período selecionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum evento encontrado no período selecionado
            </p>
          ) : (
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-500">{event.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {event.location && (
                        <span>📍 {event.location}</span>
                      )}
                      <span>📅 {formatDateTime(event.startTime)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      Criado por {event.author.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
