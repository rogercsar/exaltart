// netlify/functions/updateGroup.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event) {
  if (event.httpMethod !== 'PUT' && event.httpMethod !== 'PATCH') {
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

    const qp = event.queryStringParameters || {};
    const groupId = qp.id;
    if (!groupId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID do grupo é obrigatório' }) };
    }

    const { name, description, memberIds } = JSON.parse(event.body || '{}');
    const nowIso = new Date().toISOString();

    // Atualizar dados do grupo
    const updatedRows = await supabaseFetch('/groups', {
      method: 'PATCH',
      preferRepresentation: true,
      params: { id: `eq.${groupId}` },
      body: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        updated_at: nowIso
      }
    });

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

    // Atualizar membros se enviado
    if (Array.isArray(memberIds)) {
      // Remove todos e insere novamente
      await supabaseFetch('/group_members', {
        method: 'DELETE',
        params: { group_id: `eq.${groupId}` }
      });

      if (memberIds.length > 0) {
        await supabaseFetch('/group_members', {
          method: 'POST',
          body: memberIds.map(uid => ({ group_id: groupId, user_id: uid, added_at: nowIso }))
        });
      }
    }

    // Montar membros
    let members = [];
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      const users = await supabaseFetch('/users', { params: { select: 'id,name,email,photo_url', id: `in.(${memberIds.join(',')})` } });
      members = (users || []).map(u => ({ id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url }));
    } else {
      const ms = await supabaseFetch('/group_members', { params: { select: 'user_id', group_id: `eq.${groupId}` } });
      const ids = Array.from(new Set((ms || []).map(m => m.user_id)));
      if (ids.length > 0) {
        const users = await supabaseFetch('/users', { params: { select: 'id,name,email,photo_url', id: `in.(${ids.join(',')})` } });
        members = (users || []).map(u => ({ id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url }));
      }
    }

    const group = {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      createdBy: updated.created_by || null,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      members
    };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group }) };
  } catch (error) {
    console.error('Erro ao atualizar grupo:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao atualizar grupo.' }) };
  }
};