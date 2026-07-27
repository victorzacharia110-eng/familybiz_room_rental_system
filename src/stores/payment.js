import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/api'

export const usePaymentStore = defineStore('payment', () => {
  const payments = ref([])
  const tenant_payment = ref({})
  const count_tenant_unpaid_payment = ref(0)
  const error = ref(null)
  const loading = ref(false)
  const paymentForm = ref({
    room_id: '',
    month: '',
    year: '',
    amount: '',
    status: 'unpaid',
    due_date: '',
  })

  const loadPaymentForEdit = async (id) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.get(`/api/payment/show/${id}`)

      const payment = response.data.payment || {}

      paymentForm.value = {
        room_id: payment?.room_id ?? '',
        month: payment?.month ?? '',
        year: payment?.year ?? '',
        amount: payment?.amount ?? '',
        status: payment?.status ?? 'unpaid',
        due_date: payment?.due_date ?? '',
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  const fetchPayment = async () => {
    try {
      const response = await api.get('/api/payment/fetch')
      tenant_payment.value = await response.data.tenant_payment
      count_tenant_unpaid_payment.value = await response.data.count_tenant_unpaid_payment

      console.log('value : ', tenant_payment.value)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }
  //   fetch payments
  const fetchPayments = async () => {
    loading.value = true
    try {
      const response = await api.get('/api/payment/fetch')
      const result = response.data.payments
      payments.value = Array.isArray(result) ? result : (result?.data ?? [])
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }
  // create a new payment
  const registerPayment = async (payload) => {
    try {
      const response = await api.post('/api/payment/create', {
        room_id: payload.room_id,
        month: payload.month,
        year: payload.year,
        due_date: payload.due_date,
        amount: payload.amount,
        status: payload.status,
      })

      const newPayment = response.data.payment
      payments.value.push(newPayment)
      console.log('from payment store : ', response)

      return newPayment
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const updatePayments = async (id, payload) => {
    loading.value = true
    error.value = null

    try {
      const response = await api.patch(`/api/payment/update/${id}`, {
        amount: payload.amount,
        status: payload.status,
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const deletePayment = async (id) => {
    try {
      const response = await api.delete(`/api/payment/delete/${id}`)
      console.log('Payment deleted successfully', response.data)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const selectRoom = async (roomId, paymentMethod = 'clickpesa') => {
    loading.value = true
    error.value = null
    try {
      const response = await api.post(`/api/room/select/${roomId}`, {
        payment_method: paymentMethod,
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const confirmPayment = async (paymentId, message = '') => {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch(`/api/payment/confirm/${paymentId}`, {
        confirmation_message: message,
      })
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const unconfirmedPayments = ref([])

  const fetchUnconfirmedPayments = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await api.get('/api/payment/unconfirmed')
      unconfirmedPayments.value = response.data.unconfirmed_payments || []
      return unconfirmedPayments.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return []
    } finally {
      loading.value = false
    }
  }

  const cancelPayment = async (paymentId) => {
    loading.value = true
    error.value = null
    try {
      const response = await api.patch(`/api/payment/cancel/${paymentId}`)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    payments,
    tenant_payment,
    count_tenant_unpaid_payment,
    error,
    loading,
    paymentForm,
    deletePayment,
    registerPayment,
    fetchPayments,
    fetchPayment,
    updatePayments,
    loadPaymentForEdit,
    selectRoom,
    confirmPayment,
    unconfirmedPayments,
    fetchUnconfirmedPayments,
    cancelPayment,
  }
})
