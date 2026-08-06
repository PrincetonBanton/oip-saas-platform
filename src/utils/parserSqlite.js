/**
 * WASM Engine: Parses binary .sqlite / .db database files directly in browser memory.
 */
let sqlEngine = null

async function initSqlEngine() {
  if (sqlEngine) return sqlEngine
  
  // Dynamically load sql.js WebAssembly library from CDN
  if (!window.initSqlJs) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js'
      script.onload = resolve
      script.onerror = () => reject(new Error('Failed to load SQL.js WASM engine'))
      document.head.appendChild(script)
    })
  }

  sqlEngine = await window.initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  })
  return sqlEngine
}

export async function parseSqliteFile(file) {
  const SQL = await initSqlEngine()
  const arrayBuffer = await file.arrayBuffer()
  const db = new SQL.Database(new Uint8Array(arrayBuffer))

  // Get first available table in SQLite database
  const tablesResult = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
  if (!tablesResult.length || !tablesResult[0].values.length) {
    throw new Error('No user tables found inside SQLite database.')
  }

  const firstTableName = tablesResult[0].values[0][0]
  const contents = db.exec(`SELECT * FROM "${firstTableName}"`)

  if (!contents.length) return []

  const columns = contents[0].columns
  const values = contents[0].values

  // Map values to object key-value records
  return values.map(row => {
    const record = {}
    columns.forEach((col, idx) => {
      record[col] = row[idx]
    })
    return record
  })
}