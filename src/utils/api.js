export async function apiGetData(section = 'clinic') {
  const res = await fetch(`/.netlify/functions/data?section=${encodeURIComponent(section)}`)
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

// Netlify caps a function request at 6 MB and the clinic table with monographs is ~8 MB,
// so the save is gzipped when the browser can do it (the function unzips it).
async function gzipText(text) {
  if (typeof CompressionStream === 'undefined') return null
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Blob([await new Response(stream).arrayBuffer()])
}

export async function apiAdminUpdate({ token, columns, rows, section = 'clinic' }) {
  const text = JSON.stringify({ columns, rows, section })
  const zipped = await gzipText(text).catch(() => null)
  const res = await fetch('/.netlify/functions/admin-update', {
    method: 'POST',
    headers: zipped
      ? { 'Content-Type': 'application/octet-stream', 'X-Body-Encoding': 'gzip', 'Authorization': `Bearer ${token}` }
      : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: zipped || text,
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
