import { getConfig, stripDiacritics, cashbillCreateSign } from './_lib/cashbill.js'
import { insertOrder } from './_lib/orders.js'
import { validateCartItem, isValidNickname } from './_lib/catalog.js'
import { validateCoupon } from './_lib/coupons.js'
import { sendJson, handleOptions } from './_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const { nickname, email, items, couponCode } = req.body || {}
  const cfg = getConfig()

  if (!cfg.shopId || !cfg.secretKey) {
    return sendJson(res, 500, {
      error: 'CashBill nie jest skonfigurowany. Ustaw CASHBILL_SHOP_ID i CASHBILL_SECRET_KEY w zmiennych środowiskowych'
    })
  }

  // Na Vercel zamowienia MUSZA trafiac do Supabase (brak trwalego dysku - plik by zniknal)
  if (process.env.VERCEL && !(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY))) {
    return sendJson(res, 500, {
      error: 'Brak konfiguracji Supabase. Ustaw SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w zmiennych środowiskowych Vercel'
    })
  }

  if (!isValidNickname(nickname)) {
    // Nick trafia do komendy RCON - musi byc bezpieczny (3-16 znakow [A-Za-z0-9_])
    return sendJson(res, 400, { error: 'Nick musi miec 3-16 znakow (litery, cyfry, podkreslenie) - bez spacji i znakow specjalnych' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return sendJson(res, 400, { error: 'Koszyk jest pusty' })
  }

  // Walidacja przeciwko kanonicznemu katalogowi: ceny i klucze /case trzyma serwer,
  // klient nie ma wplywu (nie mozna kupic klucza za grosze ani wstrzyknac wlasnej komendy)
  const validatedItems = []
  let itemsTotal = 0
  for (const item of items) {
    const validated = validateCartItem(item)
    if (!validated.ok) {
      return sendJson(res, 400, { error: validated.error })
    }
    itemsTotal += validated.price * validated.quantity
    validatedItems.push({
      name: validated.name,
      price: validated.price,
      quantity: validated.quantity,
      category: typeof item?.category === 'string' ? item.category : undefined,
      key: validated.key
    })
  }
  itemsTotal = Math.round(itemsTotal * 100) / 100
  if (itemsTotal <= 0) {
    return sendJson(res, 400, { error: 'Nieprawidlowa kwota' })
  }

  // Walidacja kuponu rabatowego po stronie serwera (kody trzymamy w bazie,
  // a licznik uzyc liczony jest z oplaconych zamowien - klient nie ma wplywu na rabat)
  let validatedDiscount = 0
  let appliedCouponCode = null
  if (typeof couponCode === 'string' && couponCode.trim()) {
    let couponResult
    try {
      couponResult = await validateCoupon(couponCode)
    } catch (error) {
      console.error('[coupons] Blad walidacji kuponu przy platnosci:', error)
      return sendJson(res, 500, { error: 'Blad serwera podczas walidacji kuponu' })
    }
    if (!couponResult.ok) {
      return sendJson(res, 400, { error: couponResult.message })
    }
    validatedDiscount = couponResult.discount
    appliedCouponCode = couponResult.coupon.code
  }
  const amountNumber = Math.round(itemsTotal * (1 - validatedDiscount) * 100) / 100

  const orderId = 'GM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase()
  const title = stripDiacritics(`Zamowienie GlowMoon ${orderId}`)
  const returnUrl = `${cfg.publicUrl}/payment/success?orderId=${orderId}`
  const negativeReturnUrl = `${cfg.publicUrl}/payment/failure?orderId=${orderId}`
  const amountValue = amountNumber.toFixed(2)
  const currency = 'PLN'
  const cleanEmail = typeof email === 'string' ? email.trim() : ''

  const sign = cashbillCreateSign({
    title,
    amountValue,
    currency,
    returnUrl,
    description: '',
    negativeReturnUrl,
    email: cleanEmail,
    secretKey: cfg.secretKey
  })

  const form = new URLSearchParams()
  form.set('title', title)
  form.set('amount.value', amountValue)
  form.set('amount.currencyCode', currency)
  form.set('returnUrl', returnUrl)
  form.set('negativeReturnUrl', negativeReturnUrl)
  if (cleanEmail) form.set('personalData.email', cleanEmail)
  form.set('sign', sign)

  try {
    const response = await fetch(`${cfg.apiBase}payment/${cfg.shopId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString()
    })

    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      data = { raw: text }
    }

    if (!response.ok || !data.redirectUrl) {
      console.error('[CashBill] Blad tworzenia platnosci:', response.status, text)
      return sendJson(res, 502, {
        error: 'Nie udalo sie utworzyc platnosci w CashBill',
        details: data?.errorMessage || data?.message || (typeof data?.raw === 'string' ? data.raw.slice(0, 200) : undefined) || `HTTP ${response.status}`
      })
    }

    await insertOrder({
      orderId,
      cashbillPaymentId: data.id,
      status: 'pending',
      nickname: nickname.trim(),
      email: cleanEmail || undefined,
      items: validatedItems,
      amount: Number(amountValue),
      currency,
      couponCode: appliedCouponCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    console.log(`[CashBill] Utworzono platnosc ${orderId} (${amountValue} ${currency}) -> ${data.id}`)
    return sendJson(res, 200, { success: true, orderId, redirectUrl: data.redirectUrl })
  } catch (error) {
    console.error('[CashBill] Wyjatek przy tworzeniu platnosci:', error)
    return sendJson(res, 502, { error: 'Nie udalo sie polaczyc z CashBill' })
  }
}
