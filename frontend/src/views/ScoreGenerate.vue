<template>
  <div>
    <h2>Generar Score</h2>
    <div v-for="(v, key) in factors" :key="key" style="margin-bottom:12px">
      <label>{{ labels[key] }}</label>
      <input type="number" v-model.number="factors[key]" step="0.1"/>
    </div>
    <button @click="generate">Generar</button>

    <div v-if="result" style="margin-top:16px">
      <h3>Resultado</h3>
      <div>Raw: {{ result.raw_score }}</div>
      <div>Final: {{ result.final_score }}</div>
      <div>
        <h4>Contribuciones</h4>
        <ul>
          <li v-for="(v, k) in result.contributions" :key="k">{{ k }}: {{ v }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api'
import { reactive, ref } from 'vue'

export default {
  setup() {
    const userId = 'demo.user'
    const factors = reactive({
      potencial: 5,
      vocacion: 5,
      complejidad: 5,
      riesgo_climatico: 5,
      perfil_financiero: 5
    })
    const labels = {
      potencial: 'Potencial',
      vocacion: 'Vocación',
      complejidad: 'Complejidad',
      riesgo_climatico: 'Riesgo Climático',
      perfil_financiero: 'Perfil Financiero'
    }
    const result = ref(null)
    const generate = async () => {
      try {
        const r = await api.post('/score', { user_id: userId, factors })
        result.value = r.data
      } catch (e) {
        alert('Error generating score')
      }
    }
    return { factors, labels, generate, result }
  }
}
</script>
