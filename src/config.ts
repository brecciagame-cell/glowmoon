// Adres backendu (Express). W trybie dev Vite przekierowuje /api na http://localhost:3001
// (proxy w vite.config.ts), więc puste stringi wystarczą.
// Jeśli frontend i API działają na innych domenach, ustaw VITE_API_URL, np.:
//   VITE_API_URL=https://api.twoja-domena.pl
export const API_BASE: string = (import.meta.env.VITE_API_URL as string | undefined) ?? ''
