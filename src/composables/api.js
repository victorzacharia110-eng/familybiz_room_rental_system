import axios from 'axios'

const api = axios.create({
  baseURL: 'https://homerentsystemapi-main-qjnwql.laravel.cloud',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export default api