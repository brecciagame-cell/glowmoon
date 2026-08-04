import { rconExec } from './rcon.js'
import { updateOrderDelivery } from './orders.js'

// Konfiguracja RCON ze zmiennych środowiskowych (działa identycznie na Vercel i lokalnie)
export function getRconConfig() {
  return {
    host: process.env.RCON_HOST || '',
    port: Number(process.env.RCON_PORT || 25575),
    password: process.env.RCON_PASSWORD || ''
  }
}

export function isRconConfigured() {
  const cfg = getRconConfig()
  return !!(cfg.host && cfg.password)
}

/**
 * Buduje listę komend RCON dla zamówienia:
 *   /case give <player> <key> <qty>
 * Item bez pola `key` jest pomijany (np. darowizny/wsparcie serwera).
 * @returns {{ command: string, itemName: string }[]}
 */
export function buildCommands(order) {
  const nick = (order?.nickname || '').trim()
  if (!nick) return []

  const commands = []
  for (const item of order?.items || []) {
    const key = (item?.key || '').trim()
    if (!key) continue
    const qty = Math.max(1, Number(item?.quantity) || 1)
    // Przez RCON komendy wysylamy bez wiodacego '/' (konwencja konsoli Minecraft)
    commands.push({
      command: `case give ${nick} ${key} ${qty}`,
      itemName: item?.name || key
    })
  }
  return commands
}

/**
 * Dostarcza produkty zamówienia przez RCON (komenda /case give).
 * Idempotentne: jeśli zamówienie ma already delivered=true, nic nie robi.
 * @returns {Promise<{ attempted: boolean, ok: boolean, results: Array }>}
 */
export async function deliverOrder(order) {
  const cfg = getRconConfig()

  if (!isRconConfigured()) {
    console.warn('[RCON] Nie skonfigurowano RCON (RCON_HOST/RCON_PASSWORD) - pominieto dostrawe')
    return { attempted: false, ok: false, reason: 'brak konfiguracji RCON' }
  }

  if (!order || order.delivered) {
    return { attempted: false, ok: true, reason: 'juz dostarczone' }
  }

  const commands = buildCommands(order)
  if (commands.length === 0) {
    console.warn(`[RCON] Zamowienie ${order.orderId} nie ma produktow z kluczem /case - pominieto`)
    return { attempted: false, ok: true, reason: 'brak produktow /case' }
  }

  // Idempotentnosc: pomijamy pozycje, ktore juz zostaly dostarczone (log w bazie),
  // zeby np. przy ponowieniu nie nadac drugi raz tych samych przedmiotow.
  const done = new Set(
    (order.deliveryLog || []).filter((e) => e.ok && e.itemName).map((e) => e.itemName)
  )

  const results = []
  let anySkipped = false
  for (const { command, itemName } of commands) {
    if (done.has(itemName)) {
      results.push({ command, itemName, ok: true, skipped: true })
      anySkipped = true
      continue
    }
    const result = await rconExec({ ...cfg, command })
    results.push({ command, itemName, ok: result.ok, output: result.output, error: result.error })
    if (result.ok) {
      console.log(`[RCON] OK  ${command}${result.output ? ' -> ' + result.output.slice(0, 120) : ''}`)
    } else {
      console.error(`[RCON] BLAD ${command}: ${result.error}`)
    }
  }

  const ok = results.every((r) => r.ok)
  const deliveredAt = ok ? new Date().toISOString() : null

  // Zapisujemy wynik dostawy (delivered/delivery_log) - jesli cos nie przeszlo, zamowienie
  // pozostaje niedostarczone i zostanie ponowione przy nastepnej notyfikacji / odswiezeniu.
  try {
    await updateOrderDelivery(order.orderId, {
      delivered: ok,
      deliveredAt,
      deliveryLog: results.map((r) => ({
        command: r.command,
        itemName: r.itemName,
        ok: r.ok,
        error: r.error || null,
        at: new Date().toISOString()
      }))
    })
  } catch (error) {
    console.error('[RCON] Blad zapisu stanu dostawy:', error)
  }

  return { attempted: true, ok, results }
}
