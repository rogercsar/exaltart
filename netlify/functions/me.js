// netlify/functions/me.js

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
const connectionString = process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL;
if (!connectionString) {
  console.error('Variável de ambiente de conexão com o banco não definida (SUPABASE_DB_URL ou AIVEN_DATABASE_URL).');
}
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false // Aiven/Supabase geralmente requerem SSL
  }
});

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

    const client = await pool.connect();
    
    // Buscar dados do usuário
    const result = await client.query(
      'SELECT id, name, email, role, birth_date, photo_url, ministry_entry_date, created_at, updated_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    client.release();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    const user = result.rows[0];

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
