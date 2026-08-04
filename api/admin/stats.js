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

function summaryOfOrder(order) {
  const names = (order.items || [])
    .map((i) => (i.quantity > 1 ? `${i.name} x${i.quantity}` : i.name))
    .join(', ')
  return {
    orderId: order.orderId || order.order_id,
    nickname: order.nickname,
    items: names,
    amount: Number(order.amount),
    currency: order.currency || 'PLN',
    status: order.status,
    delivered: !!order.delivered,
    deliveryError: !!order.deliveryError || !!order.delivery_error,
    couponCode: order.couponCode || order.coupon_code || null,
    createdAt: order.createdAt || order.created_at || null
  }
}

function sumAmounts(rows) {
  return Math.round(rows.reduce((s, r) => s + Number(r.amount), 0) * 100) / 100
}

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  if (!requireAdminToken(req, res)) return

  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const startISO = startOfToday.toISOString()

    const db = getDb()
    let stats
    let recent

    if (db) {
      const [allPaid, todayPaid, recentData] = await Promise.all([
        db.from('orders').select('amount').eq('status', 'paid'),
        db.from('orders').select('amount').eq('status', 'paid').gte('created_at', startISO),
        db.from('orders').select('*').order('created_at', { ascending: false }).limit(10)
      ])
      if (allPaid.error) throw new Error(allPaid.error.message)
      if (todayPaid.error) throw new Error(todayPaid.error.message)
      if (recentData.error) throw new Error(recentData.error.message)

      const allPaidRows = allPaid.data || []
      const todayPaidRows = todayPaid.data || []

      stats = {
        ordersToday: todayPaidRows.length,
        revenueToday: sumAmounts(todayPaidRows),
        totalOrders: allPaidRows.length,
        totalRevenue: sumAmounts(allPaidRows)
      }

      recent = (recentData.data || []).map((r) =>
        summaryOfOrder({
          orderId: r.order_id,
          nickname: r.nickname,
          items: r.items || [],
          amount: r.amount,
          currency: r.currency,
          status: r.status,
          delivered: r.delivered,
          deliveryError: r.delivery_error,
          couponCode: r.coupon_code,
          createdAt: r.created_at
        })
      )
    } else {
      const allOrders = loadFileOrders()
      const allPaid = allOrders.filter((o) => o.status === 'paid')
      const todayPaid = allPaid.filter((o) => o.createdAt && new Date(o.createdAt).getTime() >= startOfToday.getTime())

      stats = {
        ordersToday: todayPaid.length,
        revenueToday: sumAmounts(todayPaid),
        totalOrders: allPaid.length,
        totalRevenue: sumAmounts(allPaid)
      }

      recent = allOrders
        .slice()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10)
        .map(summaryOfOrder)
    }

    return sendJson(res, 200, {
      stats,
      recent,
      generatedAt: new Date().toISOString(),
      nowTs: Date.now()
    })
  } catch (error) {
    console.error('[admin/stats] Blad:', error)
    return sendJson(res, 500, { error: 'Blad odczytu statystyk' })
  }
}
