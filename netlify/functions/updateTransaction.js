// netlify/functions/updateTransaction.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método PUT
  if (event.httpMethod !== 'PUT') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Método não permitido' }),
    };
  }

  try {
    const transactionId = event.pathParameters?.id;
    
    if (!transactionId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID da transação é obrigatório' }),
      };
    }

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

    // Verificar existência via Supabase
    const existing = await supabaseFetch('/financial_transactions', {
      params: { id: `eq.${transactionId}`, select: 'id' }
    });
    if (!Array.isArray(existing) || existing.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Transação não encontrada' }),
      };
    }

    // Atualizar via Supabase REST
    const updated = await supabaseFetch('/financial_transactions', {
      method: 'PATCH',
      preferRepresentation: true,
      params: { id: `eq.${transactionId}` },
      body: {
        description,
        amount,
        type,
        category: category || null,
        date,
        proof_url: proofUrl || null,
        updated_at: new Date().toISOString()
      }
    });

    const row = Array.isArray(updated) ? updated[0] : updated;
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
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction }),
    };
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao atualizar a transação.' }),
    };
  }
};
