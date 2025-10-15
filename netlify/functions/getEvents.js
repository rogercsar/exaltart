// netlify/functions/getEvents.js

const { Pool } = require('pg');

// O Pool gerencia múltiplas conexões com o banco de dados de forma eficiente.
// Ele usa a variável de ambiente que configuramos no Netlify.
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async function(event, context) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM events ORDER BY start_time ASC;');
    client.release(); // Libera o cliente de volta para o pool

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Erro ao conectar ou buscar no banco de dados', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Falha ao buscar os eventos.' }),
    };
  }
};