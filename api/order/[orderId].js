import { getConfig, fetchPaymentStatus, mapPaymentStatus } from '../_lib/cashbill.js'
import { findOrderByOrderId, updateOrderStatus, publicOrder } from '../_lib/orders.js'
import { deliverOrder } from '../_lib/delivery.js'
import { sendJson, handleOptions } from '../_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  // Vercel przekazuje parametry w req.query, Express w req.params
  const orderId = String(req.params?.orderId || req.query?.orderId || '')
  if (!orderId) {
    return sendJson(res, 400, { error: 'Brak numeru zamowienia' })
  }

  let order
  try {
    order = await findOrderByOrderId(orderId)
  } catch (error) {
    console.error('[orders] Blad odczytu zamowienia:', error)
    return sendJson(res, 500, { error: 'Blad odczytu zamowienia' })
  }

  if (!order) {
    return sendJson(res, 404, { error: 'Nie znaleziono zamowienia' })
  }

  // Dopoki platnosc nie zakonczona, odswiezamy status z CashBill (strona sukcesu czeka na potwierdzenie)
  if (order.status === 'pending' && order.cashbillPaymentId && getConfig().secretKey) {
    try {
      const payment = await fetchPaymentStatus(order.cashbillPaymentId)
      const status = mapPaymentStatus(payment?.status)
      if (status !== order.status) {
        await updateOrderStatus(order.orderId, status)
        order.status = status
      }
    } catch (error) {
      console.error('[CashBill] Blad odswiezania statusu:', error)
    }
  }

  // Retry dostawy: jesli platnosc zaksięgowana, a produkty jeszcze nie dostarczone (np. RCON
  // nie dzialal w momencie notyfikacji) - proba ponowna przy kazdym odswiezeniu strony.
  if (order.status === 'paid' && !order.delivered) {
    try {
      const delivery = await deliverOrder(order)
      if (delivery.attempted) {
        // Odswiez obiekt, zeby strona od razu pokazala status (bez czekania na kolejny poll)
        order.delivered = delivery.ok
        order.deliveredAt = delivery.ok ? new Date().toISOString() : null
      }
    } catch (error) {
      console.error('[RCON] Blad retry dostawy:', error)
    }
  }

  return sendJson(res, 200, publicOrder(order))
}
