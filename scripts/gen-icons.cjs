const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function crc32(buf) {
  let c
  const table = crc32.table || (crc32.table = (() => {
    const t = []
    for (let n = 0; n < 256; n++) {
      c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[n] = c
    }
    return t
  })())
  let crc = 0xffffffff
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crcBuf])
}

function makeIcon(size) {
  const bg = [0x30, 0x7f, 0x2c]
  const fg = [0xf2, 0xfa, 0xf1]
  const raw = Buffer.alloc(size * (1 + size * 4))
  const cx = size / 2
  const r = size * 0.46

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4)
    raw[rowStart] = 0
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cx
      const inCircle = dx * dx + dy * dy <= r * r
      let col = inCircle ? bg : [0xff, 0xff, 0xff]
      let alpha = 255
      if (!inCircle) alpha = 0

      if (inCircle) {
        const bx = (x - size * 0.28) / size
        const by = (y - size * 0.34) / size
        const bagTop = 0.3, bagBottom = 0.72, bagLeft = 0.28, bagRight = 0.72
        const fx = x / size, fy = y / size
        const inBag = fx > bagLeft && fx < bagRight && fy > bagTop && fy < bagBottom
        const handleCx = size * 0.5
        const handleCy = size * 0.3
        const hr = size * 0.14
        const hd = Math.hypot(x - handleCx, y - handleCy)
        const onHandle = hd < hr + size * 0.035 && hd > hr - size * 0.035 && y < handleCy + 2
        if (inBag || onHandle) col = fg
      }

      const off = 1 + x * 4
      raw[rowStart + off] = col[0]
      raw[rowStart + off + 1] = col[1]
      raw[rowStart + off + 2] = col[2]
      raw[rowStart + off + 3] = alpha
    }
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const idat = zlib.deflateSync(raw, { level: 9 })
  const png = Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ])
  return png
}

const outDir = path.join(__dirname, '..', 'public')
fs.writeFileSync(path.join(outDir, 'icon-192.png'), makeIcon(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), makeIcon(512))
console.log('icons written')
