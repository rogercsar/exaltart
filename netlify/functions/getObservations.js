// netlify/functions/getObservations.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {
    // Query params: page, limit, order, q (search), category, startDate, endDate
    const qp = event.queryStringParameters || {}
    const pageNum = parseInt(qp.page || '1', 10)
    const limitNum = parseInt(qp.limit || '10', 10)
    const offset = (pageNum - 1) * limitNum
    const order = qp.order || 'published_at.desc,created_at.desc'
    const { q, category, startDate, endDate } = qp

    const params = {
      select: 'id,title,content,category,published_at,author_id,created_at,updated_at,author:users(id,name,email)',
      order,
      limit: String(limitNum),
      offset: String(offset)
    }

    if (category) params['category'] = `eq.${category}`

    if (q && q.trim().length > 0) {
      const term = q.trim()
      params['or'] = `(title.ilike.*${term}*,content.ilike.*${term}*)`
    }

    if (startDate && endDate) {
      params['and'] = `(published_at.gte.${startDate},published_at.lte.${endDate})`
    } else if (startDate) {
      params['published_at'] = `gte.${startDate}`
    } else if (endDate) {
      params['published_at'] = `lte.${endDate}`
    }

    // Fetch with exact count for pagination
    const { data: rows, headers } = await supabaseFetch('/observations', {
      params,
      preferCountExact: true,
      returnMeta: true
    })

    const contentRange = headers['content-range']
    let total = 0
    if (contentRange && contentRange.includes('/')) {
      const parts = contentRange.split('/')
      const totalStr = parts[1]
      total = parseInt(totalStr, 10) || 0
    }

    const data = (rows || []).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      category: row.category || null,
      publishedAt: row.published_at,
      authorId: row.author_id || null,
      author: row.author ? {
        id: row.author.id,
        name: row.author.name,
        email: row.author.email
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.max(1, Math.ceil((total || 0) / limitNum))
        }
      })
    }
  } catch (error) {
    console.error('Erro ao listar observações:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao listar observações.' })
    }
  }
}