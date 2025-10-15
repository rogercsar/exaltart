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
        // Sintaxe alternativa sem parênteses para evitar PGRST100
        select: 'total:amount.sum,count:count',
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

    let totalIncome = 0;
    let totalExpenses = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    try {
      const [incomeRows, expenseRows] = await Promise.all([
        supabaseFetch('/financial_transactions', { params: makeAggParams('INCOME') }),
        supabaseFetch('/financial_transactions', { params: makeAggParams('EXPENSE') })
      ]);

      const income = (Array.isArray(incomeRows) && incomeRows[0]) || { count: 0, total: 0 };
      const expenses = (Array.isArray(expenseRows) && expenseRows[0]) || { count: 0, total: 0 };

      totalIncome = income.total ? parseFloat(income.total) : 0;
      totalExpenses = expenses.total ? parseFloat(expenses.total) : 0;
      incomeCount = income.count ? parseInt(income.count) : 0;
      expenseCount = expenses.count ? parseInt(expenses.count) : 0;
    } catch (aggErr) {
      console.warn('Agregação via select falhou, fallback para soma/contagem manual:', aggErr);

      const addDateFilters = (p) => {
        if (startDate && endDate) {
          p['and'] = `(date.gte.${startDate},date.lte.${endDate})`;
        } else if (startDate) {
          p['date'] = `gte.${startDate}`;
        } else if (endDate) {
          p['date'] = `lte.${endDate}`;
        }
        return p;
      };

      const pageSize = 1000;

      const fetchTotalsByType = async (type) => {
        let sum = 0;
        let count = 0;
        let start = 0;
        let total = null;

        while (true) {
          const params = addDateFilters({ select: 'amount', type: `eq.${type}` });
          const { data, headers } = await supabaseFetch('/financial_transactions', {
            params,
            preferCountExact: true,
            returnMeta: true,
            headers: { Range: `${start}-${start + pageSize - 1}` }
          });

          const range = headers['content-range'];
          if (range && range.includes('/')) {
            const totalStr = range.split('/')[1];
            const parsedTotal = parseInt(totalStr, 10);
            if (!Number.isNaN(parsedTotal)) total = parsedTotal;
          }

          if (Array.isArray(data) && data.length > 0) {
            for (const row of data) {
              const amt = row.amount !== undefined && row.amount !== null ? parseFloat(row.amount) : 0;
              if (!Number.isNaN(amt)) sum += amt;
            }
            count += data.length;
          }

          if (!data || data.length < pageSize) break;
          if (total !== null && count >= total) break;
          start += pageSize;
        }

        if (total !== null) count = total;
        return { sum, count };
      };

      const [incomeTotals, expenseTotals] = await Promise.all([
        fetchTotalsByType('INCOME'),
        fetchTotalsByType('EXPENSE')
      ]);

      totalIncome = incomeTotals.sum;
      totalExpenses = expenseTotals.sum;
      incomeCount = incomeTotals.count;
      expenseCount = expenseTotals.count;
    }
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
