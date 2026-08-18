<template>
  <div class="file-ingestion-hub">
    <!-- DROP ZONE -->
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
        <div class="upload-icon-wrapper">
          <span class="upload-icon">☁</span>
        </div>
        <h3>Drop data or database files here</h3>
        <p class="subtitle">Supports standard enterprise formats</p>
        <div class="format-badges">
          <span v-for="ext in formats" :key="ext" class="badge">.{{ ext }}</span>
        </div>
        <button type="button" class="browse-btn">Browse Local Files</button>
      </div>

      <div v-else class="loading-state">
        <div class="spinner"></div>
        <p class="loading-title">Analyzing and ingesting data stream...</p>
        <p class="loading-sub">Parsing schema structure and row records</p>
      </div>
    </div>

    <!-- AUTOMATED INGESTION ACTION BUTTONS -->
    <div class="auto-actions">
      <button type="button" class="action-card" @click="showAutoDetectModal = true">
        <div class="action-icon-box">
          <span class="action-icon">🔍</span>
        </div>
        <div class="text">
          <strong>Auto-Detect Local Databases</strong>
          <small>Scan system directories for .sqlite, .mdb & .dbf</small>
        </div>
      </button>

      <button type="button" class="action-card" @click="showServerConnectModal = true">
        <div class="action-icon-box">
          <span class="action-icon">🖥</span>
        </div>
        <div class="text">
          <strong>Connect to Database Server</strong>
          <small>Direct access for MySQL, PostgreSQL, MS SQL</small>
        </div>
      </button>
    </div>

    <!-- ERROR BANNER -->
    <div v-if="errorMessage" class="error-banner">
      <span class="error-icon">⚠️</span>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- AUTOMATED MODALS -->
    <AutoDetectModal 
      :is-open="showAutoDetectModal"
      @close="showAutoDetectModal = false"
      @file-selected="onAutoDetectFileSelected"
    />
    <ServerConnectModal
      :is-open="showServerConnectModal"
      @close="showServerConnectModal = false"
      @connect="onServerConnected"
    />

    <!-- ACTIVE FILE SUMMARY CARD -->
    <ActiveSummaryCard
      v-if="metaSummary.fileName && !isLoading"
      :meta-summary="metaSummary"
      :record-count="activeDataset.length"
      :header-count="activeHeaders.length"
      :available-sheets="availableSheets"
      :active-sheet-name="activeSheetName"
      :dataset="activeDataset"
      :headers="activeHeaders"
      @reset="handleReset"
      @sheet-change="onSheetChange"
    />

    <!-- SCHEMA SUMMARY CARD -->
    <SchemaSummaryCard
      v-if="activeHeaders.length > 0 && !isLoading"
      :dataset-name="datasetName"
      :headers="activeHeaders"
      :dataset="activeDataset"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'
import { parseFileByExtension } from '../utils/fileParserService.js'

import AutoDetectModal from '../modals/AutoDetectModal.vue'
import ServerConnectModal from '../modals/ServerConnectModal.vue'
import ActiveSummaryCard from './ActiveSummaryCard.vue'
import SchemaSummaryCard from './SchemaSummaryCard.vue'

const formats = ['csv', 'xlsx', 'json', 'sql', 'sqlite', 'xml', 'dbf']

const store = useWorkspaceStore()
const { loadDataset, resetWorkspace, metaSummary, availableSheets, activeSheetName } = store

const isDragging = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)
const currentRawFile = ref(null)

const showAutoDetectModal = ref(false)
const showServerConnectModal = ref(false)

const activeDataset = computed(() => {
  const ds = store.currentDataset
  if (!ds) return []
  return Array.isArray(ds) ? ds : (ds.value || [])
})

const activeHeaders = computed(() => {
  const hd = store.datasetHeaders
  if (!hd) return []
  return Array.isArray(hd) ? hd : (hd.value || [])
})

const datasetName = computed(() => {
  return store.metaSummary?.fileName || store.metaSummary?.value?.fileName || 'Connected Database'
})

onMounted(() => traceFlow(import.meta.url, 'onMounted Lifecycle Hook'))

function triggerFileInput() {
  if (fileInputRef.value) fileInputRef.value.click()
}

function handleDrop(e) {
  isDragging.value = false
  const files = e.dataTransfer.files
  if (files?.length) processFile(files[0])
}

function handleFileSelected(e) {
  const files = e.target.files
  if (files?.length) processFile(files[0])
}

async function processFile(file, selectedSheet = null) {
  errorMessage.value = ''
  isLoading.value = true
  currentRawFile.value = file

  try {
    const { dataset, ext, sheetNames } = await parseFileByExtension(file, selectedSheet)
    loadDataset(dataset, file.name, ext, sheetNames, file.size)
  } catch (err) {
    errorMessage.value = err.message || 'File parsing error.'
    traceFlow(import.meta.url, 'processFile() [ERROR]', { fileName: file.name, error: errorMessage.value })
  } finally {
    isLoading.value = false
  }
}

function onAutoDetectFileSelected(fileItem) {
  if (fileItem.file) {
    processFile(fileItem.file)
  } else {
    errorMessage.value = `Selected database file (${fileItem.name}) detected at: ${fileItem.path}`
  }
}

function onServerConnected(res) {
  if (res.data?.length) {
    loadDataset(res.data, `supabase_${res.tableName}`, 'postgres')
  }
}

function onSheetChange(targetSheet) {
  if (currentRawFile.value) processFile(currentRawFile.value, targetSheet)
}

function handleReset() {
  resetWorkspace()
  currentRawFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>

<style scoped>
.file-ingestion-hub{max-width:800px;margin:1.5rem auto;}
.drop-zone{position:relative;border-radius:300px;padding:2.5rem 1.5rem;text-align:center;background-color:#fff;transition:all .2s cubic-bezier(.4,0,.2,1);}
.drop-zone:hover{border-color:#6366f1;background-color:#f8fafc;}
.drop-zone.is-dragging{border-color:#4f46e5;background-color:#eef2ff;transform:scale(1.005);}
.hidden-file-input{display:none;}
.upload-icon-wrapper{width:52px;height:52px;margin:0 auto .75rem;background:#eef2ff;border-radius:50%;display:flex;align-items:center;justify-content:center;}
.upload-icon{font-size:24px;color:#4f46e5;line-height:1;}
.drop-zone-content h3{margin:0 0 .25rem;font-size:1.1rem;font-weight:600;color:#0f172a;}
.subtitle{color:#64748b;margin:0 0 1rem;font-size:.85rem;}
.format-badges{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;margin-bottom:1.25rem;}
.badge{background-color:#f1f5f9;color:#475569;font-size:.725rem;font-weight:600;padding:.15rem .5rem;border-radius:4px;border:1px solid #e2e8f0;}
.browse-btn{background-color:#4f46e5;color:#fff;border:none;padding:.55rem 1.25rem;border-radius:6px;font-weight:600;font-size:.85rem;cursor:pointer;transition:background-color .15s ease;box-shadow:0 1px 2px rgba(0,0,0,.05);}
.browse-btn:hover{background-color:#4338ca;}
.loading-state{padding:1rem 0;}
.spinner{width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#4f46e5;border-radius:50%;animation:spin .75s linear infinite;margin:0 auto .75rem;}
.loading-title{font-weight:600;color:#0f172a;margin:0 0 .25rem;font-size:.95rem;}
.loading-sub{color:#64748b;font-size:.8rem;margin:0;}
@keyframes spin{to{transform:rotate(360deg);}}
.auto-actions{display:grid;grid-template-columns:1fr 1fr;gap:.85rem;}
.action-card{display:flex;align-items:center;gap:.85rem;padding:1rem;background:#fff;border:1px solid #e2e8f0;border-radius:10px;text-align:left;cursor:pointer;transition:all .2s ease;box-shadow:0 1px 2px rgba(0,0,0,.03);}
.action-card:hover{border-color:#6366f1;box-shadow:0 4px 12px rgba(99,102,241,.06);transform:translateY(-1px);}
.action-icon-box{width:38px;height:38px;min-width:38px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;color:#475569;}
.action-card:hover .action-icon-box{background:#eef2ff;color:#4f46e5;border-color:#c7d2fe;}
.action-icon{font-size:16px;line-height:1;}
.action-card strong{display:block;font-size:.875rem;color:#0f172a;font-weight:600;}
.action-card small{display:block;font-size:.75rem;color:#64748b;margin-top:.15rem;}
.error-banner{margin-top:1.25rem;padding:.75rem 1rem;background-color:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;font-size:.85rem;display:flex;align-items:center;gap:.5rem;}
.error-icon{font-size:16px;line-height:1;}
</style>