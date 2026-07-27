import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/composables/api'

export const useRoomStore = defineStore('room', () => {
  const rooms = ref([])
  const totalRooms = ref(0)
  const roomsAvailableCount = ref(0)
  const roomsMaintananceCount = ref(0)
  const roomsOccupiedCount = ref(0)
  const error = ref(null)
  const loading = ref(false)

  const roomForm = ref({
    id: null,
    room_number: '',
    type: '',
    status: '',
    room_price: 0,
    photo: null,
    preview: null,
  })

  const registerRoom = async (payload) => {
    error.value = null
    loading.value = true

    try {

      const hasFile = payload.photo instanceof File
      let data

      if (hasFile) {
        data = new FormData()
        data.append('room_number', payload.room_number)
        data.append('room_price', payload.room_price)
        data.append('type', payload.type)
        data.append('status', payload.status)
        data.append('amount', payload.amount || 0)
        data.append('photo', payload.photo)
      } else {
        data = {
          room_number: payload.room_number,
          room_price: payload.room_price,
          type: payload.type,
          status: payload.status,
          amount: payload.amount,
        }
      }

      const response = await api.post('/api/room/create', data)

      const newRoom = response.data.room
      rooms.value.push(newRoom)
      return newRoom
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return error.value
    } finally {
      loading.value = false
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await api.get('/api/room/fetch')
      const result = response.data.rooms
      rooms.value = Array.isArray(result) ? result : (result?.data ?? [])
      totalRooms.value = response.data.totalRooms
      roomsAvailableCount.value = response.data.roomsAvailableCount
      roomsMaintananceCount.value = response.data.roomsMaintananceCount
      roomsOccupiedCount.value = response.data.roomsOccupiedCount
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  const loadRoomForEdit = async (id) => {
    try {

      const response = await api.get(`/api/room/show/${id}`)

      const room = response?.data?.room

      if (!room) {
        throw new Error('Room data not found in response')
      }

      roomForm.value.id = room.id
      roomForm.value.room_number = room.room_number
      roomForm.value.type = room.type
      roomForm.value.status = room.status
      roomForm.value.room_price = room.room_price ?? 0
      roomForm.value.photo = null
      roomForm.value.preview = room.photo_url || null

      return roomForm.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    }
  }

  const updateRoom = async () => {
    if (!roomForm.value.id) return null

    loading.value = true
    error.value = null

    try {

      const hasFile = roomForm.value.photo instanceof File
      let data

      if (hasFile) {
        data = new FormData()
        data.append('room_number', roomForm.value.room_number)
        data.append('type', roomForm.value.type)
        data.append('status', roomForm.value.status)
        data.append('room_price', roomForm.value.room_price ?? 0)
        data.append('photo', roomForm.value.photo)
        data.append('_method', 'PATCH')
      } else {
        data = {
          room_number: roomForm.value.room_number,
          type: roomForm.value.type,
          status: roomForm.value.status,
          room_price: roomForm.value.room_price,
        }
      }

      const endpoint = `/api/room/update/${roomForm.value.id}`
      const response = hasFile ? await api.post(endpoint, data) : await api.patch(endpoint, data)

      const updatedRoom = response?.data?.room

      if (!updatedRoom) {
        throw new Error('Updated room not found in response')
      }

      const index = rooms.value.findIndex(
        (r) => r.id === roomForm.value.id
      )

      if (index !== -1) {
        rooms.value[index] = updatedRoom
      }

      return updatedRoom
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateRoomStatus = async (id, checked) => {
    try {
      const status = checked ? 'Occupied' : 'Available'
      await api.patch(`/api/room/update/status/${id}`, { status })

      const room = rooms.value.find((r) => r.id === id)

      if (room) {
        room.status = status
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  const deleteRoom = async (id) => {
    try {
      const response = await api.delete(`/api/room/delete/${id}`)
      rooms.value = rooms.value.filter((r) => r.id !== id)
      return true
    } catch (error) {
      error.value = error.response?.data?.message || error.message
      return false
    }
  }

  return {
    rooms,
    totalRooms,
    roomsAvailableCount,
    roomsMaintananceCount,
    roomsOccupiedCount,
    error,
    loading,
    roomForm,
    registerRoom,
    fetchRooms,
    loadRoomForEdit,
    updateRoom,
    updateRoomStatus,
    deleteRoom,
  }
})
