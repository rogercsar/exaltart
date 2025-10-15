# 🗄️ Configuração do Banco de Dados - Exaltart

Este guia explica como configurar o banco de dados PostgreSQL para o sistema Exaltart.

## 📋 Pré-requisitos

- PostgreSQL 13 ou superior instalado
- Node.js 18 ou superior
- npm ou yarn

## 🚀 Passo a Passo

### 1. Instalar PostgreSQL

#### Windows
1. Baixe o PostgreSQL do site oficial: https://www.postgresql.org/download/windows/
2. Execute o instalador e siga as instruções
3. Anote a senha do usuário `postgres` que você definiu durante a instalação

#### macOS
```bash
# Usando Homebrew
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Criar o Banco de Dados

Conecte-se ao PostgreSQL e crie o banco de dados:

```bash
# Conectar como superusuário
psql -U postgres

# Criar banco de dados
CREATE DATABASE exaltart_db;

# Criar usuário específico (opcional, mas recomendado)
CREATE USER exaltart_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE exaltart_db TO exaltart_user;

# Sair do psql
\q
```

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp backend/env.example backend/.env
```

2. Edite o arquivo `backend/.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://exaltart_user:sua_senha_segura@localhost:5432/exaltart_db"

# JWT Secret (use uma chave forte em produção)
JWT_SECRET="sua-chave-jwt-super-secreta-aqui"

# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend URL (para CORS em produção)
FRONTEND_URL="http://localhost:3000"
```

### 4. Instalar Dependências e Configurar Prisma

```bash
# Na raiz do projeto
npm run install:all

# Gerar cliente Prisma
cd backend
npm run db:generate

# Aplicar schema no banco de dados
npm run db:push
```

### 5. Verificar Configuração

```bash
# Iniciar o servidor backend
cd backend
npm run dev
```

Se tudo estiver correto, você verá:
```
🚀 Server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/api/health
```

### 6. Testar a API

Você pode testar a API usando curl, Postman ou qualquer cliente HTTP:

```bash
# Health check
curl http://localhost:3001/api/health

# Registrar um usuário admin
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exaltart.com",
    "name": "Administrador",
    "password": "123456",
    "role": "ADMIN"
  }'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@exaltart.com",
    "password": "123456"
  }'
```

## 🔧 Comandos Úteis do Prisma

```bash
# Visualizar dados no navegador
npm run db:studio

# Resetar banco de dados (cuidado!)
npx prisma db push --force-reset

# Gerar migração
npx prisma migrate dev --name nome_da_migracao

# Aplicar migrações pendentes
npx prisma migrate deploy
```

## 🚨 Solução de Problemas

### Erro de Conexão
- Verifique se o PostgreSQL está rodando
- Confirme se as credenciais no `.env` estão corretas
- Teste a conexão: `psql -U exaltart_user -d exaltart_db`

### Erro de Permissão
- Verifique se o usuário tem permissões no banco
- Tente conectar como superusuário: `psql -U postgres`

### Erro de Schema
- Execute `npm run db:push` novamente
- Verifique se o arquivo `schema.prisma` está correto

## 📊 Estrutura do Banco

O banco de dados contém as seguintes tabelas:

- **User**: Usuários do sistema (Admin/Member)
- **Event**: Eventos do ministério
- **FinancialTransaction**: Transações financeiras (Receitas/Despesas)

Cada tabela possui campos de auditoria (`createdAt`, `updatedAt`) e relacionamentos apropriados.

---

**Próximo passo**: Após configurar o banco, você pode prosseguir para o Step 3: Frontend Initial Setup & Auth.

