<template>
  <div class="data-grid-container">
    <!-- TOOLBAR: Search & Page Controls -->
    <div class="grid-toolbar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search records in active dataset..."
          class="search-input"
          @input="currentPage = 1"
        />
        <button v-if="searchQuery" class="clear-search" @click="searchQuery = ''; currentPage = 1">✕</button>
      </div>

      <div class="pagination-controls">
        <label for="pageSizeSelect" class="page-size-label">Rows per page:</label>
        <select id="pageSizeSelect" v-model.number="pageSize" class="page-size-select" @change="currentPage = 1">
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>

        <div class="page-nav">
          <button class="nav-btn" :disabled="currentPage === 1" @click="currentPage--">◀ Prev</button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages || 1 }}</span>
          <button class="nav-btn" :disabled="currentPage >= totalPages" @click="currentPage++">Next ▶</button>
        </div>
      </div>
    </div>

    <!-- DATA TABLE -->
    <div class="table-wrapper">
      <table v-if="paginatedData.length > 0" class="data-table">
        <thead>
          <tr>
            <th class="row-index-hdr">#</th>
            <th 
              v-for="col in headers" 
              :key="col" 
              class="sortable-hdr"
              @click="toggleSort(col)"
            >
              <div class="hdr-content">
                <span>{{ col }}</span>
                <span class="sort-icon">
                  <template v-if="sortColumn === col">
                    {{ sortDirection === 'asc' ? '▲' : '▼' }}
                  </template>
                  <template v-else>⇅</template>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in paginatedData" :key="idx" class="data-row">
            <td class="row-index-cell">{{ (currentPage - 1) * pageSize + idx + 1 }}</td>
            <td v-for="col in headers" :key="col" class="data-cell">
              <span :class="getCellClass(row[col])">
                {{ formatCellValue(row[col]) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- EMPTY STATE -->
      <div v-else class="empty-grid-state">
        <p v-if="dataset.length === 0">📂 No dataset active in workspace. Load a file or database table to view data.</p>
        <p v-else>🔍 No matching records found for "{{ searchQuery }}".</p>
      </div>
    </div>

    <!-- FOOTER STATS -->
    <div class="grid-footer">
      <span>Total Records: <strong>{{ filteredData.length.toLocaleString() }}</strong> <span v-if="filteredData.length !== dataset.length">(filtered from {{ dataset.length.toLocaleString() }})</span></span>
      <span>Columns: <strong>{{ headers.length }}</strong></span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  dataset: { type: Array, default: () => [] },
  headers: { type: Array, default: () => [] }
})

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(25)
const sortColumn = ref('')
const sortDirection = ref('asc')

// Filter dataset based on global keyword search
const filteredData = computed(() => {
  if (!props.dataset) return []
  if (!searchQuery.value.trim()) return props.dataset

  const q = searchQuery.value.toLowerCase().trim()
  return props.dataset.filter(row => {
    return Object.values(row).some(val => 
      val !== null && val !== undefined && String(val).toLowerCase().includes(q)
    )
  })
})

// Sort filtered dataset
const sortedData = computed(() => {
  if (!sortColumn.value) return filteredData.value

  return [...filteredData.value].sort((a, b) => {
    let valA = a[sortColumn.value]
    let valB = b[sortColumn.value]

    if (valA === null || valA === undefined) return 1
    if (valB === null || valB === undefined) return -1

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection.value === 'asc' ? valA - valB : valB - valA
    }

    valA = String(valA).toLowerCase()
    valB = String(valB).toLowerCase()

    if (valA < valB) return sortDirection.value === 'asc' ? -1 : 1
    if (valA > valB) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// Calculate total pages
const totalPages = computed(() => {
  return Math.ceil(sortedData.value.length / pageSize.value)
})

// Paginate dataset
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return sortedData.value.slice(start, start + pageSize.value)
})

function toggleSort(column) {
  if (sortColumn.value === column) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

function formatCellValue(val) {
  if (val === null || val === undefined || val === '') return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function getCellClass(val) {
  if (val === null || val === undefined || val === '') return 'cell-null'
  if (typeof val === 'number') return 'cell-number'
  if (typeof val === 'boolean') return 'cell-boolean'
  return 'cell-text'
}
</script>

<style scoped>
.data-grid-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
.grid-toolbar { padding: 0.75rem 1rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; }
.search-box { position: relative; display: flex; align-items: center; min-width: 280px; }
.search-icon { position: absolute; left: 0.65rem; font-size: 0.85rem; opacity: 0.6; }
.search-input { width: 100%; padding: 0.45rem 2rem 0.45rem 2rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; }
.clear-search { position: absolute; right: 0.5rem; background: none; border: none; font-size: 0.8rem; color: #94a3b8; cursor: pointer; }
.pagination-controls { display: flex; align-items: center; gap: 1rem; font-size: 0.8rem; color: #475569; }
.page-size-label { font-size: 0.8rem; }
.page-size-select { padding: 0.35rem 0.5rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.8rem; }
.page-nav { display: flex; align-items: center; gap: 0.5rem; }
.nav-btn { background: #ffffff; border: 1px solid #cbd5e1; padding: 0.35rem 0.65rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: #334155; }
.nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-info { font-weight: 600; color: #0f172a; min-width: 90px; text-align: center; }
.table-wrapper { overflow-x: auto; max-height: 520px; position: relative; }
.data-table { width: 100%; border-collapse: collapse; font-size: 0.825rem; text-align: left; }
.data-table th { position: sticky; top: 0; background: #f1f5f9; color: #334155; font-weight: 700; padding: 0.65rem 0.85rem; border-bottom: 2px solid #cbd5e1; z-index: 10; white-space: nowrap; user-select: none; }
.sortable-hdr { cursor: pointer; }
.sortable-hdr:hover { background: #e2e8f0; }
.hdr-content { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.sort-icon { font-size: 0.7rem; color: #64748b; }
.data-table td { padding: 0.55rem 0.85rem; border-bottom: 1px solid #f1f5f9; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.row-index-hdr, .row-index-cell { width: 50px; text-align: center; color: #94a3b8; font-weight: 600; background: #fafafa; border-right: 1px solid #f1f5f9; }
.data-row:hover { background: #f8fafc; }
.cell-null { color: #cbd5e1; font-style: italic; }
.cell-number { color: #0284c7; font-weight: 600; }
.cell-boolean { color: #d97706; font-weight: 600; }
.cell-text { color: #1e293b; }
.empty-grid-state { padding: 3rem 1rem; text-align: center; color: #64748b; font-size: 0.9rem; }
.grid-footer { padding: 0.65rem 1rem; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 0.75rem; color: #64748b; }
</style>