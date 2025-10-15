// netlify/functions/getUsers.js

const { Pool } = require('pg');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

exports.handler = async function(event, context) {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT id, name, email, role, birth_date, photo_url, phone, ministry_entry_date, created_at, updated_at
      FROM users 
      ORDER BY name ASC
    `);
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ users: result.rows }),
    };
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar os usuários.' }),
    };
  }
};
