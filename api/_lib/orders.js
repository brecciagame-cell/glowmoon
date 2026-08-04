import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Fallback do pliku (tylko lokalny dev bez Supabase). Na Vercel używana jest baza.
const ORDERS_FILE = path.join(__dirname, '..', '..', 'data', 'orders.json')

let _client = null
function client() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) return null
  if (!_client) {
    _client = createClient(url, key, { auth: { persistSession: false } })
  }
  return _client
}

// Wspolny dostep do klienta Supabase (uzywany tez przez kolejke dostaw)
export function getDb() {
  return client()
}

// --- fallback plikowy (dev) ---
function loadOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveOrders(orders) {
  try {
    fs.mkdirSync(path.dirname(ORDERS_FILE), { recursive: true })
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2))
  } catch (error) {
    console.warn('[orders] Nie udalo sie zapisac pliku (tryb dev):', error.message)
  }
}

function mapRow(row) {
  return {
    orderId: row.order_id,
    cashbillPaymentId: row.cashbill_payment_id,
    status: row.status,
    nickname: row.nickname,
    email: row.email || undefined,
    items: row.items || [],
    amount: Number(row.amount),
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    delivered: !!row.delivered,
    deliveredAt: row.delivered_at || undefined,
    deliveryLog: Array.isArray(row.delivery_log) ? row.delivery_log : [],
    deliveryError: !!row.delivery_error
  }
}

export async function insertOrder(order) {
  const db = client()
  if (db) {
    const { error } = await db.from('orders').insert({
      order_id: order.orderId,
      cashbill_payment_id: order.cashbillPaymentId,
      status: order.status,
      nickname: order.nickname,
      email: order.email || null,
      items: order.items,
      amount: order.amount,
      currency: order.currency,
      delivered: !!order.delivered,
      delivered_at: order.deliveredAt || null,
      delivery_log: order.deliveryLog || [],
      delivery_error: !!order.deliveryError
    })
    if (error) throw new Error(error.message)
    return
  }
  const orders = loadOrders()
  orders.push(order)
  saveOrders(orders)
}

export async function findOrderByOrderId(orderId) {
  const db = client()
  if (db) {
    const { data, error } = await db.from('orders').select('*').eq('order_id', orderId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRow(data) : null
  }
  return loadOrders().find((o) => o.orderId === orderId) || null
}

export async function findOrderByPaymentId(paymentId) {
  const db = client()
  if (db) {
    const { data, error } = await db.from('orders').select('*').eq('cashbill_payment_id', paymentId).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRow(data) : null
  }
  return loadOrders().find((o) => o.cashbillPaymentId === paymentId) || null
}

export async function updateOrderStatus(orderId, status) {
  const db = client()
  if (db) {
    const { error } = await db
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('order_id', orderId)
    if (error) throw new Error(error.message)
    return
  }
  const orders = loadOrders()
  const order = orders.find((o) => o.orderId === orderId)
  if (order) {
    order.status = status
    order.updatedAt = new Date().toISOString()
    saveOrders(orders)
  }
}

// Zapisuje stan dostawy zamówienia (kolejka/plugin)
export async function updateOrderDelivery(orderId, { delivered, deliveredAt, deliveryLog, deliveryError }) {
  const db = client()
  if (db) {
    const { error } = await db
      .from('orders')
      .update({
        delivered: !!delivered,
        delivered_at: delivered ? deliveredAt : null,
        delivery_log: deliveryLog || [],
        delivery_error: !!deliveryError,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
    if (error) throw new Error(error.message)
    return
  }
  const orders = loadOrders()
  const order = orders.find((o) => o.orderId === orderId)
  if (order) {
    order.delivered = !!delivered
    order.deliveredAt = delivered ? deliveredAt : undefined
    order.deliveryLog = deliveryLog || []
    order.deliveryError = !!deliveryError
    order.updatedAt = new Date().toISOString()
    saveOrders(orders)
  }
}

// Dane zamówienia bez wewnętrznych pól (paymentId itd.)
export function publicOrder(order) {
  if (!order) return null
  return {
    orderId: order.orderId,
    status: order.status,
    nickname: order.nickname,
    email: order.email || null,
    items: order.items,
    amount: order.amount,
    currency: order.currency,
    createdAt: order.createdAt,
    delivered: !!order.delivered,
    deliveredAt: order.deliveredAt || null,
    deliveryError: !!order.deliveryError,
    deliveryLog: Array.isArray(order.deliveryLog) ? order.deliveryLog : []
  }
}
