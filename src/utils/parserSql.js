/**
 * Pure JS Parser Engine: Extracts tabular records from .sql text dumps.
 * Parses INSERT INTO table (cols...) VALUES (vals...) statements.
 */
export async function parseSqlFile(file) {
  const text = await file.text()
  const records = []

  // Fixed flags: /gi instead of /gii
  const insertRegex = /INSERT\s+INTO\s+[`"']?\w+[`"']?\s*\(([^)]+)\)\s*VALUES\s*(.+?);/gi
  let match

  while ((match = insertRegex.exec(text)) !== null) {
    const rawHeaders = match[1].split(',').map(h => h.replace(/[`"'\s]/g, ''))
    const rawValuesGroup = match[2]

    // Matches individual tuple rows e.g. ('val1', 100), ('val2', 200)
    const tupleRegex = /\(([^)]+)\)/g
    let tupleMatch

    while ((tupleMatch = tupleRegex.exec(rawValuesGroup)) !== null) {
      const values = tupleMatch[1].split(',').map(v => {
        const clean = v.trim().replace(/^['"]|['"]$/g, '')
        return !isNaN(clean) && clean !== '' ? Number(clean) : clean
      })

      const row = {}
      rawHeaders.forEach((header, idx) => {
        row[header] = values[idx] !== undefined ? values[idx] : null
      })
      records.push(row)
    }
  }

  if (records.length === 0) {
    throw new Error('No valid INSERT INTO statements found in the SQL file.')
  }

  return records
}