import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { usersApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, User as UserIcon, Upload, X, MessageCircle } from 'lucide-react'
import type { User } from '@/types/api'

export default function Members() {
  const { user: currentUser } = useAuthStore()
  const { toast } = useToast()
  const [members, setMembers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<User | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'MEMBER' as 'ADMIN' | 'MEMBER',
    birthDate: '',
    phone: '',
    photoUrl: ''
  })

  const isAdmin = currentUser?.role === 'ADMIN'

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getAll()
      setMembers(response.users)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast({
        title: "Erro",
        description: "Falha ao carregar membros",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) return

    try {
      let photoUrl = formData.photoUrl

      // If a new image was selected, convert it to base64
      if (selectedImage) {
        photoUrl = await convertImageToBase64(selectedImage)
      }

      const memberData = {
        ...formData,
        photoUrl
      }

      if (editingMember) {
        await usersApi.update(editingMember.id, memberData)
        toast({
          title: "Sucesso",
          description: "Membro atualizado com sucesso!",
        })
      } else {
        await usersApi.create(memberData)
        toast({
          title: "Sucesso",
          description: "Membro adicionado com sucesso!",
        })
      }
      setIsDialogOpen(false)
      setEditingMember(null)
      resetForm()
      fetchMembers()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao salvar membro'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const handleEdit = (member: User) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      birthDate: member.birthDate || '',
      phone: member.phone || '',
      photoUrl: member.photoUrl || ''
    })
    
    // Set image preview if member has existing photo
    if (member.photoUrl) {
      setImagePreview(member.photoUrl)
      setSelectedImage(null) // Clear selected image since we're using existing
    } else {
      setImagePreview(null)
      setSelectedImage(null)
    }
    
    setIsDialogOpen(true)
  }

  const handleDelete = async (memberId: string) => {
    if (!isAdmin || !confirm('Tem certeza que deseja excluir este membro?')) return

    try {
      await usersApi.delete(memberId)
      toast({
        title: "Sucesso",
        description: "Membro excluído com sucesso!",
      })
      fetchMembers()
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao excluir membro'
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'MEMBER',
      birthDate: '',
      phone: '',
      photoUrl: ''
    })
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive"
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        })
        return
      }

      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleOpenDialog = () => {
    setEditingMember(null)
    resetForm()
    setIsDialogOpen(true)
  }

  const filteredMembers = (members || []).filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
          <p className="text-gray-600">Carregando membros...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Membros</h1>
          <p className="text-gray-600">Gerencie os membros do ministério</p>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingMember ? 'Editar Membro' : 'Adicionar Membro'}
                </DialogTitle>
                <DialogDescription>
                  {editingMember 
                    ? 'Atualize as informações do membro' 
                    : 'Preencha os dados do novo membro'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Função</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'ADMIN' | 'MEMBER') => 
                      setFormData(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Membro</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone (WhatsApp)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Ex: +55 11 91234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Foto de Perfil</Label>
                  <div className="space-y-4">
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <div className="flex items-center space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{imagePreview ? 'Alterar Foto' : 'Selecionar Foto'}</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <span className="text-sm text-gray-500">
                        JPG, PNG ou GIF (máx. 5MB)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMember ? 'Atualizar' : 'Adicionar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Membros</CardTitle>
          <CardDescription>
            Digite para filtrar membros por nome ou email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Membros</CardTitle>
          <CardDescription>
            {filteredMembers.length} membro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Foto</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Data de Nascimento</TableHead>
                <TableHead>Entrada no Ministério</TableHead>
                {isAdmin && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.photoUrl ? (
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {member.name}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone || '-'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      disabled={!member.phone}
                    >
                      <a
                        href={getWhatsAppLink(member.phone || '', member.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                      </a>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.role === 'ADMIN' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {member.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {member.birthDate ? formatDate(member.birthDate) : '-'}
                  </TableCell>
                  <TableCell>{formatDate(member.ministryEntryDate)}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          disabled={member.id === currentUser?.id}
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

function getWhatsAppLink(phone: string, name: string) {
  const digits = phone.replace(/\D/g, '')
  const text = `Olá ${name}!`
  const encoded = encodeURIComponent(text)
  if (!digits) {
    return `https://wa.me/?text=${encoded}`
  }
  return `https://wa.me/${digits}?text=${encoded}`
}
