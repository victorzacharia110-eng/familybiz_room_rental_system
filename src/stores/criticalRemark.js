import { ref } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useCriticalRemarkStore = defineStore('criticalRemark', () => {
    const criticalRemarks = ref([])
    const singleAuthCriticalRemark = ref({})
    const error = ref(null)
    const loading = ref(false)

    const fetchCriticalRemarks = async () => {
        try {
            await api.get('/sanctum/csrf-cookie')
            const response = await api.get('/api/remarks/fetch')
            criticalRemarks.value = response.data.criticalRemarks
            console.log('Critical Remarks : ', criticalRemarks.value)
            return criticalRemarks.value
        } catch (err) {
            error.value = err.response?.data.message || err.message
            return error.value
        }
    }

    const registerCriticalRemarks = async (payload) => {
        try {
            await api.get('/sanctum/csrf-cookie')
            const response = await api.post('/api/remarks/create', {
                user_id: payload.user_id,  //  Send the TENANT ID
                reason: payload.reason,
                type: payload.type,
                active: payload.active,
            })
            const newCriticalRemark = response.data.criticalRemark
            criticalRemarks.value.push(newCriticalRemark)
            return newCriticalRemark
        } catch (err) {
            error.value = err.response?.data.message || err.message
            return error.value
        } finally {
            loading.value = false
        }
    }

    const loadCriticalRemarkForEdit = async (id) => {
        loading.value = true
        error.value = null

        try {
            await api.get('/sanctum/csrf-cookie')
            const response = await api.get(`/api/remarks/show/${id}`)
            singleAuthCriticalRemark.value = response.data.criticalRemark || {}
        } catch (err) {
            error.value = err.response?.data.message || err.message
        } finally {
            loading.value = false
        }
    }

    const updateCriticalRemark = async (id, payload) => {
        loading.value = true
        error.value = null

        try {
            await api.get('/sanctum/csrf-cookie')
            const response = await api.patch(`/api/remarks/update/${id}`, {
                reason: payload.reason_text,
                type: payload.type,
                active: payload.active,
            })
            const updatedCriticalRemark = response.data.criticalRemark

            // Update the local list of critical remarks
            const index = criticalRemarks.value.findIndex((r) => r.id === id)
            if (index !== -1) {
                criticalRemarks.value[index] = updatedCriticalRemark
            }

            return updatedCriticalRemark
        } catch (err) {
            error.value = err.response?.data.message || err.message
            return error.value
        } finally {
            loading.value = false
        }
    }

    const deleteCriticalRemark = async (id) => {
        loading.value = true
        error.value = null

        try {
            await api.get('/sanctum/csrf-cookie')
            await api.delete(`/api/remarks/delete/${id}`)
            criticalRemarks.value = criticalRemarks.value.filter((r) => r.id !== id)
            return true
        } catch (err) {
            error.value = err.response?.data.message || err.message
            return false
        } finally {
            loading.value = false
        }
    }


    return {
        error,
        loading,
        criticalRemarks,
        singleAuthCriticalRemark,
        fetchCriticalRemarks,
        registerCriticalRemarks,
        loadCriticalRemarkForEdit,
        updateCriticalRemark,
        deleteCriticalRemark,             
    }
})