import { ref } from 'vue'
import api from '@/composables/api'

export default function useRegister() {
  const loading = ref(false)
  const error = ref(null)
  const data = ref(null)

const register = async (payload) => {
  loading.value = true
  error.value = null
  data.value = null

  try {
    const response = await api.post('/api/user/create', payload)

    data.value = response.data

    return response // 👈 THIS IS THE FIX
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = err.message
    }

    return err.response // 👈 also return error response
  } finally {
    loading.value = false
  }
}

  return { register, data, error, loading }
}
