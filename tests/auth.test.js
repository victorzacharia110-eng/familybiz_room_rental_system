import { describe, it, expect, vi, beforeEach } from "vitest"
import { setActivePinia, createPinia } from "pinia"
import { useAuthStore } from "@/stores/auth"

// mock API
vi.mock('@/composables/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn()
  }
}))

import api from '@/composables/api'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('Auth Store', () => {

  it('logs in user successfully', async () => {
    const store = useAuthStore()

    api.get.mockResolvedValueOnce({}) // csrf
    api.post.mockResolvedValueOnce({
      data: { user: { id: 1, name: "Victor" } }
    })

    const result = await store.login({
      email: "test@mail.com",
      password: "123456"
    })

    expect(result.name).toBe("Victor")
    expect(store.user.name).toBe("Victor")
    expect(store.loading).toBe(false)
  })

  it('handles login error', async () => {
    const store = useAuthStore()

    api.get.mockResolvedValueOnce({})
    api.post.mockRejectedValueOnce({
      response: { data: { message: "Invalid credentials" } }
    })

    const result = await store.login({})

    expect(result).toBe(null)
    expect(store.error).toBe("Invalid credentials")
  })

  it('fetches single user', async () => {
    const store = useAuthStore()

    api.get
      .mockResolvedValueOnce({}) // csrf
      .mockResolvedValueOnce({
        data: { user: { id: 2, name: "John" } }
      })

    await store.fetchUser()

    expect(store.user.name).toBe("John")
  })

  it('fetches users list', async () => {
    const store = useAuthStore()

    api.get
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        data: {
          users: [{ id: 1 }, { id: 2 }]
        }
      })

    await store.fetchUsers()

    expect(store.users.length).toBe(2)
  })

  it('logs out user', async () => {
    const store = useAuthStore()

    store.user = { id: 1 }

    api.get.mockResolvedValueOnce({})
    api.post.mockResolvedValueOnce({})

    await store.logout()

    expect(store.user).toBe(null)
  })

  it('updates phone number', async () => {
    const store = useAuthStore()

    api.get.mockResolvedValueOnce({})
    api.patch.mockResolvedValueOnce({
      data: {
        user: { id: 1, phone_number: "123456789" }
      }
    })

    const response = await store.updatePhoneNumber(1, "123456789")

    expect(store.user.phone_number).toBe("123456789")
    expect(response).not.toBeNull()
  })

})