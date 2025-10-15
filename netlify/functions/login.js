// netlify/functions/login.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dns = require('dns');
const dnsPromises = dns.promises;

async function normalizeConnectionString(connStr) {
  try {
    const url = new URL(connStr);
    const host = url.hostname;
    // Usa DNS público para resolver o host e substituir por IP (evita ENOTFOUND)
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    let ip = null;
    try {
      const v4 = await dnsPromises.resolve4(host);
      if (v4 && v4.length) ip = v4[0];
    } catch (_) {
      try {
        const v6 = await dnsPromises.resolve6(host);
        if (v6 && v6.length) ip = v6[0];
      } catch (_) {}
    }
    if (ip) {
      url.hostname = ip; // URL aplica colchetes para IPv6 automaticamente
      return url.toString();
    }
  } catch (_) {}
  return connStr;
}

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
    const rawConnStr = process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL;
    if (!rawConnStr) {
      console.error('Variável de ambiente de conexão com o banco não definida (SUPABASE_DB_URL ou AIVEN_DATABASE_URL).');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Configuração do banco ausente' }),
      };
    }
    const connectionString = await normalizeConnectionString(rawConnStr);
    const pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

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
