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
          Scan standard system folders and common application data directories for embedded database files.
        </p>

        <!-- PRESET PROFILE SELECTOR -->
        <div class="form-group">
          <label>Target Folder Directory / App Preset</label>
          <select v-model="selectedDirectory">
            <option value="appdata">User AppData & LocalSettings (%APPDATA%)</option>
            <option value="documents">User Documents & Desktop</option>
            <option value="programdata">Common ProgramData (%PROGRAMDATA%)</option>
            <option value="custom">Custom Folder Path...</option>
          </select>
        </div>

        <div v-if="selectedDirectory === 'custom'" class="form-group">
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
            <label><input type="checkbox" v-model="filters.sqlite" /> SQLite (.sqlite, .db)</label>
            <label><input type="checkbox" v-model="filters.dbf" /> dBASE / FoxPro (.dbf)</label>
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
          <span v-else>Scanning System Directories...</span>
        </button>

        <!-- DISCOVERED FILES RESULTS TABLE -->
        <div v-if="discoveredFiles.length > 0" class="results-container">
          <h4>Discovered Databases ({{ discoveredFiles.length }})</h4>
          <div class="results-list">
            <div 
              v-for="(item, idx) in discoveredFiles" 
              :key="idx" 
              class="result-item"
              @click="selectDiscoveredFile(item)"
            >
              <div class="file-info">
                <strong>{{ item.name }}</strong>
                <small>{{ item.path }} • {{ item.size }}</small>
              </div>
              <span class="badge">{{ item.type.toUpperCase() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'file-selected'])

const selectedDirectory = ref('appdata')
const customPath = ref('')
const isScanning = ref(false)
const discoveredFiles = ref([])

const filters = reactive({
  sqlite: true,
  dbf: true,
  access: true
})

function close() {
  emit('close')
}

async function startScan() {
  isScanning.value = true
  discoveredFiles.value = []

  // Mocked filesystem scan response for web execution
  setTimeout(() => {
    const mockResults = []

    if (filters.sqlite) {
      mockResults.push({ name: 'app_cache.sqlite', path: 'C:\\Users\\AppData\\Local\\App\\app_cache.sqlite', type: 'sqlite', size: '2.4 MB' })
      mockResults.push({ name: 'store_v2.db', path: 'C:\\Users\\Documents\\store_v2.db', type: 'sqlite', size: '512 KB' })
    }
    if (filters.dbf) {
      mockResults.push({ name: 'CLIENTS.DBF', path: 'C:\\ProgramData\\LegacyPOS\\CLIENTS.DBF', type: 'dbf', size: '1.1 MB' })
    }
    if (filters.access) {
      mockResults.push({ name: 'inventory_2024.mdb', path: 'C:\\Users\\Documents\\inventory_2024.mdb', type: 'mdb', size: '14.8 MB' })
    }

    discoveredFiles.value = mockResults
    isScanning.value = false
  }, 1200)
}

function selectDiscoveredFile(fileItem) {
  emit('file-selected', fileItem)
  close()
}
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 999; }
.modal-card { background: #ffffff; width: 100%; max-width: 550px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
.modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.header-title { display: flex; align-items: center; gap: 0.5rem; }
.header-title h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }
.modal-body { padding: 1.25rem; }
.description { font-size: 0.85rem; color: #64748b; margin-top: 0; margin-bottom: 1rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; font-size: 0.8rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem; }
select, .text-input { width: 100%; padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; }
.checkbox-grid { display: flex; gap: 1rem; font-size: 0.8rem; color: #475569; }
.scan-btn { width: 100%; padding: 0.65rem; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.scan-btn:hover { background: #0369a1; }
.scan-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.results-container { margin-top: 1.25rem; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; }
.results-container h4 { margin: 0 0 0.5rem; font-size: 0.85rem; color: #0f172a; }
.results-list { max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem; }
.result-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.result-item:hover { border-color: #0284c7; background: #f0f9ff; }
.file-info strong { display: block; font-size: 0.8rem; color: #0f172a; }
.file-info small { color: #64748b; font-size: 0.7rem; }
.badge { background: #e0f2fe; color: #0369a1; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; }
</style>