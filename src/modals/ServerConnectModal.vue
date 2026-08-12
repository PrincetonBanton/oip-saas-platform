<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🔌 Connect to Supabase / Postgres</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <div class="form-group">
          <div class="label-row">
            <label>Select Table</label>
            <button class="refresh-btn" :disabled="isFetchingTables" @click="loadTables">
              {{ isFetchingTables ? 'Scanning...' : '🔄 Refresh Tables' }}
            </button>
          </div>

          <!-- TABLE SELECT DROPDOWN -->
          <select 
            v-if="availableTables.length > 0"
            v-model="selectedTable" 
            class="form-control"
            :disabled="loading"
          >
            <option value="" disabled>-- Select a table from database --</option>
            <option v-for="table in availableTables" :key="table" :value="table">
              📊 {{ table }}
            </option>
          </select>

          <!-- FALLBACK MANUAL INPUT -->
          <input 
            v-else
            v-model="selectedTable" 
            type="text" 
            class="form-control" 
            placeholder="Type table name manually (e.g. users, products)"
            :disabled="loading"
          />
        </div>

        <div v-if="errorMessage" class="error-box">
          ⚠️ {{ errorMessage }}
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="loading" @click="close">Cancel</button>
          <button type="button" class="btn-primary" :disabled="loading || !selectedTable" @click="importSelectedTable">
            {{ loading ? 'Ingesting Data...' : 'Import Table Data' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../utils/supabaseClient.js'
import { traceFlow } from '../utils/flowTracer.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'connect'])

const selectedTable = ref('')
const availableTables = ref([])
const isFetchingTables = ref(false)
const loading = ref(false)
const errorMessage = ref('')

// Auto-detect tables whenever modal opens
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    loadTables()
  }
})

async function loadTables() {
  isFetchingTables.value = true
  errorMessage.value = ''
  
  traceFlow(import.meta.url, 'loadTables() - Auto-detecting Supabase tables')

  try {
    // Attempt RPC function first
    const { data, error } = await supabase.rpc('get_tables')
    
    if (error) throw error

    if (data && data.length > 0) {
      // Map return values cleanly whether returned as strings or objects
      availableTables.value = data.map(item => typeof item === 'string' ? item : item.table_name)
      if (availableTables.value.length > 0) {
        selectedTable.value = availableTables.value[0]
      }
      traceFlow(import.meta.url, 'loadTables() [SUCCESS]', { detected: availableTables.value })
    } else {
      availableTables.value = []
    }
  } catch (err) {
    traceFlow(import.meta.url, 'loadTables() [FALLBACK] - RPC missing or RLS restricted', { error: err.message })
    // Silent fallback to manual mode if RPC is not configured in Supabase
    availableTables.value = []
  } finally {
    isFetchingTables.value = false
  }
}

async function importSelectedTable() {
  if (!selectedTable.value) return

  loading.value = true
  errorMessage.value = ''

  traceFlow(import.meta.url, 'importSelectedTable() [START]', { table: selectedTable.value })

  try {
    // 1. Initialize pagination controls and master dataset array
    let allData = []
    let page = 0
    const pageSize = 1000
    let hasMore = true

    // 2. Loop continuously to fetch data chunks until no more rows remain
    while (hasMore) {
      // Calculate zero-indexed row offsets for the current page chunk
      const from = page * pageSize
      const to = from + pageSize - 1

      // 3. .range(from, to) bypasses PostgREST's default 1,000-row limit by asking for specific slices
      const { data, error } = await supabase
        .from(selectedTable.value.trim())
        .select('*')
        .range(from, to) // <--- CRITICAL LINE: Solves the 1,000-row cap

      if (error) throw error

      if (data && data.length > 0) {
        allData = allData.concat(data)     // Append current 1,000-row batch to master array

        // 4. If returned chunk is less than 1,000, we've reached the last page
        if (data.length < pageSize) {
          hasMore = false                 // Reached the end of the table
        } else {
          page++                          // Increment page index to fetch next slice (e.g. 1000-1999, 2000-2999)
        }
      } else {
        hasMore = false                   // Empty response means dataset is fully loaded
      }
    }

    if (allData.length === 0) {
      throw new Error(`Table "${selectedTable.value}" contains no records.`)
    }

    traceFlow(import.meta.url, 'importSelectedTable() [SUCCESS]', { rowCount: allData.length })

    // Emit full aggregated dataset to parent hub component
    emit('connect', {
      tableName: selectedTable.value,
      data: allData,
      format: 'supabase'
    })

    close()
  } catch (err) {
    errorMessage.value = err.message || 'Failed to fetch table contents from Supabase.'
    traceFlow(import.meta.url, 'importSelectedTable() [ERROR]', { error: errorMessage.value })
  } finally {
    loading.value = false
  }
}

function close() {
  errorMessage.value = ''
  emit('close')
}
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #ffffff; width: 100%; max-width: 460px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
.modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }
.modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.label-row { display: flex; justify-content: space-between; align-items: center; }
label { font-size: 0.75rem; font-weight: 600; color: #475569; }
.refresh-btn { background: none; border: none; color: #0284c7; font-size: 0.75rem; cursor: pointer; font-weight: 600; }
.refresh-btn:hover { text-decoration: underline; }
.form-control { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; background-color: #fff; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
.btn-primary { background: #0284c7; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-primary:hover { background: #0369a1; }
.btn-secondary { background: #e2e8f0; color: #334155; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.8rem; }
</style>