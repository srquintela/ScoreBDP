<template>
  <div>
    <h2>Alta de solicitud</h2>
    <div style="max-width:900px">
      <div class="card">
          <div class="form-grid">
              <div>
                  <label>Carnet de Identidad</label>
                  <input v-model="form.ci" maxlength="15" />
              </div>


              <div>
                  <label>Nombre</label>
                  <input v-model="form.nombre" maxlength="20" />
              </div>
              <div>
                  <label>Primer Apellido</label>
                  <input v-model="form.primer_apellido" maxlength="20" />
              </div>

              <div>
                  <label>Segundo Apellido</label>
                  <input v-model="form.segundo_apellido" maxlength="20" />
              </div>
              <div>
                  <label>Fecha de Nacimiento</label>
                  <input type="date" v-model="form.fechanac" />
              </div>

            <div>
                <label>G&eacute;nero</label>
                <select v-model="form.genero">
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                </select>
            </div>

            <div class="full">
                <label>Direcci&oacute;n</label>
                <textarea v-model="form.direccion" rows="3" maxlength="200"></textarea>
            </div>

              <div>
                  <label>Departamento</label>
                  <select v-model="form.departamento" @change="onDepartamentoChange">
                      <option value="">-- seleccione --</option>
                      <option v-for="d in departamentos" :key="d" :value="d">{{ d }}</option>
                  </select>
              </div>

              <div>
                  <label>Municipio</label>
                  <select v-model="form.municipio">
                      <option value="">-- seleccione --</option>
                      <option v-for="m in municipios" :key="m.codmunicipio" :value="m.municipio">{{ m.municipio }}</option>
                  </select>
              </div>
              <div>
                  <label>Producto</label>
                  <select v-model="form.producto">
                      <option value="">-- seleccione --</option>
                      <option v-for="p in productos" :key="p" :value="p">{{ p }}</option>
                  </select>
              </div>
              <div>
                  <label>CAEDEC</label>
                  <select v-model="form.caedec">
                      <option value="">-- seleccione --</option>
                      <option v-for="c in caedecs" :key="c.caedec" :value="c.caedec">{{ c.actividad }}</option>
                  </select>
              </div>
              <div>
                  <label>Monto Solicitado</label>
                  <input v-model="form.monto" maxlength="20" />
              </div>
              <div>
                  <label>Mes siembra</label>
                  <select v-model="form.messiembra">
                      <option value="">-- seleccione --</option>
                      <option v-for="s in meses" :key="s" :value="s">{{ s }}</option>
                  </select>
              </div>

          </div>
              <div style="margin-top:16px; display:flex; align-items:center; gap:12px; flex-wrap:wrap">
                  <div style="display:flex; gap:12px">
                      <button class="btn btn-outline-primary" @click="limpiar" type="button">Limpiar</button>
                      <button class="btn btn-primary" @click="procesar" type="button">Procesar</button>
                  </div>
                  <div style="flex:1; min-width:200px">
                      <span style="color:var(--muted)" v-if="msg">{{ msg }}</span>
                      <ul v-if="errors.length" style="color:#b91c1c; margin:8px 0 0; padding-left:18px">
                          <li v-for="(e, idx) in errors" :key="idx">{{ e }}</li>
                      </ul>
                  </div>
              </div>
          </div>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue'
import api from '../api'

export default {
  setup() {
    const form = reactive({
      ci: '', nombre: '', primer_apellido: '', segundo_apellido: '',
      fechanac: '', genero: 'Masculino', direccion: '', departamento: '', municipio: '', producto: '', monto: '', messiembra: '', caedec: ''
    })
    // static departamentos list (do not call backend)
      const departamentos = ref([
      'Chuquisaca', 'La Paz', 'Cochabamba', 'Oruro', 'Potos&iacute;', 'Tarija', 'Santa Cruz', 'Beni', 'Pando'
    ])
        // static months list (do not call backend)
    const meses = ref([
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
     ])
    const municipios = ref([])
    const msg = ref('')
    const productos = ref([])
    const caedecs = ref([])
    const errors = ref([])

    const onDepartamentoChange = async () => {
      if (!form.departamento) {
        municipios.value = []
        return
        }
      const r = await api.get('/api/municipios', { params: { departamento: form.departamento } })
      // backend returns objects with { cod_municipio, municipio }
      municipios.value = r.data
    }


    const validate = () => {
      errors.value = []
      if (!form.ci || form.ci.length > 15) errors.value.push('Carnet de Identidad: m&aacute;ximo 15 caracteres')
      if (!form.nombre || form.nombre.length > 20) errors.value.push('Nombre: m&aacute;ximo 20 caracteres')
      if (!form.primer_apellido || form.primer_apellido.length > 20) errors.value.push('Primer Apellido: m&aacute;ximo 20 caracteres')
      if (form.segundo_apellido && form.segundo_apellido.length > 20) errors.value.push('Segundo Apellido: m&aacute;ximo 20 caracteres')
      if (!form.fechanac) errors.value.push('Fecha de Nacimiento requerida')
      else {
        const dob = new Date(form.fechanac)
        const today = new Date()
        let age = today.getFullYear() - dob.getFullYear()
        const m = today.getMonth() - dob.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
        if (age < 18) errors.value.push('El usuario debe ser mayor de 18 a&ntilde;os')
      }
      if (!form.direccion || form.direccion.length > 200) errors.value.push('Direcci&oacute;n: m&aacute;ximo 200 caracteres')
      if (!form.departamento) errors.value.push('Departamento requerido')
      if (!form.municipio) errors.value.push('Municipio requerido')
      if (!form.producto) errors.value.push('Producto requerido')
      if (!form.monto || isNaN(Number(form.monto))) errors.value.push('Monto debe ser un número')
      if (!form.messiembra) errors.value.push('Mes siembra requerido')
      return errors.value.length === 0
    }

    const limpiar = () => {
      form.ci = ''
      form.nombre = ''
      form.primer_apellido = ''
      form.segundo_apellido = ''
      form.fechanac = ''
      form.genero = 'Masculino'
      form.direccion = ''
      form.departamento = ''
      form.municipio = ''
      form.producto = ''
      municipios.value = []
      msg.value = ''
      errors.value = []
    }

    const procesar = async () => {
      try {
        msg.value = ''
        if (!validate()) {
          msg.value = 'Corrija los errores'
          return
        }
        const payload = {
          ci: form.ci,
          nombre: form.nombre,
          primer_apellido: form.primer_apellido,
          segundo_apellido: form.segundo_apellido,
          fechanac: form.fechanac,
          genero: form.genero,
          direccion: form.direccion,
          departamento: form.departamento,
          municipio: form.municipio,
          producto: form.producto,
          caedec: form.caedec,
          monto: Number(form.monto),
          messiembra: form.messiembra
        }
        const r = await api.post('/api/solicitud', payload)
        msg.value = 'Procesado correctamente'
        console.log(r.data)
      } catch (e) {
        console.error(e)
        msg.value = 'Error al procesar'
      }
    }

    // load productos and leave departamentos static
    onMounted(async () => {
      try {
        const r = await api.get('/api/productos')
        productos.value = (r.data || []).map(p => p.descripcion)
      } catch (e) {
        productos.value = []
      }
      try {
        const r2 = await api.get('/api/caedec')
        caedecs.value = (r2.data || []).map(c => ({ caedec: c.caedec, actividad: c.actividad }))
      } catch (e) {
        caedecs.value = []
      }
    })
    return { form, departamentos, municipios, meses, productos, caedecs, onDepartamentoChange, procesar, limpiar, msg, errors }
  }
}
</script>
