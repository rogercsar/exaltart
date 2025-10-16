// netlify/functions/updateDevotional.js

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
        body: JSON.stringify({ error: 'ID do devocional é obrigatório' })
      }
    }

    const { title, content, frequency, publishedAt } = JSON.parse(event.body || '{}')

    if (frequency !== undefined && frequency !== 'WEEKLY' && frequency !== 'MONTHLY') {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Frequência deve ser WEEKLY ou MONTHLY' })
      }
    }

    const body = {}
    if (title !== undefined) body.title = title
    if (content !== undefined) body.content = content
    if (frequency !== undefined) body.frequency = frequency
    if (publishedAt !== undefined) body.published_at = publishedAt
    body.updated_at = new Date().toISOString()

    const updated = await supabaseFetch('/devotional_posts', {
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
        body: JSON.stringify({ error: 'Devocional não encontrado' })
      }
    }

    const devotional = {
      id: row.id,
      title: row.title,
      content: row.content,
      frequency: row.frequency,
      publishedAt: row.published_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ devotional })
    }
  } catch (error) {
    console.error('Erro ao atualizar devocional:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao atualizar devocional.' })
    }
  }
}