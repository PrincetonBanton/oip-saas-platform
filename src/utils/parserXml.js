/**
 * Pure JS Parser Engine: Converts tabular XML elements into array records.
 */
export async function parseXmlFile(file) {
  const text = await file.text()
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  // Detect parser errors
  const parseError = xmlDoc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Invalid XML structure.')
  }

  // Find record node children under root
  const root = xmlDoc.documentElement
  const recordNodes = Array.from(root.children)

  if (recordNodes.length === 0) {
    throw new Error('No data records found inside XML file.')
  }

  const records = recordNodes.map(node => {
    const row = {}
    Array.from(node.children).forEach(child => {
      const val = child.textContent.trim()
      row[child.tagName] = !isNaN(val) && val !== '' ? Number(val) : val
    })
    return row
  })

  return records
}