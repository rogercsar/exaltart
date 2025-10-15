// netlify/functions/deleteEvent.js

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
    const eventId = event.pathParameters?.id;
    
    if (!eventId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID do evento é obrigatório' }),
      };
    }

    // Deletar via Supabase REST (DELETE com filtro por id)
    // Se o id não existir, Supabase retorna 204 mesmo assim — tratamos como sucesso idempotente
    await supabaseFetch('/events', {
      method: 'DELETE',
      params: {
        id: `eq.${eventId}`
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Evento excluído com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar evento (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir o evento.' }),
    };
  }
};
