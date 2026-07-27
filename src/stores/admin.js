import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/api'

export const useAdminStore = defineStore('admin', () => {
  const landlords = ref([])
  const tenants = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchLandlords = async (search = '') => {
    loading.value = true
    error.value = null
    try {
      const params = search ? { search } : {}
      const res = await api.get('/api/admin/landlords', { params })
      landlords.value = res.data.landlords.data || res.data.landlords
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  const fetchTenants = async (search = '') => {
    loading.value = true
    error.value = null
    try {
      const params = search ? { search } : {}
      const res = await api.get('/api/admin/tenants', { params })
      tenants.value = res.data.tenants.data || res.data.tenants
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  const resetPassword = async (userId, newPassword) => {
    try {
      const res = await api.patch(`/api/admin/user/${userId}/reset-password`, {
        new_password: newPassword,
        new_password_confirmation: newPassword,
      })
      return res.data.message
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const res = await api.patch(`/api/admin/user/${userId}/toggle-status`)
      return res.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    }
  }

  return {
    landlords,
    tenants,
    error,
    loading,
    fetchLandlords,
    fetchTenants,
    resetPassword,
    toggleUserStatus,
  }
})
