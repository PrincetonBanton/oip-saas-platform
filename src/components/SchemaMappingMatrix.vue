<template>
  <div class="schema-mapping-matrix">
    <div class="table-wrapper">
      <table class="matrix-table">
        <thead>
          <tr>
            <th>Field Name</th>
            <th>Detected Data Type</th>
            <th>Sample Value</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(col, index) in normalizedHeaders" :key="col.key || index">
            <!-- FIELD NAME -->
            <td class="col-name">
              <span class="field-icon">🏷️</span>
              <strong class="field-label">{{ col.name }}</strong>
            </td>

            <!-- DATA TYPE SELECTOR -->
            <td>
              <select 
                :value="col.type" 
                @change="onTypeChange(col.name, $event.target.value)" 
                class="type-select"
              >
                <option value="string">String (Text)</option>
                <option value="number">Number (Numeric)</option>
                <option value="boolean">Boolean (True/False)</option>
                <option value="date">Date / Timestamp</option>
                <option value="object">Object / JSON</option>
              </select>
            </td>

            <!-- SAMPLE VALUE -->
            <td class="sample-cell">
              <code class="sample-text">{{ getSampleValue(col.name) }}</code>
            </td>

            <!-- STATUS BADGE -->
            <td>
              <span class="status-badge valid">Mapped</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'

const store = useWorkspaceStore()

const props = defineProps({
  headers: {
    type: Array,
    default: () => []
  },
  dataset: {
    type: Array,
    default: () => []
  }
})

// Local reactive state for type overrides
const columnTypes = reactive({})

// Handle manual dropdown selection change
function onTypeChange(fieldName, newType) {
  columnTypes[fieldName] = newType
  
  // STEP 3.3: Sync change directly to store & trigger alert
  if (store.updateColumnType) {
    store.updateColumnType(fieldName, newType)
  }
}

// Safely normalize array of strings or objects into a standard structure
const normalizedHeaders = computed(() => {
  if (!Array.isArray(props.headers)) return []

  return props.headers.map((h, idx) => {
    const fieldName = typeof h === 'string' ? h : (h?.name || h?.key || h?.field || `Column_${idx + 1}`)
    const detectedType = store.customSchemaTypes[fieldName] || columnTypes[fieldName] || inferType(fieldName)

    return {
      key: fieldName,
      name: fieldName,
      type: detectedType
    }
  })
})

// Infer data type from dataset rows
function inferType(fieldName) {
  if (!Array.isArray(props.dataset) || props.dataset.length === 0) return 'string'

  for (const row of props.dataset.slice(0, 10)) {
    const val = row?.[fieldName]
    if (val !== undefined && val !== null && val !== '') {
      if (typeof val === 'number') return 'number'
      if (typeof val === 'boolean') return 'boolean'
      if (!isNaN(Date.parse(val)) && String(val).length > 5 && (String(val).includes('-') || String(val).includes('/'))) return 'date'
      if (typeof val === 'object') return 'object'
      if (!isNaN(Number(val))) return 'number'
      return 'string'
    }
  }
  return 'string'
}

// Get sample value for display
function getSampleValue(fieldName) {
  if (!Array.isArray(props.dataset) || props.dataset.length === 0) return 'N/A'

  for (const row of props.dataset.slice(0, 5)) {
    const val = row?.[fieldName]
    if (val !== undefined && val !== null && val !== '') {
      return String(val)
    }
  }
  return 'null'
}
</script>

<style scoped>
.schema-mapping-matrix { width: 100%; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
.table-wrapper { width: 100%; overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
.matrix-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
.matrix-table th { background-color: #f8fafc; color: #475569; font-weight: 600; padding: 0.65rem 0.85rem; border-bottom: 1px solid #e2e8f0; font-size: 0.775rem; text-transform: uppercase; letter-spacing: 0.02em; }
.matrix-table td { padding: 0.6rem 0.85rem; border-bottom: 1px solid #f1f5f9; color: #0f172a; vertical-align: middle; }
.matrix-table tr:last-child td { border-bottom: none; }
.matrix-table tr:hover td { background-color: #f8fafc; }
.col-name { display: flex; align-items: center; gap: 0.5rem; }
.field-icon { font-size: 0.9rem; }
.field-label { font-weight: 600; color: #0f172a; }
.type-select { padding: 0.3rem 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; background-color: #fff; color: #0f172a; font-weight: 500; outline: none; cursor: pointer; }
.type-select:focus { border-color: #0284c7; }
.sample-cell { max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sample-text { background-color: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-family: monospace; font-size: 0.775rem; color: #334155; }
.status-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.725rem; font-weight: 600; }
.status-badge.valid { background-color: #dcfce7; color: #166534; }
</style>