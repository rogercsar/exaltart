import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth'
import { transactionsApi } from '@/lib/api'
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import type { FinancialTransaction, FinancialSummary } from '@/types/api'

export default function Finances() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [summary, setSummary] = useState<FinancialSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'INCOME' as 'INCOME' | 'EXPENSE',
    category: '',
    date: new Date().toISOString().split('T')[0],
    proofUrl: ''
  })
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchTransactions()
    fetchSummary()
  }, [])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const response = await transactionsApi.getAll({
        page: 1,
        limit: 100
      })
      setTransactions(response.data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar transações",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await transactionsApi.getSummary()
      setSummary(response.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    try {
      let uploadedProofUrl: string | undefined = undefined
      if (proofFile) {
        const bucket = 'proofs'
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const baseName = proofFile.name || 'comprovante'
        const filePath = `${year}/${month}/${Date.now()}_${baseName}`
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, proofFile, { contentType: proofFile.type })
        if (uploadError) {
          throw new Error('Falha ao enviar comprovante: ' + uploadError.message)
        }
        const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath)
        uploadedProofUrl = publicData.publicUrl
      }

      const transactionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        proofUrl: uploadedProofUrl || formData.proofUrl || undefined
      }

      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, transactionData)
        toast({
          title: "Sucesso",
          description: "Transação atualizada com sucesso!",
        })
      } else {
        await transactionsApi.create(transactionData)
        toast({
          title: "Sucesso",
          description: "Transação criada com sucesso!",
        })
      }
      
      setIsDialogOpen(false)
      setEditingTransaction(null)
      resetForm()
      setProofFile(null)
      setProofPreview(null)
      fetchTransactions()
      fetchSummary()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar transação'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEdit = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category || '',
      date: transaction.date.split('T')[0],
      proofUrl: transaction.proofUrl || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (transactionId: string) => {
    if (!isAdmin || !confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      await transactionsApi.delete(transactionId)
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso!",
      })
      fetchTransactions()
      fetchSummary()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao excluir transação'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'INCOME',
      category: '',
      date: new Date().toISOString().split('T')[0],
      proofUrl: ''
    })
  }

  const handleOpenDialog = () => {
    setEditingTransaction(null)
    resetForm()
    setProofFile(null)
    setProofPreview(null)
    setIsDialogOpen(true)
  }

  const filteredTransactions = (transactions || []).filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'ALL' || transaction.type === typeFilter
    return matchesSearch && matchesType
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setProofFile(file)
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setProofPreview(url)
    } else {
      setProofPreview(null)

    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-600">Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanças</h1>
          <p className="text-gray-600">Gerencie as transações financeiras do ministério</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction 
                    ? 'Atualize as informações da transação' 
                    : 'Registre uma nova transação financeira'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                    placeholder="Ex: Dízimo, Aluguel do espaço, etc."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: 'INCOME' | 'EXPENSE') => 
                        setFormData(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCOME">Receita</SelectItem>
                        <SelectItem value="EXPENSE">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Dízimo, Eventos, Manutenção, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="proofFile">Comprovante (PDF ou imagem)</Label>
                  <Input
                    id="proofFile"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleProofFileChange}
                  />
                  {proofPreview ? (
                    <div className="mt-2">
                      <img src={proofPreview} alt="Prévia do comprovante" className="max-h-40 rounded border" />
                    </div>
                  ) : (
                    editingTransaction?.proofUrl && (
                      <div className="mt-2">
                        <a
                          href={editingTransaction.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Comprovante atual
                        </a>
                      </div>
                    )
                  )}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingTransaction ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
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
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar Transações</CardTitle>
          <CardDescription>
            Use os filtros para encontrar transações específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por descrição ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={(value: 'ALL' | 'INCOME' | 'EXPENSE') => setTypeFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as transações</SelectItem>
                <SelectItem value="INCOME">Apenas receitas</SelectItem>
                <SelectItem value="EXPENSE">Apenas despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Autor</TableHead>
                {isAdmin && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-medium">
                    {transaction.description}
                    {transaction.proofUrl && (
                      <a
                        href={transaction.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline text-xs"
                      >
                        [Comprovante]
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(transaction.amount)}
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
                  <TableCell>{formatDate(transaction.date)}</TableCell>
                  <TableCell>{transaction.author.name}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(transaction.id)}
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
// Removidas funções de stub: os setters reais são definidos via useState no topo do componente.

