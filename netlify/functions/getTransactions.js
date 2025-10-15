// netlify/functions/getTransactions.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  try {
    // Autenticação (qualquer usuário autenticado)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    try {
      const token = authHeader.substring(7);
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    // Filtros opcionais e paginação
    const pageNum = parseInt(event.queryStringParameters?.page || '1', 10);
    const limitNum = parseInt(event.queryStringParameters?.limit || '10', 10);
    const offset = (pageNum - 1) * limitNum;

    const { type, category, startDate, endDate } = event.queryStringParameters || {};

    const params = {
      select: '*,author:users(id,name,email)',
      order: 'date.desc,created_at.desc',
      limit: String(limitNum),
      offset: String(offset)
    };

    if (type) params['type'] = `eq.${type}`;
    // Busca parcial e case-insensitive em categoria
    if (category) params['category'] = `ilike.*${category}*`;
    if (startDate && endDate) {
      params['and'] = `(date.gte.${startDate},date.lte.${endDate})`;
    } else if (startDate) {
      params['date'] = `gte.${startDate}`;
    } else if (endDate) {
      params['date'] = `lte.${endDate}`;
    }

    // Buscar via Supabase REST com count exato para paginação
    const { data: rows, headers } = await supabaseFetch('/financial_transactions', {
      params,
      preferCountExact: true,
      returnMeta: true
    });

    // Extrair total do Content-Range: "start-end/total"
    const contentRange = headers['content-range'] || headers['content-range'];
    let total = 0;
    if (contentRange && contentRange.includes('/')) {
      const parts = contentRange.split('/');
      const totalStr = parts[1];
      total = parseInt(totalStr, 10) || 0;
    }

    // Mapear resposta para o formato esperado
    const transactions = (rows || []).map(row => ({
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      category: row.category,
      date: row.date,
      proofUrl: row.proof_url,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.author ? {
        id: row.author.id,
        name: row.author.name,
        email: row.author.email
      } : {
        id: row.author_id,
        name: null,
        email: null
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.max(1, Math.ceil((total || 0) / limitNum))
        }
      }),
    };
  } catch (error) {
    console.error('Erro ao buscar transações (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar as transações.' }),
    };
  }
};
