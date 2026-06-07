import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useAnnouncementStore = defineStore('announcement', () => {
  const announcements = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchAnnouncements = async () => {
    try {
      loading.value = true

      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/announcements/fetch')

      // ✅ STORE DATA HERE (THIS WAS MISSING)
      announcements.value = response.data.announcements

      return announcements.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }
  const registerAnnouncement = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/announcements/create', {
        title: payload.title,
        message: payload.message,
      })

      const newAnnouncement = response.data.announcement
      announcements.value.push(newAnnouncement)
      return newAnnouncement
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    }
  }

const deleteAnnouncement = async (id) => {
  try {
    await api.get('/sanctum/csrf-cookie')
    await api.delete(`/api/announcements/delete/${id}`)
    announcements.value = announcements.value.filter((announcement) => announcement.id !== id)
    return true  
  } catch (err) {
    error.value = err.response?.data?.message || err.message
    return false  
  }
}

const loadAnnouncementForEdit = async (id) => {
  try {
    await api.get('/sanctum/csrf-cookie')
    const response = await api.get(`/api/announcements/show/${id}`)
    return response.data.announcement
  } catch (err) {
    error.value = err.response?.data?.message || err.message
    return null
  }
}


  return {
    announcements,
    error,
    loading,
    fetchAnnouncements,
    registerAnnouncement,
    deleteAnnouncement,
    loadAnnouncementForEdit
  }
})
