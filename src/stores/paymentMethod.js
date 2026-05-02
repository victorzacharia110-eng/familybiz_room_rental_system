import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/composables/api'

export const usePaymentMethodStore = defineStore('paymentMethod', () => {
  const paymentMethods = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchPaymentMethods = async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/method/fetch')
      paymentMethods.value = response.data.paymentMethods

      console.log('Payment Methods : ', paymentMethods.value)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const registerPaymentMethods = async (payload) => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/method/create', {
        airtel_money_number: payload.airtel_money_number,
        m_pesa_number: payload.m_pesa_number,
        mixx_by_yas_number: payload.mixx_by_yas_number,
        halopesa_number: payload.halopesa_number,
        nmb_account_number: payload.nmb_account_number,
        crdb_account_number: payload.crdb_account_number,
        nbc_account_number: payload.nbc_account_number,
      })

      const newPaymentMethod = response.data.newPaymentMethod
      paymentMethods.value.push(newPaymentMethod)
      console.log('New Payment Method : ', newPaymentMethod)

      return newPaymentMethod
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = true
    }
  }

  const deletePaymentMethod = async (id) => {
    await api.get('/sanctum/csrf-cookie')
    const response = await api.delete(`/api/method/delete/${id}`)
    console.log('deleted id plus response : ', id + 'response : ', response)
  }
  return {
    paymentMethods,
    error,
    loading,
    fetchPaymentMethods,
    registerPaymentMethods,
    deletePaymentMethod,
  }
})
