// netlify/functions/updateEvent.js

const { supabaseFetch } = require('./_supabase');

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

    // Atualizar via Supabase REST (PATCH com filtro por id)
    const updated = await supabaseFetch('/events', {
      method: 'PATCH',
      preferRepresentation: true,
      params: {
        id: `eq.${eventId}`
      },
      body: {
        title,
        description: description || null,
        location: location || null,
        start_time: startTime,
        end_time: endTime,
        updated_at: new Date().toISOString()
      }
    });

    const eventRow = Array.isArray(updated) ? updated[0] : updated;
    if (!eventRow) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Evento não encontrado' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: eventRow }),
    };
  } catch (error) {
    console.error('Erro ao atualizar evento (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao atualizar o evento.' }),
    };
  }
};
