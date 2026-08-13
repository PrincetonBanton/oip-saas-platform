import { ref, reactive, computed } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'

// Module-level initialization trace
traceFlow(import.meta.url, 'useWorkspaceStore Module Loaded')

const currentDataset = ref([])             // Raw array of flat row objects parsed from file e.g., [{ Crop: 'Rice', Harvest_Tons: 42.5 }]
const datasetHeaders = ref([])             // Dynamic list of column header keys extracted from dataset e.g., ['Crop', 'Harvest_Tons', 'Location']
const activeSchemaMapping = reactive({})   // Dynamic column role dictionary e.g., { Crop: 'dimension', Harvest_Tons: 'metric', Farm_ID: 'ignore' }
const availableSheets = ref([])            // List of workbook sheet tab names if parsed from Excel e.g., ['Sheet1', 'Q1_Sales', 'Settings']
const activeSheetName = ref('')            // Currently active sheet tab name selected by user e.g., 'Sheet1'

const metaSummary = reactive({             // Global active file metadata container
  fileName: '',                            // Name of loaded file e.g., 'sample.csv'
  fileType: '',                            // Format type e.g., 'csv' | 'json' | 'xlsx'
  fileSize: 0                              // File size in bytes e.g., 1024
})

// Custom Vue Composable for managing workspace state and data classification.
export function useWorkspaceStore() {

  /**
   * Primary Ingestion Loader: Loads dataset array into global state and triggers sniffer.
   * @param {Array<Object>} payload - Array of row objects from parser.
   * @param {string} fileName - Discovered or original file name.
   * @param {string} fileType - Format label ('csv' | 'json' | 'xlsx').
   * @param {Array<string>} [sheets=[]] - Optional array of sheet names for Excel files.
   * @param {number} [fileSize=0] - Size of the file in bytes.
   */
  function loadDataset(payload, fileName, fileType, sheets = [], fileSize = 0) {
    traceFlow(import.meta.url, 'loadDataset() [START]', {
      fileName,
      fileType,
      fileSize,
      recordCount: payload?.length || 0,
      sheetsCount: sheets.length
    })

    currentDataset.value = payload
    availableSheets.value = sheets
    activeSheetName.value = sheets.length > 0 ? sheets[0] : ''
    
    metaSummary.fileName = fileName
    metaSummary.fileType = fileType
    metaSummary.fileSize = fileSize

    if (payload && payload.length > 0) {
      datasetHeaders.value = Object.keys(payload[0])
      autoInitializeMapping(payload[0])
    } else {
      datasetHeaders.value = []
      traceFlow(import.meta.url, 'loadDataset() [EMPTY_PAYLOAD]', { fileName })
    }

    traceFlow(import.meta.url, 'loadDataset() [COMPLETED]', {
      metaSummary: { ...metaSummary },
      headersCount: datasetHeaders.value.length,
      activeSheet: activeSheetName.value,
      schemaMapping: { ...activeSchemaMapping }
    })
  }

  /**
   * Cached missing data percentage calculation.
   * Audits dataset cells for null, undefined, or empty string values.
   */
  const missingRate = computed(() => {
    const rows = currentDataset.value
    const headers = datasetHeaders.value

    if (!rows.length || !headers.length) return 0

    const totalCells = rows.length * headers.length
    let emptyCells = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      for (let j = 0; j < headers.length; j++) {
        const val = row[headers[j]]
        if (val === null || val === undefined || val === '') {
          emptyCells++
        }
      }
    }

    return Number(((emptyCells / totalCells) * 100).toFixed(1))
  })
  
  /**
   * Classification Sniffer Algorithm
   * Inspects sample row properties to automatically map columns into operational categories:
   * - 'ignore': Header key includes id, uuid, or pass
   * - 'metric': Property value is a number
   * - 'dimension': Standard text string / boolean
   */
  function autoInitializeMapping(sampleRow) {
    traceFlow(import.meta.url, 'autoInitializeMapping() [START]', { sampleKeys: Object.keys(sampleRow) })

    for (const key in activeSchemaMapping) {
      delete activeSchemaMapping[key]
    }

    Object.keys(sampleRow).forEach(key => {
      const value = sampleRow[key]
      const lowerKey = key.toLowerCase()

      if (lowerKey.includes('id') || lowerKey.includes('uuid') || lowerKey.includes('pass')) {
        activeSchemaMapping[key] = 'ignore'
      } else if (typeof value === 'number') {
        activeSchemaMapping[key] = 'metric'
      } else {
        activeSchemaMapping[key] = 'dimension'
      }
    })

    traceFlow(import.meta.url, 'autoInitializeMapping() [COMPLETED]', { ...activeSchemaMapping })
  }

  /**
   * UI Manual Override Mutator
   * @param {string} header - Column key name.
   * @param {('dimension'|'metric'|'ignore')} role - New category assignment.
   */
  function updateColumnRole(header, role) {
    const previousRole = activeSchemaMapping[header]

    if (header in activeSchemaMapping) {
      activeSchemaMapping[header] = role
      traceFlow(import.meta.url, 'updateColumnRole() [MUTATED]', {
        header,
        previousRole,
        newRole: role
      })
    } else {
      traceFlow(import.meta.url, 'updateColumnRole() [HEADER_NOT_FOUND]', { header, role })
    }
  }
  
  function resetWorkspace() {
    traceFlow(import.meta.url, 'resetWorkspace() [START]', {
      clearedFile: metaSummary.fileName
    })

    currentDataset.value = []
    datasetHeaders.value = []
    availableSheets.value = []
    activeSheetName.value = ''
    metaSummary.fileName = ''
    metaSummary.fileType = ''
    metaSummary.fileSize = 0

    for (const key in activeSchemaMapping) {
      delete activeSchemaMapping[key]
    }

    traceFlow(import.meta.url, 'resetWorkspace() [COMPLETED]')
  }

  return {
    currentDataset,
    datasetHeaders,
    activeSchemaMapping,
    availableSheets,
    activeSheetName,
    metaSummary,
    missingRate,
    loadDataset,
    updateColumnRole,
    resetWorkspace
  }
}