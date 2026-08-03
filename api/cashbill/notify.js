import { getConfig, fetchPaymentStatus, mapPaymentStatus, verifyNotifySignature } from '../_lib/cashbill.js'
import { findOrderByPaymentId, updateOrderStatus } from '../_lib/orders.js'
import { sendOk } from '../_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  // CashBill wysyla notyfikacje jako GET z parametrami cmd, args, sign.
  // POST akceptujemy dodatkowo dla wygody testow.
  const params = req.method === 'GET' ? req.query : (req.body || {})
  const cmd = String(params.cmd || '')
  const args = String(params.args || '')
  const sign = String(params.sign || '')

  const cfg = getConfig()

  if (!cfg.secretKey) {
    console.warn('[CashBill] Brak CASHBILL_SECRET_KEY - nie mozna zweryfikowac notyfikacji')
    return sendOk(res)
  }

  if (!cmd || !args || !sign) {
    return res.status(400).send('ERROR')
  }

  // Weryfikacja sygnatury: MD5(cmd + args + klucz podpisu)
  if (!verifyNotifySignature(cmd, args, sign, cfg.secretKey)) {
    console.warn('[CashBill] Nieprawidlowa sygnatura notyfikacji')
    return res.status(401).send('ERROR')
  }

  const order = await findOrderByPaymentId(args)
  if (!order) {
    console.warn(`[CashBill] Notyfikacja dla nieznanej platnosci: ${args}`)
    return sendOk(res)
  }

  try {
    // Notyfikacja mowi tylko 'status sie zmienil' - pobieramy faktyczny status
    const payment = await fetchPaymentStatus(args)
    const status = mapPaymentStatus(payment?.status)
    if (status !== order.status) {
      await updateOrderStatus(order.orderId, status)
      console.log(`[CashBill] Zamowienie ${order.orderId}: ${status}`)
    }
  } catch (error) {
    console.error('[CashBill] Blad przy odczycie statusu platnosci:', error)
    return sendOk(res)
  }

  return sendOk(res)
}
