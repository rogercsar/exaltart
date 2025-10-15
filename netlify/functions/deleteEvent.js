// netlify/functions/deleteEvent.js

const { createPoolOrThrow } = require('./_db');

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

    const pool = await createPoolOrThrow();
    const client = await pool.connect();
    
    // Verificar se o evento existe
    const existingEvent = await client.query('SELECT id FROM events WHERE id = $1', [eventId]);
    
    if (existingEvent.rows.length === 0) {
      client.release();
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Evento não encontrado' }),
      };
    }
    
    // Deletar o evento
    await client.query('DELETE FROM events WHERE id = $1', [eventId]);
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Evento excluído com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir o evento.' }),
    };
  }
};
