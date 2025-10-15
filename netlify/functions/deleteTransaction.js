// netlify/functions/deleteTransaction.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método DELETE
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const transactionId = event.pathParameters?.id;
    
    if (!transactionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID da transação é obrigatório' }),
      };
    }

    // Deletar via Supabase REST (idempotente)
    // Supabase retorna 204 mesmo se o recurso não existir
    await supabaseFetch('/financial_transactions', {
      method: 'DELETE',
      params: { id: `eq.${transactionId}` }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Transação excluída com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar transação (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir a transação.' }),
    };
  }
};
