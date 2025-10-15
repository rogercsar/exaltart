// netlify/functions/createUser.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { name, email, role, birthDate, photoUrl, phone } = JSON.parse(event.body);

    // Validações básicas
    if (!name || !email || !role) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Nome, email e função são obrigatórios' }),
      };
    }

    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Função deve ser ADMIN ou MEMBER' }),
      };
    }

    // Verificar se o email já existe via Supabase REST
    const existing = await supabaseFetch('/users', {
      params: {
        select: 'id',
        email: `eq.${email}`,
        limit: '1'
      }
    });

    if (existing && existing.length > 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email já está em uso' }),
      };
    }

    // Inserir o novo usuário via Supabase REST
    const inserted = await supabaseFetch('/users', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        name,
        email,
        role,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        phone: phone || null,
        ministry_entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    const row = Array.isArray(inserted) ? inserted[0] : inserted;

    const user = {
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
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Erro ao criar usuário (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao criar o usuário.' }),
    };
  }
};
