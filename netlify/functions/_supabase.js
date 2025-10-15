// netlify/functions/_supabase.js
// Helper para acessar o Supabase via REST (PostgREST) usando URL e API Key

function getSupabaseEnvOrThrow() {
  const url = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_API_KEY

  if (!url) {
    throw new Error('SUPABASE_URL não configurada nas variáveis de ambiente')
  }
  if (!key) {
    throw new Error('Chave de API do Supabase não configurada (SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY/SUPABASE_API_KEY)')
  }
  return { url, key }
}

async function supabaseFetch(path, options = {}) {
  const { url, key } = getSupabaseEnvOrThrow()

  const {
    method = 'GET',
    headers = {},
    body,
    params,
    preferRepresentation = false,
    preferCountExact = false,
    returnMeta = false
  } = options

  let fullUrl = `${url}/rest/v1${path}`
  if (params && Object.keys(params).length > 0) {
    const usp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      usp.append(k, v)
    }
    fullUrl += `?${usp.toString()}`
  }

  const finalHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    ...headers,
  }
  if (preferRepresentation || preferCountExact) {
    const prefs = []
    if (preferRepresentation) prefs.push('return=representation')
    if (preferCountExact) prefs.push('count=exact')
    finalHeaders['Prefer'] = prefs.join(', ')
  }

  const res = await fetch(fullUrl, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase REST ${res.status}: ${text}`)
  }

  const ct = res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')
  const data = isJson ? await res.json() : await res.text()

  if (returnMeta) {
    const headersObj = {}
    for (const [k, v] of res.headers.entries()) {
      headersObj[k.toLowerCase()] = v
    }
    return { data, headers: headersObj, status: res.status }
  }
  return data
}

module.exports = { supabaseFetch }