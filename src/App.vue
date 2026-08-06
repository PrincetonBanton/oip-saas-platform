<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Operational Intelligence Platform (OIP)</h1>
      <span class="badge">SaaS Mode</span>
    </header>

    <main class="workspace-main">
      <div class="toolbar">
        <button @click="runDiagnostic" class="test-btn">Run Diagnostic Suite</button>
      </div>

      <FileIngestionHub />
    </main>
  </div>
</template>

<script setup>
import { runDiagnostic } from './utils/testParser.js'
import FileIngestionHub from './components/FileIngestionHub.vue'
</script>

<style scoped>
.app-container { width: 100%; min-height: 100vh; padding: 1.25rem; box-sizing: border-box; background-color: #f8fafc; }
.app-header { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.75rem; margin-bottom: 1.25rem; }
.app-header h1 { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin: 0; }
.badge { background-color: #e0f2fe; color: #0369a1; padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
.workspace-main { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
.toolbar { display: flex; justify-content: flex-end; }
.test-btn { padding: 0.4rem 0.85rem; background-color: #0284c7; color: #fff; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: background-color 0.2s; }
.test-btn:hover { background-color: #0369a1; }
</style>