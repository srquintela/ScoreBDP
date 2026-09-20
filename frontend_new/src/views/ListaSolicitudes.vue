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

      <!-- modal inside the main template -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-card">
          <div style="display:flex; gap:18px; align-items:flex-start">
            <!-- Left card: textual scores -->
            <div style="flex:1; padding:14px; border:1px solid rgba(15,23,42,0.04); border-radius:6px; background:#fff;">
              <h4 style="margin-top:0">Desglose de puntajes</h4>
              <ul style="list-style:none; padding:0; margin:0;">
                <li style="margin-bottom:12px">
                  <div><strong>SCORE FINANCIERO:</strong> {{ modal.score_fin }}</div>
                  <div class="muted">PESO: {{ modal.peso_fin }} % &mdash; {{ getRiskLabel(modal.score_fin) }}</div>
                </li>
                <li style="margin-bottom:12px">
                  <div><strong>SCORE VIABILIDAD:</strong> {{ modal.score_via }}</div>
                  <div class="muted">PESO: {{ modal.peso_via }} % &mdash; {{ getRiskLabel(modal.score_via) }}</div>
                </li>
                <li style="margin-bottom:12px">
                  <div><strong>SCORE ADOPCION:</strong> {{ modal.score_adop }}</div>
                  <div class="muted">PESO: {{ modal.peso_adop }} % &mdash; {{ getRiskLabel(modal.score_adop) }}</div>
                </li>
                <li style="margin-bottom:12px">
                  <div><strong>SCORE MERCADO:</strong> {{ modal.score_merc }}</div>
                  <div class="muted">PESO: {{ modal.peso_merc }} % &mdash; {{ getRiskLabel(modal.score_merc) }}</div>
                </li>
                <li style="margin-bottom:12px">
                  <div><strong>SCORE CLIMA:</strong> {{ 1-modal.score_clima }}</div>
                  <div class="muted">PESO: {{ modal.peso_clima }} % &mdash; {{ getRiskLabel(1-modal.score_clima) }}</div>
                </li>
                <li style="margin-top:8px">
                  <div><strong style="color:teal">SCORE BDP:</strong> <span style="color:teal">{{ modal.final_score }}</span></div>
                  <div class="muted">SCORE BDP LITERAL: {{ modal.literal }}</div>
                </li>
              </ul>
              
            </div>

            <!-- Center card: XY matrix / chart -->
            <div style="flex:1; padding:14px; border:1px solid rgba(15,23,42,0.04); border-radius:6px; background:#fff; display:flex; flex-direction:column;">
              <h4 style="margin:0 0 8px 0">Componentes (XY)</h4>
              <div style="flex:1; min-height:260px;">
                <canvas ref="chartCanvas" style="width:100%; height:100%"></canvas>
              </div>
            </div>

            <!-- Right card: centered gauge -->
            <div style="width:320px; padding:14px; border:1px solid rgba(15,23,42,0.04); border-radius:6px; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center">
                <h4 style="margin:0 0 8px 0">Score BDP</h4>
                <div style="width:320px; display:flex; align-items:center; justify-content:center">
                    <div style="position: relative; width:200px; text-align:center;">
                        <svg viewBox="0 0 100 50" style="width:100%;">
                            <!-- Background Track -->
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e6edfe" stroke-width="12" stroke-linecap="round" />
                            <!-- Value Arc -->
                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" :stroke="gaugeColor" stroke-width="12" stroke-linecap="round"
                                  :stroke-dasharray="arcLengthStr" :stroke-dashoffset="dashOffset" />
                        </svg>
                        <div style="margin-top: -30px;">
                            <span style="font-size: 12px; color: #666; display: block;">Score</span>
                            <span style="font-size: 28px; font-weight: bold; color: #1d63ed;">{{ displayGaugeValue }}</span>
                        </div>
                    </div>
                </div>
                <div class="muted">El Score BDP eval&uacute;a el riesgo crediticio combinando el perfil financiero del cliente con la escala de producci&oacute;n regional, ventaja comparativa, ingresos del cultivo y riesgo clim&aacute;tico multitemporal. Esta puntuaci&oacute;n unificada impulsa la inclusi&oacute;n financiera</div>
                <div style="text-align:right; margin-top:12px">
                    <button class="btn btn-outline-secondary" @click="closeModal">Cerrar</button>
                </div>

            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import api from '../api'
import Chart from 'chart.js/auto'

export default {
  setup() {
    const rows = ref([])
    const searchId = ref('')
    const showModal = ref(false)
    const modal = ref(null)

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

    let chartInstance = null

    const renderChart = async () => {
      if (!modal.value) return
      await nextTick()
      const ctx = chartCanvas.value && chartCanvas.value.getContext('2d')
      if (!ctx) return
      const labels = ['Fin', 'Viab', 'Adop', 'Merc', 'Clima']
      const pesosData = [modal.value.peso_fin, modal.value.peso_via, modal.value.peso_adop, modal.value.peso_merc, modal.value.peso_clima]
      const scoresData = [modal.value.score_fin * 100, modal.value.score_via * 100, modal.value.score_adop * 100, modal.value.score_merc * 100, modal.value.score_clima * 100]
      if (chartInstance) {
        chartInstance.data.labels = labels
        chartInstance.data.datasets[0].data = pesosData
        chartInstance.data.datasets[1].data = scoresData
        chartInstance.update()
        return
      }
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Pesos (%)',
              data: pesosData,
              borderColor: '#007bff',
              backgroundColor: 'rgba(0,123,255,0.12)',
              tension: 0.3,
              pointRadius: 4,
              yAxisID: 'y'
            },
            {
              label: 'Scores x100',
              data: scoresData,
              borderColor: '#f97316',
              backgroundColor: 'rgba(249,115,22,0.08)',
              tension: 0.3,
              pointRadius: 4,
              yAxisID: 'y'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } },
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              display: true,
              title: { display: true, text: 'Componentes', color: '#374151' },
              ticks: { color: '#374151' },
              grid: { color: 'rgba(15,23,42,0.04)' }
            },
            y: {
              display: true,
              title: { display: true, text: 'Valor', color: '#374151' },
              ticks: {
                color: '#374151',
                callback: function(value){ return value + '%' }
              },
              beginAtZero: true,
              suggestedMax: 100,
              grid: { color: 'rgba(15,23,42,0.04)', borderDash: [4,4] }
            }
          },
          plugins: {
            legend: { position: 'bottom', labels: { color: '#374151' } },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context){
                  const label = context.dataset.label || ''
                  const value = context.parsed.y
                  if (!label) return `${value}`
                  // show percent for pesos and value for scores
                  if (label.includes('Pesos')) return `${label}: ${value}%`
                  return `${label}: ${value.toFixed(2)}`
                }
              }
            }
          }
        }
      })
    }

    const chartCanvas = ref(null)

    // SVG gauge parameters
    const arcRadius = 40
    const arcLength = Math.PI * arcRadius
    const arcLengthStr = arcLength.toFixed(1)
    const gaugeColor = computed(() => '#1d63ed')
    const gaugePercent = computed(() => {
      if (!modal.value) return 0
      // backend final_score may be 0..1000 — normalize to 0..100
      const raw = Number(modal.value.final_score || 0)
      const clamped = Math.max(0, Math.min(1000, raw))
      return (clamped / 1000) * 100
    })
    const dashOffset = computed(() => (arcLength * (1 - (gaugePercent.value / 100))).toFixed(1))
    const displayGaugeValue = computed(() => {
      if (!modal.value) return 0
      return Math.round(Number(modal.value.final_score || 0))
    })

    const teardownChart = () => { if (chartInstance) { chartInstance.destroy(); chartInstance = null } }

    const onScore = (row) => {
      ;(async () => {
        try {
          const r = await api.post(`/api/score/generate/${row.id}`)
          if (r && r.data && r.data.score) {
            const sc = r.data.score
            const pesos = r.data.pesos || { perfil_financiero:20, viabilidad:20, adopcion:20, mercado:20, riesgo_climatico:20 }
            modal.value = {
              score_fin: Number(sc.scorefinanciero) || 0,
              peso_fin: Number(pesos.perfil_financiero) || 0,
              score_via: Number(sc.scoreviabilidad) || 0,
              peso_via: Number(pesos.viabilidad) || 0,
              score_adop: Number(sc.scoreadopcion) || 0,
              peso_adop: Number(pesos.adopcion) || 0,
              score_merc: Number(sc.scoremercado) || 0,
              peso_merc: Number(pesos.mercado) || 0,
              score_clima: Number(sc.scoreclima) || 0,
              peso_clima: Number(pesos.riesgo_climatico) || 0,
              final_score: Number(sc.score) || 0,
              literal: sc.scoreletra || sc.score_letra || 'N/A'
            }
            showModal.value = true
            // render chart for the modal
            renderChart()
          } else {
            alert('Score generated')
          }
        } catch (e) {
          console.error(e)
          alert('Error generating score')
        }
      })()
    }

    const closeModal = () => { showModal.value = false }
    watch(showModal, (v) => { if (!v) { teardownChart() } })

    // helper to convert score (0..1) to risk label
    const getRiskLabel = (val) => {
      const v = Number(val)
      if (isNaN(v)) return ''
      if (v >= 0.81) return 'Muy bajo riesgo'
      if (v >= 0.61) return 'Bajo riesgo'
      if (v >= 0.41) return 'Riesgo Moderado'
      if (v >= 0.21) return 'Riesgo Elevado'
      return 'Muy alto riesgo'
    }

    const pesosPoints = computed(() => {
      if (!modal.value) return ''
      const vals = [modal.value.peso_fin, modal.value.peso_via, modal.value.peso_adop, modal.value.peso_merc, modal.value.peso_clima]
      const max = 100
      const w = 320
      const h = 200
      const gap = w / (vals.length + 1)
      return vals.map((v,i) => {
        const x = gap * (i+1)
        const y = h - (Math.min(v, max) / max) * (h - 20) - 10
        return `${x},${y}`
      }).join(' ')
    })

    const scoresPoints = computed(() => {
      if (!modal.value) return ''
      const vals = [modal.value.score_fin*100, modal.value.score_via*100, modal.value.score_adop*100, modal.value.score_merc*100, modal.value.score_clima*100]
      const max = 100
      const w = 320
      const h = 200
      const gap = w / (vals.length + 1)
      return vals.map((v,i) => {
        const x = gap * (i+1)
        const y = h - (Math.min(v, max) / max) * (h - 20) - 10
        return `${x},${y}`
      }).join(' ')
    })

    onMounted(() => loadAll())
    return { rows, searchId, loadAll, search, onScore, showModal, modal, closeModal, pesosPoints, scoresPoints, chartCanvas, arcLengthStr, dashOffset, displayGaugeValue, gaugeColor, getRiskLabel }
  }
}
</script>

<style>
.modal-overlay{position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center}
.modal-card{background:#fff; padding:18px; border-radius:8px; width:1120px; max-width:95%}
.modal-card .muted{font-size:13px}
.small-desc{font-size:13px; color:#6b7280; margin-top:4px}
.muted{color:#666; margin-left:8px}
</style>
