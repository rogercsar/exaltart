// netlify/functions/updateUser.js

const { createPoolOrThrow } = require('./_db');

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

    // Verificar se o email já existe em outro usuário
    const emailCheck = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    
    if (emailCheck.rows.length > 0) {
      client.release();
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email já está em uso por outro usuário' }),
      };
    }
    
    // Atualizar o usuário
    const result = await client.query(
      `UPDATE users 
       SET name = $1, email = $2, role = $3, birth_date = $4, photo_url = $5, phone = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [name, email, role, birthDate || null, photoUrl || null, phone || null, userId]
    );
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: result.rows[0] }),
    };
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao atualizar o usuário.' }),
    };
  }
};
