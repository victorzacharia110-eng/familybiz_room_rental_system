import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useCommentStore = defineStore('comment', () => {
  const loading = ref(false)
  const comments = ref([])
  const error = ref(null)

  const fetchComments = async () => {
    await api.get('/sanctum/csrf-cookie')

    const response = await api.get('/api/comments/fetch')

    comments.value = response.data.comments 

    return comments.value
  }

  const registerComments = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = api.post('/api/comments/create', {
        comment: payload.comment,
        rating: payload.rating,
      })

      const newComment = (await response).data.comment
      comments.value.push(newComment)
      return newComment
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    }
  }

  
  return {
    loading,
    comments,
    error,
    fetchComments,
    registerComments,
  }
})
