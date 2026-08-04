import { getDb } from '../_lib/orders.js'
import { requireAdminToken } from '../_lib/admin.js'
import { sendJson, handleOptions } from '../_lib/http.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ORDERS_FILE = path.join(__dirname, '..', '..', 'data', 'orders.json')

function loadFileOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  if (!requireAdminToken(req, res)) return

  try {
    const db = getDb()
    let rows

    if (db) {
      const { data, error } = await db
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw new Error(error.message)
      rows = (data || []).map((r) => ({
        orderId: r.order_id,
        cashbillPaymentId: r.cashbill_payment_id,
        status: r.status,
        nickname: r.nickname,
        email: r.email || null,
        items: r.items || [],
        amount: Number(r.amount),
        currency: r.currency,
        couponCode: r.coupon_code || null,
        delivered: !!r.delivered,
        deliveredAt: r.delivered_at || null,
        deliveryError: !!r.delivery_error,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }))
    } else {
      rows = loadFileOrders()
        .map((o) => ({
          orderId: o.orderId,
          cashbillPaymentId: o.cashbillPaymentId,
          status: o.status,
          nickname: o.nickname,
          email: o.email || null,
          items: o.items || [],
          amount: Number(o.amount),
          currency: o.currency,
          couponCode: o.couponCode || null,
          delivered: !!o.delivered,
          deliveredAt: o.deliveredAt || null,
          deliveryError: !!o.deliveryError,
          createdAt: o.createdAt,
          updatedAt: o.updatedAt
        }))
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 100)
    }

    return sendJson(res, 200, { orders: rows })
  } catch (error) {
    console.error('[admin/orders] Blad:', error)
    return sendJson(res, 500, { error: 'Blad odczytu zamowien' })
  }
}
