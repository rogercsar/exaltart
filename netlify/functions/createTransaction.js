// netlify/functions/createTransaction.js

const { supabaseFetch } = require('./_supabase');

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
        date,
        proof_url: proofUrl || null,
        author_id: '1', // TODO: Usar ID do usuário autenticado
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    const transaction = {
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
      author: {
        id: row.author_id,
        name: null,
        email: null
      }
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
