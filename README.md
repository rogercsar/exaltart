# Exaltart - Sistema de Gestão do Ministério de Dança

Sistema completo para gerenciamento de ministério de dança, incluindo gestão de membros, eventos e finanças.

## 🚀 Tecnologias

### Backend
- **Node.js** com **TypeScript**
- **Express.js** para API REST
- **PostgreSQL** como banco de dados
- **Prisma** como ORM
- **JWT** para autenticação
- **Zod** para validação
- **Multer** para upload de arquivos

### Frontend
- **React** com **TypeScript**
- **Vite** como build tool
- **Tailwind CSS** para estilização
- **Shadcn/UI** para componentes
- **React Router** para navegação
- **Zustand** para gerenciamento de estado
- **Axios** para requisições HTTP

## 📁 Estrutura do Projeto

```
exaltart-app/
├── backend/                 # API Backend
│   ├── src/                # Código fonte
│   ├── prisma/             # Schema do banco de dados
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # Aplicação React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── stores/         # Estado global (Zustand)
│   │   ├── lib/            # Utilitários
│   │   └── types/          # Tipos TypeScript
│   ├── public/             # Arquivos estáticos
│   └── package.json
└── package.json            # Configuração do monorepo
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js (versão 18 ou superior)
- PostgreSQL (versão 13 ou superior)
- npm ou yarn

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd exaltart-app
```

### 2. Instale as dependências
```bash
# Instala dependências de todos os workspaces
npm run install:all
```

### 3. Configure o banco de dados

#### Backend (.env)
```bash
# Copie o arquivo de exemplo
cp backend/env.example backend/.env

# Edite o arquivo .env com suas configurações
DATABASE_URL="postgresql://username:password@localhost:5432/exaltart_db"
JWT_SECRET="your-super-secret-jwt-key-here"
PORT=3001
NODE_ENV=development
```

#### Configure o PostgreSQL
1. Crie um banco de dados chamado `exaltart_db`
2. Execute as migrações do Prisma:
```bash
cd backend
npm run db:generate
npm run db:push
```

### 4. Execute o projeto

#### Desenvolvimento (Backend + Frontend)
```bash
# Na raiz do projeto
npm run dev
```

#### Ou execute separadamente:

**Backend (porta 3001):**
```bash
cd backend
npm run dev
```

**Frontend (porta 3000):**
```bash
cd frontend
npm run dev
```

## 🎨 Cores do Sistema

- **Cor Primária:** #0F430F (Verde escuro)
- **Cores Secundárias:** Baseadas no sistema de design do Shadcn/UI

## 📋 Funcionalidades (Em Desenvolvimento)

### ✅ Step 1: Estrutura do Projeto
- [x] Configuração do monorepo
- [x] Backend com Express + TypeScript + Prisma
- [x] Frontend com React + Vite + Tailwind CSS
- [x] Schema do banco de dados

### ✅ Step 2: Backend Foundation & Authentication
- [x] Configuração do Prisma Client
- [x] Middleware de autenticação JWT
- [x] Rotas de autenticação (register, login, me)
- [x] Rotas de usuários (CRUD - Admin only)
- [x] Rotas de eventos (CRUD - Admin only)
- [x] Rotas de transações financeiras (CRUD - Admin only)
- [x] Validação com Zod
- [x] Hash de senhas com bcryptjs

### ✅ Step 3: Frontend Initial Setup & Auth
- [x] Configuração do Tailwind CSS com Shadcn/UI
- [x] Roteamento com React Router (rotas públicas e privadas)
- [x] Store de autenticação com Zustand
- [x] Páginas de Login e Registro
- [x] Sistema de rotas protegidas
- [x] Layout principal com sidebar responsiva
- [x] Dashboard com resumo financeiro e eventos
- [x] Integração completa com API backend

### ✅ Step 4: Gestão de Membros (Frontend)
- [x] Página completa de gestão de membros
- [x] Tabela com busca e filtros
- [x] Formulário de criação/edição de membros
- [x] Controle de permissões (Admin only)
- [x] Validação de formulários
- [x] Integração com API backend

### ✅ Step 6: Gestão Financeira (Frontend)
- [x] Página completa de gestão financeira
- [x] Tabela de transações com filtros avançados
- [x] Formulário de criação/edição de transações
- [x] Cards de resumo financeiro em tempo real
- [x] Filtros por tipo (Receita/Despesa) e busca
- [x] Formatação de moeda brasileira
- [x] Controle de permissões (Admin only)

### ✅ Step 5: Gestão de Eventos (Frontend)
- [x] Página completa de gestão de eventos
- [x] Tabela com busca e filtros avançados
- [x] Formulário de criação/edição de eventos
- [x] Validação de datas (término > início)
- [x] Status de eventos (Próximo, Em andamento, Finalizado)
- [x] Controle de permissões (Admin only)
- [x] Integração com API backend

### ✅ Step 7: Relatórios (Frontend)
- [x] Página completa de relatórios e dashboards
- [x] Filtros por período de datas
- [x] Resumo financeiro detalhado
- [x] Análise por categoria de transações
- [x] Lista de eventos do período
- [x] Exportação de dados em CSV
- [x] Visualizações e métricas em tempo real

### 🎉 Sistema Completo!
- [x] Todas as funcionalidades principais implementadas
- [x] Backend e Frontend totalmente integrados
- [x] Interface responsiva e moderna
- [x] Sistema de autenticação completo
- [x] CRUD completo para todos os módulos

## 🔌 API Endpoints

### Autenticação (`/api/auth`)
- `POST /register` - Registro de usuário
- `POST /login` - Login de usuário
- `GET /me` - Dados do usuário atual (protegido)

### Usuários (`/api/users`) - Admin only
- `GET /` - Listar todos os usuários
- `GET /:id` - Buscar usuário por ID
- `PUT /:id` - Atualizar usuário
- `DELETE /:id` - Deletar usuário

### Eventos (`/api/events`)
- `GET /` - Listar eventos (todos os usuários autenticados)
- `GET /:id` - Buscar evento por ID
- `POST /` - Criar evento (Admin only)
- `PUT /:id` - Atualizar evento (Admin only)
- `DELETE /:id` - Deletar evento (Admin only)

### Transações Financeiras (`/api/transactions`)
- `GET /` - Listar transações (com filtros e paginação)
- `GET /:id` - Buscar transação por ID
- `GET /summary` - Resumo financeiro (total receitas, despesas, saldo)
- `POST /` - Criar transação (Admin only)
- `PUT /:id` - Atualizar transação (Admin only)
- `DELETE /:id` - Deletar transação (Admin only)

## 🚀 Scripts Disponíveis

### Raiz do Projeto
- `npm run dev` - Executa backend e frontend simultaneamente
- `npm run build` - Build de produção
- `npm run install:all` - Instala todas as dependências

### Backend
- `npm run dev` - Modo desenvolvimento
- `npm run build` - Build de produção
- `npm run db:generate` - Gera cliente Prisma
- `npm run db:push` - Aplica mudanças no banco
- `npm run db:migrate` - Executa migrações
- `npm run db:studio` - Abre Prisma Studio

### Frontend
- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run preview` - Preview do build
- `npm run lint` - Linter

## 📝 Notas de Desenvolvimento

Este projeto está sendo desenvolvido seguindo as melhores práticas de desenvolvimento web moderno, com foco em:
- Type Safety (TypeScript)
- Componentes reutilizáveis
- Design responsivo
- Acessibilidade
- Performance
- Segurança

---

**Desenvolvido para o Ministério de Dança Exaltart** 🕺💃
