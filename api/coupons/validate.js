import { validateCoupon } from '../_lib/coupons.js'
import { sendJson, handleOptions } from '../_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const { code } = req.body || {}
  try {
    const result = await validateCoupon(code)
    if (!result.ok) {
      return sendJson(res, 200, { ok: false, message: result.message })
    }
    return sendJson(res, 200, {
      ok: true,
      code: result.coupon.code,
      discount: result.discount,
      message: `Kod ${result.coupon.code} zastosowany -${result.coupon.discount}%`
    })
  } catch (error) {
    console.error('[coupons] Blad walidacji kuponu:', error)
    return sendJson(res, 500, { ok: false, message: 'Blad serwera podczas walidacji kuponu' })
  }
}
