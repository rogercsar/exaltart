const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    console.log('🔐 Criando usuário administrador...')
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    // Criar usuário admin
    const admin = await prisma.user.create({
      data: {
        email: 'admin@exaltart.com',
        name: 'Administrador Exaltart',
        password: hashedPassword,
        role: 'ADMIN',
        ministryEntryDate: new Date()
      }
    })
    
    console.log('✅ Usuário administrador criado com sucesso!')
    console.log('📧 Email: admin@exaltart.com')
    console.log('🔑 Senha: admin123')
    console.log('👤 Nome:', admin.name)
    console.log('🆔 ID:', admin.id)
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Usuário administrador já existe!')
      console.log('📧 Email: admin@exaltart.com')
      console.log('🔑 Senha: admin123')
    } else {
      console.error('❌ Erro ao criar usuário administrador:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()

