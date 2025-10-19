// netlify/functions/updateScale.js

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
    const scaleId = qp.id;
    if (!scaleId) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'ID da escala é obrigatório' }) };
    }

    const { status, weekStart, weekEnd, groupId, assignedMemberIds } = JSON.parse(event.body || '{}');
    const nowIso = new Date().toISOString();

    const updateBody = { updated_at: nowIso };
    if (status) updateBody.status = status;
    if (weekStart) updateBody.week_start = weekStart;
    if (weekEnd) updateBody.week_end = weekEnd;
    if (groupId !== undefined) updateBody.group_id = groupId || null;

    const updatedRows = await supabaseFetch('/scales', {
      method: 'PATCH',
      preferRepresentation: true,
      params: { id: `eq.${scaleId}` },
      body: updateBody
    });

    const updated = Array.isArray(updatedRows) ? updatedRows[0] : updatedRows;

    // Atualizar atribuições se enviado
    if (Array.isArray(assignedMemberIds)) {
      await supabaseFetch('/scale_assignments', { method: 'DELETE', params: { scale_id: `eq.${scaleId}` } });
      if (assignedMemberIds.length > 0) {
        await supabaseFetch('/scale_assignments', {
          method: 'POST',
          body: assignedMemberIds.map(uid => ({ scale_id: scaleId, user_id: uid, created_at: nowIso, updated_at: nowIso }))
        });
      }
    }

    // Buscar membros atribuídos
    const assignments = await supabaseFetch('/scale_assignments', { params: { select: 'user_id,viewed_at', scale_id: `eq.${scaleId}` } });
    const ids = Array.from(new Set((assignments || []).map(a => a.user_id)));
    let members = [];
    if (ids.length > 0) {
      const users = await supabaseFetch('/users', { params: { select: 'id,name,email,photo_url', id: `in.(${ids.join(',')})` } });
      const usersMap = (users || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      members = (assignments || []).map(a => ({ id: a.user_id, name: usersMap[a.user_id]?.name, email: usersMap[a.user_id]?.email, photoUrl: usersMap[a.user_id]?.photo_url, viewedAt: a.viewed_at || null }));
    }

    const scale = {
      id: updated.id,
      weekStart: updated.week_start,
      weekEnd: updated.week_end,
      status: updated.status,
      groupId: updated.group_id || null,
      createdBy: updated.created_by || null,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
      members
    };

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scale }) };
  } catch (error) {
    console.error('Erro ao atualizar escala:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao atualizar escala.' }) };
  }
};