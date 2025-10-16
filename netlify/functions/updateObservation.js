// netlify/functions/updateObservation.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
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

    const qp = event.queryStringParameters || {}
    const id = qp.id
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID da observação é obrigatório' })
      }
    }

    const { title, content, category, publishedAt } = JSON.parse(event.body || '{}')

    const body = {}
    if (title !== undefined) body.title = title
    if (content !== undefined) body.content = content
    if (category !== undefined) body.category = category
    if (publishedAt !== undefined) body.published_at = publishedAt
    body.updated_at = new Date().toISOString()

    const updated = await supabaseFetch('/observations', {
      method: 'PATCH',
      params: { id: `eq.${id}` },
      preferRepresentation: true,
      body
    })

    const row = Array.isArray(updated) ? updated[0] : updated
    if (!row) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Observação não encontrada' })
      }
    }

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
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation })
    }
  } catch (error) {
    console.error('Erro ao atualizar observação:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao atualizar observação.' })
    }
  }
}