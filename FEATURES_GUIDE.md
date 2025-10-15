# 🎯 Guia de Funcionalidades - Exaltart

Este guia detalha todas as funcionalidades implementadas no sistema Exaltart.

## 🔐 Sistema de Autenticação

### Login e Registro
- **Página de Login** com validação de formulário
- **Página de Registro** com validação de senhas
- **Persistência de sessão** com localStorage
- **Redirecionamento automático** para rotas protegidas
- **Notificações** de sucesso e erro

### Controle de Acesso
- **Rotas protegidas** que exigem autenticação
- **Diferentes níveis de acesso** (Admin/Membro)
- **Middleware de autenticação** no frontend e backend
- **Logout seguro** com limpeza de dados

## 👥 Gestão de Membros

### Funcionalidades Principais
- **Listagem completa** de todos os membros
- **Busca em tempo real** por nome ou email
- **Filtros avançados** para encontrar membros específicos
- **Visualização de perfil** com foto e informações

### Operações CRUD (Admin Only)
- **Criar membro** com formulário completo
- **Editar informações** de membros existentes
- **Excluir membros** com confirmação
- **Alterar função** (Admin/Membro)
- **Upload de foto** via URL

### Campos Gerenciados
- Nome completo
- Email (único)
- Data de nascimento
- Função no ministério
- URL da foto de perfil
- Data de entrada no ministério

## 💰 Gestão Financeira

### Funcionalidades Principais
- **Resumo financeiro** em tempo real
- **Listagem de transações** com paginação
- **Filtros avançados** por tipo e categoria
- **Busca por descrição** ou categoria
- **Formatação de moeda** brasileira

### Operações CRUD (Admin Only)
- **Criar transação** (Receita/Despesa)
- **Editar transações** existentes
- **Excluir transações** com confirmação
- **Upload de comprovantes** via URL
- **Categorização** de transações

### Tipos de Transação
- **Receitas**: Dízimos, ofertas, eventos, etc.
- **Despesas**: Aluguel, manutenção, materiais, etc.

### Campos Gerenciados
- Descrição da transação
- Valor (formato brasileiro)
- Tipo (Receita/Despesa)
- Categoria personalizada
- Data da transação
- URL do comprovante
- Autor da transação

## 📊 Dashboard

### Resumo Financeiro
- **Total de receitas** com contador
- **Total de despesas** com contador
- **Saldo atual** (Receitas - Despesas)
- **Número de transações** por tipo

### Próximos Eventos
- **Lista dos próximos eventos** do ministério
- **Informações básicas** (título, local, data)
- **Integração** com módulo de eventos

### Estatísticas Gerais
- **Cards informativos** com ícones
- **Cores diferenciadas** para cada métrica
- **Atualização em tempo real**

## 🎨 Interface e Design

### Design System
- **Cor primária**: #0F430F (verde do Exaltart)
- **Componentes Shadcn/UI** para consistência
- **Tailwind CSS** para estilização
- **Tema responsivo** para todos os dispositivos

### Navegação
- **Sidebar responsiva** com menu colapsível
- **Indicadores visuais** de página ativa
- **Menu mobile** otimizado
- **Breadcrumbs** para navegação

### Componentes Reutilizáveis
- **Tabelas** com ordenação e filtros
- **Formulários** com validação
- **Modais** para criação/edição
- **Notificações** toast
- **Botões** com estados de loading

## 🔧 Funcionalidades Técnicas

### Validação de Dados
- **Validação no frontend** com feedback visual
- **Validação no backend** com Zod
- **Mensagens de erro** específicas
- **Prevenção de dados inválidos**

### Gerenciamento de Estado
- **Zustand** para estado global
- **Persistência** no localStorage
- **Sincronização** com API
- **Otimização** de re-renders

### Integração com API
- **Axios** para requisições HTTP
- **Interceptors** para autenticação
- **Tratamento de erros** centralizado
- **Loading states** em todas as operações

### Responsividade
- **Mobile-first** design
- **Breakpoints** otimizados
- **Touch-friendly** interfaces
- **Performance** em dispositivos móveis

## 🚀 Como Usar

### Para Administradores
1. **Faça login** com credenciais de admin
2. **Acesse "Membros"** para gerenciar usuários
3. **Acesse "Finanças"** para controlar transações
4. **Use o Dashboard** para acompanhar métricas

### Para Membros
1. **Faça login** com suas credenciais
2. **Visualize o Dashboard** com informações gerais
3. **Navegue pelas seções** disponíveis
4. **Acompanhe eventos** e atividades

## 🔒 Segurança

### Autenticação
- **JWT tokens** com expiração
- **Hash de senhas** com bcrypt
- **Validação de tokens** em todas as requisições
- **Logout automático** em caso de token inválido

### Autorização
- **Controle de acesso** baseado em roles
- **Proteção de rotas** sensíveis
- **Validação de permissões** no backend
- **Prevenção de acesso** não autorizado

### Validação
- **Sanitização** de dados de entrada
- **Validação** de tipos e formatos
- **Prevenção** de SQL injection
- **Escape** de caracteres especiais

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dispositivos
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (até 767px)

### Recursos Necessários
- JavaScript habilitado
- LocalStorage disponível
- Conexão com internet
- Resolução mínima 320px

---

**Sistema Exaltart** - Desenvolvido para o Ministério de Dança com tecnologia moderna e interface intuitiva.

