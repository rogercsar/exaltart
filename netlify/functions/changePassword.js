// netlify/functions/changePassword.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  // Verificar se é um método POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    // Autenticação: usuário atual
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' })
      };
    }

    let decoded;
    try {
      const token = authHeader.substring(7);
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' })
      };
    }

    // Body: senha atual e nova senha
    const { currentPassword, newPassword } = JSON.parse(event.body || '{}');
    if (!currentPassword || !newPassword) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Senha atual e nova senha são obrigatórias' })
      };
    }

    const newPwd = String(newPassword || '').trim();
    if (newPwd.length < 6) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Nova senha deve ter pelo menos 6 caracteres' })
      };
    }

    // Buscar usuário atual para verificar a senha
    const rows = await supabaseFetch('/users', {
      params: {
        select: 'id,password',
        id: `eq.${decoded.userId}`,
        limit: '1'
      }
    });

    if (!rows || rows.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    const user = rows[0];
    if (!user.password) {
      // Usuário sem senha definida (criado sem senha): bloquear por segurança
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Usuário não possui senha definida. Solicite ao administrador definir uma senha inicialmente.' })
      };
    }

    const ok = await bcrypt.compare(String(currentPassword), String(user.password));
    if (!ok) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Senha atual incorreta' })
      };
    }

    // Hash e atualização
    const hashed = await bcrypt.hash(newPwd, 10);
    await supabaseFetch('/users', {
      method: 'PATCH',
      params: { id: `eq.${decoded.userId}` },
      body: { password: hashed, updated_at: new Date().toISOString() }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Senha alterada com sucesso' })
    };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha ao alterar a senha.' })
    };
  }
};