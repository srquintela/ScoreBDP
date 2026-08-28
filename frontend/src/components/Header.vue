<template>
  <header class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="/logo.svg" alt="logo" style="height:34px"/>
      <div>{{ dateStr }}</div>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <div>{{ user.name }}</div>
      <button @click="logout">Logout</button>
    </div>
  </header>
</template>

<script>
import { ref } from 'vue'
export default {
  setup() {
    const user = { name: 'demo.user' } // UI stub
    const dateStr = new Date().toLocaleString()
    const logout = () => {
      alert('Logout stub')
    }
    return { user, dateStr, logout }
  }
}
</script>
