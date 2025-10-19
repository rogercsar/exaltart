// netlify/functions/deleteGroupItem.js

const { supabaseFetch } = require('./_supabase')

exports.handler = async function(event) {
  try {
    const id = (event.queryStringParameters && event.queryStringParameters.id) || null
    if (!id) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Parâmetro id é obrigatório.' })
      }
    }

    await supabaseFetch('/group_items', {
      method: 'DELETE',
      params: { id: `eq.${id}` }
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    console.error('Erro ao remover item do grupo:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao remover item do grupo.' })
    }
  }
}