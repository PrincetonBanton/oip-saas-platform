<template>
  <div class="file-meta-card">
    <!-- TOP HEADER BAR -->
    <div class="card-header">
      <div class="header-title-group">
        <div>
          <h3 class="card-title">Dataset Details</h3>
          <p class="card-subtitle">Overview of current file metrics and dataset structure</p>
        </div>
      </div>

      <div class="header-actions">
        <button class="view-grid-btn" @click="isGridModalOpen = true">
          View Grid
        </button>
        <button class="reset-btn" @click="$emit('reset')" title="Clear Dataset">
          Clear
        </button>
      </div>
    </div>
    
    <!-- METRICS + SHEET CONTROLS ROW -->
    <div class="meta-footer">
      <div class="file-info-group">
        <!-- SEPARATE FILENAME PILL -->
        <div class="file-title-pill">
          <div class="file-icon-box">
            <span class="file-symbol">📄</span>
          </div>
          <div class="title-details">
            <h4 :title="metaSummary.fileName">{{ metaSummary.fileName }}</h4>
            <span class="active-dot" title="Active Dataset"></span>
          </div>
        </div>

        <!-- SEPARATE FORMAT TYPE PILL -->
        <div v-if="metaSummary.fileType" class="format-pill">
          <span class="format-label">Type</span>
          <span class="format-tag">{{ metaSummary.fileType?.toUpperCase() }}</span>
        </div>
      </div>

      <div class="metrics-group">
        <div class="metric-pill">
          <span class="label">Rows</span>
          <span class="value">{{ recordCount.toLocaleString() }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-pill">
          <span class="label">Cols</span>
          <span class="value">{{ headerCount }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-pill">
          <span class="label">Size</span>
          <span class="value">{{ formattedSize }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-pill">
          <span class="label">Missing</span>
          <span class="value" :class="{ 'warning-text': missingRate > 5 }">{{ missingRate }}%</span>
        </div>
      </div>

      <div v-if="availableSheets.length > 1" class="sheet-selector">
        <label for="sheet-select">Sheet:</label>
        <div class="select-wrapper">
          <select id="sheet-select" :value="activeSheetName" @change="$emit('sheet-change', $event.target.value)">
            <option v-for="sheet in availableSheets" :key="sheet" :value="sheet">{{ sheet }}</option>
          </select>
          <span class="select-chevron">▾</span>
        </div>
      </div>
    </div>

    <!-- DATA GRID PREVIEW MODAL -->
    <Teleport to="body">
      <div v-if="isGridModalOpen" class="modal-backdrop" @click.self="isGridModalOpen = false">
        <div class="modal-container">
          <header class="modal-header">
            <div class="modal-title-group">
              <h2>Active Dataset Workspace</h2>
              <span class="dataset-tag">{{ metaSummary.fileName || 'Connected Database' }}</span>
            </div>
            <button @click="isGridModalOpen = false" class="close-modal-btn" aria-label="Close Modal">&times;</button>
          </header>

          <div class="modal-body">
            <DataGridPreview :dataset="dataset" :headers="headers" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import DataGridPreview from './DataGridPreview.vue'

const props = defineProps({
  metaSummary: { type: Object, required: true },
  recordCount: { type: Number, default: 0 },
  headerCount: { type: Number, default: 0 },
  missingRate: { type: Number, default: 0 },
  availableSheets: { type: Array, default: () => [] },
  activeSheetName: { type: String, default: '' },
  dataset: { type: Array, default: () => [] },
  headers: { type: Array, default: () => [] }
})

defineEmits(['reset', 'sheet-change'])

const isGridModalOpen = ref(false)

const formattedSize = computed(() => {
  const bytes = props.metaSummary.fileSize
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})
</script>

<style scoped>
.file-meta-card { margin-top: 1rem; padding: 0.875rem 1.125rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(15,23,42,0.04); display: flex; flex-direction: column; gap: 0.75rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 0.85rem; flex-wrap: wrap; }
.header-title-group { display: flex; align-items: center; gap: 0.75rem; }
.card-title { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; line-height: 1.2; }
.card-subtitle { margin: 0.15rem 0 0 0; font-size: 0.775rem; color: #64748b; line-height: 1.2; }
.header-actions { display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0; }
.view-grid-btn, .reset-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.view-grid-btn { background: #4f46e5; border: 1px solid #4338ca; color: #fff; box-shadow: 0 1px 2px rgba(79,72,229,0.2); }
.view-grid-btn:hover { background: #4338ca; }
.reset-btn { background: #fff; border: 1px solid #cbd5e1; color: #64748b; }
.reset-btn:hover { background-color: #f8fafc; color: #0f172a; border-color: #94a3b8; }
.meta-footer { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.file-info-group { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; min-width: 0; }
.file-title-pill { display: flex; align-items: center; gap: 0.5rem; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 0.25rem 0.65rem; border-radius: 6px; min-width: 0; }
.file-icon-box { display: flex; align-items: center; justify-content: center; }
.file-symbol { font-size: 0.875rem; line-height: 1; }
.title-details { display: flex; align-items: center; gap: 0.35rem; min-width: 0; }
.title-details h4 { margin: 0; color: #0f172a; font-size: 0.775rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.active-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.2); flex-shrink: 0; }
.format-pill { display: flex; align-items: center; gap: 0.35rem; background-color: #eef2ff; border: 1px solid #c7d2fe; padding: 0.25rem 0.55rem; border-radius: 6px; flex-shrink: 0; }
.format-label { font-size: 0.7rem; color: #6366f1; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
.format-tag { font-size: 0.775rem; font-weight: 700; color: #4338ca; }
.metrics-group { display: flex; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 0.25rem 0.65rem; border-radius: 6px; gap: 0.65rem; flex-wrap: wrap; }
.metric-pill { display: flex; align-items: center; gap: 0.35rem; }
.metric-pill .label { font-size: 0.7rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
.metric-pill .value { font-size: 0.775rem; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums; }
.metric-pill .warning-text { color: #d97706; }
.metric-divider { width: 1px; height: 12px; background-color: #cbd5e1; }
.sheet-selector { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #64748b; font-weight: 500; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select-wrapper select { appearance: none; padding: 0.25rem 1.4rem 0.25rem 0.55rem; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #fff; color: #0f172a; font-size: 0.75rem; font-weight: 600; outline: none; cursor: pointer; transition: border-color 0.15s ease; }
.select-wrapper select:focus { border-color: #6366f1; }
.select-chevron { position: absolute; right: 0.45rem; color: #64748b; pointer-events: none; font-size: 0.65rem; line-height: 1; }
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