// --- State ---
let currentToken = null

// --- DOM helpers ---
const $ = (id) => document.getElementById(id)
function show(id) { $(id).classList.remove('hidden') }
function hide(id) { $(id).classList.add('hidden') }
function setText(id, text) { $(id).textContent = text }

// --- Auth ---
async function loadSession() {
  const { session } = await chrome.storage.local.get('session')
  if (!session?.access_token) return null
  // Quick validity check
  const user = await getUser(session.access_token).catch(() => null)
  if (!user) {
    await chrome.storage.local.remove('session')
    return null
  }
  return session
}

async function saveSession(session) {
  await chrome.storage.local.set({ session })
}

async function clearSession() {
  await chrome.storage.local.remove('session')
}

// --- Init ---
async function init() {
  const session = await loadSession()
  if (session) {
    currentToken = session.access_token
    showMain()
  } else {
    showLogin()
  }
}

function showLogin() {
  show('login-view')
  hide('main-view')
}

async function showMain() {
  hide('login-view')
  show('main-view')
  $('dashboard-link').href = `${CONFIG.baseUrl}/dashboard`

  // Load current tab URL
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab?.url || ''
  $('current-url-display').textContent = url || 'No URL detected'

  // Store for shortening
  $('shorten-btn').dataset.url = url

  // Load recent links
  loadLinks()
}

// --- Login form ---
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = $('email').value.trim()
  const password = $('password').value
  const btn = $('login-btn')
  const errEl = $('login-error')

  hide('login-error')
  btn.disabled = true
  btn.textContent = 'Signing in…'

  try {
    const session = await login(email, password)
    await saveSession(session)
    currentToken = session.access_token
    showMain()
  } catch (err) {
    errEl.textContent = err.message || 'Login failed'
    show('login-error')
  } finally {
    btn.disabled = false
    btn.textContent = 'Sign In'
  }
})

// --- Logout ---
$('logout-btn').addEventListener('click', async () => {
  await clearSession()
  currentToken = null
  showLogin()
})

// --- Shorten current page ---
$('shorten-btn').addEventListener('click', async () => {
  const url = $('shorten-btn').dataset.url
  if (!url || !url.startsWith('http')) {
    alert('Cannot shorten this page URL.')
    return
  }

  hide('shorten-idle')
  show('shorten-loading')

  try {
    const { shortUrl } = await createShortLink(url, currentToken)
    $('result-url').textContent = shortUrl
    hide('shorten-loading')
    show('shorten-result')
    loadLinks() // Refresh list
  } catch (err) {
    hide('shorten-loading')
    show('shorten-idle')
    alert(err.message || 'Failed to shorten link.')
  }
})

// --- Copy result ---
$('copy-btn').addEventListener('click', async () => {
  const url = $('result-url').textContent
  await navigator.clipboard.writeText(url)
  $('copy-btn').textContent = 'Copied!'
  setTimeout(() => { $('copy-btn').textContent = 'Copy' }, 1500)
})

// --- Shorten another ---
$('shorten-another').addEventListener('click', () => {
  hide('shorten-result')
  show('shorten-idle')
})

// --- Refresh links ---
$('refresh-btn').addEventListener('click', loadLinks)

// --- Load recent links ---
async function loadLinks() {
  hide('links-empty')
  hide('links-list')
  show('links-loading')

  try {
    const links = await getRecentLinks(currentToken)
    hide('links-loading')

    if (!links || links.length === 0) {
      show('links-empty')
      return
    }

    const list = $('links-list')
    list.innerHTML = ''
    for (const link of links) {
      const shortUrl = `${CONFIG.baseUrl}/${link.slug}`
      const li = document.createElement('li')
      li.className = 'link-item'
      li.innerHTML = `
        <div class="link-info">
          <span class="link-slug">${link.slug}</span>
          <span class="link-dest">${link.destination_url}</span>
        </div>
        <div class="link-meta">
          <span class="click-badge">${link.total_clicks} clicks</span>
          <button class="btn btn-outline copy-link-btn" data-url="${shortUrl}">Copy</button>
        </div>
      `
      list.appendChild(li)
    }

    // Copy buttons on each link
    list.querySelectorAll('.copy-link-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(btn.dataset.url)
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy' }, 1500)
      })
    })

    show('links-list')
  } catch (err) {
    hide('links-loading')
    show('links-empty')
  }
}

// --- Start ---
init()
