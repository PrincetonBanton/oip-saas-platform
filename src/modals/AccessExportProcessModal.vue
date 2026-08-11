<template>
  <div v-if="isOpen" class="modal-backdrop nested" @click.self="close">
    <div class="modal-card access-card">
      <div class="modal-header">
        <h3>Choose Access Conversion Method</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <div class="modal-body">
        <p>How would you like to process data from <strong>{{ file?.name || 'Access Database' }}</strong>?</p>

        <!-- ERROR MESSAGE ALERT -->
        <div v-if="errorMessage" class="error-box">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- LOADING STATE -->
        <div v-if="loading" class="loading-state">
          <span>Processing conversion request...</span>
        </div>

        <!-- OPTIONS -->
        <div v-else class="access-options">
          <!-- OPTION 1: CLIENT-SIDE MDB-READER -->
          <div class="option-box selectable" @click="onSelectApi">
            <div class="option-header">
              <strong>1. Direct In-Browser Reader (mdb-reader)</strong>
              <span class="action-tag">Client-Side</span>
            </div>
            <p>Parse the database directly inside your browser without uploading to any server using open-source JS tooling.</p>
          </div>

          <!-- OPTION 2: DIRECT CSV IMPORT -->
          <div class="option-box selectable" @click="onSelectCsv">
            <div class="option-header">
              <strong>2. Zero-Code Choice (Direct CSV Import)</strong>
              <span class="action-tag">No Server Needed</span>
            </div>
            <p>Select a CSV exported directly from MS Access (External Data → Export → Text/CSV) to load instantly.</p>
          </div>

          <!-- OPTION 3: ONLINE CONVERTER FALLBACK -->
          <div class="option-box selectable" @click="openOnlineConverter">
            <div class="option-header">
              <strong>3. Free Online Converter (Temporary Fallback)</strong>
              <span class="action-tag external">External Link</span>
            </div>
            <p>Use a third-party online converter (e.g., Convertio) to transform your .mdb file into CSV, then import it here.</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="loading" @click="close">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'
import { handleRunApiExport, handleRunCsvImport } from '../utils/accessExportHandlers.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  file: { type: Object, default: null }
})

const emit = defineEmits(['close', 'processed'])

const loading = ref(false)
const errorMessage = ref('')

onMounted(() => {
  traceFlow(import.meta.url, 'AccessExportProcess mount')
})

async function onSelectApi() {
  traceFlow(import.meta.url, 'onSelectApi() - Selected mdb-reader Client-Side Flow', { file: props.file?.name })
  loading.value = true
  errorMessage.value = ''

  const result = await handleRunApiExport(props.file)
  loading.value = false

  if (result.success) {
    emit('processed', result.payload)
    close()
  } else {
    errorMessage.value = result.error || 'Failed to process mdb-reader conversion'
  }
}

async function onSelectCsv() {
  traceFlow(import.meta.url, 'onSelectCsv() - Selected Direct CSV Flow')
  loading.value = true
  errorMessage.value = ''

  const result = await handleRunCsvImport()
  loading.value = false

  if (result.success) {
    emit('processed', result.payload)
    close()
  } else if (result.reason !== 'canceled') {
    errorMessage.value = result.error || 'Failed to import CSV'
  }
}

function openOnlineConverter() {
  traceFlow(import.meta.url, 'openOnlineConverter() - Redirecting to Convertio')
  window.open('https://convertio.co/mdb-csv/', '_blank', 'noopener,noreferrer')
}

function close() {
  errorMessage.value = ''
  emit('close')
}
</script>

  <style scoped>
  .modal-backdrop.nested { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
  .modal-card.access-card { background: #ffffff; width: 100%; max-width: 520px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
  .modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
  .modal-header h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
  .close-btn { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }
  .modal-body { padding: 1.25rem; }
  .modal-body p { font-size: 0.85rem; color: #475569; margin-top: 0; margin-bottom: 0.75rem; line-height: 1.4; }
  .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.8rem; margin-bottom: 0.85rem; }
  .loading-state { text-align: center; padding: 1.5rem; font-size: 0.85rem; color: #0284c7; font-weight: 600; }
  .access-options { display: flex; flex-direction: column; gap: 0.75rem; margin: 1rem 0; }
  .option-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; transition: all 0.2s ease; }
  .option-box.selectable { cursor: pointer; }
  .option-box.selectable:hover { border-color: #0284c7; background: #f0f9ff; }
  .option-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
  .option-header strong { font-size: 0.85rem; color: #0f172a; }
  .action-tag { font-size: 0.75rem; font-weight: 700; color: #0284c7; }
  .option-box p { margin: 0; font-size: 0.75rem; color: #64748b; }
  .modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
  .btn-secondary { background: #e2e8f0; color: #334155; border: none; padding: 0.5rem 0.85rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
  .btn-secondary:hover { background: #cbd5e1; }
  </style>