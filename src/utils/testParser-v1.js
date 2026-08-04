// Step 1: Import all three decoupled parser utilities
import { parseCsvFile } from './parserCsv.js'
import { parseJsonFile } from './parserJson.js'
import { parseExcelFile } from './parserExcel.js'

/**
 * Helper Utility: Asynchronously fetches a static file from the `public/` directory
 * and wraps it inside a native browser `File` object to simulate a real user upload.
 * * @param {string} path - Relative URL path to the target file in public/ (e.g. '/testingFiles/sample.csv').
 * @param {string} fileName - Destination file name (e.g. 'sample.csv').
 * @param {string} mimeType - Standard Internet Media Type string (e.g. 'text/csv').
 * @returns {Promise<File>} Resolved native JavaScript File object.
 */

async function fetchTestFile(path, fileName, mimeType) {
  const response = await fetch(path)                      // A. Execute HTTP GET request to retrieve static file bytes from the web server
  const blob = await response.blob()                      // B. Extract raw binary Blob data from the response stream
  return new File([blob], fileName, { type: mimeType })   // C. Instantiates and returns a native File object wrapping the Blob
}


/**
 * Main Diagnostic Test Suite Runner.
 * Executes end-to-end tests fetching real CSV, JSON, and XLSX files from `public/testingFiles/`.
 */
export function runDiagnostic() {
  
  // =========================================================================
  // 1. REAL CSV FILE DIAGNOSTIC
  // =========================================================================
  fetchTestFile('/testingFiles/sample.csv', 'sample.csv', 'text/csv')
    .then(file => parseCsvFile(file)) // Pass retrieved File directly into PapaParse wrapper
    .then(data => console.log('✅ CSV File Test Passed:', data))
    .catch(err => console.error('❌ CSV File Test Failed:', err))

  // =========================================================================
  // 2. REAL JSON FILE DIAGNOSTIC
  // =========================================================================
  fetchTestFile('/testingFiles/sample.json', 'sample.json', 'application/json')
    .then(file => parseJsonFile(file)) // Pass retrieved File into FileReader + flatten utility
    .then(data => console.log('✅ JSON File Test Passed:', data))
    .catch(err => console.error('❌ JSON File Test Failed:', err))

  // =========================================================================
  // 3. REAL EXCEL (.XLSX) FILE DIAGNOSTIC
  // =========================================================================
  fetchTestFile(
    '/testingFiles/sample.xlsx', 
    'sample.xlsx', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    .then(file => parseExcelFile(file)) // Pass retrieved binary XLSX File into SheetJS wrapper
    .then(res => console.log('✅ Excel File Test Passed:', res.data))
    .catch(err => console.error('❌ Excel File Test Failed:', err))
}