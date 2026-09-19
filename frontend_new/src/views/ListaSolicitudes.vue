<template>
  <div>
    <h2>Lista de solicitudes</h2>
    <div class="card">
      <div style="display:flex; gap:12px; align-items:center; margin-bottom:12px">
        <input v-model="searchId" placeholder="Buscar por id" style="width:160px" />
        <button class="btn btn-primary" @click="search">Buscar</button>
        <button class="btn btn-outline-primary" @click="loadAll">Mostrar todos</button>
      </div>
      <div style="overflow:auto">
        <table class="table">
          <thead>
            <tr>
              <th>id</th>
              <th>municipio</th>
              <th>producto</th>
              <th>monto</th>
              <th>fecha</th>
              <th>ci</th>
              <th>nombre</th>
              <th>primer apellido</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>{{ row.id }}</td>
              <td>{{ row.municipio }}</td>
              <td>{{ row.producto }}</td>
              <td>{{ row.monto }}</td>
              <td>{{ row.fecha }}</td>
              <td>{{ row.ci }}</td>
              <td>{{ row.nombre }}</td>
              <td>{{ row.primer_apellido }}</td>
              <td><button class="btn btn-sm btn-primary" @click="onScore(row)">SCORE</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../api'

export default {
  setup() {
    const rows = ref([])
    const searchId = ref('')

    const loadAll = async () => {
      try {
        const r = await api.get('/api/solicitudes')
        rows.value = r.data
      } catch (e) {
        console.error(e)
      }
    }

    const search = async () => {
      if (!searchId.value) return loadAll()
      try {
        const r = await api.get('/api/solicitudes', { params: { item_id: Number(searchId.value) } })
        rows.value = r.data
      } catch (e) {
        console.error(e)
      }
    }

    const onScore = (row) => {
      alert(`Score action for solicitud id ${row.id}`)
    }

    onMounted(() => loadAll())
    return { rows, searchId, loadAll, search, onScore }
  }
}
</script>
