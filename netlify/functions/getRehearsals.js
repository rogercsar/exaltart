// netlify/functions/getRehearsals.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event, context) {
  try {
    // Autenticação: requer usuário autenticado
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' })
      }
    }

    try {
      const token = authHeader.substring(7)
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' })
      }
    }

    // Buscar ensaios com autor embutido
    const rows = await supabaseFetch('/rehearsals', {
      params: {
        select: 'id,title,date,location,notes,created_by,created_at,updated_at,author:users(id,name,email)',
        order: 'date.desc'
      }
    })

    const rehearsals = (rows || []).map(row => ({
      id: row.id,
      title: row.title,
      date: row.date,
      location: row.location || null,
      notes: row.notes || null,
      createdBy: row.created_by,
      author: row.author || { id: row.created_by, name: null, email: null },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rehearsals })
    }
  } catch (error) {
    console.error('Erro ao buscar ensaios:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar os ensaios.' })
    }
  }
}