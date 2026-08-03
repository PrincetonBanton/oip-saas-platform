// Step 1: Import the SheetJS library for reading binary spreadsheet formats (.xlsx, .xls, .ods)
import * as XLSX from 'xlsx'

/**
 * Reads an Excel workbook and parses a specified worksheet into flat JSON objects.
 * Defaults to the first sheet if no sheetName is passed.
 * @param {File} file - Raw binary Excel File object from file picker or drag-and-drop.
 * @param {String} [sheetName=null] - Optional target worksheet name.
 * @returns {Promise<{ sheetNames: Array<string>, data: Array<Object> }>}
 */
export function parseExcelFile(file, sheetName = null) {
  // STEP 2: Wrap the file read in a Promise for smooth async/await usage in UI components
  return new Promise((resolve, reject) => {

    // STEP 3: Use the browser's FileReader API
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Excel File reading failed.'))                            // Handle file read errors from disk

    // STEP 4: Execute when the binary array buffer finishes loading into memory
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)                                                  // Convert the raw ArrayBuffer into a Uint8Array byte array for SheetJS
        const workbook = XLSX.read(data, { type: 'array' })                                           // Parse the binary byte array into a SheetJS Workbook object
        const sheetNames = workbook.SheetNames                                                        // Extract list of all sheet tab names available in the workbook (e.g. ['Sheet1', 'Q1_Sales'])
        const targetSheet = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0]   // Select the requested sheet name, or default to the very first sheet in the list
        const worksheet = workbook.Sheets[targetSheet]                                                // Access the specific worksheet grid object
        const parsedJson = XLSX.utils.sheet_to_json(worksheet, { defval: null })                      // Convert the worksheet grid into an array of JavaScript objects. { defval: null } ensures empty cells are filled with `null` rather than missing keys
        resolve({ sheetNames, data: parsedJson })                                                     // Fulfill the promise returning both sheet tab metadata and the parsed row records
      } catch (err) {
        reject(new Error(`Excel Parsing Failed: ${err.message}`))
      }
    }

    // STEP 5: Read the Excel file as a raw binary ArrayBuffer (not plain text)
    reader.readAsArrayBuffer(file)
  })
}