<template>
  <aside class="left">
    <div class="menu-item" @click="go('/score/generar')">Score</div>
    <div class="submenu">
      <div class="menu-item" @click="go('/score/generar')">Generar</div>
      <div class="menu-item" @click="go('/score/cargar')">Cargar</div>
    </div>
    <div class="menu-item" style="margin-top:12px" @click="go('/configuracion')">Configuración</div>
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
