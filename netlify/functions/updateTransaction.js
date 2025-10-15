// netlify/functions/updateTransaction.js

const { Pool } = require('pg');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
const pool = new Pool({
  connectionString: process.env.AIVEN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Aiven geralmente requer SSL
  }
});

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

    const client = await pool.connect();
    
    // Verificar se a transação existe
    const existingTransaction = await client.query('SELECT id FROM financial_transactions WHERE id = $1', [transactionId]);
    
    if (existingTransaction.rows.length === 0) {
      client.release();
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Transação não encontrada' }),
      };
    }
    
    // Atualizar a transação
    const result = await client.query(
      `UPDATE financial_transactions 
       SET description = $1, amount = $2, type = $3, category = $4, date = $5, proof_url = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [description, amount, type, category || null, date, proofUrl || null, transactionId]
    );
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transaction: result.rows[0] }),
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
