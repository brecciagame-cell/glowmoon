import { sendJson, handleOptions } from './_lib/http.js'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' })
  }

  const { code, to } = req.body || {}

  const mailjetApiKey = process.env.MAILJET_API_KEY || ''
  const mailjetApiSecret = process.env.MAILJET_API_SECRET || ''
  const mailjetFromEmail = process.env.MAILJET_FROM_EMAIL || ''
  const mailjetFromName = process.env.MAILJET_FROM_NAME || 'GlowMoon'
  const admin2faTo = process.env.ADMIN_2FA_TO || ''

  const recipient = admin2faTo || to

  if (!code || !recipient) {
    return sendJson(res, 400, { error: 'Brak kodu lub adresu email' })
  }

  if (!mailjetApiKey || !mailjetApiSecret || !mailjetFromEmail) {
    console.warn(`[DEV] Mailjet nie skonfigurowany. Kod 2FA dla ${recipient}: ${code}`)
    return sendJson(res, 200, {
      success: true,
      devMode: true,
      message: 'Mailjet nie jest skonfigurowany. Kod wypisano w logach serwera.'
    })
  }

  try {
    const auth = Buffer.from(`${mailjetApiKey}:${mailjetApiSecret}`).toString('base64')
    const response = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        Messages: [
          {
            From: { Email: mailjetFromEmail, Name: mailjetFromName },
            To: [{ Email: recipient }],
            Subject: 'Kod weryfikacji - Panel Admina GlowMoon',
            TextPart: `Kod weryfikacji: ${code}. GlowMoon Admin Panel.`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; background: #1a1a25; color: #ddddee; border-radius: 12px;">
                <h2 style="color: #818cf8; margin-bottom: 20px;">Panel Administracyjny GlowMoon</h2>
                <p>Otrzymalismy probe logowania do panelu admina.</p>
                <p>Twoj kod weryfikacyjny:</p>
                <div style="background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <span style="font-size: 32px; font-weight: bold; color: #818cf8; letter-spacing: 8px; font-family: monospace;">${code}</span>
                </div>
                <p style="font-size: 14px; color: #666677;">Kod wazny przez 10 minut. Jesli to nie Ty probowales sie zalogowac, zignoruj te wiadomosc.</p>
              </div>
            `
          }
        ]
      })
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data?.ErrorMessage || data?.message || data?.error || `Mailjet HTTP ${response.status}`)
    }

    console.log('Email wyslany do:', recipient)
    return sendJson(res, 200, { success: true, message: 'Kod wyslany' })
  } catch (error) {
    console.error('Blad wysylania email:', error)
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[DEV] Fallback 2FA dla ${recipient}: ${code}`)
      return sendJson(res, 200, {
        success: true,
        devMode: true,
        message: 'SMTP odrzucone. Kod wypisano w logach serwera.'
      })
    }
    return sendJson(res, 500, {
      error: 'Nie udalo sie wyslac emaila',
      details: error instanceof Error ? error.message : 'unknown error'
    })
  }
}
