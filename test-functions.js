// Script para testar as Netlify Functions localmente
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8888/.netlify/functions';

async function testFunction(functionName, method = 'GET', data = null) {
  try {
    const url = `${BASE_URL}/${functionName}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
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
  console.log('Certifique-se de que o Netlify Dev está rodando (npm run dev:netlify)');

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
