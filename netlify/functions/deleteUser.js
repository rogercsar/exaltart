// netlify/functions/deleteUser.js

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
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
      };
    }

    // Verificar se o usuário existe via Supabase REST
    const existing = await supabaseFetch('/users', {
      params: { select: 'id', id: `eq.${userId}`, limit: '1' }
    });
    
    if (!existing || existing.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    // Deletar via Supabase REST (idempotente)
    await supabaseFetch('/users', {
      method: 'DELETE',
      params: { id: `eq.${userId}` }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Usuário excluído com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir o usuário.' }),
    };
  }
};
