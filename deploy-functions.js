// Script para fazer deploy das funções Netlify
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Fazendo deploy das funções Netlify...');

try {
  // Verificar se o Netlify CLI está instalado
  execSync('netlify --version', { stdio: 'pipe' });
  console.log('✅ Netlify CLI encontrado');

  // Fazer deploy das funções
  console.log('📦 Fazendo deploy...');
  execSync('netlify deploy --prod --dir frontend/dist --functions netlify/functions', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Deploy concluído!');
  console.log('🌐 Suas funções estão disponíveis em:');
  console.log('   - https://exaltart.netlify.app/.netlify/functions/getEvents');
  console.log('   - https://exaltart.netlify.app/.netlify/functions/login');
  console.log('   - https://exaltart.netlify.app/.netlify/functions/register');
  console.log('   - E todas as outras funções...');

} catch (error) {
  console.error('❌ Erro no deploy:', error.message);
  console.log('\n📋 Instruções manuais:');
  console.log('1. Execute: netlify deploy --prod --dir frontend/dist --functions netlify/functions');
  console.log('2. Ou use o painel do Netlify para fazer deploy');
}
