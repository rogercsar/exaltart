// netlify/functions/updateEvent.js

const { createPoolOrThrow } = require('./_db');

exports.handler = async function(event, context) {
  // Verificar se é um método PUT
  if (event.httpMethod !== 'PUT') {
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

    const { title, description, location, startTime, endTime } = JSON.parse(event.body);

    // Validações básicas
    if (!title || !startTime || !endTime) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Título, data de início e data de término são obrigatórios' }),
      };
    }

    // Validar que a data de término é posterior à data de início
    if (new Date(endTime) <= new Date(startTime)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'A data de término deve ser posterior à data de início' }),
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
    
    // Atualizar o evento
    const result = await client.query(
      `UPDATE events 
       SET title = $1, description = $2, location = $3, start_time = $4, end_time = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [title, description || null, location || null, startTime, endTime, eventId]
    );
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: result.rows[0] }),
    };
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao atualizar o evento.' }),
    };
  }
};
