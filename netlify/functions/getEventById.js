// netlify/functions/getEventById.js

const { supabaseFetch } = require('./_supabase')

exports.handler = async function(event, context) {
  try {
    // Extrair ID de forma robusta (suporta /getEventById/:id e query ?id=)
    let eventId = event.pathParameters?.id
    if (!eventId && event.queryStringParameters && event.queryStringParameters.id) {
      eventId = event.queryStringParameters.id
    }
    if (!eventId && event.path) {
      const segments = event.path.split('/').filter(Boolean)
      const last = segments[segments.length - 1]
      const maybeId = last && last !== 'getEventById' ? last : null
      eventId = maybeId
    }

    if (!eventId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do evento é obrigatório' })
      }
    }

    const rows = await supabaseFetch('/events', {
      params: {
        select: 'id,title,description,location,start_time,end_time,author_id,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${eventId}`,
        limit: '1'
      }
    })

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    if (!row) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Evento não encontrado' })
      }
    }

    const eventObj = {
      id: row.id,
      title: row.title,
      description: row.description || null,
      location: row.location || null,
      startTime: row.start_time,
      endTime: row.end_time,
      authorId: row.author_id,
      author: row.author || { id: row.author_id, name: null, email: null },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: eventObj })
    }
  } catch (error) {
    console.error('Erro ao buscar evento por ID:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar o evento.' })
    }
  }
}