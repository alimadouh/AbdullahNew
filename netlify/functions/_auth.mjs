import jwt from 'jsonwebtoken'

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || '5123'
}

export function getJwtSecret() {
  return process.env.JWT_SECRET || 'CHANGE_ME_SET_JWT_SECRET'
}

export function signAdminToken() {
  return jwt.sign(
    { role: 'admin' },
    getJwtSecret(),
    { expiresIn: '7d' }
  )
}

export function verifyAdmin(event) {
  const auth = event.headers?.authorization || event.headers?.Authorization || ''
  if (!auth.startsWith('Bearer ')) {
    const e = new Error('Missing Authorization header.')
    e.statusCode = 401
    throw e
  }
  const token = auth.slice('Bearer '.length).trim()
  try {
    const payload = jwt.verify(token, getJwtSecret())
    if (payload?.role !== 'admin') {
      const e = new Error('Invalid token.')
      e.statusCode = 401
      throw e
    }
    return payload
  } catch {
    const e = new Error('Invalid or expired token.')
    e.statusCode = 401
    throw e
  }
}
