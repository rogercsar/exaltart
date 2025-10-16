// netlify/functions/getObservationById.js

const { supabaseFetch } = require('./_supabase')

exports.handler = async function(event, context) {
  try {
    // Extrair ID de forma robusta
    let id = event.pathParameters?.id
    if (!id && event.queryStringParameters && event.queryStringParameters.id) {
      id = event.queryStringParameters.id
    }
    if (!id && event.path) {
      const segments = event.path.split('/').filter(Boolean)
      const last = segments[segments.length - 1]
      const maybeId = last && last !== 'getObservationById' ? last : null
      id = maybeId
    }

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID da observação é obrigatório' })
      }
    }

    const rows = await supabaseFetch('/observations', {
      params: {
        select: 'id,title,content,category,published_at,author_id,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${id}`,
        limit: '1'
      }
    })

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
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
      author: row.author || (row.author_id ? { id: row.author_id, name: null, email: null } : null),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ observation })
    }
  } catch (error) {
    console.error('Erro ao buscar observação por ID:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar a observação.' })
    }
  }
}