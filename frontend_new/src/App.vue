<template>
  <div class="app">
    <Header />
    <div class="layout">
      <LeftMenu />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script>
import Header from './components/Header.vue'
import LeftMenu from './components/LeftMenu.vue'

export default {
  components: { Header, LeftMenu }
}
</script>

<style scoped>
/* small layout adjustments */
.app { display:flex; flex-direction:column; height:100vh }
.layout { display:flex; flex:1 }
.content { flex:1; padding:20px; background:#f4f6fb }
</style>
