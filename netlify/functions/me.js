// netlify/functions/me.js

const jwt = require('jsonwebtoken');
const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {

    // Verificar token de autorização
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    // Buscar dados do usuário via Supabase REST
    const rows = await supabaseFetch('/users', {
      params: {
        select: 'id,name,email,role,birth_date,photo_url,ministry_entry_date,created_at,updated_at',
        id: `eq.${decoded.userId}`,
        limit: '1'
      }
    });

    if (!rows || rows.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    const user = rows[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
