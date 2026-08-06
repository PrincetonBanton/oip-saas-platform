/**
 * Pure JS Parser Engine: Reads binary .dbf (dBASE III / FoxPro) files.
 * Decodes the header byte offsets and record descriptors directly.
 */
export async function parseDbfFile(file) {
  const buffer = await file.arrayBuffer()
  const view = new DataView(buffer)

  const numRecords = view.getUint32(4, true)
  const headerLength = view.getUint16(8, true)
  const recordLength = view.getUint16(10, true)

  const fields = []
  let offset = 32

  // Read field descriptors (32 bytes per column definition)
  while (offset < headerLength - 1) {
    const nameBytes = new Uint8Array(buffer, offset, 11)
    let fieldName = ''
    for (let i = 0; i < 11 && nameBytes[i] !== 0; i++) {
      fieldName += String.fromCharCode(nameBytes[i])
    }

    const fieldType = String.fromCharCode(view.getUint8(offset + 11))
    const fieldLen = view.getUint8(offset + 16)

    if (fieldName.trim().length > 0) {
      fields.push({ name: fieldName.trim(), type: fieldType, length: fieldLen })
    }
    offset += 32
  }

  const records = []
  const decoder = new TextDecoder('latin1')
  let recordOffset = headerLength

  // Extract tabular records
  for (let r = 0; r < numRecords; r++) {
    const isDeleted = view.getUint8(recordOffset) === 0x2A // '*' indicates deleted
    if (!isDeleted) {
      let fieldOffset = recordOffset + 1
      const row = {}

      fields.forEach(field => {
        const rawBytes = new Uint8Array(buffer, fieldOffset, field.length)
        let rawStr = decoder.decode(rawBytes).trim()

        if (field.type === 'N' || field.type === 'F') {
          row[field.name] = rawStr === '' ? null : Number(rawStr)
        } else if (field.type === 'L') {
          row[field.name] = rawStr === 'Y' || rawStr === 'T'
        } else {
          row[field.name] = rawStr
        }

        fieldOffset += field.length
      })

      records.push(row)
    }
    recordOffset += recordLength
  }

  return records
}