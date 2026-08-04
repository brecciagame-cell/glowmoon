// Pomocnicza autoryzacja dla endpointow admina.
// Wymaga naglowka `Authorization: Bearer <ADMIN_API_TOKEN>` (albo ?token=...).
// Token ustaw w zmiennych srodowiskowych Vercel (ADMIN_API_TOKEN) oraz we
// frontendzie przez VITE_ADMIN_API_TOKEN (plik .env.production przed buildem).
import { sendJson } from './http.js'

export function requireAdminToken(req, res) {
  const expected = process.env.ADMIN_API_TOKEN || ''
  if (!expected) {
    sendJson(res, 500, {
      error: 'ADMIN_API_TOKEN nie jest ustawiony na serwerze. Dodaj go do zmiennych srodowiskowych Vercel.'
    })
    return false
  }
  const auth = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  const token = String(req.query?.token || '')
  if (auth !== expected && token !== expected) {
    sendJson(res, 401, { error: 'Nieautoryzowany dostep do panelu admina' })
    return false
  }
  return true
}
