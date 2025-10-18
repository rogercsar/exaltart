// netlify/functions/deleteRehearsal.js

const { supabaseFetch } = require('./_supabase')
const jwt = require('jsonwebtoken')

exports.handler = async function(event, context) {
  // Verificar método
  if (event.httpMethod !== 'DELETE') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    }
  }

  try {
    const qp = event.queryStringParameters || {}
    let rehearsalId = event.pathParameters?.id
    if (!rehearsalId && qp.id) rehearsalId = qp.id
    if (!rehearsalId && event.path) {
      const segments = event.path.split('/').filter(Boolean)
      const last = segments[segments.length - 1]
      const maybeId = last && last !== 'deleteRehearsal' ? last : null
      rehearsalId = maybeId || rehearsalId
    }

    if (!rehearsalId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'ID do ensaio é obrigatório' })
      }
    }

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

    await supabaseFetch('/rehearsals', {
      method: 'DELETE',
      params: {
        id: `eq.${rehearsalId}`
      }
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Ensaio excluído com sucesso' })
    }
  } catch (error) {
    console.error('Erro ao excluir ensaio:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao excluir o ensaio.' })
    }
  }
}