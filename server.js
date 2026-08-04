import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getConfig } from './api/_lib/cashbill.js'
import createPaymentHandler from './api/create-payment.js'
import notifyHandler from './api/cashbill/notify.js'
import orderHandler from './api/order/[orderId].js'
import send2faHandler from './api/send-2fa-code.js'
import deliveryPollHandler from './api/delivery/poll.js'
import deliveryAckHandler from './api/delivery/ack.js'
import couponValidateHandler from './api/coupons/validate.js'
import adminCouponsHandler from './api/admin/coupons.js'
import adminCouponHandler from './api/admin/coupons/[id].js'
import adminStatsHandler from './api/admin/stats.js'
import adminOrdersHandler from './api/admin/orders.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Te same handlery co funkcje Vercel (api/*.js)
app.all('/api/create-payment', createPaymentHandler)
app.all('/api/cashbill/notify', notifyHandler)
app.get('/api/order/:orderId', orderHandler)
app.post('/api/send-2fa-code', send2faHandler)
app.get('/api/delivery/poll', deliveryPollHandler)
app.post('/api/delivery/ack', deliveryAckHandler)
app.post('/api/coupons/validate', couponValidateHandler)
app.get('/api/admin/coupons', adminCouponsHandler)
app.post('/api/admin/coupons', adminCouponsHandler)
app.patch('/api/admin/coupons/:id', adminCouponHandler)
app.delete('/api/admin/coupons/:id', adminCouponHandler)
app.get('/api/admin/stats', adminStatsHandler)
app.get('/api/admin/orders', adminOrdersHandler)

app.get('/api/test', (_req, res) => {
  res.json({ message: 'API dziala!' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  const cfg = getConfig()
  console.log(`Serwer API dziala na porcie ${PORT}`)
  console.log(`Endpoint 2FA: POST http://localhost:${PORT}/api/send-2fa-code`)
  if (cfg.shopId && cfg.secretKey) {
    console.log(`CashBill skonfigurowany (${cfg.shopId})`)
  } else {
    console.log('CashBill NIE skonfigurowany - ustaw CASHBILL_SHOP_ID i CASHBILL_SECRET_KEY w .env')
  }
  if (process.env.SUPABASE_URL) {
    console.log('Zamowienia: Supabase')
  } else {
    console.log('Zamowienia: plik data/orders.json (tryb dev - ustaw SUPABASE_URL w .env aby uzyc bazy)')
  }
  if (process.env.DELIVERY_TOKEN) {
    console.log('Dostawa: tryb pull (plugin GlowMoonDelivery odpytuje /api/delivery/poll co kilka sekund)')
  } else {
    console.log('Dostawa: BRAK DELIVERY_TOKEN - ustaw go w .env (plugin nie bedzie mogl pobrac komend)')
  }
  console.log('Dostawa: GET  /api/delivery/poll?token=... (plugin pobiera komendy)')
  console.log('Dostawa: POST /api/delivery/ack (plugin potwierdza wykonanie)')
  console.log(`CashBill: adres notyfikacji do ustawienia w panelu: ${process.env.CASHBILL_NOTIFY_URL || `http://localhost:${PORT}/api/cashbill/notify`}`)
  console.log(`CashBill: adresy powrotu: ${cfg.publicUrl}/payment/success ... i .../payment/failure`)
})
