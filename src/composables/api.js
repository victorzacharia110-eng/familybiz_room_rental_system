import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.familybiz.online',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
})

export default api