// netlify/functions/getEvents.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {
    // Buscar eventos com o autor embutido e normalizar campos para o frontend
    const rows = await supabaseFetch('/events', {
      params: {
        select: 'id,title,description,location,start_time,end_time,author_id,created_at,updated_at,author:users(id,name,email)',
        order: 'start_time.asc'
      }
    });

    const events = (rows || []).map(row => ({
      id: row.id,
      title: row.title,
      description: row.description || null,
      location: row.location || null,
      startTime: row.start_time,
      endTime: row.end_time,
      authorId: row.author_id,
      author: row.author || { id: row.author_id, name: null, email: null },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(events),
    };
  } catch (error) {
    console.error('Erro ao buscar eventos via Supabase REST:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao buscar os eventos.' }),
    };
  }
};