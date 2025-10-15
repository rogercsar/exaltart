// netlify/functions/login.js

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
    const { email, password } = JSON.parse(event.body);

    // Validações básicas
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email e senha são obrigatórios' }),
      };
    }

    const client = await pool.connect();
    
    // Buscar usuário por email
    const result = await client.query(
      'SELECT id, name, email, password, role FROM users WHERE email = $1',
      [email]
    );
    
    client.release();

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Credenciais inválidas' }),
      };
    }

    const user = result.rows[0];

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Credenciais inválidas' }),
      };
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // Retornar dados do usuário (sem a senha)
    const { password: _, ...userWithoutPassword } = user;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        user: userWithoutPassword
      }),
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
