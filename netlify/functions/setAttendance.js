// netlify/functions/setAttendance.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

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
    const parsed = event.body ? JSON.parse(event.body) : {}
    const { rehearsalId, records } = parsed

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

    // Validações básicas
    if (!rehearsalId || !Array.isArray(records)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'rehearsalId e records são obrigatórios' })
      }
    }

    // Validar status
    const allowed = new Set(['PRESENT', 'ABSENT', 'JUSTIFIED'])
    for (const r of records) {
      if (!r || !r.userId || !allowed.has(r.status)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Registro inválido: userId e status válidos são obrigatórios' })
        }
      }
    }

    // Upsert em lote usando on_conflict (rehearsal_id,user_id)
    const payload = records.map(r => ({
      rehearsal_id: rehearsalId,
      user_id: r.userId,
      status: r.status,
      note: r.note || null,
      marked_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const upserted = await supabaseFetch('/attendance_records', {
      method: 'POST',
      params: {
        on_conflict: 'rehearsal_id,user_id'
      },
      headers: {
        'Prefer': 'resolution=merge-duplicates, return=representation'
      },
      body: payload
    })

    const normalized = (upserted || []).map(row => ({
      id: row.id,
      rehearsalId: row.rehearsal_id,
      userId: row.user_id,
      status: row.status,
      note: row.note || null,
      markedAt: row.marked_at,
      updatedAt: row.updated_at
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: normalized })
    }
  } catch (error) {
    console.error('Erro ao definir presença:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao registrar presença.' })
    }
  }
}