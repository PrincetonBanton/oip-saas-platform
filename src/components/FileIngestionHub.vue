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
          <svg class="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
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

    <!-- INGESTION METHOD SEPARATOR -->
    <div class="divider">
      <span>OR CHOOSE AN AUTOMATED INGESTION METHOD</span>
    </div>

    <!-- AUTOMATED INGESTION ACTION BUTTONS -->
    <div class="auto-actions">
      <button class="action-card" @click="showAutoDetectModal = true">
        <div class="action-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div class="text">
          <strong>Auto-Detect Local Databases</strong>
          <small>Scan system directories for .sqlite, .mdb & .dbf</small>
        </div>
      </button>

      <button class="action-card" @click="showServerConnectModal = true">
        <div class="action-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        </div>
        <div class="text">
          <strong>Connect to Database Server</strong>
          <small>Direct access for MySQL, PostgreSQL, MS SQL</small>
        </div>
      </button>
    </div>

    <!-- ERROR BANNER -->
    <div v-if="errorMessage" class="error-banner">
      <svg class="error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- ACTIVE FILE SUMMARY CARD -->
    <ActiveSummaryCard
      v-if="metaSummary.fileName && !isLoading"
      :meta-summary="metaSummary"
      :record-count="currentDataset.length"
      :header-count="datasetHeaders.length"
      :available-sheets="availableSheets"
      :active-sheet-name="activeSheetName"
      @reset="handleReset"
      @sheet-change="onSheetChange"
      @open-grid="$emit('open-grid')"
    />

    <SchemaMappingMatrix v-if="datasetHeaders.length > 0 && !isLoading" />

    <!-- MODALS -->
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'
import { parseFileByExtension } from '../utils/fileParserService.js'
import AutoDetectModal from '../modals/AutoDetectModal.vue'
import ServerConnectModal from '../modals/ServerConnectModal.vue'

import ActiveSummaryCard from './ActiveSummaryCard.vue'
import SchemaMappingMatrix from './SchemaMappingMatrix.vue'

defineEmits(['open-grid'])

const formats = ['csv', 'xlsx', 'json', 'sql', 'sqlite', 'xml', 'dbf']

const { loadDataset, resetWorkspace, currentDataset, datasetHeaders, metaSummary, availableSheets, activeSheetName } = useWorkspaceStore()

const isDragging = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const fileInputRef = ref(null)
const currentRawFile = ref(null)

const showAutoDetectModal = ref(false)
const showServerConnectModal = ref(false)

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
    // Pass file.size as the 5th parameter to store it in metaSummary
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
.file-ingestion-hub { max-width: 800px; margin: 1.5rem auto; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; }
.drop-zone { position: relative; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 2.5rem 1.5rem; text-align: center; background-color: #ffffff; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02); }
.drop-zone:hover { border-color: #6366f1; background-color: #f8fafc; }
.drop-zone.is-dragging { border-color: #4f46e5; background-color: #eef2ff; transform: scale(1.005); }
.hidden-file-input { display: none; }
.upload-icon-wrapper { width: 52px; height: 52px; margin: 0 auto 0.75rem; background: #eef2ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.upload-icon { width: 28px; height: 28px; color: #4f46e5; }
.drop-zone-content h3 { margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: #0f172a; }
.subtitle { color: #64748b; margin: 0 0 1rem 0; font-size: 0.85rem; }
.format-badges { display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin-bottom: 1.25rem; }
.badge { background-color: #f1f5f9; color: #475569; font-size: 0.725rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid #e2e8f0; }
.browse-btn { background-color: #4f46e5; color: #ffffff; border: none; padding: 0.55rem 1.25rem; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background-color 0.15s ease; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
.browse-btn:hover { background-color: #4338ca; }
.loading-state { padding: 1rem 0; }
.spinner { width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.75s linear infinite; margin: 0 auto 0.75rem; }
.loading-title { font-weight: 600; color: #0f172a; margin: 0 0 0.25rem 0; font-size: 0.95rem; }
.loading-sub { color: #64748b; font-size: 0.8rem; margin: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.divider { display: flex; align-items: center; text-align: center; margin: 1.5rem 0; color: #94a3b8; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid #e2e8f0; }
.divider span { padding: 0 1rem; }
.auto-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }
.action-card { display: flex; align-items: center; gap: 0.85rem; padding: 1rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; text-align: left; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03); }
.action-card:hover { border-color: #6366f1; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.06); transform: translateY(-1px); }
.action-icon-box { width: 38px; height: 38px; min-width: 38px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; color: #475569; }
.action-card:hover .action-icon-box { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }
.action-icon-box svg { width: 20px; height: 20px; }
.action-card strong { display: block; font-size: 0.875rem; color: #0f172a; font-weight: 600; }
.action-card small { display: block; font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }
.error-banner { margin-top: 1.25rem; padding: 0.75rem 1rem; background-color: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; }
.error-icon { width: 18px; height: 18px; min-width: 18px; color: #dc2626; }
</style>