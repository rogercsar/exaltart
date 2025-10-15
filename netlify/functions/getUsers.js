// netlify/functions/getUsers.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {
    const rows = await supabaseFetch('/users', {
      params: {
        select: 'id,name,email,role,birth_date,photo_url,phone,ministry_entry_date,created_at,updated_at',
        order: 'name.asc'
      }
    });

    const users = (rows || []).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      birthDate: row.birth_date || null,
      photoUrl: row.photo_url || null,
      phone: row.phone || null,
      ministryEntryDate: row.ministry_entry_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users }),
    };
  } catch (error) {
    console.error('Erro ao buscar usuários (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar os usuários.' }),
    };
  }
};
