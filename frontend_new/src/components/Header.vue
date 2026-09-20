<template>
  <header class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="/bdplogo.png" alt="BDP logo" style="height:38px"/>
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
    const user = { name: 'usuario demo' }
    const dateStr = new Date().toLocaleString()
    const logout = () => alert('Logout stub')
    return { user, dateStr, logout }
  }
}
</script>

<style scoped>
.header { background:#fff; padding:12px 20px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 1px 3px rgba(0,0,0,.06) }
</style>
