// scripts/seed-admin.js
// Cria um usuário admin diretamente no Postgres (Supabase) usando pg + bcrypt

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const dns = require('dns')
const dnsPromises = dns.promises

async function normalizeConnectionString(connStr) {
  try {
    const url = new URL(connStr)
    const host = url.hostname
    // Usa DNS público para resolver o host e substituir por IP (evita ENOTFOUND do DNS local)
    dns.setServers(['8.8.8.8', '1.1.1.1'])
    let ip = null
    try {
      const v4 = await dnsPromises.resolve4(host)
      if (v4 && v4.length) ip = v4[0]
    } catch (_) {
      // Se IPv4 não resolver, tenta IPv6
      try {
        const v6 = await dnsPromises.resolve6(host)
        if (v6 && v6.length) ip = v6[0]
      } catch (_) {}
    }
    if (ip) {
      url.hostname = ip // URL aplica colchetes automaticamente para IPv6
      return url.toString()
    }
  } catch (_) {}
  return connStr
}

async function main() {
  const rawConnStr = process.env.SUPABASE_DB_URL || process.env.AIVEN_DATABASE_URL
  const connectionString = await normalizeConnectionString(rawConnStr)
  if (!connectionString) {
    console.error('❌ Variável de ambiente SUPABASE_DB_URL ou AIVEN_DATABASE_URL não definida.')
    console.error('   Defina-a com sua string de conexão do Postgres (Supabase) e tente novamente.')
    process.exit(1)
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@exaltart.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'Exalt@rt2024!'
  const adminName = process.env.ADMIN_NAME || 'Administrador Exaltart'

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  const client = await pool.connect()
  try {
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail])
    if (exists.rows.length > 0) {
      console.log('⚠️  Usuário admin já existe:', adminEmail)
      return
    }

    const hashed = await bcrypt.hash(adminPassword, 12)

    const res = await client.query(
      `INSERT INTO users (email, name, password, role, ministry_entry_date, created_at, updated_at)
       VALUES ($1, $2, $3, 'ADMIN', NOW(), NOW(), NOW())
       RETURNING id, email, name, role`,
      [adminEmail, adminName, hashed]
    )

    console.log('✅ Admin criado com sucesso:')
    console.table(res.rows[0])
  } catch (err) {
    console.error('❌ Erro ao criar admin:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()