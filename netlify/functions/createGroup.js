// netlify/functions/createGroup.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Método não permitido' }) };
  }

  try {
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token de autorização não fornecido' }) };
    }

    let decoded;
    try {
      decoded = jwt.verify(authHeader.substring(7), process.env.JWT_SECRET || 'your-secret-key');
    } catch (_) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token inválido' }) };
    }

    if (!decoded || decoded.role !== 'ADMIN') {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Permissão negada' }) };
    }

    const { name, description, memberIds } = JSON.parse(event.body || '{}');
    if (!name || typeof name !== 'string') {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Nome do grupo é obrigatório' }) };
    }

    const nowIso = new Date().toISOString();

    const inserted = await supabaseFetch('/groups', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        name,
        description: description || '',
        created_by: decoded.id || decoded.userId || null,
        created_at: nowIso,
        updated_at: nowIso
      }
    });

    const groupRow = Array.isArray(inserted) ? inserted[0] : inserted;

    if (Array.isArray(memberIds) && memberIds.length > 0) {
      await supabaseFetch('/group_members', {
        method: 'POST',
        preferRepresentation: false,
        body: memberIds.map(uid => ({ group_id: groupRow.id, user_id: uid, added_at: nowIso }))
      });
    }

    // Build members
    let members = [];
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const users = await supabaseFetch('/users', {
        params: { select: 'id,name,email,photo_url', id: `in.(${memberIds.join(',')})` }
      });
      members = (users || []).map(u => ({ id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url }));
    }

    const group = {
      id: groupRow.id,
      name: groupRow.name,
      description: groupRow.description || '',
      createdBy: groupRow.created_by || null,
      createdAt: groupRow.created_at,
      updatedAt: groupRow.updated_at,
      members
    };

    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group }) };
  } catch (error) {
    console.error('Erro ao criar grupo:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao criar grupo.' }) };
  }
};