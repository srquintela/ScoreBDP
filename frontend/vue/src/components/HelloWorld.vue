<template>
  <div>
    <button @click="callApi">Call /api/hello</button>
    <div v-if="msg">Response: {{ msg }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const msg = ref('')

async function callApi() {
  try {
    const r = await fetch('/api/hello')
    const j = await r.json()
    msg.value = j.message || JSON.stringify(j)
  } catch (e) {
    msg.value = 'Error: ' + e.message
  }
}
</script>
