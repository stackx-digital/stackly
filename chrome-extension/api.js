// Supabase REST API helpers

async function supabaseFetch(path, options = {}, token = null) {
  const key = token || CONFIG.supabaseAnonKey
  const res = await fetch(`${CONFIG.supabaseUrl}${path}`, {
    ...options,
    headers: {
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function login(email, password) {
  const res = await fetch(
    `${CONFIG.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'apikey': CONFIG.supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || data.message || 'Login failed')
  return data // { access_token, refresh_token, user, expires_at }
}

async function getUser(token) {
  const res = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
    headers: {
      'apikey': CONFIG.supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
    },
  })
  if (!res.ok) return null
  return res.json()
}

function generateSlug(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

async function isSlugAvailable(slug, token) {
  const data = await supabaseFetch(
    `/rest/v1/links?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
    {},
    token
  )
  return !data || data.length === 0
}

async function createShortLink(destinationUrl, token) {
  let slug = generateSlug()
  let attempts = 0
  while (!(await isSlugAvailable(slug, token)) && attempts < 10) {
    slug = generateSlug()
    attempts++
  }

  const user = await getUser(token)
  if (!user) throw new Error('Not authenticated')

  await supabaseFetch(
    '/rest/v1/links',
    {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        slug,
        destination_url: destinationUrl,
        is_active: true,
      }),
    },
    token
  )

  return { slug, shortUrl: `${CONFIG.baseUrl}/${slug}` }
}

async function getRecentLinks(token) {
  const links = await supabaseFetch(
    '/rest/v1/links?select=id,slug,destination_url,title,is_active,created_at&is_active=eq.true&order=created_at.desc&limit=5',
    {},
    token
  )
  if (!links || links.length === 0) return []

  const ids = links.map(l => `"${l.id}"`).join(',')
  const summary = await supabaseFetch(
    `/rest/v1/link_click_summary?link_id=in.(${ids})&select=link_id,total_clicks`,
    {},
    token
  ).catch(() => [])

  const clickMap = {}
  for (const s of (summary || [])) clickMap[s.link_id] = s.total_clicks

  return links.map(l => ({ ...l, total_clicks: clickMap[l.id] || 0 }))
}
