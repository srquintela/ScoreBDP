<template>
  <div>
    <h2>Configuraci&oacute;n de pesos</h2>
    <div class="card" style="max-width:720px">
      <div class="form-grid">
        <div>
          <label>Peso para el perfil financiero</label>
          <input type="number" step="0.1" v-model.number="form.perfil" />
        </div>
        <div>
          <label>Peso para el valor del producto (viabilidad)</label>
          <input type="number" step="0.1" v-model.number="form.viabilidad" />
        </div>
        <div>
          <label>Peso para la adopci&oacute;n regional</label>
          <input type="number" step="0.1" v-model.number="form.adopcion" />
        </div>
        <div>
          <label>Peso para el acceso a log&iacute;stica del municipio (mercado)</label>
          <input type="number" step="0.1" v-model.number="form.mercado" />
        </div>
        <div>
          <label>Peso para el riesgo clim&aacute;tico</label>
          <input type="number" step="0.1" v-model.number="form.riesgoclimatico" />
        </div>
      </div>

      <div style="margin-top:16px; display:flex; gap:12px; align-items:center">
        <button class="btn btn-primary" @click="guardar">Guardar</button>
        <button class="btn btn-outline-primary" @click="limpiar">Limpiar</button>
        <span style="color:var(--muted)" v-if="msg">{{ msg }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import api from '../api'

export default {
  setup() {
    const form = reactive({ perfil: 1.0, viabilidad: 1.0, adopcion: 1.0, mercado: 1.0, riesgoclimatico: 1.0 })
    const msg = ref('')

    const limpiar = () => {
      form.perfil = 1.0
      form.viabilidad = 1.0
      form.adopcion = 1.0
      form.mercado = 1.0
      form.riesgoclimatico = 1.0
      msg.value = ''
    }

    const guardar = async () => {
      try {
        msg.value = ''
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
        msg.value = 'Error al guardar'
      }
    }

    return { form, guardar, limpiar, msg }
  }
}
</script>
