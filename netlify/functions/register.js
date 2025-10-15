// netlify/functions/register.js

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

    // Verificar se o email já existe via Supabase REST
    const existing = await supabaseFetch('/users', {
      params: {
        select: 'id',
        email: `eq.${email}`,
        limit: '1'
      }
    });

    if (existing && existing.length > 0) {
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

    // Criar usuário via Supabase REST
    const inserted = await supabaseFetch('/users', {
      method: 'POST',
      body: {
        name,
        email,
        password: hashedPassword,
        role,
        ministry_entry_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      preferRepresentation: true
    });

    const newUser = Array.isArray(inserted) ? inserted[0] : inserted;

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
