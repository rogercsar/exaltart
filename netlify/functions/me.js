// netlify/functions/me.js

const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const dns = require('dns');
const dnsPromises = dns.promises;

async function normalizeConnectionString(connStr) {
  try {
    const url = new URL(connStr);
    const host = url.hostname;
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
      url.hostname = ip;
      return url.toString();
    }
  } catch (_) {}
  return connStr;
}

exports.handler = async function(event, context) {
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

    // Verificar token de autorização
    const authHeader = event.headers.authorization || event.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar e decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    const client = await pool.connect();
    
    // Buscar dados do usuário
    const result = await client.query(
      'SELECT id, name, email, role, birth_date, photo_url, ministry_entry_date, created_at, updated_at FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    client.release();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Usuário não encontrado' }),
      };
    }

    const user = result.rows[0];

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user }),
    };
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Erro interno do servidor' }),
    };
  }
};
