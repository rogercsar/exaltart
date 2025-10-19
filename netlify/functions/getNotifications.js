// netlify/functions/getNotifications.js

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

    const qp = event.queryStringParameters || {}
    const limitNum = parseInt(qp.limit || '20', 10)

    const { data: rows, headers } = await supabaseFetch('/notifications', {
      params: {
        select: 'id,user_id,type,entity_type,entity_id,title,message,read,created_at,read_at',
        user_id: `eq.${userId}`,
        order: 'created_at.desc',
        limit: String(limitNum)
      },
      preferCountExact: true,
      returnMeta: true
    })

    // Unread count
    const { data: unreadRows } = await supabaseFetch('/notifications', {
      params: { select: 'id', user_id: `eq.${userId}`, read: 'eq.false' },
      returnMeta: true
    })
    const unreadCount = Array.isArray(unreadRows) ? unreadRows.length : 0

    const notifications = (rows || []).map(r => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      entityType: r.entity_type,
      entityId: r.entity_id,
      title: r.title,
      message: r.message || '',
      read: !!r.read,
      createdAt: r.created_at,
      readAt: r.read_at || null
    }))

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notifications, unreadCount }) }
  } catch (error) {
    console.error('Erro ao obter notificações:', error)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao obter notificações.' }) }
  }
}