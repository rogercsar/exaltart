// netlify/functions/createScale.js

const { supabaseFetch } = require('./_supabase');
const { createNotificationsBulk } = require('./_notifications');
const jwt = require('jsonwebtoken');

function ensureWeekEnd(weekStartStr) {
  const d = new Date(weekStartStr);
  if (isNaN(d.getTime())) return null;
  const end = new Date(d);
  end.setUTCDate(d.getUTCDate() + 6);
  return end.toISOString().slice(0, 10);
}

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

    const { weekStart, weekEnd, assignedMemberIds, groupId, status } = JSON.parse(event.body || '{}');

    if (!weekStart) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'weekStart é obrigatório (YYYY-MM-DD)' }) };
    }

    const computedWeekEnd = weekEnd || ensureWeekEnd(weekStart);
    if (!computedWeekEnd) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Data de início inválida' }) };
    }

    const nowIso = new Date().toISOString();

    const inserted = await supabaseFetch('/scales', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        week_start: weekStart,
        week_end: computedWeekEnd,
        status: status || 'DRAFT',
        group_id: groupId || null,
        created_by: decoded.id || decoded.userId || null,
        created_at: nowIso,
        updated_at: nowIso
      }
    });

    const scaleRow = Array.isArray(inserted) ? inserted[0] : inserted;

    if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
      await supabaseFetch('/scale_assignments', {
        method: 'POST',
        body: assignedMemberIds.map(uid => ({ scale_id: scaleRow.id, user_id: uid, created_at: nowIso, updated_at: nowIso }))
      });
    }

    // Build members
    let members = [];
    if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
      const users = await supabaseFetch('/users', { params: { select: 'id,name,email,photo_url', id: `in.(${assignedMemberIds.join(',')})` } });
      members = (users || []).map(u => ({ id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url, viewedAt: null }));
    }

    const scale = {
      id: scaleRow.id,
      weekStart: scaleRow.week_start,
      weekEnd: scaleRow.week_end,
      status: scaleRow.status,
      groupId: scaleRow.group_id || null,
      createdBy: scaleRow.created_by || null,
      createdAt: scaleRow.created_at,
      updatedAt: scaleRow.updated_at,
      members
    };

    // Notificações: atribuições e publicação
    if (Array.isArray(assignedMemberIds) && assignedMemberIds.length > 0) {
      try {
        // Atribuição de escala
        await createNotificationsBulk(assignedMemberIds.map(uid => ({
          userId: uid,
          type: 'SCALE_ASSIGNMENT',
          entityType: 'SCALE',
          entityId: scaleRow.id,
          title: 'Você foi atribuído à escala',
          message: `Semana ${weekStart} até ${computedWeekEnd}`
        })))

        // Publicação da escala
        if ((scaleRow.status || '').toUpperCase() === 'PUBLISHED') {
          await createNotificationsBulk(assignedMemberIds.map(uid => ({
            userId: uid,
            type: 'SCALE_PUBLISHED',
            entityType: 'SCALE',
            entityId: scaleRow.id,
            title: 'Escala publicada',
            message: `Semana ${weekStart}–${computedWeekEnd}`
          })))
        }
      } catch (err) {
        console.error('Falha ao notificar criação de escala:', err?.message || err)
      }
    }

    return { statusCode: 201, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scale }) };
  } catch (error) {
    console.error('Erro ao criar escala:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao criar escala.' }) };
  }
};