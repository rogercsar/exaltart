// netlify/functions/getScales.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

function getMonthRange(monthStr) {
  // monthStr: 'YYYY-MM'
  const [y, m] = (monthStr || '').split('-').map(Number);
  if (!y || !m) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0)); // last day of month
  const startStr = start.toISOString().slice(0, 10);
  const endStr = end.toISOString().slice(0, 10);
  return { startStr, endStr };
}

exports.handler = async function(event) {
  try {
    const qp = event.queryStringParameters || {};
    const month = qp.month; // 'YYYY-MM'
    const groupId = qp.groupId;

    // Optional: restrict by user membership if not admin
    const authHeader = event.headers.authorization || event.headers.Authorization;
    let userId = null;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded?.id || decoded?.userId || null;
        isAdmin = decoded?.role === 'ADMIN';
      } catch (_) {}
    }

    const params = {
      select: 'id,week_start,week_end,status,group_id,created_by,created_at,updated_at',
      order: 'week_start.asc,created_at.desc'
    };

    if (groupId) params['group_id'] = `eq.${groupId}`;
    if (month) {
      const range = getMonthRange(month);
      if (range) {
        params['and'] = `(week_start.gte.${range.startStr},week_start.lte.${range.endStr})`;
      }
    }

    const scales = await supabaseFetch('/scales', { params });
    const scaleIds = (scales || []).map(s => s.id);

    let assignments = [];
    if (scaleIds.length > 0) {
      assignments = await supabaseFetch('/scale_assignments', {
        params: {
          select: 'scale_id,user_id,viewed_at',
          scale_id: `in.(${scaleIds.join(',')})`
        }
      });
    }

    const userIds = Array.from(new Set((assignments || []).map(a => a.user_id)));
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await supabaseFetch('/users', {
        params: { select: 'id,name,email,photo_url', id: `in.(${userIds.join(',')})` }
      });
      usersMap = (users || []).reduce((acc, u) => {
        acc[u.id] = { id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url };
        return acc;
      }, {});
    }

    const data = (scales || []).map(s => {
      const assigned = (assignments || []).filter(a => a.scale_id === s.id);
      const members = assigned.map(a => ({ ...usersMap[a.user_id], viewedAt: a.viewed_at || null })).filter(Boolean);
      return {
        id: s.id,
        weekStart: s.week_start,
        weekEnd: s.week_end,
        status: s.status,
        groupId: s.group_id || null,
        createdBy: s.created_by || null,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        members
      };
    });

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data }) };
  } catch (error) {
    console.error('Erro ao listar escalas:', error);
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Falha ao listar escalas.' }) };
  }
};