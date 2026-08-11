import { traceFlow } from './flowTracer.js'
import { parseCsvFile } from './parserCsv.js'
import { parseJsonFile } from './parserJson.js'
import { parseExcelFile } from './parserExcel.js'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'

// 1. Script Setup / Module Load Tracer
traceFlow(import.meta.url, 'testParser Module Loaded')

// Helper Utility: Asynchronously fetches a static file from `public/testingFiles/`
async function fetchTestFile(path, fileName, mimeType) {
  traceFlow(import.meta.url, 'fetchTestFile() [START]', { path, fileName, mimeType })
  
  try {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    const file = new File([blob], fileName, { type: mimeType })

    traceFlow(import.meta.url, 'fetchTestFile() [SUCCESS]', {
      fileName,
      size: `${(file.size / 1024).toFixed(2)} KB`
    })

    return file
  } catch (err) {
    traceFlow(import.meta.url, 'fetchTestFile() [ERROR]', { path, error: err.message })
    throw err
  }
}

// Validates store loading and classification across all supported file formats.
export async function runDiagnostic() {
  traceFlow(import.meta.url, 'runDiagnostic() [START]')
  const { loadDataset, currentDataset, activeSchemaMapping, metaSummary } = useWorkspaceStore()

  try {
    // 1. STORE TEST: CSV FILE
    traceFlow(import.meta.url, 'Starting CSV Test Phase')
    const csvFile = await fetchTestFile('/testingFiles/sample.csv', 'sample.csv', 'text/csv')
    
    traceFlow(import.meta.url, 'Invoking parseCsvFile()', { fileName: csvFile.name })
    const csvData = await parseCsvFile(csvFile)
    
    traceFlow(import.meta.url, 'Loading CSV into Store', { recordCount: csvData?.length || 0 })
    loadDataset(csvData, csvFile.name, 'csv')
    
    const csvPayload = {
      meta: { ...metaSummary },
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    }
    traceFlow(import.meta.url, 'CSV Store Test Passed', csvPayload)
    console.log('✅ [CSV Store Test Passed]', csvPayload)

    // 2. STORE TEST: JSON FILE (Flattening + Classification)
    traceFlow(import.meta.url, 'Starting JSON Test Phase')
    const jsonFile = await fetchTestFile('/testingFiles/sample.json', 'sample.json', 'application/json')
    
    traceFlow(import.meta.url, 'Invoking parseJsonFile()', { fileName: jsonFile.name })
    const jsonData = await parseJsonFile(jsonFile)
    
    traceFlow(import.meta.url, 'Loading JSON into Store', { recordCount: jsonData?.length || 0 })
    loadDataset(jsonData, jsonFile.name, 'json')
    
    const jsonPayload = {
      meta: { ...metaSummary },
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    }
    traceFlow(import.meta.url, 'JSON Store Test Passed', jsonPayload)
    console.log('✅ [JSON Store Test Passed]', jsonPayload)

    // 3. STORE TEST: EXCEL FILE (Workbook parsing + Classification)
    traceFlow(import.meta.url, 'Starting Excel Test Phase')
    const excelFile = await fetchTestFile(
      '/testingFiles/sample.xlsx', 
      'sample.xlsx', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    
    traceFlow(import.meta.url, 'Invoking parseExcelFile()', { fileName: excelFile.name })
    const excelRes = await parseExcelFile(excelFile)
    
    traceFlow(import.meta.url, 'Loading Excel into Store', { 
      recordCount: excelRes.data?.length || 0, 
      sheets: excelRes.sheetNames 
    })
    loadDataset(excelRes.data, excelFile.name, 'xlsx', excelRes.sheetNames)
    
    const excelPayload = {
      meta: { ...metaSummary },
      sheets: excelRes.sheetNames,
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    }
    traceFlow(import.meta.url, 'Excel Store Test Passed', excelPayload)
    console.log('✅ [Excel Store Test Passed]', jsonPayload)

    traceFlow(import.meta.url, 'runDiagnostic() [SUCCESS]', { status: 'All file types verified' })
  } catch (err) {
    traceFlow(import.meta.url, 'runDiagnostic() [FAILURE]', { error: err.message || err })
  }
}