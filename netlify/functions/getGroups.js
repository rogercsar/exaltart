// netlify/functions/getGroups.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event) {
  try {
    // Opcionalmente filtra por associação ao usuário autenticado; admins veem todos
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
      select: 'id,name,description,created_by,created_at,updated_at',
      order: 'name.asc'
    };

    // Busca lista de grupos
    const groups = await supabaseFetch('/groups', { params });

    // Se desejar filtrar por grupos do usuário quando não admin
    const filteredGroups = (!isAdmin && userId)
      ? (groups || []).filter(g => !!g)
      : (groups || []);

    const groupIds = filteredGroups.map(g => g.id);

    // Buscar membros de todos os grupos listados
    let memberships = [];
    if (groupIds.length > 0) {
      memberships = await supabaseFetch('/group_members', {
        params: {
          select: 'group_id,user_id,added_at',
          group_id: `in.(${groupIds.join(',')})`
        }
      });
    }

    // Buscar dados dos usuários envolvidos
    const userIds = Array.from(new Set((memberships || []).map(m => m.user_id)));
    let usersMap = {};
    if (userIds.length > 0) {
      const users = await supabaseFetch('/users', {
        params: {
          select: 'id,name,email,photo_url',
          id: `in.(${userIds.join(',')})`
        }
      });
      usersMap = (users || []).reduce((acc, u) => {
        acc[u.id] = { id: u.id, name: u.name, email: u.email, photoUrl: u.photo_url };
        return acc;
      }, {});
    }

    // Montar resposta
    const data = filteredGroups.map(g => {
      const members = (memberships || [])
        .filter(m => m.group_id === g.id)
        .map(m => usersMap[m.user_id])
        .filter(Boolean);
      return {
        id: g.id,
        name: g.name,
        description: g.description || '',
        createdBy: g.created_by || null,
        createdAt: g.created_at,
        updatedAt: g.updated_at,
        members
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    };
  } catch (error) {
    console.error('Erro ao listar grupos:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao listar grupos.' })
    };
  }
};