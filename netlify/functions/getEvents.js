// netlify/functions/getEvents.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {
    const rows = await supabaseFetch('/events', {
      params: {
        select: '*',
        order: 'start_time.asc'
      }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rows),
    };
  } catch (error) {
    console.error('Erro ao buscar eventos via Supabase REST:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao buscar os eventos.' }),
    };
  }
};