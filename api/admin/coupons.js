import { listCoupons, createCoupon } from '../_lib/coupons.js'
import { requireAdminToken } from '../_lib/admin.js'
import { sendJson, handleOptions } from '../_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (!requireAdminToken(req, res)) return

  try {
    if (req.method === 'GET') {
      const coupons = await listCoupons()
      return sendJson(res, 200, { coupons })
    }

    if (req.method === 'POST') {
      const { code, discount, maxUses } = req.body || {}
      const result = await createCoupon({ code, discount, maxUses })
      if (!result.ok) return sendJson(res, 400, { error: result.error })
      const coupons = await listCoupons()
      return sendJson(res, 200, { ok: true, coupons })
    }

    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (error) {
    console.error('[admin/coupons] Blad:', error)
    return sendJson(res, 500, { error: 'Blad serwera' })
  }
}
