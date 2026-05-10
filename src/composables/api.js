import axios from 'axios'

const api = axios.create({
  baseURL: 'https://api.familybiz.online',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export default api