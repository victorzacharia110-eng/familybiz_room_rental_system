import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useAnnouncementStore = defineStore('announcement', () => {
  const announcements = ref([])

  //  this is what the edit page binds to, it gets populated when loading an announcement for edit 
  // and reset to null while loading to avoid showing stale data if switching between records
  const announcementForm = ref(null)   
  const error = ref(null)
  const loading = ref(false)

  const fetchAnnouncements = async () => {
    try {
      loading.value = true
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/announcements/fetch')
      const result = response.data.announcements
      announcements.value = Array.isArray(result) ? result : (result?.data ?? [])
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
      announcements.value = announcements.value.filter((a) => a.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return false
    }
  }

  const loadAnnouncementForEdit = async (id) => {
    try {
      loading.value = true
       // reset while loading to avoid showing stale data if switching between records
      announcementForm.value = null    
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get(`/api/announcements/show/${id}`)

      //  POPULATE the form ref with the fetched announcement data
      announcementForm.value = response.data.announcement 

      return announcementForm.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateAnnouncement = async (id, payload) => {
    try {
      loading.value = true
      await api.get('/sanctum/csrf-cookie')
      const response = await api.patch(`/api/announcements/update/${id}`, payload)
      
      // sync updated record back into the list if it's loaded
      const idx = announcements.value.findIndex((a) => a.id === id)
      if (idx !== -1) announcements.value[idx] = response.data.announcement
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    announcements,
    announcementForm, 
    error,
    loading,
    fetchAnnouncements,
    registerAnnouncement,
    deleteAnnouncement,
    loadAnnouncementForEdit,
    updateAnnouncement, 
  }
})