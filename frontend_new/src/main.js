import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
// Tabler UI - install with: npm install @tabler/core
import '@tabler/core/dist/css/tabler.min.css'
import '@tabler/core/dist/js/tabler.min.js'
import './styles.css'

createApp(App).use(router).mount('#app')
