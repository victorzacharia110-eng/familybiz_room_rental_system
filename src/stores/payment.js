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
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get(`/api/payment/show/${id}`)

      const payment = response.data.payment

      paymentForm.value = {
        room_id: payment.room_id,
        month: payment.month,
        year: payment.year,
        amount: payment.amount,
        status: payment.status,
        due_date: payment.due_date,
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }

  const fetchPayment = async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
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
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/payment/fetch')
      payments.value = await response.data.payments
      console.log(' payments response fetched :: ', response)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = false
    }
  }
  // create a new payment
  const registerPayment = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
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
      await api.get('/sanctum/csrf-cookie')
      const response = api.patch(`/api/payment/update/${id}`, {
        amount: payload.amount,
        status: payload.status,
      })
    } catch (err) {}
  }

  const deletePayment = async (id) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.delete(`/api/payment/delete/${id}`)
      console.log('Payment deleted successfully', response.data)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  return {
    payments,
    tenant_payment,
    count_tenant_unpaid_payment,
    error,
    loading,
    deletePayment,
    registerPayment,
    fetchPayments,
    fetchPayment,
    updatePayments,
    loadPaymentForEdit,
  }
})
