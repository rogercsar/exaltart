# Configuração do Netlify Functions

## Problema Identificado
Os erros 404 indicam que as Netlify Functions não estão sendo encontradas. Isso pode acontecer por alguns motivos:

## Soluções

### 1. Instalar Netlify CLI
```bash
npm install -g netlify-cli
```

### 2. Executar o projeto com Netlify Dev
```bash
npm run dev:netlify
# Em monorepos, o CLI pode pedir para escolher o site.
# O script já usa --filter exaltart-frontend para evitar prompts.
```

### 3. Configurar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com:
```
AIVEN_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```

### 4. Testar as Funções Localmente
Com o Netlify Dev rodando, as funções estarão disponíveis em:
- `http://localhost:8888/.netlify/functions/getEvents`
- `http://localhost:8888/.netlify/functions/createEvent`
- etc.

### 5. Deploy para Netlify
1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. Faça o deploy

## Estrutura de Arquivos Criada
- `netlify.toml` - Configuração do Netlify
- `frontend/public/_redirects` - Redirecionamentos
- Funções em `netlify/functions/`

## Próximos Passos
1. Execute `npm install` para instalar as dependências
2. Execute `npm run dev:netlify` para testar localmente
3. Configure as variáveis de ambiente
4. Teste as funções no navegador
