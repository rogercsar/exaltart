// netlify/functions/deleteUser.js

const { Pool } = require('pg');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
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
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'ID do usuário é obrigatório' }),
      };
    }

    const client = await pool.connect();
    
    // Verificar se o usuário existe
    const existingUser = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
    
    if (existingUser.rows.length === 0) {
      client.release();
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }
    
    // Deletar o usuário
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Usuário excluído com sucesso' }),
    };
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao excluir o usuário.' }),
    };
  }
};
