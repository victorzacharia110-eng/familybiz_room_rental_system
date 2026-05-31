import { describe, it, expect, vi, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useRoomStore } from "@/stores/room"

// Mock API
vi.mock('@/composables/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

import api from '@/composables/api'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('Room Store', () => {
it('fetches rooms and stats', async () => {
  const store = useRoomStore()

  api.get
    .mockResolvedValueOnce({}) // csrf
    .mockResolvedValueOnce({
      data: {
        rooms: [{ id: 1 }, { id: 2 }],
        totalRooms: 2,
        roomsAvailableCount: 1,
        roomsMaintananceCount: 0,
        roomsOccupiedCount: 1,
      }
    })

  await store.fetchRooms()

  expect(store.rooms.length).toBe(2)
  expect(store.totalRooms).toBe(2)
  expect(store.roomsAvailableCount).toBe(1)
})


it('creates a new room', async () => {
  const store = useRoomStore()

  api.get.mockResolvedValueOnce({})
  api.post.mockResolvedValueOnce({
    data: {
      room: { id: 10, room_number: "A1", type: "Single" }
    }
  })

  const result = await store.registerRoom({
    room_number: "A1",
    room_price: 100,
    type: "Single",
    status: "Available",
    amount: 100
  })

  expect(store.rooms.length).toBe(1)
  expect(result.room_number).toBe("A1")
})

it('updates a room', async () => {
  const store = useRoomStore()

  store.rooms = [
    { id: 1, room_number: "A1", type: "Single", status: "Available" }
  ]

  store.roomForm = {
    id: 1,
    room_number: "A2",
    type: "Double",
    status: "Occupied"
  }

  api.get.mockResolvedValueOnce({})
  api.patch.mockResolvedValueOnce({
    data: {
      room: {
        id: 1,
        room_number: "A2",
        type: "Double",
        status: "Occupied"
      }
    }
  })

  const result = await store.updateRoom()

  expect(store.rooms[0].room_number).toBe("A2")
  expect(result.room_number).toBe("A2")
})


it('updates room status', async () => {
  const store = useRoomStore()

  store.rooms = [
    { id: 1, status: "Available" }
  ]

  api.patch.mockResolvedValueOnce({})

  await store.updateRoomStatus(1, true)

  expect(store.rooms[0].status).toBe("Occupied")
})
})
