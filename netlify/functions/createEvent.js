// netlify/functions/createEvent.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

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

    // Autenticação e autorização (Admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    let decoded;
    try {
      const token = authHeader.substring(7);
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    if (!decoded || decoded.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Permissão negada' }),
      };
    }

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
        author_id: decoded.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    const created = Array.isArray(inserted) ? inserted[0] : inserted;

    // Buscar o evento criado com autor embed para alinhar ao frontend
    const rows = await supabaseFetch('/events', {
      params: {
        select: 'id,title,description,location,start_time,end_time,author_id,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${created.id}`,
        limit: '1'
      }
    });

    const row = rows && rows[0] ? rows[0] : created;
    const eventData = {
      id: row.id,
      title: row.title,
      description: row.description || null,
      location: row.location || null,
      startTime: row.start_time,
      endTime: row.end_time,
      authorId: row.author_id,
      author: row.author || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event: eventData }),
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
