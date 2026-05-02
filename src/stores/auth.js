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

    // Login
    const login = async (payload) => {
      loading.value = true
      error.value = null

      try {
        await api.get('/sanctum/csrf-cookie')
        const response = await api.post('/api/user/auth', payload)

        user.value = response.data.user
        return user.value
      } catch (err) {
        error.value = err.response?.data?.message || err.message
        return null
      } finally {
        loading.value = false
      }
    }

    const fetchUser = async () => {
      loading.value = true
      error.value = null
      try {
        await api.get('/sanctum/csrf-cookie')
        const response = await api.get('/api/user/fetch')
        user.value = response.data.user || null
      } catch (err) {
        user.value = null
        error.value = err.response?.data?.message || err.message
      } finally {
        loading.value = false
      }
    }

    const fetchUsers = async () => {
      loading.value = true
      users.value = []

      try {
        await api.get('/sanctum/csrf-cookie')
        const response = await api.get('/api/user/fetch')
        users.value = response.data.users
      } catch (err) {
        error.value = err.response?.message || err.message
      } finally {
        loading.value = false
      }
    }

    const logout = async () => {
      loading.value = true
      try {
        await api.get('/sanctum/csrf-cookie')
        await api.post('/api/user/logout')
        user.value = null
      } catch (err) {
        error.value = err.response?.data?.message || err.message
      } finally {
        loading.value = false
      }
    }

    const updatePhoneNumber = async (id, phone) => {
      loading.value = true
      error.value = null

      try {
        await api.get('/sanctum/csrf-cookie')

        const response = await api.patch(`/api/user/update/phone/${id}`, {
          phone_number: phone,
        })

        // update store user immediately (optional but recommended)
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

    const requestPasswordReset = async (email) => {
      loading.value = true
      error.value = null

      try {
        await api.get('/sanctum/csrf-cookie')
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
      requestPasswordReset,
      logout,
    }
  },
  {
    persist: {
      paths: ['user'], // only save authenticated user
    },
  },
)
