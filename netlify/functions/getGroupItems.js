// netlify/functions/getGroupItems.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event) {
  try {
    const groupId = (event.queryStringParameters && event.queryStringParameters.groupId) || null
    if (!groupId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Parâmetro groupId é obrigatório.' })
      }
    }

    // Opcional: obter autor atual
    const authHeader = event.headers.authorization || event.headers.Authorization
    let requesterId = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7)
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
        requesterId = decoded?.id || decoded?.userId || null
      } catch (_) {}
    }

    let itemsRaw = []
    try {
      itemsRaw = await supabaseFetch('/group_items', {
        params: {
          select: 'id,group_id,title,description,type,url,storage_path,author_id,created_at,updated_at',
          group_id: `eq.${groupId}`,
          order: 'created_at.desc'
        }
        // Não encaminhar Authorization do usuário para o Supabase REST
      })
    } catch (err) {
      console.error('Falha ao buscar itens do grupo no Supabase:', err?.message || err)
      itemsRaw = []
    }

    const authorIds = Array.from(new Set((itemsRaw || []).map(i => i.author_id).filter(Boolean)))
    let usersMap = {}
    if (authorIds.length > 0) {
      try {
        const users = await supabaseFetch('/users', {
          params: {
            select: 'id,name,email',
            id: `in.(${authorIds.join(',')})`
          }
          // Não encaminhar Authorization do usuário para o Supabase REST
        })
        usersMap = (users || []).reduce((acc, u) => {
          acc[u.id] = { id: u.id, name: u.name, email: u.email }
          return acc
        }, {})
      } catch (err) {
        console.error('Falha ao buscar autores:', err?.message || err)
        usersMap = {}
      }
    }

    const data = (itemsRaw || []).map(i => ({
      id: i.id,
      groupId: i.group_id,
      title: i.title,
      description: i.description || '',
      type: i.type,
      url: i.url || null,
      storagePath: i.storage_path || null,
      authorId: i.author_id || null,
      author: i.author_id ? (usersMap[i.author_id] || null) : null,
      createdAt: i.created_at,
      updatedAt: i.updated_at
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    }
  } catch (error) {
    console.error('Erro ao listar itens de grupo:', error)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [], warning: 'Falha ao listar itens do grupo.' })
    }
  }
}