/**
 * Main Utility: Reads a raw JSON file, parses its text contents, and flattens all rows.
 * @param {File} file - Raw JSON File object from an upload or drop zone.
 * @returns {Promise<Array<Object>>} A Promise that resolves to an array of flat objects.
 */
export function parseJsonFile(file) {
  // STEP 1: Wrap the asynchronous file read in a Promise for smooth `await` usage in UI
  return new Promise((resolve, reject) => {

    // STEP 2: Use the browser's native FileReader API to read disk data
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('JSON File reading failed.'))     // Handle unexpected disk/read failures

    // STEP 3: Triggered automatically when the FileReader finishes reading the text
    reader.onload = (e) => {
      try {
       
        const raw = JSON.parse(e.target.result)                           // Convert the raw string into actual JavaScript objects/arrays
        const arrayData = Array.isArray(raw) ? raw : [raw]                // Ensure payload is an array (if a user uploads a single object `{...}`, wrap it in `[...]`)
        const flattenedData = arrayData.map(item => flattenObject(item))  // Map through every row item in the array and flatten its nested objects
        resolve(flattenedData)                                            // Fulfill the promise returning the flat array
      } catch (err) {
        reject(new Error(`JSON Parsing Failed: ${err.message}`))          // Catch invalid JSON syntax errors (e.g. malformed braces or quotes)
      }
    }

    // STEP 4: Tell the reader to begin reading the file as plain text
    reader.readAsText(file)
  })
}

/**
 * Helper Utility: Recursively flattens a deeply nested object into a single-level object using dot notation.
 * @param {Object} obj - The current nested object node to inspect.
 * @param {String} parentKey - Accumulated key path (e.g., 'location.farm').
 * @param {Object} res - The single-level accumulator object where flat key-values are stored.
 * @returns {Object} A single-level object with dot-notation keys.
 */
export function flattenObject(obj, parentKey = '', res = {}) {
  // STEP 1: Loop over every key in the object
  for (let key in obj) {
    
  if (Object.prototype.hasOwnProperty.call(obj, key)) {                                 // Ensure we are inspecting actual properties of the object, not prototype properties

      // STEP 2: Build the full dot-notation key (e.g. parent "metrics" + key "yield" = "metrics.yield")
      const propName = parentKey ? `${parentKey}.${key}` : key

      // STEP 3: Check if the property value is another nested object (and not null or an array)
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        flattenObject(obj[key], propName, res)                                          // RECURSION: Function calls itself to drill deeper into the child object!
      } else {
        // BASE CASE: If it's a primitive value (string, number, boolean) or an array, save it to `res`
        res[propName] = Array.isArray(obj[key]) ? JSON.stringify(obj[key]) : obj[key]   // Arrays are stringified so they don't break simple tabular inputs
      }
    }
  }
  return res
}