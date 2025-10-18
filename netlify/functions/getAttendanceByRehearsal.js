// netlify/functions/getAttendanceByRehearsal.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event, context) {
  try {
    // Autenticação: requer ADMIN
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

    // Extrair rehearsalId
    let rehearsalId = event.pathParameters?.id
    if (!rehearsalId && event.queryStringParameters && event.queryStringParameters.rehearsalId) {
      rehearsalId = event.queryStringParameters.rehearsalId
    }
    if (!rehearsalId && event.path) {
      const segments = event.path.split('/').filter(Boolean)
      const last = segments[segments.length - 1]
      const maybeId = last && last !== 'getAttendanceByRehearsal' ? last : null
      rehearsalId = maybeId
    }

    if (!rehearsalId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do ensaio é obrigatório' })
      }
    }

    const rows = await supabaseFetch('/attendance_records', {
      params: {
        select: 'id,rehearsal_id,user_id,status,note,marked_at,updated_at,user:users(id,name,email,role)',
        rehearsal_id: `eq.${rehearsalId}`,
        order: 'user_id.asc'
      }
    })

    const records = (rows || []).map(row => ({
      id: row.id,
      rehearsalId: row.rehearsal_id,
      userId: row.user_id,
      status: row.status,
      note: row.note || null,
      markedAt: row.marked_at,
      updatedAt: row.updated_at,
      user: row.user ? {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        role: row.user.role
      } : undefined
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records })
    }
  } catch (error) {
    console.error('Erro ao listar presença por ensaio:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao listar presenças.' })
    }
  }
}