import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useCommentStore = defineStore('comment', () => {
  const loading = ref(false)
  const comments = ref([])
  const error = ref(null)

  const fetchComments = async () => {
    loading.value = true
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/comments/fetch')
      comments.value = response.data.comments
      return comments.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const registerComments = async (payload) => {
    loading.value = true
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/comments/create', {
        comment: payload.comment,
        rating: payload.rating,
      })

      const newComment = response.data.comment
      comments.value.push(newComment)
      return newComment
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const deleteComment = async (id) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      await api.delete(`/api/comments/delete/${id}`)
      comments.value = comments.value.filter((c) => c.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return false
    }
  }

  
  return {
    loading,
    comments,
    error,
    fetchComments,
    registerComments,
    deleteComment,
  }
})
