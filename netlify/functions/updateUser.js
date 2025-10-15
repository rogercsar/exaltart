// netlify/functions/updateUser.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método PUT
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
      };
    }

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

    // Verificar se o usuário existe via Supabase REST
    const existing = await supabaseFetch('/users', {
      params: { select: 'id', id: `eq.${userId}`, limit: '1' }
    });
    if (!existing || existing.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    // Verificar se o email já está em uso por outro usuário
    const emailCheck = await supabaseFetch('/users', {
      params: {
        select: 'id',
        email: `eq.${email}`,
        id: `neq.${userId}`,
        limit: '1'
      }
    });
    if (emailCheck && emailCheck.length > 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Email já está em uso por outro usuário' }),
      };
    }

    // Atualizar via Supabase REST
    const updatedRows = await supabaseFetch('/users', {
      method: 'PATCH',
      params: { id: `eq.${userId}` },
      preferRepresentation: true,
      body: {
        name,
        email,
        role,
        birth_date: birthDate || null,
        photo_url: photoUrl || null,
        phone: phone || null,
        updated_at: new Date().toISOString()
      }
    });

    const row = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;
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
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao atualizar o usuário.' }),
    };
  }
};
