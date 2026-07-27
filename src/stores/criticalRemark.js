import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useCriticalRemarkStore = defineStore('criticalRemark', () => {
  const criticalRemarks = ref([])
  const singleAuthCriticalRemark = ref({})
  const error = ref(null)
  const loading = ref(false)

  const fetchCriticalRemarks = async () => {
    loading.value = true
    try {
      const response = await api.get('/api/remarks/fetch')
      const result = response.data.criticalRemarks
      criticalRemarks.value = Array.isArray(result) ? result : (result?.data ?? [])
      return criticalRemarks.value
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const registerCriticalRemarks = async (payload) => {
    try {
      const response = await api.post('/api/remarks/create', {
        user_id: payload.user_id, //  Send the TENANT ID
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

  const loadCriticalRemarkForEdit = async (id) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/api/remarks/show/${id}`)
      singleAuthCriticalRemark.value = response.data.criticalRemark || {}
    } catch (err) {
      error.value = err.response?.data.message || err.message
    } finally {
      loading.value = false
    }
  }

  const updateCriticalRemark = async (id, payload) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.patch(`/api/remarks/update/${id}`, {
        reason_text: payload.reason_text,
        type: payload.type,
        active: payload.active,
      })
      const updatedCriticalRemark = response.data.criticalRemark

      // Update the local list of critical remarks
      const index = criticalRemarks.value.findIndex((r) => r.id === id)
      if (index !== -1) {
        criticalRemarks.value[index] = updatedCriticalRemark
      }

      return updatedCriticalRemark
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const deleteCriticalRemark = async (id) => {
    loading.value = true
    error.value = null

    try {
      await api.delete(`/api/remarks/delete/${id}`)
      criticalRemarks.value = criticalRemarks.value.filter((r) => r.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return false
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
    loadCriticalRemarkForEdit,
    updateCriticalRemark,
    deleteCriticalRemark,
  }
})
