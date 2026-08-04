import { claimCommands, getDeliveryToken } from '../_lib/delivery.js'
import { sendJson, handleOptions } from '../_lib/http.js'

export const config = { maxDuration: 10 }

// Plugin GlowMoonDelivery odpytuje ten endpoint co kilka sekund i pobiera komendy
// do wykonania na serwerze Minecraft (np. `case give <nick> <klucz> <ilosc>`).
// Autoryzacja: token w query (DELIVERY_TOKEN - musi byc taki sam jak w config.yml pluginu).
export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const expected = getDeliveryToken()
  const token = String(req.query?.token || '')
  if (!expected || token !== expected) {
    return sendJson(res, 401, { error: 'Niautoryzowano' })
  }

  const limit = Math.min(Math.max(Number(req.query?.limit) || 10, 1), 25)

  try {
    const commands = await claimCommands(limit)
    return sendJson(res, 200, { commands })
  } catch (error) {
    console.error('[delivery/poll] Blad:', error)
    return sendJson(res, 500, { error: 'Blad wewnetrzny' })
  }
}
