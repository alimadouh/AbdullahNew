import { getAdminPassword, signAdminToken } from './_auth.mjs'

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}')
    const password = String(body.password || '')

    if (password !== getAdminPassword()) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Wrong password.' }),
      }
    }

    const token = signAdminToken()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }
  } catch (err) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: String(err?.message || err) }),
    }
  }
}
