import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/api'

export const useAuthStore = defineStore(
  'auth',
  () => {
    const user = ref(null)
    const users = ref([])
    const loading = ref(false)
    const error = ref(null)

    const login = async (payload) => {
      loading.value = true
      error.value = null

      try {
        const response = await api.post('/api/user/auth', payload)

        user.value = response.data.user
        if (response.data.token) {
          localStorage.setItem('auth_token', response.data.token)
        }
        return user.value
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        return null
      } finally {
        loading.value = false
      }
    }

    const fetchUser = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        user.value = null
        return
      }

      loading.value = true
      error.value = null
      try {
        const response = await api.get('/api/user/fetch')
        user.value = response.data.user || response.data || null
      } catch (err) {
        if (err.response?.status === 401) {
          user.value = null
          localStorage.removeItem('auth_token')
        }
        error.value = err.response?.data?.message || err.message
      } finally {
        loading.value = false
      }
    }

    const fetchUsers = async () => {
      loading.value = true
      users.value = []

      try {
        const response = await api.get('/api/user/fetch')
        const result = response.data.users
        users.value = Array.isArray(result) ? result : (result?.data ?? [])
      } catch (err) {
        error.value = err.response?.message || err.message
      } finally {
        loading.value = false
      }
    }

    const logout = async () => {
      loading.value = true
      try {
        await api.post('/api/user/logout')
      } catch (err) {
        error.value = err.response?.data?.message || err.message
      } finally {
        user.value = null
        localStorage.removeItem('auth_token')
        loading.value = false
      }
    }

    const updatePhoneNumber = async (id, phone) => {
      loading.value = true
      error.value = null

      try {
        const response = await api.patch(`/api/user/update/phone/${id}`, {
          phone_number: phone,
        })

        if (response.data.user) {
          user.value = response.data.user
        }

        return response
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        return null
      } finally {
        loading.value = false
      }
    }

    const updateProfile = async (id, payload) => {
      loading.value = true
      error.value = null
      try {
        const response = await api.patch(`/api/user/update/profile/${id}`, payload)
        if (response.data.user) {
          user.value = response.data.user
        }
        return response.data
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        return null
      } finally {
        loading.value = false
      }
    }

    const requestPasswordReset = async (email) => {
      loading.value = true
      error.value = null

      try {
        const response = await api.post('/api/user/forgot-password', { email })
        if (response.data && response.data.success === false) {
          error.value = response.data.message || 'Failed to send reset link.'
          return null
        }
        return true
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        return null
      } finally {
        loading.value = false
      }
    }

    return {
      user,
      users,
      loading,
      error,
      login,
      fetchUser,
      fetchUsers,
      updatePhoneNumber,
      updateProfile,
      requestPasswordReset,
      logout,
    }
  },
  {
    persist: {
      paths: ['user'],
    },
  },
)
