// Wspólne odpowiedzi HTTP - handlery działają identycznie pod Express (lokalnie) i Vercel.

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export function sendJson(res, status, data) {
  cors(res)
  res.status(status).json(data)
}

export function sendOk(res) {
  // CashBill wymaga odpowiedzi HTTP 200 z cialem dokladnie "OK"
  cors(res)
  res.status(200).send('OK')
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') {
    cors(res)
    res.status(204).end()
    return true
  }
  return false
}
