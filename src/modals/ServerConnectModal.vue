<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="close">
    <div class="modal-card">
      <div class="modal-header">
        <h3>🔌 Connect to Database Server</h3>
        <button class="close-btn" @click="close">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label>Database Type</label>
          <select v-model="form.dbType" class="form-control">
            <option value="postgres">PostgreSQL</option>
            <option value="mysql">MySQL / MariaDB</option>
            <option value="mssql">MS SQL Server</option>
          </select>
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>Host / IP Address</label>
            <input 
              v-model="form.host" 
              type="text" 
              class="form-control" 
              placeholder="localhost or 192.168.1.1" 
              required 
            />
          </div>
          <div class="form-group flex-1">
            <label>Port</label>
            <input 
              v-model="form.port" 
              type="number" 
              class="form-control" 
              :placeholder="defaultPort" 
              required 
            />
          </div>
        </div>

        <div class="form-group">
          <label>Database Name</label>
          <input 
            v-model="form.database" 
            type="text" 
            class="form-control" 
            placeholder="my_database" 
            required 
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Username</label>
            <input 
              v-model="form.user" 
              type="text" 
              class="form-control" 
              placeholder="admin" 
              required 
            />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input 
              v-model="form.password" 
              type="password" 
              class="form-control" 
              placeholder="••••••••" 
            />
          </div>
        </div>

        <div class="form-checkbox">
          <label>
            <input v-model="form.useSsl" type="checkbox" />
            Enable SSL / TLS Connection
          </label>
        </div>

        <div v-if="testResult" :class="['result-box', testResult.success ? 'success' : 'error']">
          {{ testResult.message }}
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" @click="close">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="isConnecting">
            {{ isConnecting ? 'Testing Connection...' : 'Connect' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { traceFlow } from '../utils/flowTracer.js'

const props = defineProps({
  isOpen: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'connect'])

const isConnecting = ref(false)
const testResult = ref(null)

const form = ref({
  dbType: 'postgres',
  host: 'localhost',
  port: 5432,
  database: '',
  user: '',
  password: '',
  useSsl: false
})

// Auto-update standard ports when changing database type
const defaultPort = computed(() => {
  switch (form.value.dbType) {
    case 'mysql': return 3306
    case 'mssql': return 1433
    case 'postgres':
    default: return 5432
  }
})

watch(() => form.value.dbType, () => {
  form.value.port = defaultPort.value
})

function close() {
  testResult.value = null
  emit('close')
}

async function handleSubmit() {
  traceFlow(import.meta.url, 'handleSubmit() - Testing database connection', {
    dbType: form.value.dbType,
    host: form.value.host,
    port: form.value.port,
    database: form.value.database
  })

  isConnecting.value = true
  testResult.value = null

  // Connect logic / Backend route invocation
  setTimeout(() => {
    isConnecting.value = false
    emit('connect', { ...form.value })
    close()
  }, 1000)
}
</script>

<style scoped>
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-card { background: #ffffff; width: 100%; max-width: 480px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0; }
.modal-header { padding: 1rem 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 1.05rem; color: #0f172a; }
.close-btn { background: none; border: none; font-size: 1.1rem; color: #64748b; cursor: pointer; }
.modal-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.85rem; }
.form-group { display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
.form-row { display: flex; gap: 0.75rem; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
label { font-size: 0.75rem; font-weight: 600; color: #475569; }
.form-control { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; box-sizing: border-box; }
.form-control:focus { outline: none; border-color: #0284c7; }
.form-checkbox label { font-size: 0.8rem; font-weight: 400; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
.btn-primary { background: #0284c7; color: #fff; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
.btn-primary:hover { background: #0369a1; }
.btn-secondary { background: #e2e8f0; color: #334155; border: none; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: #cbd5e1; }
.result-box { padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.8rem; }
.result-box.error { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
.result-box.success { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
</style>