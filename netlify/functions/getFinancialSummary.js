// netlify/functions/getFinancialSummary.js

const { supabaseFetch } = require('./_supabase');

exports.handler = async function(event, context) {
  try {
    const { startDate, endDate } = event.queryStringParameters || {};

    const params = {
      select: 'type,count:count(*),total:sum(amount)',
      group: 'type'
    };
    if (startDate) params['date'] = `gte.${startDate}`;
    if (endDate) params['date'] = params['date'] ? `${params['date']},lte.${endDate}` : `lte.${endDate}`;

    const rows = await supabaseFetch('/financial_transactions', { params });

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    (rows || []).forEach(row => {
      if (row.type === 'INCOME') {
        totalIncome = parseFloat(row.total) || 0;
        incomeCount = parseInt(row.count) || 0;
      } else if (row.type === 'EXPENSE') {
        totalExpenses = parseFloat(row.total) || 0;
        expenseCount = parseInt(row.count) || 0;
      }
    });

    const balance = totalIncome - totalExpenses;

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
    console.error('Erro ao buscar resumo financeiro (Supabase REST):', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Falha ao buscar o resumo financeiro.' }),
    };
  }
};
