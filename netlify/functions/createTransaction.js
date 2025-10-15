// netlify/functions/createTransaction.js

const { createPoolOrThrow } = require('./_db');

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

    const pool = await createPoolOrThrow();
    const client = await pool.connect();
    
    // Inserir a nova transação
    const result = await client.query(
      `INSERT INTO financial_transactions (description, amount, type, category, date, proof_url, author_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [description, amount, type, category || null, date, proofUrl || null, '1'] // TODO: Usar ID do usuário autenticado
    );
    
    client.release();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: result.rows[0] }),
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
