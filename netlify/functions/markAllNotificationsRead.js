// netlify/functions/markAllNotificationsRead.js

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

    const userId = decoded?.id || decoded?.userId
    if (!userId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Usuário não identificado no token' }) }
    }

    const nowIso = new Date().toISOString()

    // Patch all unread notifications for this user
    await supabaseFetch('/notifications', {
      method: 'PATCH',
      params: { and: `(user_id.eq.${userId},read.eq.false)` },
      body: { read: true, read_at: nowIso }
    })

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ success: true }) }
  } catch (error) {
    console.error('Erro ao marcar todas notificações como lidas:', error)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao marcar notificações.' }) }
  }
}