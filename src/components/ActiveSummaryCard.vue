<template>
  <div class="file-meta-card">
    <!-- TOP HEADER BAR -->
    <div class="meta-header">
      <div class="file-title-group">
        <div class="file-icon-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="title-details">
          <div class="name-badge-row">
            <h4 :title="metaSummary.fileName">{{ metaSummary.fileName }}</h4>
            <span class="active-dot" title="Active Dataset"></span>
          </div>
          <span class="format-tag">{{ metaSummary.fileType?.toUpperCase() }}</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="view-grid-btn" @click="$emit('open-grid')">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M3 15h18"/>
            <path d="M9 3v18"/>
            <path d="M15 3v18"/>
          </svg>
          View Grid
        </button>
        <button class="reset-btn" @click="$emit('reset')" title="Clear Dataset">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
          Clear
        </button>
      </div>
    </div>
    
    <!-- METRICS + SHEET CONTROLS ROW -->
    <div class="meta-footer">
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
          <svg class="select-chevron" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metaSummary: { type: Object, required: true },
  recordCount: { type: Number, default: 0 },
  headerCount: { type: Number, default: 0 },
  missingRate: { type: Number, default: 0 },
  availableSheets: { type: Array, default: () => [] },
  activeSheetName: { type: String, default: '' }
})

defineEmits(['reset', 'sheet-change', 'open-grid'])

const formattedSize = computed(() => {
  const bytes = props.metaSummary.fileSize
  if (!bytes) return 'N/A'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
})
</script>

<style scoped>
.file-meta-card { margin-top: 1rem; padding: 0.875rem 1.125rem; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04); display: flex; flex-direction: column; gap: 0.75rem; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.meta-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.file-title-group { display: flex; align-items: center; gap: 0.65rem; min-width: 0; }
.file-icon-box { width: 34px; height: 34px; min-width: 34px; border-radius: 8px; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; display: flex; align-items: center; justify-content: center; }
.title-details { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
.name-badge-row { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
.title-details h4 { margin: 0; color: #0f172a; font-size: 0.875rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.active-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #22c55e; box-shadow: 0 0 0 2px rgba(34, 197, 94, 0.2); flex-shrink: 0; }
.format-tag { font-size: 0.685rem; font-weight: 700; color: #6366f1; letter-spacing: 0.03em; }
.header-actions { display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0; }
.view-grid-btn, .reset-btn { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: all 0.15s ease; }
.view-grid-btn { background: #4f46e5; border: 1px solid #4338ca; color: #ffffff; box-shadow: 0 1px 2px rgba(79, 70, 229, 0.2); }
.view-grid-btn:hover { background: #4338ca; }
.reset-btn { background: #ffffff; border: 1px solid #cbd5e1; color: #64748b; }
.reset-btn:hover { background-color: #f8fafc; color: #0f172a; border-color: #94a3b8; }
.meta-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.65rem; border-top: 1px solid #f1f5f9; gap: 1rem; }
.metrics-group { display: flex; align-items: center; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 0.25rem 0.65rem; border-radius: 6px; gap: 0.65rem; flex-wrap: wrap; }
.metric-pill { display: flex; align-items: center; gap: 0.35rem; }
.metric-pill .label { font-size: 0.7rem; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
.metric-pill .value { font-size: 0.775rem; color: #0f172a; font-weight: 700; font-variant-numeric: tabular-nums; }
.metric-pill .warning-text { color: #d97706; }
.metric-divider { width: 1px; height: 12px; background-color: #cbd5e1; }
.sheet-selector { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #64748b; font-weight: 500; }
.select-wrapper { position: relative; display: inline-flex; align-items: center; }
.select-wrapper select { appearance: none; padding: 0.25rem 1.5rem 0.25rem 0.55rem; border-radius: 6px; border: 1px solid #cbd5e1; background-color: #ffffff; color: #0f172a; font-size: 0.75rem; font-weight: 600; outline: none; cursor: pointer; transition: border-color 0.15s ease; }
.select-wrapper select:focus { border-color: #6366f1; }
.select-chevron { position: absolute; right: 0.45rem; color: #64748b; pointer-events: none; }
</style>