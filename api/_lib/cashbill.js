import crypto from 'crypto'

const sha1 = (s) => crypto.createHash('sha1').update(s, 'utf8').digest('hex')
const md5 = (s) => crypto.createHash('md5').update(s, 'utf8').digest('hex')

// Konfiguracja czytana ze zmiennych środowiskowych (działa identycznie na Vercel i lokalnie)
export function getConfig() {
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
  return {
    shopId: process.env.CASHBILL_SHOP_ID || '',
    secretKey: process.env.CASHBILL_SECRET_KEY || '',
    // Produkcja: https://pay.cashbill.pl/ws/rest/  |  Testy: https://pay.cashbill.pl/testws/rest/
    apiBase: (process.env.CASHBILL_API_BASE || 'https://pay.cashbill.pl/ws/rest/').replace(/\/+$/, '') + '/',
    publicUrl: (process.env.PUBLIC_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:5173')).replace(/\/+$/, '')
  }
}

const DIACRITICS_MAP = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' }
export const stripDiacritics = (s) => s.replace(/[ąćęłńóśźż]/gi, (ch) => DIACRITICS_MAP[ch.toLowerCase()] ?? ch)

// Sygnatura tworzenia płatności: SHA-1 ze sklejonych pól (dokładnie w tej kolejności!) + klucz podpisu.
// Puste pola też wchodzą do sygnatury jako pusty ciąg znaków.
export function cashbillCreateSign({ title, amountValue, currency, returnUrl, description, negativeReturnUrl, email, secretKey }) {
  const parts = [
    title,                 // 1. title
    amountValue,           // 2. amount.value
    currency,              // 3. amount.currencyCode
    returnUrl,             // 4. returnUrl
    description || '',     // 5. description
    negativeReturnUrl,     // 6. negativeReturnUrl
    '',                    // 7. additionalData
    '',                    // 8. paymentChannel
    '',                    // 9. languageCode
    '',                    // 10. referer
    '',                    // 11. personalData.firstName
    '',                    // 12. personalData.surname
    email || '',           // 13. personalData.email
    '',                    // 14. personalData.country
    '',                    // 15. personalData.city
    '',                    // 16. personalData.postcode
    '',                    // 17. personalData.street
    '',                    // 18. personalData.house
    '',                    // 19. personalData.flat
    '',                    // 20. personalData.ip
    secretKey              // 21. klucz podpisu
  ]
  return sha1(parts.join(''))
}

// Pobranie aktualnego statusu płatności z CashBill
export async function fetchPaymentStatus(paymentId) {
  const { shopId, secretKey, apiBase } = getConfig()
  const sign = sha1(paymentId + secretKey)
  const response = await fetch(`${apiBase}payment/${shopId}/${paymentId}?sign=${sign}`)
  if (!response.ok) {
    throw new Error(`CashBill GET ${response.status}`)
  }
  return response.json()
}

// Mapowanie statusu CashBill na nasz status zamówienia
export function mapPaymentStatus(status) {
  if (status === 'PositiveFinish') return 'paid'
  if (['Abort', 'NegativeFinish', 'NegativeAuthorization', 'Fraud'].includes(status)) return 'cancelled'
  return 'pending'
}

// Weryfikacja sygnatury notyfikacji: MD5(cmd + args + klucz podpisu)
export function verifyNotifySignature(cmd, args, sign, secretKey) {
  return md5(cmd + args + secretKey) === sign
}
