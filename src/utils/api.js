export async function apiGetData() {
  const res = await fetch('/.netlify/functions/data')
  if (!res.ok) throw new Error(`Failed to load data (${res.status})`)
  return res.json()
}

export async function apiAdminAuth(password) {
  const res = await fetch('/.netlify/functions/admin-auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!res.ok) {
    const msg = await safeMsg(res)
    throw new Error(msg || `Login failed (${res.status})`)
  }
  return res.json()
}

export async function apiAdminUpdate({ token, columns, rows }) {
  const res = await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ columns, rows }),
  })
  if (!res.ok) {
    const msg = await safeMsg(res)
    throw new Error(msg || `Save failed (${res.status})`)
  }
  return res.json()
}

async function safeMsg(res) {
  try {
    const data = await res.json()
    return data?.error || data?.message || ''
  } catch {
    try { return await res.text() } catch { return '' }
  }
}
