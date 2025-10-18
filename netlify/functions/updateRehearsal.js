// netlify/functions/updateRehearsal.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event, context) {
  // Verificar método
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    let rehearsalId = event.pathParameters?.id
    if (!rehearsalId && event.queryStringParameters && event.queryStringParameters.id) {
      rehearsalId = event.queryStringParameters.id
    }
    if (!rehearsalId && event.path) {
      const segments = event.path.split('/').filter(Boolean)
      const last = segments[segments.length - 1]
      const maybeId = last && last !== 'updateRehearsal' ? last : null
      rehearsalId = maybeId
    }

    if (!rehearsalId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do ensaio é obrigatório' })
      }
    }

    const parsed = event.body ? JSON.parse(event.body) : {}
    const { title, date, location, notes } = parsed

    // Autenticação e autorização (Admin only)
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

    // Atualizar via Supabase REST
    const updated = await supabaseFetch('/rehearsals', {
      method: 'PATCH',
      preferRepresentation: true,
      params: {
        id: `eq.${rehearsalId}`
      },
      body: {
        ...(title !== undefined ? { title } : {}),
        ...(date !== undefined ? { date } : {}),
        ...(location !== undefined ? { location: location || null } : {}),
        ...(notes !== undefined ? { notes: notes || null } : {}),
        updated_at: new Date().toISOString()
      }
    })

    const row = Array.isArray(updated) ? updated[0] : updated
    if (!row) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Ensaio não encontrado' })
      }
    }

    // Buscar representação completa com autor
    const fetched = await supabaseFetch('/rehearsals', {
      params: {
        select: 'id,title,date,location,notes,created_by,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${row.id}`,
        limit: '1'
      }
    })

    const fullRow = Array.isArray(fetched) ? fetched[0] : fetched
    const rehearsal = {
      id: fullRow.id,
      title: fullRow.title,
      date: fullRow.date,
      location: fullRow.location || null,
      notes: fullRow.notes || null,
      createdBy: fullRow.created_by,
      author: fullRow.author || { id: fullRow.created_by, name: null, email: null },
      createdAt: fullRow.created_at,
      updatedAt: fullRow.updated_at
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rehearsal })
    }
  } catch (error) {
    console.error('Erro ao atualizar ensaio:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao atualizar o ensaio.' })
    }
  }
}