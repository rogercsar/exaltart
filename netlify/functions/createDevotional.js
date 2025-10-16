// netlify/functions/createDevotional.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' })
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
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    if (!decoded || decoded.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Permissão negada' })
      };
    }

    const { title, content, frequency, publishedAt } = JSON.parse(event.body || '{}');

    if (!title || !content || !frequency) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Título, conteúdo e frequência são obrigatórios' })
      };
    }

    if (frequency !== 'WEEKLY' && frequency !== 'MONTHLY') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Frequência deve ser WEEKLY ou MONTHLY' })
      };
    }

    const inserted = await supabaseFetch('/devotional_posts', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        title,
        content,
        frequency,
        published_at: publishedAt || new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    const devotional = {
      id: row.id,
      title: row.title,
      content: row.content,
      frequency: row.frequency,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devotional })
    };
  } catch (error) {
    console.error('Erro ao criar devocional:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao criar devocional.' })
    };
  }
};