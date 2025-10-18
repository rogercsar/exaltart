// netlify/functions/createRehearsal.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Verificar método
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    const { title, date, location, notes } = JSON.parse(event.body || '{}')

    // Autenticação e autorização (Admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
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

    // Validações
    if (!title || !date) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Título e data são obrigatórios' })
      }
    }

    // Inserir ensaio
    const inserted = await supabaseFetch('/rehearsals', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        title,
        date,
        location: location || null,
        notes: notes || null,
        created_by: decoded.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    const created = Array.isArray(inserted) ? inserted[0] : inserted

    // Buscar com autor embutido
    const rows = await supabaseFetch('/rehearsals', {
      params: {
        select: 'id,title,date,location,notes,created_by,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${created.id}`,
        limit: '1'
      }
    })

    const row = rows && rows[0] ? rows[0] : created
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
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rehearsal })
    }
  } catch (error) {
    console.error('Erro ao criar ensaio:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao criar o ensaio.' })
    }
  }
}