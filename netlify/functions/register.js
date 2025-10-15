// netlify/functions/register.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
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
    const { name, email, password, role = 'MEMBER' } = JSON.parse(event.body);

    // Validações básicas
    if (!name || !email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Nome, email e senha são obrigatórios' }),
      };
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email inválido' }),
      };
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Senha deve ter pelo menos 6 caracteres' }),
      };
    }

    const client = await pool.connect();
    
    // Verificar se o email já existe
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const result = await client.query(
      `INSERT INTO users (name, email, password, role, ministry_entry_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
       RETURNING id, name, email, role, ministry_entry_date, created_at`,
      [name, email, hashedPassword, role]
    );
    
    client.release();

    const newUser = result.rows[0];

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email, 
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        user: newUser
      }),
    };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
