<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-brand">
        <h1>Operational Intelligence Platform (OIP)</h1>
        <span class="badge">SaaS Mode</span>
      </div>
      <div class="toolbar">
        <button @click="handleRunDiagnostic" class="test-btn">Run Diagnostic Suite</button>
      </div>
    </header>

    <main class="workspace-main">
      <!-- PHASE 3: INGESTION HUB -->
      <FileIngestionHub />

      <!-- EXCEL HEADER REMINDER BANNER -->
      <div v-if="isExcelFile" class="excel-notice">
        <p><strong>Excel File Loaded:</strong> Ensure your active sheet uses the <strong>first row for headers</strong> (no blank top rows or titles) for clean field mapping.</p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { traceFlow } from './utils/flowTracer.js'
import { runDiagnostic } from './utils/testParser.js'
import { useWorkspaceStore } from './composables/useWorkspaceStore.js'

import FileIngestionHub from './components/FileIngestionHub.vue'
import DataGridPreview from './components/DataGridPreview.vue'

const workspaceStore = useWorkspaceStore()
const isGridModalOpen = ref(false)

const activeDataset = computed(() => {
  const ds = workspaceStore.currentDataset
  return (ds && ds.value) ? ds.value : (Array.isArray(ds) ? ds : [])
})

const datasetHeaders = computed(() => {
  const hd = workspaceStore.datasetHeaders
  return (hd && hd.value) ? hd.value : (Array.isArray(hd) ? hd : [])
})

const datasetName = computed(() => {
  return workspaceStore.metaSummary?.fileName || workspaceStore.metaSummary?.value?.fileName || 'Connected Database'
})

const fileType = computed(() => {
  return workspaceStore.metaSummary?.fileType || workspaceStore.metaSummary?.value?.fileType || ''
})

const isExcelFile = computed(() => {
  return fileType.value === 'xlsx' || fileType.value === 'xls'
})

traceFlow(import.meta.url, 'Script Setup Initialized')

onMounted(() => {
  traceFlow(import.meta.url, 'onMounted Lifecycle Hook')
})

function handleRunDiagnostic() {
  traceFlow(import.meta.url, 'handleRunDiagnostic()')
  runDiagnostic()
}

function openModal() {
  traceFlow(import.meta.url, 'openModal() [GRID_PREVIEW_OPENED]')
  isGridModalOpen.value = true
}

function closeModal() {
  traceFlow(import.meta.url, 'closeModal() [GRID_PREVIEW_CLOSED]')
  isGridModalOpen.value = false
}
</script>

<style scoped>
.app-container { width: 100%; min-height: 100vh; padding: 1.25rem; box-sizing: border-box; background: #f8fafc; }
.app-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
.header-brand { display: flex; align-items: center; gap: 0.75rem; }
.app-header h1 { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin: 0; }
.badge { background: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
.workspace-main { display: flex; flex-direction: column; gap: 1.25rem; width: 100%;}
.toolbar { display: flex; justify-content: flex-end; }
.test-btn { padding: 0.4rem 0.85rem; background: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background 0.2s; }
.test-btn:hover { background: #0369a1; }
.excel-notice { display: flex; align-items: center; gap: 0.65rem; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 0.65rem 1rem; font-size: 0.8rem; color: #854d0e; }
.excel-notice p { margin: 0; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15,23,42,0.65); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem; box-sizing: border-box; }
.modal-container { background: #fff; width: 100%; max-width: 1250px; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.modal-title-group { display: flex; align-items: center; gap: 0.75rem; }
.modal-header h2 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
.dataset-tag { background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
.close-modal-btn { background: transparent; border: none; font-size: 1.5rem; color: #64748b; cursor: pointer; padding: 0 0.5rem; line-height: 1; }
.close-modal-btn:hover { color: #0f172a; }
.modal-body { padding: 1.25rem; overflow-y: auto; flex: 1; }
</style>