// netlify/functions/getRehearsalById.js

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
      const maybeId = last && last !== 'getRehearsalById' ? last : null
      id = maybeId
    }

    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do ensaio é obrigatório' })
      }
    }

    const rows = await supabaseFetch('/rehearsals', {
      params: {
        select: 'id,title,date,location,notes,created_by,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${id}`,
        limit: '1'
      }
    })

    const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null
    if (!row) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Ensaio não encontrado' })
      }
    }

    const rehearsal = {
      id: row.id,
      title: row.title,
      date: row.date,
      location: row.location || null,
      notes: row.notes || null,
      createdBy: row.created_by,
      author: row.author || { id: row.created_by, name: null, email: null },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rehearsal })
    }
  } catch (error) {
    console.error('Erro ao buscar ensaio por ID:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar o ensaio.' })
    }
  }
}