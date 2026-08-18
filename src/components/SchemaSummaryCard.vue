<!-- SchemaSummaryCard.vue -->
<template>
  <div class="schema-summary-card">
    <div class="card-header">
      <div class="header-info">
        <div class="title-row">
          <h3>Schema Mapping Matrix</h3>
        </div>
        <p class="subtitle">{{ headers.length }} fields loaded</p>
      </div>

      <button type="button" class="open-modal-btn" @click="isModalOpen = true">
        <span>View Schema</span>
      </button>
    </div>

    <!-- Modal Dialog -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="modal-backdrop" @click.self="isModalOpen = false">
        <div class="modal-container" role="dialog" aria-modal="true">
          <header class="modal-header">
            <div class="modal-title-group">
              <h2>Schema Mapping Matrix</h2>
              <span class="dataset-tag">{{ datasetName }}</span>
            </div>
            <button type="button" class="close-modal-btn" @click="isModalOpen = false" aria-label="Close Modal">&times;</button>
          </header>

          <div class="modal-body">
            <div v-if="!headers.length" class="empty-warning">
              No schema headers detected. Please load a valid file.
            </div>

            <SchemaMappingMatrix v-else :headers="headers" :dataset="dataset" />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import SchemaMappingMatrix from './SchemaMappingMatrix.vue'

defineProps({
  datasetName: { type: String, default: 'Connected Dataset' },
  headers: { type: Array, default: () => [] },
  dataset: { type: Array, default: () => [] }
})

const isModalOpen = ref(false)

onErrorCaptured((err) => {
  console.error('[SchemaSummaryCard] Error rendering SchemaMappingMatrix:', err)
  return false
})
</script>

<style scoped>
.schema-summary-card { margin-top: 1.25rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); overflow: hidden; }
.card-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; background: #f8fafc; }
.title-row h3 { margin: 0; font-size: 0.95rem; font-weight: 600; color: #0f172a; }
.subtitle { margin: 0.2rem 0 0; font-size: 0.8rem; color: #64748b; }
.open-modal-btn { background: #0284c7; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: background 0.15s ease; }
.open-modal-btn:hover { background: #0369a1; }
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1.5rem; }
.modal-container { background: #fff; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1); width: 100%; max-width: 1100px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
.modal-title-group { display: flex; align-items: center; gap: 0.75rem; }
.modal-title-group h2 { margin: 0; font-size: 1.15rem; font-weight: 600; color: #0f172a; }
.dataset-tag { background: #e0f2fe; color: #0369a1; font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 9999px; }
.close-modal-btn { background: transparent; border: none; font-size: 1.5rem; line-height: 1; color: #64748b; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 4px; }
.close-modal-btn:hover { color: #0f172a; background: #e2e8f0; }
.modal-body { padding: 1.5rem; overflow-y: auto; }
.empty-warning { padding: 1rem; color: #b91c1c; background: #fef2f2; border-radius: 6px; font-size: 0.85rem; text-align: center; }
</style>