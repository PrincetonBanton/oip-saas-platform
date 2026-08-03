// STEP 1: Import the PapaParse library, which handles robust CSV/TSV parsing natively.
import Papa from 'papaparse'    

/**
 * Parses flat CSV or TSV files into an Array of JSON Objects using PapaParse.
 * * @param {File} file - The raw File object provided by a browser drag-and-drop or file picker input.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of parsed row objects.
 */

export function parseCsvFile(file) {

  // STEP 2: Wrap the asynchronous parsing process in a JavaScript Promise. This allows caller functions in our UI to use `await parseCsvFile(file)` cleanly.
  return new Promise((resolve, reject) => {

    // STEP 3: Invoke Papa.parse(), passing the raw File object and a configuration object.
    Papa.parse(file, {
      header: true,               // Config A: Treat row #1 as the object keys (column headers like "Category", "Yield_Kg").
      dynamicTyping: true,        // Config B: Auto-convert string numbers (e.g. "1200.5") into true JS numbers (1200.5).
      skipEmptyLines: true,       // Config C: Ignore trailing empty lines at the end of the file so they don't produce empty `{}` rows.      

      // STEP 4: Define the success callback when PapaParse finishes reading the entire stream.
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {          // If non-fatal warnings occur (e.g., mismatched delimiters), log them without crashing.
          console.warn('CSV Parsing Warnings:', results.errors)
        }
        resolve(results.data)                                       // Fulfill the promise and pass the clean array of JavaScript objects (`results.data`).
      },

      // STEP 5: Define the failure callback if a file read error or syntax break occurs.
      error: (err) => {
        reject(new Error(`CSV Parsing Failed: ${err.message}`))     // Reject the promise with a readable custom Error message.
      }
    })
  })
}