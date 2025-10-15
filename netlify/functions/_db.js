// netlify/functions/_db.js
// Helper para criar Pool do Postgres com fallback de DNS e uso por invocação

const { Pool } = require('pg');
const dns = require('dns');

/**
 * Resolve o host para um IP, tentando DNS padrão e, em seguida, servidores públicos.
 */
async function resolveHostToIP(hostname) {
  const dnsPromises = dns.promises;
  try {
    const res = await dnsPromises.lookup(hostname);
    if (res && res.address) return res.address;
  } catch (e) {
    // Continua para fallback
  }

  try {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
    const res2 = await dnsPromises.lookup(hostname);
    if (res2 && res2.address) return res2.address;
  } catch (e2) {
    // Falha total
  }

  return null;
}

/**
 * Normaliza a string de conexão substituindo o hostname por um IP resolvido.
 */
async function normalizeConnectionString(rawConnStr) {
  try {
    const url = new URL(rawConnStr);
    const hostname = url.hostname;
    const ip = await resolveHostToIP(hostname);
    if (ip) {
      url.hostname = ip;
    }
    return url.toString();
  } catch (err) {
    // Se não conseguir parsear, retorna a original
    return rawConnStr;
  }
}

function getRawConnectionString() {
  return process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL;
}

/**
 * Cria um Pool por invocação com SSL relaxado (evita erros de certificado em ambientes gerenciados).
 */
async function createPoolOrThrow() {
  const raw = getRawConnectionString();
  if (!raw) {
    console.error('Variáveis de conexão não definidas: defina SUPABASE_DB_URL ou AIVEN_DATABASE_URL.');
    throw new Error('String de conexão com o banco não configurada');
  }
  const normalized = await normalizeConnectionString(raw);
  return new Pool({
    connectionString: normalized,
    ssl: { rejectUnauthorized: false },
  });
}

module.exports = { createPoolOrThrow, normalizeConnectionString };