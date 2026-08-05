import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { getDb, updateOrderDelivery } from './orders.js'

// Dostawa produktow w trybie "pull" (plugin GlowMoonDelivery na serwerze Minecraft).
// Po opłaceniu zamowienia backend odkłada komendy do kolejki (Supabase delivery_queue),
// a plugin odpytuje GET /api/delivery/poll, wykonuje komendy przez konsole serwera
// i potwierdza przez POST /api/delivery/ack. Dzieki temu dostawa dziala nawet gdy
// hosting Minecraft blokuje port RCON z internetu (np. gamehost.pl).

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Fallback plikowy - tylko lokalny dev bez Supabase
const QUEUE_FILE = path.join(__dirname, '..', '..', 'data', 'delivery_queue.json')

const STALE_MS = 3 * 60 * 1000 // 'in_progress' starsze niz 3 min wznawiamy (plugin padl przed ack)
const MAX_ATTEMPTS = 5 // limit ponownych prob dla pozycji 'failed'
const nowIso = () => new Date().toISOString()

function loadQueue() {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'))
  } catch {
    return []
  }
}

function saveQueue(queue) {
  try {
    fs.mkdirSync(path.dirname(QUEUE_FILE), { recursive: true })
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2))
  } catch (error) {
    console.warn('[delivery] Nie udalo sie zapisac pliku kolejki (tryb dev):', error.message)
  }
}

// Sekret, ktory musi znac plugin (config.yml) - identyczny z DELIVERY_TOKEN w Vercel
export function getDeliveryToken() {
  return process.env.DELIVERY_TOKEN || ''
}

/**
 * Buduje listę komend dostawy dla zamówienia:
 *   case give <player> <key> <qty>                    - klucze /case
 *   lp user <player> parent addtemp <rank> 30d        - rangi LuckPerms (VIP/SVIP)
 * Item bez pola `key` ani `rank` jest pomijany (np. darowizny/wsparcie serwera).
 * @returns {{ command: string, itemName: string }[]}
 */
export function buildCommands(order) {
  const nick = (order?.nickname || '').trim()
  if (!nick) return []

  const commands = []
  for (const item of order?.items || []) {
    const qty = Math.max(1, Number(item?.quantity) || 1)

    // Ranga LuckPerms: addtemp na 30 dni (x ilosc = 30d, 60d, 90d...)
    const rank = (item?.rank || '').trim()
    if (rank) {
      commands.push({
        command: `lp user ${nick} parent addtemp ${rank} ${30 * qty}d`,
        itemName: item?.name || rank
      })
      continue
    }

    const key = (item?.key || '').trim()
    if (!key) continue
    commands.push({
      command: `case give ${nick} ${key} ${qty}`,
      itemName: item?.name || key
    })
  }
  return commands
}

// ---------- enqueue ----------

async function enqueueSupabase(orderId, commands) {
  const db = getDb()
  for (const { command, itemName } of commands) {
    const { error } = await db.from('delivery_queue').upsert(
      {
        order_id: orderId,
        command,
        item_name: itemName,
        status: 'pending',
        attempts: 0,
        updated_at: nowIso()
      },
      { onConflict: 'order_id,command', ignoreDuplicates: true }
    )
    if (error) throw new Error(error.message)
  }
  // Pozycje, ktore wczesniej nie doszly (failed, w granicach progu) - wracaja do kolejki
  const { error: retryError } = await db
    .from('delivery_queue')
    .update({ status: 'pending', updated_at: nowIso() })
    .eq('order_id', orderId)
    .in('command', commands.map((c) => c.command))
    .eq('status', 'failed')
    .lt('attempts', MAX_ATTEMPTS)
  if (retryError) throw new Error(retryError.message)
}

function enqueueFile(orderId, commands) {
  const queue = loadQueue()
  for (const { command, itemName } of commands) {
    const existing = queue.find((q) => q.orderId === orderId && q.command === command)
    if (existing) {
      if (existing.status === 'failed' && existing.attempts < MAX_ATTEMPTS) {
        existing.status = 'pending'
        existing.updatedAt = nowIso()
      }
      continue
    }
    queue.push({
      id: randomUUID(),
      orderId,
      command,
      itemName,
      status: 'pending',
      attempts: 0,
      ackNote: null,
      createdAt: nowIso(),
      updatedAt: nowIso()
    })
  }
  saveQueue(queue)
}

/**
 * Odklada komendy zamowienia do kolejki (idempotentne - te same pozycje nie zdubluja sie).
 * Zamiast laczac sie z serwerem Minecraft przez RCON, to plugin pobiera komendy.
 * @returns {Promise<{ attempted: boolean, ok: boolean, reason: string }>}
 */
export async function deliverOrder(order) {
  if (!order || order.delivered) {
    return { attempted: false, ok: true, reason: 'juz dostarczone' }
  }

  const commands = buildCommands(order)
  if (commands.length === 0) {
    console.warn(`[delivery] Zamowienie ${order.orderId} nie ma produktow z kluczem /case ani ranga - pominieto`)
    return { attempted: false, ok: true, reason: 'brak produktow do dostawy' }
  }

  const db = getDb()
  if (db) {
    await enqueueSupabase(order.orderId, commands)
  } else {
    enqueueFile(order.orderId, commands)
  }

  console.log(`[delivery] Zamowienie ${order.orderId}: zakolejkowano ${commands.length} komend dla pluginu`)
  return { attempted: true, ok: true, reason: 'zakolejkowano' }
}

// ---------- poll (claim) ----------

/**
 * Pobiera komendy oczekujace do wykonania (max `limit`).
 * Atomowo przejmuje pozycje 'pending' oraz wznawia 'in_progress' utkniete > 3 min
 * i 'failed' z attempts < MAX_ATTEMPTS.
 * @returns {Promise<Array<{ id: string, command: string }>>}
 */
export async function claimCommands(limit = 10) {
  const db = getDb()
  if (db) return claimSupabase(limit)
  return claimFile(limit)
}

async function claimSupabase(limit) {
  const db = getDb()
  const staleIso = new Date(Date.now() - STALE_MS).toISOString()

  // wznowienie utknietego 'in_progress' (plugin nie potwierdzil w 3 min)
  await db
    .from('delivery_queue')
    .update({ status: 'pending', updated_at: nowIso() })
    .eq('status', 'in_progress')
    .lt('updated_at', staleIso)

  // wznowienie 'failed' do ponownych prob
  await db
    .from('delivery_queue')
    .update({ status: 'pending', updated_at: nowIso() })
    .eq('status', 'failed')
    .lt('attempts', MAX_ATTEMPTS)

  const { data: pending, error } = await db
    .from('delivery_queue')
    .select('id, command')
    .eq('status', 'pending')
    .order('created_at')
    .limit(limit)
  if (error) throw new Error(error.message)
  if (!pending?.length) return []

  // atomiczny claim: tylko te, ktore wciaz sa 'pending' (dwa pluginy nie przejma tej samej pozycji)
  const { data: claimed, error: claimError } = await db
    .from('delivery_queue')
    .update({ status: 'in_progress', updated_at: nowIso() })
    .in('id', pending.map((p) => p.id))
    .eq('status', 'pending')
    .select('id, command')
  if (claimError) throw new Error(claimError.message)

  return (claimed || []).map((r) => ({ id: r.id, command: r.command }))
}

function claimFile(limit) {
  const queue = loadQueue()
  const staleMs = Date.now() - STALE_MS
  for (const q of queue) {
    if (q.status === 'in_progress' && new Date(q.updatedAt).getTime() < staleMs) q.status = 'pending'
    if (q.status === 'failed' && q.attempts < MAX_ATTEMPTS) q.status = 'pending'
  }
  const claimed = []
  for (const q of queue) {
    if (q.status === 'pending' && claimed.length < limit) {
      q.status = 'in_progress'
      q.updatedAt = nowIso()
      claimed.push({ id: q.id, command: q.command })
    }
  }
  saveQueue(queue)
  return claimed
}

// ---------- ack ----------

/**
 * Potwierdza wykonanie komend przez plugina i aktualizuje stan dostawy zamowien.
 * @param results Array<{ id: string, ok: boolean, error?: string }>
 * @returns {Promise<{ updated: number, ordersUpdated: number }>}
 */
export async function ackResults(results) {
  const db = getDb()
  const updated = []
  for (const r of results) {
    if (!r?.id) continue
    if (db) {
      const { data: row } = await db
        .from('delivery_queue')
        .select('order_id, attempts')
        .eq('id', r.id)
        .maybeSingle()
      if (!row) continue
      const { error } = await db
        .from('delivery_queue')
        .update({
          status: r.ok ? 'done' : 'failed',
          ack_note: r.error || null,
          attempts: (row.attempts || 0) + 1,
          updated_at: nowIso()
        })
        .eq('id', r.id)
        .eq('status', 'in_progress') // nie nadpisujemy juz zakonczonych (podwojny ack)
      if (error) throw new Error(error.message)
      updated.push(row.order_id)
    } else {
      const queue = loadQueue()
      const q = queue.find((x) => x.id === r.id)
      if (!q) continue
      if (q.status !== 'in_progress') continue
      q.status = r.ok ? 'done' : 'failed'
      q.ackNote = r.error || null
      q.attempts = (q.attempts || 0) + 1
      q.updatedAt = nowIso()
      saveQueue(queue)
      updated.push(q.orderId)
    }
  }

  for (const orderId of new Set(updated)) {
    await refreshOrderDeliveryState(orderId)
  }
  return { updated: updated.length, ordersUpdated: new Set(updated).size }
}

// Przelicza stan dostawy zamowienia z kolejki (delivered + delivery_log w tabeli orders)
async function refreshOrderDeliveryState(orderId) {
  const db = getDb()
  let rows
  if (db) {
    const { data, error } = await db
      .from('delivery_queue')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at')
    if (error) throw new Error(error.message)
    rows = data || []
  } else {
    rows = loadQueue().filter((q) => q.orderId === orderId)
  }

  const deliveryLog = rows.map((r) => ({
    command: r.command,
    itemName: r.item_name || r.itemName || '',
    ok: r.status === 'done',
    error: r.status === 'failed' ? (r.ack_note || 'blad dostawy') : null,
    status: r.status,
    at: r.updated_at || r.updatedAt
  }))

  const delivered = rows.length > 0 && rows.every((r) => r.status === 'done')
  // Koncowy blad: wszystkie pozycje 'failed' i kazda przekroczyla limit prob -> pokaz na stronie
  const deliveryError =
    rows.length > 0 &&
    rows.every((r) => r.status === 'failed') &&
    rows.every((r) => (r.attempts || 0) >= MAX_ATTEMPTS)
  await updateOrderDelivery(orderId, {
    delivered,
    deliveredAt: delivered ? nowIso() : null,
    deliveryLog,
    deliveryError
  })
}
