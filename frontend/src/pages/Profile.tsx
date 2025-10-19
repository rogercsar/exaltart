import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth'
import { authApi, usersApi } from '@/lib/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Upload, X } from 'lucide-react'

export default function Profile() {
  const { user, login } = useAuthStore()
  const token = useAuthStore.getState().token
  const { toast } = useToast()

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthDate: '',
    phone: '',
    photoUrl: ''
  })

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        birthDate: user.birthDate || '',
        phone: user.phone || '',
        photoUrl: user.photoUrl || ''
      })
      setImagePreview(user.photoUrl || null)
    }
  }, [user])

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem', variant: 'destructive' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem muito grande', description: 'Máximo 5MB', variant: 'destructive' })
      return
    }
    setSelectedImage(file)
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, photoUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const convertImageToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setLoading(true)
      let photoUrl = formData.photoUrl
      if (selectedImage) {
        photoUrl = await convertImageToBase64(selectedImage)
      }
      const payload = {
        name: (formData.name || '').trim(),
        email: (formData.email || '').trim(),
        birthDate: formData.birthDate || undefined,
        phone: (formData.phone || '').trim(),
        photoUrl
      }
      const res = await usersApi.update(user.id, payload)
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' })
      const token = useAuthStore.getState().token
      if (token) {
        login(res.user, token)
      }
      setIsEditing(false)
    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedCurrent = currentPassword.trim()
    const trimmedNew = newPassword.trim()
    const trimmedConfirm = confirmPassword.trim()

    if (!trimmedCurrent || !trimmedNew || !trimmedConfirm) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha todos os campos.', variant: 'destructive' })
      return
    }
    if (trimmedNew.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A nova senha deve ter pelo menos 6 caracteres.', variant: 'destructive' })
      return
    }
    if (trimmedNew !== trimmedConfirm) {
      toast({ title: 'Confirmação incorreta', description: 'A confirmação deve ser igual à nova senha.', variant: 'destructive' })
      return
    }

    try {
      setLoading(true)
      await authApi.changePassword({ currentPassword: trimmedCurrent, newPassword: trimmedNew })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setChangingPassword(false)
      toast({ title: 'Senha alterada', description: 'Sua senha foi atualizada com sucesso.' })
    } catch (error: any) {
      toast({ title: 'Erro ao alterar senha', description: error?.message || 'Tente novamente mais tarde.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm text-muted-foreground">Sem foto</span>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Você está logado como</p>
              <p className="text-base font-medium">{user?.name} ({user?.email})</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} disabled={!isEditing} placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} disabled={!isEditing} placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Data de nascimento</Label>
                <Input id="birthDate" type="date" value={formData.birthDate ? formData.birthDate.substring(0, 10) : ''} onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))} disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={!isEditing} placeholder="(xx) xxxxx-xxxx" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto</Label>
              <div className="flex items-center gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={!isEditing} />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!isEditing}>
                  <Upload className="mr-2 h-4 w-4" /> Enviar foto
                </Button>
                {imagePreview && isEditing && (
                  <Button type="button" variant="ghost" onClick={handleRemoveImage}>
                    <X className="mr-2 h-4 w-4" /> Remover
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)}>Habilitar edição</Button>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setSelectedImage(null)
                      setImagePreview(user?.photoUrl || null)
                      if (user) {
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          birthDate: user.birthDate || '',
                          phone: user.phone || '',
                          photoUrl: user.photoUrl || ''
                        })
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</Button>
                </>
              )}
            </div>
          </form>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Senha atual</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Sua senha atual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Alterando...' : 'Alterar senha'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}