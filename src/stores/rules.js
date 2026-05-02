import { ref } from 'vue'
import { defineStore } from 'pinia'
import api from '@/composables/api'

export const useRuleStore = defineStore('rule', () => {
  const rules = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchRules = async () => {
    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/rule/fetch')
      rules.value = response.data.rules
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    } finally {
      loading.value = true
    }
  }

  const registerRules = async (payload) => {
    loading.value = true
    error.value = null

    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/rule/create', {
        title: payload.title,
        description: payload.description,
        type: payload.type,
      })

      const newRule = response.data.rule
      rules.value.push(newRule)
      return newRule
    } catch (err) {
      error.value = err.response?.data.message || err.message
      return error.value
    }
  }

  return {
    rules,
    loading,
    error,
    fetchRules,
    registerRules
  }
})
