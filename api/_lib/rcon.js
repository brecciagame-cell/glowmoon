import net from 'net'

// Typy pakietów RCON (protokół Source RCON)
const TYPE_AUTH = 3
const TYPE_AUTH_RESPONSE = 2
const TYPE_EXEC = 2
const TYPE_RESPONSE = 0

function encodePacket(requestId, type, body) {
  const bodyBuf = Buffer.from(String(body) + '\0', 'utf8')
  // length = requestId(4) + type(4) + body + null(1) + padding(1)
  const length = 4 + 4 + bodyBuf.length + 1
  const buf = Buffer.alloc(4 + length)
  buf.writeInt32LE(length, 0)
  buf.writeInt32LE(requestId, 4)
  buf.writeInt32LE(type, 8)
  bodyBuf.copy(buf, 12)
  // ostatni bajt (padding) pozostaje 0
  return buf
}

/**
 * Wykonuje jedną komendę RCON na serwerze Minecraft.
 * @param {{host: string, port: number, password: string, command: string, timeoutMs?: number}} options
 * @returns {Promise<{ ok: boolean, output: string, error?: string }>}
 */
export function rconExec({ host, port, password, command, timeoutMs = 5000 }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })
    let requestId = 5
    let buffer = Buffer.alloc(0)
    let authed = false
    let gotResponse = false
    let responseAcc = ''
    let settled = false

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true
        socket.destroy()
        resolve({ ok: false, output: '', error: `RCON timeout (${timeoutMs}ms)` })
      }
    }, timeoutMs)

    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      resolve(result)
    }

    function send(type, body) {
      socket.write(encodePacket(requestId, type, body))
      const id = requestId
      requestId += 1
      return id
    }

    function handlePacket(id, type, body) {
      if (type === TYPE_AUTH_RESPONSE) {
        if (id === -1) {
          finish({ ok: false, output: '', error: 'RCON: nieprawidlowe haslo' })
          return
        }
        authed = true
        send(TYPE_EXEC, command)
        return
      }
      if (type === TYPE_RESPONSE && authed) {
        gotResponse = true
        // Odpowiedź może być podzielona na wiele pakietów; pusty pakiet kończy odpowiedź
        if (body === '') {
          finish({ ok: true, output: responseAcc })
          return
        }
        responseAcc += body
      }
    }

    function onData(data) {
      buffer = Buffer.concat([buffer, data])
      while (buffer.length >= 4) {
        const length = buffer.readInt32LE(0)
        if (buffer.length < 4 + length) break
        const pkt = buffer.subarray(4, 4 + length)
        buffer = buffer.subarray(4 + length)
        if (pkt.length >= 9) {
          const id = pkt.readInt32LE(0)
          const type = pkt.readInt32LE(4)
          const body = pkt.subarray(8, pkt.length - 2).toString('utf8') // bez \0 i paddingu
          handlePacket(id, type, body)
        }
      }
    }

    socket.on('connect', () => {
      send(TYPE_AUTH, password)
    })
    socket.on('data', onData)
    socket.on('error', (err) => {
      finish({ ok: false, output: '', error: `RCON: ${err.message}` })
    })
    socket.on('close', () => {
      if (!settled) {
        finish({
          ok: false,
          output: responseAcc,
          error: gotResponse ? 'RCON: polaczenie zamkniete przed koncem odpowiedzi' : 'RCON: polaczenie zamkniete przed odpowiedzia'
        })
      }
    })
  })
}
