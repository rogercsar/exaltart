// netlify/functions/getFinancialSummary.js

const { supabaseFetch } = require('./_supabase');
const jwt = require('jsonwebtoken');

exports.handler = async function(event, context) {
  try {
    // Autenticação (qualquer usuário autenticado)
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token de autorização não fornecido' }),
      };
    }

    try {
      const token = authHeader.substring(7);
      jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Token inválido' }),
      };
    }

    const { startDate, endDate } = event.queryStringParameters || {};

    // Função helper para montar params com filtros e agregações
    const makeAggParams = (type) => {
      const p = {
        select: 'total:sum(amount),count:count(id)',
        type: `eq.${type}`
      };
      if (startDate && endDate) {
        p['and'] = `(date.gte.${startDate},date.lte.${endDate})`;
      } else if (startDate) {
        p['date'] = `gte.${startDate}`;
      } else if (endDate) {
        p['date'] = `lte.${endDate}`;
      }
      return p;
    };

    const [incomeRows, expenseRows] = await Promise.all([
      supabaseFetch('/financial_transactions', { params: makeAggParams('INCOME') }),
      supabaseFetch('/financial_transactions', { params: makeAggParams('EXPENSE') })
    ]);

    const income = (Array.isArray(incomeRows) && incomeRows[0]) || { count: 0, total: 0 };
    const expenses = (Array.isArray(expenseRows) && expenseRows[0]) || { count: 0, total: 0 };

    const totalIncome = income.total ? parseFloat(income.total) : 0;
    const totalExpenses = expenses.total ? parseFloat(expenses.total) : 0;
    const incomeCount = income.count ? parseInt(income.count) : 0;
    const expenseCount = expenses.count ? parseInt(expenses.count) : 0;
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
