<template>
  <div class="dashboard-root">
    <div class="dash-header">
      <div>
        <div class="micro">SISTEMA DE SCORE CREDITICIO AGRICOLA &middot; BOLIVIA</div>
        <h1 class="title">Panel</h1>
      </div>
      <div class="period">2026</div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="muted">SOLICITUDES TOTALES</div>
        <div class="stat-value">3.958</div>
        <div class="muted small">solicitudes <span class="green">+18.4%</span></div>
      </div>
      <div class="stat-card">
        <div class="muted">MONTO TOTAL SOLICITADO</div>
        <div class="stat-value">Bs 284.7M</div>
        <div class="muted small">bolivianos <span class="green">+22.1%</span></div>
      </div>
      <div class="stat-card">
        <div class="muted">MONTO PROMEDIO</div>
        <div class="stat-value">Bs 74,320</div>
        <div class="muted small">por solicitud <span class="green">+3.2%</span></div>
      </div>
      <div class="stat-card">
        <div class="muted">TASA DE APROBACI&Oacute;N</div>
        <div class="stat-value">68.4%</div>
        <div class="muted small">del total <span class="red">-1.8%</span></div>
      </div>
    </div>

    <div class="main-row">
      <div class="big-card">
        <div class="card-title">TENDENCIA MENSUAL &mdash; N&uacute;mero de Solicitudes</div>
        <div class="card-body">
          <canvas ref="lineChart" style="width:100%; height:220px"></canvas>
        </div>
      </div>

      <div class="side-card">
        <div class="card-title">Evaluaci&oacute;n crediticia &mdash; Score Promedio</div>
        <div class="card-body" style="display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div class="big-letter">B</div>
          <div style="position: relative; width: 200px; text-align: center;">
              <svg viewBox="0 0 100 50" style="width: 100%;">
                  <!-- Background Track -->
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e6edfe" stroke-width="12" stroke-linecap="round" />
                  <!-- Value Arc (72% progress) -->
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#1d63ed" stroke-width="12" stroke-linecap="round"
                        stroke-dasharray="125.6" stroke-dashoffset="35.1" />
              </svg>
              <div style="margin-top: -30px;">
                  <span style="font-size: 12px; color: #666; display: block;">Score</span>
                  <span style="font-size: 28px; font-weight: bold; color: #1d63ed;">72</span>
              </div>
          </div>
          <div class="muted small">Score num&eacute;rico . <strong>72 / 100</strong></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Chart from 'chart.js/auto'

export default {
  setup() {
    const lineChart = ref(null)
    const gaugeChart = ref(null)
    let lineInstance = null
    let gaugeInstance = null

    onMounted(() => {
      // line chart
      const ctx = lineChart.value && lineChart.value.getContext('2d')
      if (ctx) {
        lineInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
            datasets: [{ label: 'Solicitudes', data: [120,150,200,300,350,320,380,420,390,410,360,300], borderColor: '#0b5ed7', backgroundColor: 'rgba(11,94,215,0.08)', tension: 0.3, fill: true }]
          },
          options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{grid:{display:false}}, y:{beginAtZero:true}} }
        })
      }

      // gauge
      const gctx = gaugeChart.value && gaugeChart.value.getContext('2d')
      if (gctx) {
        const value = 72.4
        const percent = (value / 100) * 100
        const data = [percent, 100 - percent]
        const center = {
          id: 'centerText',
          afterDraw(chart) {
            const ctx = chart.ctx
            const w = chart.width
            const h = chart.height
            ctx.save()
            ctx.fillStyle = '#6b7280'
            ctx.font = '14px Inter, Arial'
            ctx.textAlign = 'center'
            ctx.fillText('Score', w/2, h*0.45 - 14)
            ctx.fillStyle = '#0b5ed7'
            ctx.font = '700 32px Inter, Arial'
            ctx.fillText(String(Math.round(value)), w/2, h*0.45 + 18)
            ctx.restore()
          }
        }
        gaugeInstance = new Chart(gctx, { type:'doughnut', data:{datasets:[{data, backgroundColor:['#0b5ed7','#e6eefc'], borderWidth:0}]}, options:{rotation:-Math.PI, circumference:Math.PI, cutout:'75%', maintainAspectRatio:true, aspectRatio:2, responsive:true, plugins:{legend:{display:false}, tooltip:{enabled:false}}}, plugins:[center] })
      }
    })

    onBeforeUnmount(() => { if (lineInstance) { lineInstance.destroy(); lineInstance = null } if (gaugeInstance) { gaugeInstance.destroy(); gaugeInstance = null } })

    return { lineChart, gaugeChart }
  }
}
</script>

<style scoped>
/* light white background with blue tones */
.dashboard-root{background:transparent; color:#0f172a; padding:18px}
.dash-header{display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:14px}
.micro{font-size:12px; color:#6b7280; letter-spacing:1px}
.title{margin:0; font-size:26px}
.period{color:#0b5ed7; font-weight:700}
.stats-row{display:flex; gap:12px; margin-bottom:16px}
.stat-card{flex:1; background:#ffffff; border-radius:10px; padding:14px; box-shadow:0 1px 2px rgba(11,94,215,0.06); border:1px solid rgba(11,94,215,0.06)}
.muted{color:#6b7280}
.stat-value{font-size:22px; font-weight:700; margin-top:6px}
.green{color:#10b981}
.red{color:#ef4444}
.small{font-size:12px}
.main-row{display:flex; gap:12px}
.big-card{flex:2; background:#fff; border-radius:10px; padding:12px; border:1px solid rgba(11,94,215,0.06)}
.side-card{width:320px; background:#fff; border-radius:10px; padding:12px; border:1px solid rgba(11,94,215,0.06); display:flex; flex-direction:column}
.card-title{font-weight:700; color:#0f172a; margin-bottom:8px}
.card-body{background:transparent}
.big-letter{font-size:64px; color:#10b981; font-weight:700; margin-bottom:6px}
</style>
