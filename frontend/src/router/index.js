import { createRouter, createWebHistory } from 'vue-router'
import Configuracion from '../views/Configuracion.vue'
import ScoreGenerate from '../views/ScoreGenerate.vue'
import ScoreLoad from '../views/ScoreLoad.vue'

const routes = [
  { path: '/', redirect: '/score/generar' },
  { path: '/configuracion', component: Configuracion },
  { path: '/score/generar', component: ScoreGenerate },
  { path: '/score/cargar', component: ScoreLoad },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
