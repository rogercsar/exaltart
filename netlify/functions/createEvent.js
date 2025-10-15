// netlify/functions/createEvent.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
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

    // Inserir o novo evento via Supabase REST
    const inserted = await supabaseFetch('/events', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        title,
        description: description || null,
        location: location || null,
        start_time: startTime,
        end_time: endTime,
        author_id: '1', // TODO: Usar ID do usuário autenticado
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: Array.isArray(inserted) ? inserted[0] : inserted }),
    };
  } catch (error) {
    console.error('Erro ao criar evento (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao criar o evento.' }),
    };
  }
};
