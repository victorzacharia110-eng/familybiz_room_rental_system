import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'

import HomeView from '../views/HomeView.vue'
import Login from '../components/Login.vue'
import Register from '../components/Register.vue'
import ForgotPassword from '../components/ForgotPassword.vue'
import LandLordDashboard from '../components/auth/LandLordDashboard.vue'
import TenantDashboard from '../components/auth/TenantDashboard.vue'
import SuperAdminDashboard from '../components/auth/SuperAdminDashboard.vue'
import RoomEdit from '@/components/auth/edits/RoomEdit.vue'
import PaymentEdit from '@/components/auth/edits/PaymentEdit.vue'
import PaymentMethodEdit from '@/components/auth/edits/PaymentMethodEdit.vue'
import AnnouncementEdit from '@/components/auth/edits/AnnouncementEdit.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresGuest: true },
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      component: Login,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      component: Register,
      meta: { requiresGuest: true },
    },
    {
      path: '/forgot-password',
      component: ForgotPassword,
      meta: { requiresGuest: true },
    },

    // role-based routes
    {
      path: '/admin',
      component: SuperAdminDashboard,
      meta: { requiresAuth: true, role: 'admin' },
    },
    {
      path: '/landlord',
      component: LandLordDashboard,
      meta: { requiresAuth: true, role: 'landlord' },
    },
    {
      path: '/tenant',
      component: TenantDashboard,
      meta: { requiresAuth: true, role: 'tenant' },
    },

    {
      path: '/room/show/:id',
      component: RoomEdit,
      meta: { requiresAuth: true },
    },

    {
      path: '/payment/show/:id',
      component: PaymentEdit,
      meta: { requiresAuth: true },
    },
    {
      path: '/method/show/:id',
      component: PaymentMethodEdit,
      meta: { requiresAuth: true },
    },
    {
      path: '/announcements/show/:id',
      component: AnnouncementEdit,
      meta: { requiresAuth: true },
    }
  ],
})

function getRole(user) {
  if (!user) return null
  if (user.is_super_admin) return 'admin'
  if (user.is_landlord) return 'landlord'
  return 'tenant'
}

function defaultPath(role) {
  if (role === 'admin') return '/admin'
  if (role === 'landlord') return '/landlord'
  return '/tenant'
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  const roomStore = useRoomStore()

  if (!auth.user) {
    await auth.fetchUser()
  }

  const role = getRole(auth.user)

  // not logged in
  if (to.meta.requiresAuth && !auth.user) {
    return '/login'
  }

  // guest-only pages (login/register/home)
  if (to.meta.requiresGuest && auth.user) {
    return defaultPath(role)
  }

  // role protection
  if (to.meta.role && to.meta.role !== role) {
    return defaultPath(role)
  }

  // Prefetch landlord dashboard stats
  if (to.path === '/landlord' && role === 'landlord') {
    await roomStore.fetchRooms()
    await auth.fetchUsers()
  }

  // Prefetch tenant dashboard stats
  if (to.path === '/tenant' && role === 'tenant') {
    await roomStore.fetchRooms()
    await auth.fetchUser()
  }
})

export default router
