import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getDb } from './orders.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Fallback do pliku (tylko lokalny dev bez Supabase). Na Vercel uzywana jest baza.
const COUPONS_FILE = path.join(__dirname, '..', '..', 'data', 'coupons.json')
const ORDERS_FILE = path.join(__dirname, '..', '..', 'data', 'orders.json')

// --- fallback plikowy (dev) ---
function loadCoupons() {
  try {
    return JSON.parse(fs.readFileSync(COUPONS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveCoupons(coupons) {
  try {
    fs.mkdirSync(path.dirname(COUPONS_FILE), { recursive: true })
    fs.writeFileSync(COUPONS_FILE, JSON.stringify(coupons, null, 2))
  } catch (error) {
    console.warn('[coupons] Nie udalo sie zapisac pliku (tryb dev):', error.message)
  }
}

function loadOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'))
  } catch {
    return []
  }
}

function mapRow(row) {
  return {
    id: row.id,
    code: row.code,
    discount: Number(row.discount),
    maxUses: row.max_uses == null ? null : Number(row.max_uses),
    active: !!row.active,
    createdAt: row.created_at
  }
}

function toRow(coupon) {
  return {
    code: coupon.code,
    discount: coupon.discount,
    max_uses: coupon.maxUses == null ? null : coupon.maxUses,
    active: !!coupon.active
  }
}

// Ile oplaconych zamowien uzywa danego kuponu (to jest "ilosc uzyc")
export async function countCouponUses(code) {
  const db = getDb()
  if (db) {
    const { count, error } = await db
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('coupon_code', code)
      .eq('status', 'paid')
    if (error) throw new Error(error.message)
    return count || 0
  }
  return loadOrders().filter((o) => o.couponCode === code && o.status === 'paid').length
}

export async function listCoupons() {
  const db = getDb()
  if (db) {
    const { data, error } = await db.from('coupons').select('*').order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const result = []
    for (const row of data || []) {
      const coupon = mapRow(row)
      result.push({ ...coupon, usesCount: await countCouponUses(coupon.code) })
    }
    return result
  }
  const coupons = loadCoupons().map((c) => ({ ...c }))
  const result = []
  for (const coupon of coupons) {
    result.push({ ...coupon, usesCount: await countCouponUses(coupon.code) })
  }
  return result
}

export async function findCouponByCode(code) {
  const db = getDb()
  if (db) {
    const { data, error } = await db.from('coupons').select('*').eq('code', code).maybeSingle()
    if (error) throw new Error(error.message)
    return data ? mapRow(data) : null
  }
  return loadCoupons().find((c) => c.code === code) || null
}

export async function createCoupon({ code, discount, maxUses }) {
  const cleanCode = String(code || '').trim().toUpperCase()
  if (!cleanCode) return { error: 'Podaj kod kuponu' }
  const cleanDiscount = Number(discount)
  if (!Number.isFinite(cleanDiscount) || cleanDiscount <= 0 || cleanDiscount > 100) {
    return { error: 'Rabat musi byc liczba od 1 do 100 (%)' }
  }
  const cleanMax = maxUses === '' || maxUses == null ? null : Number(maxUses)
  if (cleanMax !== null && (!Number.isInteger(cleanMax) || cleanMax < 0)) {
    return { error: 'Limit uzyc musi byc liczba calkowita >= 0 (lub puste = bez limitu)' }
  }

  const existing = await findCouponByCode(cleanCode)
  if (existing) return { error: `Kupon ${cleanCode} juz istnieje` }

  const db = getDb()
  if (db) {
    const { error } = await db.from('coupons').insert(toRow({ code: cleanCode, discount: cleanDiscount, maxUses: cleanMax, active: true }))
    if (error) return { error: error.message }
    return { ok: true }
  }
  const coupons = loadCoupons()
  const id = Date.now()
  coupons.push({ id, code: cleanCode, discount: cleanDiscount, maxUses: cleanMax, active: true, createdAt: new Date().toISOString() })
  saveCoupons(coupons)
  return { ok: true }
}

export async function updateCoupon(id, fields) {
  const db = getDb()
  if (db) {
    const patch = {}
    if (fields.code !== undefined) {
      const cleanCode = String(fields.code).trim().toUpperCase()
      if (!cleanCode) return { error: 'Podaj kod kuponu' }
      patch.code = cleanCode
    }
    if (fields.discount !== undefined) {
      const d = Number(fields.discount)
      if (!Number.isFinite(d) || d <= 0 || d > 100) return { error: 'Rabat musi byc liczba od 1 do 100 (%)' }
      patch.discount = d
    }
    if (fields.maxUses !== undefined) {
      const m = fields.maxUses === '' || fields.maxUses == null ? null : Number(fields.maxUses)
      if (m !== null && (!Number.isInteger(m) || m < 0)) return { error: 'Limit uzyc musi byc liczba calkowita >= 0' }
      patch.max_uses = m
    }
    if (fields.active !== undefined) patch.active = !!fields.active

    const { error } = await db.from('coupons').update(patch).eq('id', id)
    if (error) return { error: error.message }
    return { ok: true }
  }
  const coupons = loadCoupons()
  const coupon = coupons.find((c) => c.id === Number(id))
  if (!coupon) return { error: 'Nie znaleziono kuponu' }
  if (fields.code !== undefined) coupon.code = String(fields.code).trim().toUpperCase()
  if (fields.discount !== undefined) coupon.discount = Number(fields.discount)
  if (fields.maxUses !== undefined) {
    coupon.maxUses = fields.maxUses === '' || fields.maxUses == null ? null : Number(fields.maxUses)
  }
  if (fields.active !== undefined) coupon.active = !!fields.active
  saveCoupons(coupons)
  return { ok: true }
}

export async function deleteCoupon(id) {
  const db = getDb()
  if (db) {
    const { error } = await db.from('coupons').delete().eq('id', id)
    if (error) return { error: error.message }
    return { ok: true }
  }
  const coupons = loadCoupons()
  const next = coupons.filter((c) => c.id !== Number(id))
  if (next.length === coupons.length) return { error: 'Nie znaleziono kuponu' }
  saveCoupons(next)
  return { ok: true }
}

/**
 * Sprawdza czy kod rabatowy jest wazny i zwraca rabat.
 * @returns {{ ok: boolean, coupon?: object, discount?: number, message?: string }}
 */
export async function validateCoupon(code) {
  const cleanCode = String(code || '').trim().toUpperCase()
  if (!cleanCode) return { ok: false, message: 'Podaj kod rabatowy' }

  const coupon = await findCouponByCode(cleanCode)
  if (!coupon) return { ok: false, message: 'Nieprawidlowy kod rabatowy' }
  if (!coupon.active) return { ok: false, message: 'Ten kod rabatowy jest nieaktywny' }

  const usesCount = await countCouponUses(coupon.code)
  if (coupon.maxUses != null && usesCount >= coupon.maxUses) {
    return { ok: false, message: 'Ten kod rabatowy wyczerpal swoj limit uzyc' }
  }

  return { ok: true, coupon, discount: coupon.discount / 100, usesCount }
}
