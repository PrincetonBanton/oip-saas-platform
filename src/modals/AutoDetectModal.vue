<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <div class="header-title">
          <span class="icon">🔍</span>
          <h3>Auto-Detect Local Databases</h3>
        </div>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <p class="description">
          Scan standard system folders or common application directories for embedded database files.
        </p>

        <!-- ENVIRONMENT NOTICE -->
        <div v-if="!isElectron" class="info-banner">
          🌐 <strong>Web Browser Mode:</strong> Due to browser security, selecting a preset will open a folder picker. Please select a non-system subfolder (e.g., <code>Documents</code> or <code>Desktop</code>).
        </div>

        <!-- PRESET PROFILE SELECTOR -->
        <div class="form-group">
          <label>Target Folder Directory / App Preset</label>
          <select v-model="selectedDirectory">
            <option value="documents">User Documents & Desktop</option>
            <option value="appdata">User AppData & LocalSettings (%APPDATA%)</option>
            <option value="programdata">Common ProgramData (%PROGRAMDATA%)</option>
            <option value="custom">Custom Folder Path...</option>
          </select>
        </div>

        <div v-if="selectedDirectory === 'custom' && isElectron" class="form-group">
          <input 
            type="text" 
            v-model="customPath" 
            placeholder="e.g. C:\Program Files (x86)\Legacy App\Data" 
            class="text-input"
          />
        </div>

        <!-- FILE FILTER CHECKBOXES -->
        <div class="form-group">
          <label>Database Formats to Detect</label>
          <div class="checkbox-grid">
            <label><input type="checkbox" v-model="filters.sqlite" /> SQLite / DB (.sqlite, .db)</label>
            <label><input type="checkbox" v-model="filters.dbf" /> dBASE / FoxPro (.dbf)</label>
            <label><input type="checkbox" v-model="filters.sql" /> SQL Dumps (.sql)</label>
            <label><input type="checkbox" v-model="filters.access" /> MS Access (.mdb, .accdb)</label>
          </div>
        </div>

        <!-- SCAN BUTTON & PROGRESS -->
        <button 
          class="scan-btn" 
          :disabled="isScanning" 
          @click="startScan"
        >
          <span v-if="!isScanning">🚀 Run System Scan</span>
          <span v-else>Scanning Local Directories...</span>
        </button>

        <!-- SCAN ERROR / WARNING MESSAGE -->
        <div v-if="scanError" class="scan-error">
          ⚠️ {{ scanError }}
        </div>

        <!-- DISCOVERED FILES RESULTS TABLE -->
        <div v-if="discoveredFiles.length > 0" class="results-container">
          <h4>Discovered Databases ({{ discoveredFiles.length }})</h4>
          <div class="results-list">
            <div 
              v-for="(item, idx) in discoveredFiles" 
              :key="idx" 
              class="result-item"
              :class="{ 'warning-item': item.isAccess }"
              @click="handleFileClick(item)"
            >
              <div class="file-info">
                <strong>
                  {{ item.name }}
                  <span v-if="item.isAccess" class="access-warning-text">(Requires Bridge)</span>
                </strong>
                <small>{{ item.path }} • {{ item.size }}</small>
              </div>
              <span class="badge" :class="item.type">{{ item.type.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- DIRECT ACCESS EXPORT PROCESS MODAL -->
    <AccessExportProcessModal
      :is-open="Boolean(selectedAccessFile)"
      :file="selectedAccessFile?.file"
      @close="selectedAccessFile = null"
      @processed="handleAccessProcessed"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'
import AccessExportProcessModal from './AccessExportProcessModal.vue'

traceFlow(import.meta.url, 'AutoDetectModal Module Loaded')

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'file-selected', 'processed'])

const isElectron = computed(() => {
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer'
})

const selectedDirectory = ref('documents')
const customPath = ref('')
const isScanning = ref(false)
const scanError = ref('')
const discoveredFiles = ref([])
const selectedAccessFile = ref(null)

const filters = reactive({
  sqlite: true,
  dbf: true,
  sql: true,
  access: true
})

onMounted(() => {
  traceFlow(import.meta.url, 'onMounted Lifecycle Hook', { isElectron: isElectron.value })
})

watch(() => props.isOpen, (newVal) => {
  traceFlow(import.meta.url, `Modal Visibility Changed: [${newVal ? 'OPEN' : 'CLOSED'}]`, {
    selectedDirectory: selectedDirectory.value,
    activeFilters: { ...filters }
  })
})

function close() {
  traceFlow(import.meta.url, 'close()')
  emit('close')
}

async function startScan() {
  scanError.value = ''
  discoveredFiles.value = []

  const activeExts = getActiveExtensions()
  traceFlow(import.meta.url, 'startScan() [START]', {
    isElectron: isElectron.value,
    selectedDirectory: selectedDirectory.value,
    customPath: customPath.value,
    activeExtensions: activeExts
  })

  if (isElectron.value) {
    runElectronScan()
  } else {
    runBrowserScan()
  }
}

async function runBrowserScan() {
  traceFlow(import.meta.url, 'runBrowserScan() [INITIATED]')

  if (!('showDirectoryPicker' in window)) {
    scanError.value = 'Directory scanning is not supported in this browser version. Please use Chrome, Edge, or Opera.'
    traceFlow(import.meta.url, 'runBrowserScan() [UNSUPPORTED_BROWSER]')
    return
  }

  try {
    const dirHandle = await window.showDirectoryPicker({ mode: 'read' })
    isScanning.value = true

    traceFlow(import.meta.url, 'runBrowserScan() [DIRECTORY_SELECTED]', {
      dirName: dirHandle.name
    })

    const allowedExtensions = getActiveExtensions()
    await scanDirectoryRecursive(dirHandle, dirHandle.name, allowedExtensions)

    traceFlow(import.meta.url, 'runBrowserScan() [COMPLETED]', {
      discoveredCount: discoveredFiles.value.length
    })

    if (discoveredFiles.value.length === 0) {
      scanError.value = 'No matching database files were found in the selected folder.'
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      traceFlow(import.meta.url, 'runBrowserScan() [USER_ABORTED]')
      return
    }
    
    if (err.name === 'NotAllowedError' || err.name === 'SecurityError' || err.message.includes('system')) {
      scanError.value = 'Cannot open protected system folders (%APPDATA% / %PROGRAMDATA%) in browser mode. Please select a user folder like Documents or Desktop.'
    } else {
      scanError.value = err.message || 'Failed to scan selected folder.'
    }

    traceFlow(import.meta.url, 'runBrowserScan() [ERROR]', {
      errorName: err.name,
      errorMessage: scanError.value
    })
  } finally {
    isScanning.value = false
  }
}

async function runElectronScan() {
  traceFlow(import.meta.url, 'runElectronScan() [STUB_EXECUTED]')
  isScanning.value = true
  setTimeout(() => {
    isScanning.value = false
    scanError.value = 'Electron IPC Bridge required for direct background system scans.'
    traceFlow(import.meta.url, 'runElectronScan() [STUB_COMPLETED]', { error: scanError.value })
  }, 1000)
}

async function scanDirectoryRecursive(dirHandle, currentPath, allowedExtensions) {
  traceFlow(import.meta.url, 'scanDirectoryRecursive() [ENTER_DIR]', { currentPath })

  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      const ext = entry.name.split('.').pop().toLowerCase()
      if (allowedExtensions.includes(ext)) {
        const fileObj = await entry.getFile()
        const isAccess = ext === 'mdb' || ext === 'accdb'
        
        const discoveredItem = {
          name: entry.name,
          path: `${currentPath}/${entry.name}`,
          size: formatBytes(fileObj.size),
          type: ext,
          isAccess,
          file: fileObj
        }

        discoveredFiles.value.push(discoveredItem)
        traceFlow(import.meta.url, 'scanDirectoryRecursive() [FILE_DISCOVERED]', {
          name: discoveredItem.name,
          type: discoveredItem.type,
          path: discoveredItem.path,
          size: discoveredItem.size
        })
      }
    } else if (entry.kind === 'directory') {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        try {
          await scanDirectoryRecursive(entry, `${currentPath}/${entry.name}`, allowedExtensions)
        } catch {
          traceFlow(import.meta.url, 'scanDirectoryRecursive() [SKIPPED_PROTECTED_DIR]', {
            path: `${currentPath}/${entry.name}`
          })
        }
      }
    }
  }
}

function getActiveExtensions() {
  const exts = []
  if (filters.sqlite) exts.push('sqlite', 'db')
  if (filters.dbf) exts.push('dbf')
  if (filters.sql) exts.push('sql')
  if (filters.access) exts.push('mdb', 'accdb')
  return exts
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function handleFileClick(item) {
  traceFlow(import.meta.url, 'handleFileClick()', {
    name: item.name,
    type: item.type,
    isAccess: item.isAccess
  })

  if (item.isAccess) {
    selectedAccessFile.value = item
    traceFlow(import.meta.url, 'Delegating directly to AccessExportProcessModal', { fileName: item.name })
  } else {
    emit('file-selected', item)
    close()
  }
}

function handleAccessProcessed(payload) {
  traceFlow(import.meta.url, 'handleAccessProcessed() - Emitting processed payload', payload)
  selectedAccessFile.value = null
  emit('processed', payload)
  close()
}
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-card { background: #ffffff; width: 100%; max-width: 580px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
.modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 0.5rem; }
.header-title h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }
.modal-body { padding: 1.25rem; }
.description { font-size: 0.85rem; color: #64748b; margin-top: 0; margin-bottom: 0.75rem; }
.info-banner { background: #f0f9ff; border: 1px solid #bae6fd; color: #0369a1; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.75rem; margin-bottom: 1rem; line-height: 1.4; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem; }
select, .text-input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; color: #0f172a; box-sizing: border-box; }
.checkbox-grid { display: flex; flex-wrap: wrap; gap: 0.75rem 1rem; font-size: 0.8rem; color: #475569; }
.scan-btn { width: 100%; padding: 0.65rem; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.scan-btn:hover { background: #0369a1; }
.scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.scan-error { margin-top: 0.75rem; color: #dc2626; font-size: 0.8rem; background: #fef2f2; padding: 0.65rem; border-radius: 6px; border: 1px solid #fecaca; line-height: 1.4; }
.results-container { margin-top: 1.25rem; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }
.results-container h4 { margin: 0 0 0.5rem; font-size: 0.85rem; color: #0f172a; }
.results-list { max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
.result-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.result-item:hover { border-color: #0284c7; background: #f0f9ff; }
.result-item.warning-item:hover { border-color: #d97706; background: #fffbeb; }
.file-info strong { display: block; font-size: 0.8rem; color: #0f172a; }
.file-info small { color: #64748b; font-size: 0.7rem; }
.access-warning-text { color: #b45309; font-size: 0.7rem; font-weight: normal; margin-left: 0.25rem; }
.badge { background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; }
.badge.mdb, .badge.accdb { background: #fef3c7; color: #92400e; }
</style>