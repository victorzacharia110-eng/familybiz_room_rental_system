import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useCriticalRemarkStore = defineStore('criticalRemark', () => {
  const criticalRemarks = ref([])
  const singleAuthCriticalRemark = ref({}) 
  const error = ref(null)
  const loading = ref(false)

  const fetchCriticalRemarks = async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/remarks/fetch')
      criticalRemarks.value = response.data.criticalRemarks
      console.log('Critical Remarks : ', criticalRemarks.value)
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    }
  }

  const registerCriticalRemarks = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/remarks/create', {
        // user_id:payload.user_id,
        reason: payload.reason,
        type: payload.type,
        active: payload.active,
      })

      const newCriticalRemark = response.data.criticalRemark
      criticalRemarks.value.push(newCriticalRemark)
      return newCriticalRemark
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }
  return {
    error,
    loading,
    criticalRemarks,
    singleAuthCriticalRemark,
    fetchCriticalRemarks,
    registerCriticalRemarks,
  }
})
