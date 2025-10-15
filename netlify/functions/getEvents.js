// netlify/functions/getEvents.js

const { createPoolOrThrow } = require('./_db');

exports.handler = async function(event, context) {
  try {
    const pool = await createPoolOrThrow();
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