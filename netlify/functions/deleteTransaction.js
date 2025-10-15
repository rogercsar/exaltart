// netlify/functions/deleteTransaction.js

const { Pool } = require('pg');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
const pool = new Pool({
  connectionString: process.env.AIVEN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Aiven geralmente requer SSL
  }
});

exports.handler = async function(event, context) {
  // Verificar se é um método DELETE
  if (event.httpMethod !== 'DELETE') {
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
    
    // Deletar a transação
    await client.query('DELETE FROM financial_transactions WHERE id = $1', [transactionId]);
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Transação excluída com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar transação:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir a transação.' }),
    };
  }
};
