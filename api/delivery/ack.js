import { ackResults, getDeliveryToken } from '../_lib/delivery.js'
import { sendJson, handleOptions } from '../_lib/http.js'

export const config = { maxDuration: 10 }

// Plugin GlowMoonDelivery wysyla potwierdzenie wykonania komend:
//   { "token": "...", "results": [{ "id": "...", "ok": true }, { "id": "...", "ok": false, "error": "..." }] }
// Na tej podstawie aktualizujemy delivery_log i delivered w zamowieniu (widoczne na stronie sukcesu).
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const expected = getDeliveryToken()
  const body = req.body || {}
  if (!expected || String(body.token || '') !== expected) {
    return sendJson(res, 401, { error: 'Niautoryzowano' })
  }

  const results = Array.isArray(body.results) ? body.results : []
  if (results.length === 0) {
    return sendJson(res, 200, { updated: 0, ordersUpdated: 0 })
  }

  try {
    const summary = await ackResults(results)
    return sendJson(res, 200, summary)
  } catch (error) {
    console.error('[delivery/ack] Blad:', error)
    return sendJson(res, 500, { error: 'Blad wewnetrzny' })
  }
}
