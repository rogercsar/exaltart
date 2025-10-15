// netlify/functions/createUser.js

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
    const { name, email, role, birthDate, photoUrl, phone } = JSON.parse(event.body);

    // Validações básicas
    if (!name || !email || !role) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Nome, email e função são obrigatórios' }),
      };
    }

    if (role !== 'ADMIN' && role !== 'MEMBER') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Função deve ser ADMIN ou MEMBER' }),
      };
    }

    const pool = await createPoolOrThrow();
    const client = await pool.connect();
    
    // Verificar se o email já existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (existingUser.rows.length > 0) {
      client.release();
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email já está em uso' }),
      };
    }
    
    // Inserir o novo usuário
    const result = await client.query(
      `INSERT INTO users (name, email, role, birth_date, photo_url, phone, ministry_entry_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
       RETURNING *`,
      [name, email, role, birthDate || null, photoUrl || null, phone || null]
    );
    
    client.release();

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: result.rows[0] }),
    };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao criar o usuário.' }),
    };
  }
};
