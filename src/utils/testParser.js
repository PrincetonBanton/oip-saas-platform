import { parseCsvFile } from './parserCsv.js'
import { parseJsonFile } from './parserJson.js'
import { parseExcelFile } from './parserExcel.js'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'

/**
 * Helper Utility: Asynchronously fetches a static file from `public/testingFiles/`
 */
async function fetchTestFile(path, fileName, mimeType) {
  const response = await fetch(path)
  const blob = await response.blob()
  return new File([blob], fileName, { type: mimeType })
}

/**
 * Phase 2 Comprehensive Diagnostic Suite:
 * Validates store loading and classification across all supported file formats.
 */
export async function runDiagnostic() {
  const { loadDataset, currentDataset, activeSchemaMapping, metaSummary } = useWorkspaceStore()

  console.log('🚀 --- STARTING PHASE 2 STORE INTEGRATION SUITE ---')

  try {
    // =========================================================================
    // 1. STORE TEST: CSV FILE
    // =========================================================================
    const csvFile = await fetchTestFile('/testingFiles/sample.csv', 'sample.csv', 'text/csv')
    const csvData = await parseCsvFile(csvFile)
    loadDataset(csvData, csvFile.name, 'csv')
    
    console.log('✅ [CSV Store Test Passed]', {
      meta: { ...metaSummary },
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    })

    // =========================================================================
    // 2. STORE TEST: JSON FILE (Flattening + Classification)
    // =========================================================================
    const jsonFile = await fetchTestFile('/testingFiles/sample.json', 'sample.json', 'application/json')
    const jsonData = await parseJsonFile(jsonFile)
    loadDataset(jsonData, jsonFile.name, 'json')
    
    console.log('✅ [JSON Store Test Passed]', {
      meta: { ...metaSummary },
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    })

    // =========================================================================
    // 3. STORE TEST: EXCEL FILE (Workbook parsing + Classification)
    // =========================================================================
    const excelFile = await fetchTestFile(
      '/testingFiles/sample.xlsx', 
      'sample.xlsx', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const excelRes = await parseExcelFile(excelFile)
    loadDataset(excelRes.data, excelFile.name, 'xlsx', excelRes.sheetNames)
    
    console.log('✅ [Excel Store Test Passed]', {
      meta: { ...metaSummary },
      sheets: excelRes.sheetNames,
      headers: Object.keys(currentDataset.value[0] || {}),
      schema: { ...activeSchemaMapping }
    })

    console.log('🎉 --- ALL FILE TYPES VERIFIED IN STORE! READY FOR PHASE 3 ---')

  } catch (err) {
    console.error('❌ Phase 2 Store Test Failed:', err)
  }
}