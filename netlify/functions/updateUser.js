// netlify/functions/updateUser.js

const bcrypt = require('bcryptjs');
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
    // Extrair ID de forma robusta (Netlify nem sempre popula pathParameters)
    let userId = event.pathParameters?.userId || event.pathParameters?.id;
    if (!userId && event.queryStringParameters && event.queryStringParameters.id) {
      userId = event.queryStringParameters.id;
    }
    if (!userId && event.path) {
      const segments = event.path.split('/').filter(Boolean);
      // Esperado: /.netlify/functions/updateUser/:id
      const last = segments[segments.length - 1];
      const maybeId = last && last !== 'updateUser' ? last : null;
      userId = maybeId;
    }
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
      };
    }

    const parsed = event.body ? JSON.parse(event.body) : {};
    const { name, email, role, birthDate, photoUrl, phone, password } = parsed;

    // Validações flexíveis: permitir atualização parcial
    if (role && role !== 'ADMIN' && role !== 'MEMBER') {
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

    // Verificar se o email já está em uso por outro usuário (apenas se foi fornecido)
    if (email) {
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
    }

    // Atualizar via Supabase REST
    // Construir corpo de atualização somente com campos fornecidos
    const patchBody = { updated_at: new Date().toISOString() };
    if (name !== undefined) patchBody.name = name;
    if (email !== undefined) patchBody.email = email;
    if (role !== undefined) patchBody.role = role;
    if (birthDate !== undefined) patchBody.birth_date = birthDate || null;
    if (photoUrl !== undefined) patchBody.photo_url = photoUrl || null;
    if (phone !== undefined) patchBody.phone = phone || null;

    // Atualização de senha (opcional)
    if (password !== undefined) {
      const pwd = String(password || '').trim();
      if (pwd) {
        if (pwd.length < 6) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
          };
        }
        const hashed = await bcrypt.hash(pwd, 10);
        patchBody.password = hashed;
      }
    }

    // Se nenhum campo foi fornecido, retorne representação atual para evitar 400 desnecessário
    const keysToUpdate = Object.keys(patchBody).filter(k => k !== 'updated_at');
    if (keysToUpdate.length === 0) {
      const existingFull = await supabaseFetch('/users', {
        params: {
          select: '*',
          id: `eq.${userId}`,
          limit: '1'
        }
      });
      const row = Array.isArray(existingFull) ? existingFull[0] : existingFull;
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
    }

    const updatedRows = await supabaseFetch('/users', {
      method: 'PATCH',
      params: { id: `eq.${userId}` },
      preferRepresentation: true,
      body: patchBody
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
