// netlify/functions/markNotificationRead.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event) {
  try {
    const authHeader = event.headers.authorization || event.headers.Authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token de autorização não fornecido' }) }
    }

    let decoded
    try {
      decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET || 'your-secret-key')
    } catch (_) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token inválido' }) }
    }

    const qp = event.queryStringParameters || {}
    const id = qp.id
    if (!id) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID da notificação é obrigatório' }) }
    }

    const nowIso = new Date().toISOString()

    await supabaseFetch('/notifications', {
      method: 'PATCH',
      params: { id: `eq.${id}` },
      body: { read: true, read_at: nowIso }
    })

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) }
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao marcar notificação.' }) }
  }
}