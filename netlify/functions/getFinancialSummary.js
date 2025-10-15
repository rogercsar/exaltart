// netlify/functions/getFinancialSummary.js

const { createPoolOrThrow } = require('./_db');

exports.handler = async function(event, context) {
  try {
    const pool = await createPoolOrThrow();
    const client = await pool.connect();
    
    // Construir query com filtros de data opcionais
    let whereClause = '';
    const params = [];
    let paramCount = 0;

    if (event.queryStringParameters) {
      const { startDate, endDate } = event.queryStringParameters;
      
      if (startDate) {
        paramCount++;
        whereClause += ` WHERE date >= $${paramCount}`;
        params.push(startDate);
      }
      
      if (endDate) {
        paramCount++;
        whereClause += paramCount === 1 ? ` WHERE date <= $${paramCount}` : ` AND date <= $${paramCount}`;
        params.push(endDate);
      }
    }

    // Buscar totais de receitas e despesas
    const summaryQuery = `
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total
      FROM financial_transactions
      ${whereClause}
      GROUP BY type
    `;

    const result = await client.query(summaryQuery, params);
    
    // Processar resultados
    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    result.rows.forEach(row => {
      if (row.type === 'INCOME') {
        totalIncome = parseFloat(row.total) || 0;
        incomeCount = parseInt(row.count) || 0;
      } else if (row.type === 'EXPENSE') {
        totalExpenses = parseFloat(row.total) || 0;
        expenseCount = parseInt(row.count) || 0;
      }
    });

    const balance = totalIncome - totalExpenses;
    
    client.release();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: {
          totalIncome,
          totalExpenses,
          balance,
          incomeCount,
          expenseCount
        }
      }),
    };
  } catch (error) {
    console.error('Erro ao buscar resumo financeiro:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar o resumo financeiro.' }),
    };
  }
};
