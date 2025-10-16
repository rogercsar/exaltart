// netlify/functions/createObservation.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' })
      }
    }

    let decoded
    try {
      const token = authHeader.substring(7)
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' })
      }
    }

    if (!decoded || decoded.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Permissão negada' })
      }
    }

    const { title, content, category, publishedAt } = JSON.parse(event.body || '{}')

    if (!title || !content) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Título e conteúdo são obrigatórios' })
      }
    }

    const inserted = await supabaseFetch('/observations', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        title,
        content,
        category: category || null,
        published_at: publishedAt || new Date().toISOString(),
        author_id: decoded.userId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const row = Array.isArray(inserted) ? inserted[0] : inserted
    const observation = {
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category || null,
      publishedAt: row.published_at,
      authorId: row.author_id || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation })
    }
  } catch (error) {
    console.error('Erro ao criar observação:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao criar observação.' })
    }
  }
}