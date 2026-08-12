<template>
  <div class="file-ingestion-hub">
    <!-- PRIMARY DRAG & DROP ZONE -->
    <div 
      class="drop-zone"
      :class="{ 'is-dragging': isDragging, 'is-loading': isLoading }"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="triggerFileInput"
    >
      <input 
        type="file" 
        ref="fileInputRef" 
        class="hidden-file-input" 
        accept=".csv, .tsv, .xml, .json, .xlsx, .xls, .sql, .sqlite, .db, .dbf"
        @change="handleFileSelected"
      />

      <div v-if="!isLoading" class="drop-zone-content">
        <div class="upload-icon">📂</div>
        <h3>Drag & Drop Data or Database File</h3>
        <p class="subtitle">Supports <strong>.csv, .tsv, .xml, .xlsx, .json, .sql, .sqlite, .dbf</strong></p>
        <button type="button" class="browse-btn">Browse Local Files</button>
      </div>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p>Analyzing and ingesting data stream...</p>
      </div>
    </div>

    <!-- INGESTION METHOD SEPARATOR -->
    <div class="divider">
      <span>OR CHOOSE AN AUTOMATED INGESTION METHOD</span>
    </div>

    <!-- AUTOMATED INGESTION ACTION BUTTONS -->
    <div class="auto-actions">
      <button class="action-card" @click="showAutoDetectModal = true">
        <span class="icon">🔍</span>
        <div class="text">
          <strong>Auto-Detect Local Databases</strong>
          <small>Scan system folders for .sqlite, .mdb & .dbf</small>
        </div>
      </button>

      <button class="action-card" @click="handleServerConnect">
        <span class="icon">🔌</span>
        <div class="text">
          <strong>Connect to Database Server</strong>
          <small>MySQL, PostgreSQL, MS SQL Server</small>
        </div>
      </button>
    </div>

    <!-- ERROR BANNER -->
    <div v-if="errorMessage" class="error-banner">⚠️ {{ errorMessage }}</div>

    <!-- ACTIVE FILE SUMMARY CARD -->
    <div v-if="metaSummary.fileName && !isLoading" class="file-meta-card">
      <div class="meta-header">
        <h4>📄 Active Dataset: {{ metaSummary.fileName }}</h4>
        <button class="reset-btn" @click="handleReset">Clear & Replace</button>
      </div>
      <div class="meta-details">
        <span>Format: <strong>{{ metaSummary.fileType.toUpperCase() }}</strong></span>
        <span>Records: <strong>{{ currentDataset.length }} rows</strong></span>
        <span>Columns: <strong>{{ datasetHeaders.length }} headers</strong></span>
      </div>

      <div v-if="availableSheets.length > 1" class="sheet-selector">
        <label>Select Sheet Tab:</label>
        <select :value="activeSheetName" @change="onSheetChange">
          <option v-for="sheet in availableSheets" :key="sheet" :value="sheet">{{ sheet }}</option>
        </select>
      </div>
    </div>

    <!-- AUTO-DETECT MODAL -->
    <AutoDetectModal 
      :is-open="showAutoDetectModal"
      @close="showAutoDetectModal = false"
      @file-selected="onAutoDetectFileSelected"
    />

    <!-- SERVER CONNECT MODAL -->
    <ServerConnectModal
      :is-open="showServerConnectModal"
      @close="showServerConnectModal = false"
      @connect="onServerConnected"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'
import { parseCsvFile } from '../utils/parserCsv.js'
import { parseJsonFile } from '../utils/parserJson.js'
import { parseExcelFile } from '../utils/parserExcel.js'
import { parseSqlFile } from '../utils/parserSql.js'
import { parseDbfFile } from '../utils/parserDbf.js'
import { parseSqliteFile } from '../utils/parserSqlite.js'
import { parseXmlFile } from '../utils/parserXml.js'
import AutoDetectModal from '../modals/AutoDetectModal.vue'
import ServerConnectModal from '../modals/ServerConnectModal.vue'

// 1. Module Initialization
traceFlow(import.meta.url, 'Script Setup Initialized')

const { loadDataset, resetWorkspace, currentDataset, datasetHeaders, metaSummary, availableSheets, activeSheetName } = useWorkspaceStore()

const isDragging = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)
const currentRawFile = ref(null)

// Modal States
const showAutoDetectModal = ref(false)
const showServerConnectModal = ref(false)

onMounted(() => {
  traceFlow(import.meta.url, 'onMounted Lifecycle Hook')
})

function triggerFileInput() {
  traceFlow(import.meta.url, 'triggerFileInput()')
  if (fileInputRef.value) fileInputRef.value.click()
}

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  traceFlow(import.meta.url, 'handleDrop()', {
    fileCount: files?.length || 0,
    fileName: files[0]?.name || null
  })
  if (files && files.length > 0) processFile(files[0])
}

function handleFileSelected(e) {
  const files = e.target.files
  traceFlow(import.meta.url, 'handleFileSelected()', {
    fileCount: files?.length || 0,
    fileName: files[0]?.name || null
  })
  if (files && files.length > 0) processFile(files[0])
}

async function processFile(file, selectedSheet = null) {
  errorMessage.value = ''
  isLoading.value = true
  currentRawFile.value = file
  const ext = file.name.split('.').pop().toLowerCase()

  traceFlow(import.meta.url, 'processFile() [START]', {
    name: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    extension: ext,
    selectedSheet
  })

  try {
    let dataset = []
    let sheetNames = []

    if (ext === 'csv' || ext === 'tsv') {
      traceFlow(import.meta.url, 'Invoking parseCsvFile()', { fileName: file.name, extension: ext })
      dataset = await parseCsvFile(file)
      traceFlow(import.meta.url, 'parseCsvFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, ext)

    } else if (ext === 'xml') {
      traceFlow(import.meta.url, 'Invoking parseXmlFile()', { fileName: file.name })
      dataset = await parseXmlFile(file)
      traceFlow(import.meta.url, 'parseXmlFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, 'xml')

    } else if (ext === 'json') {
      traceFlow(import.meta.url, 'Invoking parseJsonFile()', { fileName: file.name })
      dataset = await parseJsonFile(file)
      traceFlow(import.meta.url, 'parseJsonFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, 'json')

    } else if (ext === 'xlsx' || ext === 'xls') {
      traceFlow(import.meta.url, 'Invoking parseExcelFile()', { fileName: file.name, selectedSheet })
      const res = await parseExcelFile(file, selectedSheet)
      dataset = res.data
      sheetNames = res.sheetNames
      traceFlow(import.meta.url, 'parseExcelFile() Completed', { recordCount: dataset?.length || 0, sheetNames })
      loadDataset(res.data, file.name, 'xlsx', res.sheetNames)

    } else if (ext === 'sql') {
      traceFlow(import.meta.url, 'Invoking parseSqlFile()', { fileName: file.name })
      dataset = await parseSqlFile(file)
      traceFlow(import.meta.url, 'parseSqlFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, 'sql')

    } else if (ext === 'dbf') {
      traceFlow(import.meta.url, 'Invoking parseDbfFile()', { fileName: file.name })
      dataset = await parseDbfFile(file)
      traceFlow(import.meta.url, 'parseDbfFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, 'dbf')

    } else if (ext === 'sqlite' || ext === 'db') {
      traceFlow(import.meta.url, 'Invoking parseSqliteFile()', { fileName: file.name })
      dataset = await parseSqliteFile(file)
      traceFlow(import.meta.url, 'parseSqliteFile() Completed', { recordCount: dataset?.length || 0 })
      loadDataset(dataset, file.name, 'sqlite')

    } else {
      traceFlow(import.meta.url, 'Unsupported file extension encountered', { extension: ext })
      throw new Error(`Unsupported format: .${ext}`)
    }

    traceFlow(import.meta.url, 'processFile() [SUCCESS]', {
      fileName: file.name,
      rowsParsed: dataset?.length || 0,
      detectedHeaders: dataset?.length > 0 ? Object.keys(dataset[0]) : [],
      sheets: sheetNames
    })
  } catch (err) {
    errorMessage.value = err.message || 'File parsing error.'
    traceFlow(import.meta.url, 'processFile() [ERROR]', {
      fileName: file.name,
      error: errorMessage.value
    })
  } finally {
    isLoading.value = false
  }
}

function onAutoDetectFileSelected(fileItem) {
  traceFlow(import.meta.url, 'onAutoDetectFileSelected()', fileItem)
  if (fileItem.file) {
    processFile(fileItem.file)
  } else {
    errorMessage.value = `Selected database file (${fileItem.name}) detected at: ${fileItem.path}`
  }
}

function handleServerConnect() {
  traceFlow(import.meta.url, 'handleServerConnect() - Opening connection modal')
  showServerConnectModal.value = true
}

function onServerConnected(res) {
  traceFlow(import.meta.url, 'onServerConnected() - Supabase table received', {
    table: res.tableName,
    rowCount: res.data?.length
  })

  if (res.data && res.data.length > 0) {
    loadDataset(res.data, `supabase_${res.tableName}`, 'postgres')
  }
}
function onSheetChange(e) {
  const targetSheet = e.target.value
  traceFlow(import.meta.url, 'onSheetChange()', {
    targetSheet,
    activeFile: currentRawFile.value?.name
  })
  if (currentRawFile.value) processFile(currentRawFile.value, targetSheet)
}

function handleReset() {
  traceFlow(import.meta.url, 'handleReset()', {
    clearedFile: metaSummary.value?.fileName || null
  })
  resetWorkspace()
  currentRawFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped>
.file-ingestion-hub { max-width: 800px; margin: 1rem auto; font-family: system-ui, -apple-system, sans-serif; background-color: lightgray; padding: 2rem; }
.drop-zone { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2rem 1.5rem; text-align: center; background-color: #f8fafc; cursor: pointer; transition: all 0.2s ease; }
.drop-zone:hover, .drop-zone.is-dragging { border-color: #0284c7; background-color: #f0f9ff; }
.hidden-file-input { display: none; }
.upload-icon { font-size: 2.5rem; margin-bottom: 0.25rem; }
.subtitle { color: #64748b; margin-bottom: 1rem; font-size: 0.85rem; }
.browse-btn { background-color: #0284c7; color: #fff; border: none; padding: 0.5rem 1.25rem; border-radius: 6px; font-weight: 700; cursor: pointer; }
.browse-btn:hover { background-color: #0369a1; }
.divider { display: flex; align-items: center; text-align: center; margin: 1.25rem 0; color: #94a3b8; font-size: 0.75rem; font-weight: 700; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
.divider span { padding: 0 0.75rem; }
.auto-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
.action-card { display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; text-align: left; cursor: pointer; transition: all 0.2s ease; }
.action-card:hover { border-color: #0284c7; background: #f0f9ff; }
.action-card .icon { font-size: 1.5rem; }
.action-card strong { display: block; font-size: 0.85rem; color: #0f172a; }
.action-card small { display: block; font-size: 0.75rem; color: #64748b; }
.error-banner { margin-top: 1rem; padding: 0.75rem 1rem; background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; font-size: 0.85rem; }
.file-meta-card { margin-top: 1rem; padding: 1rem; background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.meta-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.meta-header h4 { margin: 0; color: #1e293b; font-size: 0.95rem; }
.reset-btn { background: none; border: 1px solid #cbd5e1; padding: 0.25rem 0.5rem; border-radius: 4px; color: #64748b; cursor: pointer; font-size: 0.75rem; }
.reset-btn:hover { background-color: #f1f5f9; color: #0f172a; }
.meta-details { display: flex; gap: 1.25rem; font-size: 0.85rem; color: #475569; }
.sheet-selector { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid #f1f5f9; display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
.spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #0284c7; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 0.5rem; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>