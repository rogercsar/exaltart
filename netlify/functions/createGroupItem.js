// netlify/functions/createGroupItem.js

const { supabaseFetch } = require('./_supabase')
const { createNotificationsBulk } = require('./_notifications')
const jwt = require('jsonwebtoken')

exports.handler = async function(event) {
  try {
    const body = JSON.parse(event.body || '{}')
    const { groupId, title, type, url, storagePath, description } = body

    if (!groupId || !title || !type) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Campos obrigatórios: groupId, title, type.' })
      }
    }

    if (!['LINK','FILE'].includes(type)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'type deve ser LINK ou FILE.' })
      }
    }

    const authHeader = event.headers.authorization || event.headers.Authorization
    let authorId = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        authorId = decoded?.id || decoded?.userId || null
      } catch (_) {}
    }

    const payload = {
      group_id: groupId,
      title,
      description: description || null,
      type,
      url: url || null,
      storage_path: storagePath || null,
      author_id: authorId || null
    }

    const inserted = await supabaseFetch('/group_items', {
      method: 'POST',
      body: payload,
      preferRepresentation: true
    })

    const row = Array.isArray(inserted) ? inserted[0] : inserted
    const item = {
      id: row.id,
      groupId: row.group_id,
      title: row.title,
      description: row.description || '',
      type: row.type,
      url: row.url || null,
      storagePath: row.storage_path || null,
      authorId: row.author_id || null,
      author: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }

    // Notificar membros do grupo (exceto o autor)
    let groupName = ''
    try {
      const gRows = await supabaseFetch('/groups', { params: { select: 'id,name', id: `eq.${groupId}` } })
      const g = Array.isArray(gRows) ? gRows[0] : gRows
      groupName = g?.name || ''
    } catch (_) {}

    try {
      const ms = await supabaseFetch('/group_members', { params: { select: 'user_id', group_id: `eq.${groupId}` } })
      const targetIds = (ms || []).map(m => m.user_id).filter(uid => !authorId || uid !== authorId)
      if (targetIds.length > 0) {
        await createNotificationsBulk(targetIds.map(uid => ({
          userId: uid,
          type: 'GROUP_ITEM_PUBLISHED',
          entityType: 'GROUP',
          entityId: groupId,
          title: groupName ? `Novo item em ${groupName}` : 'Novo item no grupo',
          message: `${type === 'FILE' ? 'Arquivo' : 'Link'}: ${title}`
        })))
      }
    } catch (err) {
      console.error('Falha ao notificar membros do grupo:', err?.message || err)
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item })
    }
  } catch (error) {
    console.error('Erro ao criar item do grupo:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao criar item do grupo.' })
    }
  }
}