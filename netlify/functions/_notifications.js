// netlify/functions/_notifications.js

const { supabaseFetch } = require('./_supabase')

async function createNotification({ userId, type, entityType = null, entityId = null, title, message = null }) {
  if (!userId || !type || !title) return
  const payload = { user_id: userId, type, entity_type: entityType, entity_id: entityId, title, message }
  try {
    await supabaseFetch('/notifications', { method: 'POST', body: payload })
  } catch (err) {
    console.error('Falha ao criar notificação:', err?.message || err)
  }
}

async function createNotificationsBulk(notifs = []) {
  const rows = (Array.isArray(notifs) ? notifs : []).filter(n => n && n.userId && n.type && n.title).map(n => ({
    user_id: n.userId,
    type: n.type,
    entity_type: n.entityType || null,
    entity_id: n.entityId || null,
    title: n.title,
    message: n.message || null
  }))
  if (rows.length === 0) return
  try {
    await supabaseFetch('/notifications', { method: 'POST', body: rows })
  } catch (err) {
    console.error('Falha ao criar notificações em lote:', err?.message || err)
  }
}

module.exports = { createNotification, createNotificationsBulk }