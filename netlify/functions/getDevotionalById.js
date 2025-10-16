// netlify/functions/getDevotionalById.js

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
      const maybeId = last && last !== 'getDevotionalById' ? last : null
      id = maybeId
    }

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do devocional é obrigatório' })
      }
    }

    const rows = await supabaseFetch('/devotional_posts', {
      params: {
        select: 'id,title,content,frequency,published_at,created_at,updated_at',
        id: `eq.${id}`,
        limit: '1'
      }
    })

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
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
    console.error('Erro ao buscar devocional por ID:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar o devocional.' })
    }
  }
}