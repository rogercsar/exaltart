// netlify/functions/getTransactions.js

const { createPoolOrThrow } = require('./_db');

exports.handler = async function(event, context) {
  try {
    const pool = await createPoolOrThrow();
    const client = await pool.connect();
    
    // Construir query com filtros opcionais
    let query = `
      SELECT t.*, u.name as author_name, u.email as author_email
      FROM financial_transactions t
      LEFT JOIN users u ON t.author_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;

    // Filtros opcionais
    if (event.queryStringParameters) {
      const { type, category, startDate, endDate, page = 1, limit = 100 } = event.queryStringParameters;
      
      if (type) {
        paramCount++;
        conditions.push(`t.type = $${paramCount}`);
        params.push(type);
      }
      
      if (category) {
        paramCount++;
        conditions.push(`t.category = $${paramCount}`);
        params.push(category);
      }
      
      if (startDate) {
        paramCount++;
        conditions.push(`t.date >= $${paramCount}`);
        params.push(startDate);
      }
      
      if (endDate) {
        paramCount++;
        conditions.push(`t.date <= $${paramCount}`);
        params.push(endDate);
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY t.date DESC, t.created_at DESC`;

    // Adicionar paginação
    const pageNum = parseInt(event.queryStringParameters?.page || '1');
    const limitNum = parseInt(event.queryStringParameters?.limit || '100');
    const offset = (pageNum - 1) * limitNum;
    
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    params.push(limitNum);
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    params.push(offset);

    const result = await client.query(query, params);
    
    // Contar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM financial_transactions t
    `;
    
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await client.query(countQuery, params.slice(0, -2)); // Remove LIMIT e OFFSET params
    const total = parseInt(countResult.rows[0].total);
    
    client.release();

    // Formatar resposta com dados do autor
    const transactions = result.rows.map(row => ({
      id: row.id,
      description: row.description,
      amount: parseFloat(row.amount),
      type: row.type,
      category: row.category,
      date: row.date,
      proofUrl: row.proof_url,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      author: {
        id: row.author_id,
        name: row.author_name,
        email: row.author_email
      }
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }),
    };
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar as transações.' }),
    };
  }
};
