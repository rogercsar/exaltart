// netlify/functions/login.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseFetch } = require('./_supabase');

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

    // Buscar usuário por email via Supabase REST
    const rows = await supabaseFetch('/users', {
      params: {
        select: 'id,name,email,password,role',
        email: `eq.${email}`,
        limit: '1'
      }
    });

    if (!rows || rows.length === 0) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Credenciais inválidas' }),
      };
    }

    const user = rows[0];

    // Se o usuário não possui senha definida (ex.: criado sem hash), retorna 401
    if (!user.password) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Credenciais inválidas' }),
      };
    }

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
