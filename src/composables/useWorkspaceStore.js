import { ref, reactive } from 'vue'

/**
 * ============================================================================
 * GLOBAL REACTIVE STATE DECLARATION (Singleton Scope)
 * ============================================================================
 * State declared outside the factory function persists across components.
 */

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

/**
 * Custom Vue Composable for managing workspace state and data classification.
 * @returns {Object} Public reactive references and state mutators.
 */
export function useWorkspaceStore() {
  /**
   * Primary Ingestion Loader: Loads dataset array into global state and triggers sniffer.
   * @param {Array<Object>} payload - Array of row objects from parser.
   * @param {string} fileName - Discovered or original file name.
   * @param {string} fileType - Format label ('csv' | 'json' | 'xlsx').
   * @param {Array<string>} [sheets=[]] - Optional array of sheet names for Excel files.
   */
  function loadDataset(payload, fileName, fileType, sheets = []) {
    currentDataset.value = payload
    availableSheets.value = sheets
    activeSheetName.value = sheets.length > 0 ? sheets[0] : ''
    
    metaSummary.fileName = fileName
    metaSummary.fileType = fileType

    if (payload && payload.length > 0) {
      datasetHeaders.value = Object.keys(payload[0])
      autoInitializeMapping(payload[0])
    }
  }

  
  /**
   * Classification Sniffer Algorithm
   * Inspects sample row properties to automatically map columns into operational categories:
   * - 'ignore': Header key includes id, uuid, or pass
   * - 'metric': Property value is a number
   * - 'dimension': Standard text string / boolean
   */
  function autoInitializeMapping(sampleRow) {
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
  }

  /**
   * UI Manual Override Mutator
   * @param {string} header - Column key name.
   * @param {('dimension'|'metric'|'ignore')} role - New category assignment.
   */
  function updateColumnRole(header, role) {
    if (header in activeSchemaMapping) {
      activeSchemaMapping[header] = role
    }
  }

  /**
   * Flushes global session state clean.
   */
  function resetWorkspace() {
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
  }

  return {
    currentDataset,
    datasetHeaders,
    activeSchemaMapping,
    availableSheets,
    activeSheetName,
    metaSummary,
    loadDataset,
    updateColumnRole,
    resetWorkspace
  }
}