<template>
  <div>
    <h2>Configuraci&oacute;n de pesos</h2>
    <div class="card" style="max-width:720px">
      <div class="form-grid">
        <div>
          <label>Peso para el perfil financiero</label>
          <input type="number" step="0.1" min="0" max="100" v-model.number="form.perfil" />
        </div>
        <div>
          <label>Peso para el valor del producto (viabilidad)</label>
          <input type="number" step="0.1" min="0" max="100" v-model.number="form.viabilidad" />
        </div>
        <div>
          <label>Peso para la adopci&oacute;n regional</label>
          <input type="number" step="0.1" min="0" max="100" v-model.number="form.adopcion" />
        </div>
        <div>
          <label>Peso para el acceso a log&iacute;stica del municipio (mercado)</label>
          <input type="number" step="0.1" min="0" max="100" v-model.number="form.mercado" />
        </div>
        <div>
          <label>Peso para el riesgo clim&aacute;tico</label>
          <input type="number" step="0.1" min="0" max="100" v-model.number="form.riesgoclimatico" />
        </div>
      </div>

      <div style="margin-top:16px; display:flex; gap:12px; align-items:center; flex-wrap:wrap">
        <div style="display:flex; align-items:center; gap:12px">
          <button class="btn btn-primary" @click="guardar">Guardar</button>
          <button class="btn btn-outline-primary" @click="limpiar">Limpiar</button>
        </div>
        <div style="flex:1; min-width:220px">
          <div style="color:var(--muted)">Suma actual: <strong>{{ total }}%</strong></div>
          <div style="color:#b91c1c; margin-top:6px" v-if="error">{{ error }}</div>
          <div style="color:var(--muted)" v-else-if="msg">{{ msg }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, computed } from 'vue'
import api from '../api'

export default {
  setup() {
    const form = reactive({ perfil: 20.0, viabilidad: 20.0, adopcion: 20.0, mercado: 20.0, riesgoclimatico: 20.0 })
    const msg = ref('')
    const error = ref('')

    const total = computed(() => {
      const s = Number(form.perfil || 0) + Number(form.viabilidad || 0) + Number(form.adopcion || 0) + Number(form.mercado || 0) + Number(form.riesgoclimatico || 0)
      return Math.round((s + Number.EPSILON) * 100) / 100
    })

    const limpiar = () => {
      form.perfil = 20.0
      form.viabilidad = 20.0
      form.adopcion = 20.0
      form.mercado = 20.0
      form.riesgoclimatico = 20.0
      msg.value = ''
      error.value = ''
    }

    const guardar = async () => {
      error.value = ''
      msg.value = ''
      // validate ranges
      const parts = [form.perfil, form.viabilidad, form.adopcion, form.mercado, form.riesgoclimatico]
      for (const p of parts) {
        if (p === null || p === undefined || isNaN(Number(p))) {
          error.value = 'Todos los pesos deben ser números válidos entre 0 y 100.'
          return
        }
        if (Number(p) < 0 || Number(p) > 100) {
          error.value = 'Cada peso debe estar entre 0 y 100.'
          return
        }
      }
      // validate sum == 100 (allow small float tolerance)
      const s = Number(form.perfil) + Number(form.viabilidad) + Number(form.adopcion) + Number(form.mercado) + Number(form.riesgoclimatico)
      if (Math.abs(s - 100) > 0.0001) {
        error.value = 'La suma de los cinco pesos debe ser 100 (actual: ' + (Math.round((s + Number.EPSILON) * 100) / 100) + ').'
        return
      }

      try {
        const payload = {
          perfil_financiero: form.perfil,
          viabilidad: form.viabilidad,
          adopcion: form.adopcion,
          mercado: form.mercado,
          riesgo_climatico: form.riesgoclimatico
        }
        const r = await api.post('/api/pesos', payload)
        msg.value = 'Guardado correctamente'
        console.log(r.data)
      } catch (e) {
        console.error(e)
        error.value = 'Error al guardar'
      }
    }

    return { form, guardar, limpiar, msg, error, total }
  }
}
</script>
