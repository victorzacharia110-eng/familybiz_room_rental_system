import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/composables/api'

export const usePaymentMethodStore = defineStore('paymentMethod', () => {
  const paymentMethods = ref([])
  const error = ref(null)
  const loading = ref(false)
  const paymentMethodForm = ref({
    airtel_money_number: '',
    m_pesa_number: '',
    mixx_by_yas_number: '',
    halopesa_number: '',
    nmb_account_number: '',
    crdb_account_number: '',
    nbc_account_number: '',
  })

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

  const loadPaymentMethodForEdit = async (id) => {
    loading.value = true
    error.value = null

    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get(`/api/method/show/${id}`)
      const paymentMethod = response.data.paymentMethod

      paymentMethodForm.value = {
        airtel_money_number: paymentMethod.airtel_money_number,
        m_pesa_number: paymentMethod.m_pesa_number,
        mixx_by_yas_number: paymentMethod.mixx_by_yas_number,
        halopesa_number: paymentMethod.halopesa_number,
        nmb_account_number: paymentMethod.nmb_account_number,
        crdb_account_number: paymentMethod.crdb_account_number,
        nbc_account_number: paymentMethod.nbc_account_number,
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
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
      loading.value = false
    }
  }

  const updatePaymentMethod = async (id) => {
  loading.value = true
  error.value = null

  try {
    await api.get('/sanctum/csrf-cookie')

    const response = await api.patch(
      `/api/method/update/${id}`,
      paymentMethodForm.value,
    )

    return response.data
  } catch (err) {
    error.value =
      err.response?.data?.message || err.message

    return null
  } finally {
    loading.value = false
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
    loadPaymentMethodForEdit,
    updatePaymentMethod,
  }
})
