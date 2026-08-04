import { updateCoupon, deleteCoupon } from '../../_lib/coupons.js'
import { requireAdminToken } from '../../_lib/admin.js'
import { sendJson, handleOptions } from '../../_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (!requireAdminToken(req, res)) return

  // Vercel przekazuje parametry w req.query, Express w req.params
  const id = req.params?.id ?? req.query?.id
  if (!id) {
    return sendJson(res, 400, { error: 'Brak id kuponu' })
  }

  try {
    if (req.method === 'PATCH') {
      const result = await updateCoupon(id, req.body || {})
      if (!result.ok) return sendJson(res, 400, { error: result.error })
      return sendJson(res, 200, { ok: true })
    }

    if (req.method === 'DELETE') {
      const result = await deleteCoupon(id)
      if (!result.ok) return sendJson(res, 400, { error: result.error })
      return sendJson(res, 200, { ok: true })
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error('[admin/coupons/id] Blad:', error)
    return sendJson(res, 500, { error: 'Blad serwera' })
  }
}
