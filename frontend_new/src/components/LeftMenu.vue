<template>
  <aside class="left">
    <div class="menu-item" @click="go('/dashboard')">Dashboard</div>
    <div class="menu-item" @click="go('/solicitud')">Alta de solicitud</div>
    <div class="menu-item" @click="go('/solicitudes')">Lista de solicitudes</div>
    <div class="menu-item" @click="go('/configuracion')">Configuraci&oacute;n de pesos</div>
  </aside>
</template>

<script>
import { useRouter } from 'vue-router'
export default {
  setup() {
    const router = useRouter()
    const go = (p) => router.push(p)
    return { go }
  }
}
</script>

<style scoped>
.left { width:220px; background:#0f172a; color:#fff; padding:16px; min-height:100vh }
.menu-item { padding:10px; cursor:pointer; border-radius:6px; margin-bottom:6px }
.menu-item:hover { background:rgba(255,255,255,0.06) }
</style>
