<template>
  <div class="app-container">
    <header class="app-header">
      <h1>Operational Intelligence Platform (OIP)</h1>
      <span class="badge">SaaS Mode</span>
    </header>

    <main class="workspace-main">
      <button @click="runDiagnostic" class="test-btn">Run CSV Parser Test</button>
    </main>
  </div>
</template>

<script setup>
import { runDiagnostic } from './utils/testParser.js'
</script>

<style scoped>
.app-container { width: 100%; min-height: 100vh; padding: 1.5rem; box-sizing: border-box; }
.app-header { display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #e2e8f0; padding-bottom: 1rem; margin-bottom: 1.5rem; }
.app-header h1 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
.badge { background-color: #e0f2fe; color: #0369a1; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; }
.workspace-main { display: flex; justify-content: flex-start; width: 100%; }
.test-btn { padding: 0.5rem 1rem; background-color: #0284c7; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; }
.test-btn:hover { background-color: #0369a1; }
</style>