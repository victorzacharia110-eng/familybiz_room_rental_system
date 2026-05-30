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

  // Form state for editing a single room
  const roomForm = ref({
    id: null,
    room_number: '',
    type: '',
    status: '',
  })

  // Create a new room
  const registerRoom = async (payload) => {
    error.value = null
    loading.value = true

    try {
      await api.get('/sanctum/csrf-cookie')
      const response = await api.post('/api/room/create', {
        room_number: payload.room_number,
        room_price: payload.room_price,
        type: payload.type,
        status: payload.status,
        amount: payload.amount,
      })

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

  // Fetch all rooms
  const fetchRooms = async () => {
    try {
      api.get('sanctum/csrf-cookie')
      const response = await api.get('/api/room/fetch')
      rooms.value = response.data.rooms
      totalRooms.value = response.data.totalRooms
      roomsAvailableCount.value = response.data.roomsAvailableCount
      roomsMaintananceCount.value = response.data.roomsMaintananceCount
      roomsOccupiedCount.value = response.data.roomsOccupiedCount
      console.log('response fetcheddd :: ', response)
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  // Load a single room into the form by ID
const loadRoomForEdit = async (id) => {
  try {
    await api.get('sanctum/csrf-cookie')

    const response = await api.get(`/api/room/show/${id}`)

    const room = response?.data?.room

    if (!room) {
      throw new Error('Room data not found in response')
    }

    // ✅ update fields reactively (IMPORTANT)
    roomForm.value.id = room.id
    roomForm.value.room_number = room.room_number
    roomForm.value.type = room.type
    roomForm.value.status = room.status

    return roomForm.value
  } catch (err) {
    error.value = err.response?.data?.message || err.message
    return null
  }
}

  // Update a room from the form
 const updateRoom = async () => {
  if (!roomForm.value.id) return null

  loading.value = true
  error.value = null

  try {
    await api.get('sanctum/csrf-cookie')

    const response = await api.patch(
      `/api/room/update/${roomForm.value.id}`,
      {
        room_number: roomForm.value.room_number,
        type: roomForm.value.type,
        status: roomForm.value.status,
      }
    )

    // ✅ Laravel returns: { room: {...} }
    const updatedRoom = response?.data?.room

    if (!updatedRoom) {
      throw new Error('Updated room not found in response')
    }

    // ✅ update local list safely
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

  // Update just the status of the room
  const updateRoomStatus = async (id, checked) => {
    try {
      const status = checked ? 'Occupied' : 'Available'
      await api.patch(`/api/room/update/status/${id}`, { status })

      const room = this.rooms.find((r) => r.id === id)

      if (room) {
        room.status = status
      }
    } catch (err) {
      error.value = err.response?.data?.message || err.message
    }
  }

  const deleteRoom = async (id) => {
    try {
      api.get('sanctum/csrf-cookie')
      const response = await api.delete(`/api/room/delete/${id}`)
      console.log('Room deleted successfully', response.data)
    } catch (error) {
      console.error('Error deleting room:', error)
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
