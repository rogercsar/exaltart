// netlify/functions/createTransaction.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  // Verificar se é um método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const { description, amount, type, category, date, proofUrl } = JSON.parse(event.body);

    // Autenticação e autorização (Admin only)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    let decoded;
    try {
      const token = authHeader.substring(7);
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    if (!decoded || decoded.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Permissão negada' }),
      };
    }

    // Validações básicas
    if (!description || amount === undefined || !type || !date) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Descrição, valor, tipo e data são obrigatórios' }),
      };
    }

    if (type !== 'INCOME' && type !== 'EXPENSE') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Tipo deve ser INCOME ou EXPENSE' }),
      };
    }

    if (amount <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Valor deve ser maior que zero' }),
      };
    }

    // Inserir via Supabase REST
    const inserted = await supabaseFetch('/financial_transactions', {
      method: 'POST',
      preferRepresentation: true,
      body: {
        description,
        amount,
        type,
        category: category || null,
        date, // coluna é "date" (DATE)
        proof_url: proofUrl || null,
        author_id: decoded.userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    const created = Array.isArray(inserted) ? inserted[0] : inserted;

    // Buscar a transação criada com autor embed para alinhar ao frontend
    const rows = await supabaseFetch('/financial_transactions', {
      params: {
        select: 'id,description,amount,type,category,date,proof_url,author_id,created_at,updated_at,author:users(id,name,email)',
        id: `eq.${created.id}`,
        limit: '1'
      }
    });

    const row = rows && rows[0] ? rows[0] : created;
    const transaction = {
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      category: row.category || null,
      date: row.date,
      proofUrl: row.proof_url || null,
      authorId: row.author_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: row.author || undefined
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction }),
    };
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao criar a transação.' }),
    };
  }
};
