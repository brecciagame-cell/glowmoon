// Kanoniczny katalog produktów - ceny i klucze /case trzymane po stronie serwera.
// Klient NIE ma wplywu na cene ani na klucz (nie mozna kupic klucza za grosze).
// Uwaga: trzymaj ceny i nazwy w zgodzie z Produkty.tsx (frontend).
export const CATALOG = [
  { name: 'Klucz Rzadki', price: 1.99, key: 'Rzadka' },
  { name: 'Klucz Epicki', price: 3.99, key: 'Epicka' },
  { name: 'Klucz Legendarny', price: 5.99, key: 'Legendarna' },
  { name: 'Klucz Survivalowy', price: 10.99, key: 'Survival' },
  { name: 'Ranga VIP', price: 15.99 },
  { name: 'Ranga SVIP', price: 25.99 }
]

// Wsparcie serwera = darowizna o dowolnej kwocie (bez klucza /case)
export const SUPPORT_NAME_PREFIX = 'Wsparcie Serwera'
export const SUPPORT_MIN_PRICE = 0.99

/**
 * Waliduje pozycję koszyka przeciwko katalogowi.
 * @returns {{ ok: true, name: string, price: number, key?: string } | { ok: false, error: string }}
 */
export function validateCartItem(item) {
  const name = typeof item?.name === 'string' ? item.name.trim() : ''
  const quantity = Number(item?.quantity)
  const key = typeof item?.key === 'string' && item.key.trim() ? item.key.trim() : undefined

  if (!name) return { ok: false, error: 'Brak nazwy produktu' }
  if (!Number.isInteger(quantity) || quantity <= 0) return { ok: false, error: 'Nieprawidlowa ilosc' }

  // Wsparcie serwera: dowolna kwota od minimum, bez klucza /case
  if (name.startsWith(SUPPORT_NAME_PREFIX)) {
    const price = Math.round(Number(item?.price) * 100) / 100
    if (!Number.isFinite(price) || price < SUPPORT_MIN_PRICE || price > 500) {
      return { ok: false, error: 'Nieprawidlowa kwota wsparcia' }
    }
    return { ok: true, name, price, quantity }
  }

  const product = CATALOG.find((p) => p.name === name)
  if (!product) {
    return { ok: false, error: `Nieznany produkt: ${name}` }
  }

  // Cena z katalogu - ignorujemy cene przeslana przez klienta
  if (key !== (product.key || undefined)) {
    return { ok: false, error: `Nieprawidlowy klucz dla produktu: ${name}` }
  }

  return { ok: true, name: product.name, price: product.price, quantity, key: product.key }
}

/**
 * Waliduje nick gracza (standard: 3-16 znakow [A-Za-z0-9_], bez spacji).
 * Bez tego nick moglby wstrzyknac dodatkowe argumenty do komendy RCON.
 */
export function isValidNickname(nickname) {
  return typeof nickname === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(nickname)
}
