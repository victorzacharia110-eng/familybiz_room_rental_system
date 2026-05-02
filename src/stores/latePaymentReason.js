import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useLatePaymentReasonStore = defineStore('latePaymentReason', () => {
  const latePaymentReasons = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchLatePaymentReasons = async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/reasons/fetch')
      latePaymentReasons.value = response.data.latePaymentReasons
      console.log('Late Payment REasons : ', response.data)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  const registerLatePaymentReasons = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/reasons/create', {
        payment_id: payload.payment_id,
        reason_text: payload.reason_text,
      })

      const newLatePaymentReason = response.data.latePaymentReason
      latePaymentReasons.value.push(newLatePaymentReason)

      return newLatePaymentReason
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    }
  }
  return {
    latePaymentReasons,
    error,
    loading,
    fetchLatePaymentReasons,
    registerLatePaymentReasons,
  }
})
