import axios from 'axios'

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BACKEND,
  headers: { 'Content-Type': 'application/json' }
})

export default api
