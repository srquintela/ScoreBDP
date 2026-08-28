<template>
  <div>
    <h2>Configuración de Pesos</h2>
    <div v-for="(v, key) in sliders" :key="key" style="margin-bottom:18px">
      <div class="range-label"><label>{{ labels[key] }}</label><div>{{ sliders[key] }}</div></div>
      <input type="range" min="0" max="10" step="0.1" v-model.number="sliders[key]" />
    </div>
    <button @click="save">Guardar pesos</button>
    <div v-if="msg" style="margin-top:12px">{{ msg }}</div>
  </div>
</template>

<script>
import api from '../api'
import { reactive, ref } from 'vue'

export default {
  setup() {
    const userId = 'demo.user'
    const sliders = reactive({
      potencial: 1,
      vocacion: 1,
      complejidad: 1,
      riesgo_climatico: 1,
      perfil_financiero: 1
    })
    const labels = {
      potencial: 'Potencial',
      vocacion: 'Vocación',
      complejidad: 'Complejidad',
      riesgo_climatico: 'Riesgo Climático',
      perfil_financiero: 'Perfil Financiero'
    }
    const msg = ref('')
    const save = async () => {
      try {
        await api.post('/weights', { user_id: userId, weights: { ...sliders } })
        msg.value = 'Pesos guardados'
      } catch (e) {
        msg.value = 'Error al guardar'
      }
    }
    return { sliders, labels, save, msg }
  }
}
</script>
