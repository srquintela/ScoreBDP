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
