# 🎨 Configuração do Frontend - Exaltart

Este guia explica como configurar e executar o frontend do sistema Exaltart.

## 📋 Pré-requisitos

- Node.js 18 ou superior
- Backend configurado e rodando (porta 3001)
- Banco de dados PostgreSQL configurado

## 🚀 Passo a Passo

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm run install:all

# Ou apenas o frontend
cd frontend
npm install
```

### 2. Configurar Variáveis de Ambiente

O frontend está configurado para se conectar automaticamente com o backend através do proxy do Vite. Certifique-se de que o backend está rodando na porta 3001.

### 3. Executar o Frontend

```bash
# Na raiz do projeto (executa frontend e backend)
npm run dev

# Ou apenas o frontend
cd frontend
npm run dev
```

O frontend estará disponível em: http://localhost:3000

### 4. Testar a Aplicação

1. **Acesse a aplicação** em http://localhost:3000
2. **Você será redirecionado** para a página de login
3. **Crie uma conta** clicando em "Cadastre-se aqui"
4. **Faça login** com suas credenciais
5. **Explore o dashboard** com dados em tempo real

## 🎯 Funcionalidades Disponíveis

### ✅ Autenticação
- **Registro de usuários** com validação de formulário
- **Login** com persistência de sessão
- **Logout** com limpeza de dados
- **Redirecionamento automático** para rotas protegidas

### ✅ Dashboard
- **Resumo financeiro** em tempo real
- **Próximos eventos** do ministério
- **Cards de estatísticas** (receitas, despesas, saldo)
- **Layout responsivo** para mobile e desktop

### ✅ Navegação
- **Sidebar responsiva** com menu colapsível
- **Roteamento protegido** baseado em autenticação
- **Navegação entre seções** (Membros, Eventos, Finanças, Relatórios)
- **Indicador de usuário** com role (Admin/Membro)

### ✅ Interface
- **Design moderno** com Tailwind CSS
- **Componentes Shadcn/UI** para consistência
- **Cor primária** #0F430F (verde do Exaltart)
- **Tema responsivo** com suporte a mobile

## 🔧 Estrutura do Frontend

```
frontend/src/
├── components/
│   ├── ui/                 # Componentes Shadcn/UI
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── label.tsx
│   │   └── toast.tsx
│   ├── Layout.tsx          # Layout principal com sidebar
│   └── ProtectedRoute.tsx  # Wrapper para rotas protegidas
├── pages/
│   ├── Login.tsx           # Página de login
│   ├── Register.tsx        # Página de registro
│   └── Dashboard.tsx       # Dashboard principal
├── stores/
│   └── auth.ts             # Store de autenticação (Zustand)
├── lib/
│   ├── api.ts              # Cliente HTTP (Axios)
│   └── utils.ts            # Utilitários
├── types/
│   └── api.ts              # Tipos TypeScript
└── hooks/
    └── use-toast.ts        # Hook para notificações
```

## 🎨 Personalização

### Cores
As cores estão configuradas no `tailwind.config.js`:
- **Primária**: #0F430F (verde do Exaltart)
- **Secundárias**: Baseadas no sistema Shadcn/UI

### Componentes
Todos os componentes seguem o design system do Shadcn/UI com customizações para o Exaltart.

## 🚨 Solução de Problemas

### Erro de Conexão com Backend
- Verifique se o backend está rodando na porta 3001
- Confirme se o proxy está configurado no `vite.config.ts`

### Erro de Autenticação
- Verifique se o JWT_SECRET está configurado no backend
- Limpe o localStorage e tente fazer login novamente

### Erro de Build
- Execute `npm run build` para verificar erros de TypeScript
- Verifique se todas as dependências estão instaladas

### Problemas de Estilo
- Verifique se o Tailwind CSS está configurado corretamente
- Confirme se os componentes Shadcn/UI estão importados

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (até 767px)

## 🔄 Próximos Passos

Após configurar o frontend, você pode prosseguir para:
1. **Gestão de Membros** - CRUD completo de usuários
2. **Gestão de Eventos** - Criação e edição de eventos
3. **Gestão Financeira** - Controle de receitas e despesas
4. **Relatórios** - Dashboards e relatórios financeiros

---

**Próximo passo**: O frontend está pronto! Você pode testar a aplicação completa ou prosseguir para implementar as funcionalidades específicas de cada módulo.

