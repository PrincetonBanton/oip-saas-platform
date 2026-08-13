<template>
  <div class="schema-mapping-card">
    <div class="card-header">
      <div class="header-title-group">
        <div class="title-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3v18"/>
            <rect width="18" height="18" x="3" y="3" rx="2"/>
            <path d="M3 9h18"/>
            <path d="M3 15h18"/>
          </svg>
        </div>
        <div>
          <h3 class="card-title">Schema Classification Matrix</h3>
          <p class="card-subtitle">Review and override column classifications before analysis</p>
        </div>
      </div>

      <div class="summary-pills">
        <span class="pill metric-pill">
          <strong>{{ counts.metric }}</strong> Metrics
        </span>
        <span class="pill dimension-pill">
          <strong>{{ counts.dimension }}</strong> Dimensions
        </span>
        <span class="pill ignore-pill">
          <strong>{{ counts.ignore }}</strong> Ignored
        </span>
      </div>
    </div>

    <div class="table-container">
      <table class="mapping-table">
        <thead>
          <tr>
            <th>Column Name</th>
            <th>Sample Data</th>
            <th>Operational Role</th>
            <th>Target Usage</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="header in datasetHeaders" :key="header" :class="`role-row-${activeSchemaMapping[header]}`">
            <td class="col-name">
              <code>{{ header }}</code>
            </td>

            <td class="col-sample">
              <span class="sample-badge" :title="getSampleValue(header)">
                {{ getSampleValue(header) }}
              </span>
            </td>

            <td class="col-role">
              <div class="role-selector">
                <button
                  type="button"
                  class="role-btn metric"
                  :class="{ active: activeSchemaMapping[header] === 'metric' }"
                  @click="updateColumnRole(header, 'metric')"
                  title="Classify as Numeric Metric"
                >
                  Metric
                </button>
                <button
                  type="button"
                  class="role-btn dimension"
                  :class="{ active: activeSchemaMapping[header] === 'dimension' }"
                  @click="updateColumnRole(header, 'dimension')"
                  title="Classify as Categorical Dimension"
                >
                  Dimension
                </button>
                <button
                  type="button"
                  class="role-btn ignore"
                  :class="{ active: activeSchemaMapping[header] === 'ignore' }"
                  @click="updateColumnRole(header, 'ignore')"
                  title="Exclude from Analysis & AI Payloads"
                >
                  Ignore
                </button>
              </div>
            </td>

            <td class="col-usage">
              <span class="usage-text" v-if="activeSchemaMapping[header] === 'metric'">
                Y-Axis / Sums / Charts
              </span>
              <span class="usage-text" v-else-if="activeSchemaMapping[header] === 'dimension'">
                X-Axis / Groups / Filters
              </span>
              <span class="usage-text muted" v-else>
                Excluded from AI & Charts
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWorkspaceStore } from '../composables/useWorkspaceStore.js'

const { datasetHeaders, activeSchemaMapping, updateColumnRole, currentDataset } = useWorkspaceStore()

// Extracts a non-empty preview sample from the first 5 records
function getSampleValue(header) {
  if (!currentDataset.value || !currentDataset.value.length) return '—'
  for (let i = 0; i < Math.min(5, currentDataset.value.length); i++) {
    const val = currentDataset.value[i][header]
    if (val !== null && val !== undefined && val !== '') {
      return String(val)
    }
  }
  return '—'
}

// Computes current breakdown of classified column roles
const counts = computed(() => {
  const result = { metric: 0, dimension: 0, ignore: 0 }
  Object.values(activeSchemaMapping).forEach(role => {
    if (result[role] !== undefined) result[role]++
  })
  return result
})
</script>

<style scoped>
.schema-mapping-card { margin-top: 1.25rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; padding-bottom: 0.85rem; border-bottom: 1px solid #f1f5f9; flex-wrap: wrap; }
.header-title-group { display: flex; align-items: center; gap: 0.75rem; }
.title-icon { width: 36px; height: 36px; background: #eef2ff; border-radius: 8px; color: #4f46e5; display: flex; align-items: center; justify-content: center; border: 1px solid #c7d2fe; }
.card-title { margin: 0; font-size: 1rem; font-weight: 600; color: #0f172a; }
.card-subtitle { margin: 0.15rem 0 0 0; font-size: 0.775rem; color: #64748b; }
.summary-pills { display: flex; gap: 0.5rem; align-items: center; }
.pill { font-size: 0.725rem; padding: 0.25rem 0.6rem; border-radius: 6px; font-weight: 500; border: 1px solid transparent; }
.metric-pill { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
.dimension-pill { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
.ignore-pill { background: #f8fafc; color: #475569; border-color: #e2e8f0; }
.table-container { overflow-x: auto; max-height: 420px; border: 1px solid #e2e8f0; border-radius: 8px; }
.mapping-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.825rem; }
.mapping-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 0.65rem 0.85rem; border-bottom: 1px solid #e2e8f0; position: sticky; top: 0; z-index: 10; }
.mapping-table td { padding: 0.6rem 0.85rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
.col-name code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 600; color: #334155; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.8rem; }
.col-sample { max-width: 180px; }
.sample-badge { display: inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; font-size: 0.775rem; background: #fafafa; padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid #f1f5f9; }
.role-selector { display: inline-flex; background: #f1f5f9; padding: 2px; border-radius: 6px; border: 1px solid #e2e8f0; }
.role-btn { border: none; background: transparent; padding: 0.25rem 0.6rem; font-size: 0.725rem; font-weight: 600; color: #64748b; border-radius: 4px; cursor: pointer; transition: all 0.15s ease; }
.role-btn:hover { color: #0f172a; }
.role-btn.metric.active { background: #16a34a; color: #ffffff; box-shadow: 0 1px 2px rgba(22, 163, 74, 0.2); }
.role-btn.dimension.active { background: #2563eb; color: #ffffff; box-shadow: 0 1px 2px rgba(37, 99, 235, 0.2); }
.role-btn.ignore.active { background: #64748b; color: #ffffff; box-shadow: 0 1px 2px rgba(100, 116, 139, 0.2); }
.usage-text { font-size: 0.75rem; font-weight: 500; color: #334155; }
.usage-text.muted { color: #94a3b8; font-style: italic; }
.role-row-ignore { background-color: #fafafa; opacity: 0.75; }
</style>