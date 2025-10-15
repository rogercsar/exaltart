// Script para testar as Netlify Functions localmente ou remotas
const fetch = require('node-fetch');

// Permite apontar para produção definindo NETLIFY_BASE_URL,
// ex.: https://minexaltart.netlify.app/.netlify/functions
const BASE_URL = process.env.NETLIFY_BASE_URL || 'http://localhost:8888/.netlify/functions';

async function testFunction(functionName, method = 'GET', data = null, extraHeaders = {}) {
  try {
    const url = `${BASE_URL}/${functionName}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    console.log(`\n🧪 Testando ${functionName}...`);
    console.log(`URL: ${url}`);
    console.log(`Método: ${method}`);

    const response = await fetch(url, options);
    const result = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Resposta:`, JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log(`✅ ${functionName} funcionando!`);
    } else {
      console.log(`❌ ${functionName} com erro!`);
    }
  } catch (error) {
    console.log(`❌ Erro ao testar ${functionName}:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes das Netlify Functions...\n');
  if (!process.env.NETLIFY_BASE_URL) {
    console.log('Certifique-se de que o Netlify Dev está rodando (npm run dev:netlify)');
  } else {
    console.log(`Usando NETLIFY_BASE_URL=${process.env.NETLIFY_BASE_URL}`);
  }

  // Testes de Autenticação
  console.log('\n🔐 Testando fluxo de autenticação (register -> login -> me)');
  const uniqueSuffix = Date.now();
  const testEmail = `test.user.${uniqueSuffix}@example.com`;
  const testPassword = 'Test@1234';

  // Register (pode ser pulado definindo SKIP_AUTH_TESTS=1)
  if (process.env.SKIP_AUTH_TESTS !== '1') {
    await testFunction('register', 'POST', {
      name: 'Test User',
      email: testEmail,
      password: testPassword,
    });
  } else {
    console.log('⏭️  Pulando registro por SKIP_AUTH_TESTS=1');
  }

  // Login
  let token = null;
  if (process.env.SKIP_AUTH_TESTS === '1') {
    console.log('⏭️  Pulando login/me por SKIP_AUTH_TESTS=1');
  } else {
    const loginResponse = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    try {
      const loginJson = await loginResponse.json();
      console.log(`\n🧪 Testando login...`);
      console.log(`Status: ${loginResponse.status}`);
      console.log('Resposta:', JSON.stringify(loginJson, null, 2));
      if (loginResponse.ok && loginJson.token) {
        token = loginJson.token;
        console.log('✅ Login retornou token.');
      } else {
        console.log('❌ Login não retornou token.');
      }
    } catch (e) {
      console.log('❌ Erro ao processar resposta do login:', e.message);
    }
  }

  // Me (se token disponível)
  if (token) {
    await testFunction('me', 'GET', null, { Authorization: `Bearer ${token}` });
  } else {
    console.log('⚠️  Pulando teste de /me por ausência de token.');
  }

  // Testar função de eventos
  await testFunction('getEvents');

  // Testar função de usuários
  await testFunction('getUsers');

  // Testar função de transações
  await testFunction('getTransactions');

  // Testar função de resumo financeiro
  await testFunction('getFinancialSummary');

  console.log('\n✨ Testes concluídos!');
}

runTests();
