import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import AltaSolicitud from '../views/AltaSolicitud.vue'
import ListaSolicitudes from '../views/ListaSolicitudes.vue'
import Configuracion from '../views/Configuracion.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', component: Dashboard },
  { path: '/solicitud', component: AltaSolicitud },
  { path: '/solicitudes/nueva', component: AltaSolicitud },
  { path: '/solicitudes', component: ListaSolicitudes },
  { path: '/configuracion', component: Configuracion },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
