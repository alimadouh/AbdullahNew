import jwt from 'jsonwebtoken'

// No built-in fallbacks: a missing setting must stop logins, not open them with a known value
function required(name) {
  const v = process.env[name]
  if (!v) {
    const e = new Error(`Server is missing the ${name} setting.`)
    e.statusCode = 500
    throw e
  }
  return v
}

export function getAdminPassword() {
  return required('ADMIN_PASSWORD')
}

export function getJwtSecret() {
  return required('JWT_SECRET')
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
