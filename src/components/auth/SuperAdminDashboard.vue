<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAdminStore } from '@/stores/admin'
import { useRoomStore } from '@/stores/room'
import { useI18n } from 'vue-i18n'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faChartBar,
  faUsers,
  faUserTie,
  faUserGroup,
  faDoorOpen,
  faShield,
  faRightFromBracket,
  faBars,
  faXmark,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faKey,
  faToggleOn,
  faToggleOff,
  faSpinner,
  faHouse,
  faBell,
  faPencil,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faChartBar,
  faUsers,
  faUserTie,
  faUserGroup,
  faDoorOpen,
  faShield,
  faRightFromBracket,
  faBars,
  faXmark,
  faSearch,
  faCheckCircle,
  faTimesCircle,
  faKey,
  faToggleOn,
  faToggleOff,
  faSpinner,
  faHouse,
  faBell,
  faPencil,
)

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const admin = useAdminStore()
const roomStore = useRoomStore()

const isSidebarOpen = ref(false)
const activeTab = ref('overview')
const searchQuery = ref('')
const loadingAction = ref(null)

const openTab = (tab) => {
  activeTab.value = tab
  isSidebarOpen.value = false
}

const logoutUser = async () => {
  await auth.logout()
  router.push('/login')
}

const landlordSearch = ref('')
const tenantSearch = ref('')

const doLandlordSearch = () => admin.fetchLandlords(landlordSearch.value)
const doTenantSearch = () => admin.fetchTenants(tenantSearch.value)

const handleResetPassword = async (userId) => {
  const pw = prompt('Enter new password (min 8 chars):')
  if (!pw || pw.length < 8) return alert('Password must be at least 8 characters')
  loadingAction.value = userId
  const msg = await admin.resetPassword(userId, pw)
  loadingAction.value = null
  if (msg) {
    alert(msg)
    admin.fetchLandlords(landlordSearch.value)
    admin.fetchTenants(tenantSearch.value)
  } else alert(admin.error || 'Failed')
}

const handleToggleStatus = async (userId) => {
  loadingAction.value = userId
  const res = await admin.toggleUserStatus(userId)
  loadingAction.value = null
  if (res) {
    admin.fetchLandlords(landlordSearch.value)
    admin.fetchTenants(tenantSearch.value)
  } else alert(admin.error || 'Failed')
}

const landlordCount = computed(() => admin.landlords.length)
const tenantCount = computed(() => admin.tenants.length)
const roomCount = computed(() => roomStore.totalRooms)

onMounted(async () => {
  await auth.fetchUser()
  await admin.fetchLandlords()
  await admin.fetchTenants()
  await roomStore.fetchRooms()
})
</script>

<template>
  <div class="dash-shell" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-dot admin-dot"></span>
        <span>FamilyBiz</span>
        <span class="admin-badge-sm">{{ t('superAdmin') }}</span>
      </div>

      <nav class="sidebar-nav">
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeTab === 'overview' }"
          @click.prevent="openTab('overview')"
        >
          <font-awesome-icon icon="chart-bar" class="ni" /><span>{{ t('overview') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeTab === 'landlords' }"
          @click.prevent="openTab('landlords')"
        >
          <font-awesome-icon icon="user-tie" class="ni" /><span>{{ t('manageLandlords') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeTab === 'tenants' }"
          @click.prevent="openTab('tenants')"
        >
          <font-awesome-icon icon="user-group" class="ni" /><span>{{ t('manageTenants') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeTab === 'rooms' }"
          @click.prevent="openTab('rooms')"
        >
          <font-awesome-icon icon="door-open" class="ni" /><span>{{ t('rooms') }}</span>
        </a>
      </nav>

      <button class="sidebar-logout" @click="logoutUser">
        <font-awesome-icon icon="right-from-bracket" /> {{ t('logout') }}
      </button>
    </aside>

    <div class="sidebar-overlay" v-if="isSidebarOpen" @click="isSidebarOpen = false"></div>

    <!-- MAIN -->
    <main class="dash-main">
      <div class="hero-banner">
        <div class="hero-cubes" ref="cubesRef"></div>
        <div class="hero-scanlines"></div>
        <div class="hero-text">
          <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">
            <font-awesome-icon icon="bars" />
          </button>
          <div class="topbar-inner">
            <div>
              <div class="dash-badge"><span class="badge-dot"></span>{{ t('superAdmin') }}</div>
              <h1 class="dash-title">{{ t('adminDashboard') }}</h1>
              <p class="dash-sub" v-if="auth.user?.last_name">
                {{ t('welcomeBack') }}, {{ auth.user.last_name }}
              </p>
            </div>
            <div class="topbar-avatar">
              <font-awesome-icon icon="shield" />
            </div>
          </div>
        </div>
      </div>

      <!-- OVERVIEW TAB -->
      <div v-if="activeTab === 'overview'" class="dash-content">
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ t('systemOverview') }}</h2>
              <p class="sec-sub">{{ t('quickGlance') }}</p>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon"><font-awesome-icon icon="user-tie" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ landlordCount }}</span>
                <span class="stat-label">{{ t('landlords') }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon tenants"><font-awesome-icon icon="user-group" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ tenantCount }}</span>
                <span class="stat-label">{{ t('tenants') }}</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon rooms"><font-awesome-icon icon="door-open" /></div>
              <div class="stat-info">
                <span class="stat-value">{{ roomCount }}</span>
                <span class="stat-label">{{ t('rooms') }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- LANDLORDS TAB -->
      <div v-if="activeTab === 'landlords'" class="dash-content">
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ t('manageLandlords') }}</h2>
              <p class="sec-sub">{{ t('viewManageLandlords') }}</p>
            </div>
          </div>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="landlordSearch"
              class="search-input"
              :placeholder="t('searchLandlords')"
              @input="doLandlordSearch"
            />
          </div>
          <div v-if="admin.loading" class="loading-box">
            <font-awesome-icon icon="spinner" spin /> {{ t('loading') }}
          </div>
          <div v-else class="user-table-wrap">
            <table class="user-table">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('email') }}</th>
                  <th>{{ t('phone') }}</th>
                  <th>{{ t('status') }}</th>
                  <th>{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in admin.landlords" :key="u.id">
                  <td>{{ u.last_name || '—' }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone_number || '—' }}</td>
                  <td>
                    <span class="status-pill" :class="u.is_active ? 'active' : 'inactive'">
                      {{ u.is_active ? t('active') : t('inactive') }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button
                      class="icon-btn toggle"
                      :disabled="loadingAction === u.id"
                      @click="handleToggleStatus(u.id)"
                      :title="t('toggleStatus')"
                    >
                      <font-awesome-icon :icon="u.is_active ? 'toggle-on' : 'toggle-off'" />
                    </button>
                    <button
                      class="icon-btn reset"
                      :disabled="loadingAction === u.id"
                      @click="handleResetPassword(u.id)"
                      :title="t('resetPassword')"
                    >
                      <font-awesome-icon icon="key" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!admin.landlords.length">
                  <td colspan="5" class="empty-row">{{ t('noLandlordsFound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- TENANTS TAB -->
      <div v-if="activeTab === 'tenants'" class="dash-content">
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ t('manageTenants') }}</h2>
              <p class="sec-sub">{{ t('viewManageTenants') }}</p>
            </div>
          </div>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="tenantSearch"
              class="search-input"
              :placeholder="t('searchTenants')"
              @input="doTenantSearch"
            />
          </div>
          <div v-if="admin.loading" class="loading-box">
            <font-awesome-icon icon="spinner" spin /> {{ t('loading') }}
          </div>
          <div v-else class="user-table-wrap">
            <table class="user-table">
              <thead>
                <tr>
                  <th>{{ t('name') }}</th>
                  <th>{{ t('email') }}</th>
                  <th>{{ t('phone') }}</th>
                  <th>{{ t('room') }}</th>
                  <th>{{ t('status') }}</th>
                  <th>{{ t('actions') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="u in admin.tenants" :key="u.id">
                  <td>{{ u.last_name || '—' }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone_number || '—' }}</td>
                  <td>{{ u.room?.room_number || '—' }}</td>
                  <td>
                    <span class="status-pill" :class="u.is_active ? 'active' : 'inactive'">
                      {{ u.is_active ? t('active') : t('inactive') }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button
                      class="icon-btn toggle"
                      :disabled="loadingAction === u.id"
                      @click="handleToggleStatus(u.id)"
                      :title="t('toggleStatus')"
                    >
                      <font-awesome-icon :icon="u.is_active ? 'toggle-on' : 'toggle-off'" />
                    </button>
                    <button
                      class="icon-btn reset"
                      :disabled="loadingAction === u.id"
                      @click="handleResetPassword(u.id)"
                      :title="t('resetPassword')"
                    >
                      <font-awesome-icon icon="key" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!admin.tenants.length">
                  <td colspan="6" class="empty-row">{{ t('noTenantsFound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- ROOMS TAB -->
      <div v-if="activeTab === 'rooms'" class="dash-content">
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ t('allRooms') }}</h2>
              <p class="sec-sub">{{ t('systemWideRoomOverview') }}</p>
            </div>
          </div>
          <div class="user-table-wrap">
            <table class="user-table">
              <thead>
                <tr>
                  <th>{{ t('roomNumber') }}</th>
                  <th>{{ t('type') }}</th>
                  <th>{{ t('price') }}</th>
                  <th>{{ t('status') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="r in roomStore.rooms" :key="r.id">
                  <td>{{ r.room_number }}</td>
                  <td>{{ r.type }}</td>
                  <td>{{ r.room_price ? Number(r.room_price).toLocaleString() : '—' }}</td>
                  <td>
                    <span
                      class="status-pill"
                      :class="
                        r.status === 'Occupied'
                          ? 'occupied'
                          : r.status === 'Available'
                            ? 'active'
                            : 'inactive'
                      "
                    >
                      {{ r.status }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!roomStore.rooms.length">
                  <td colspan="4" class="empty-row">{{ t('noRoomsFound') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.dash-shell {
  display: flex;
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
  color: #e2e8f0;
  background: #0a0f1a;
}

/* SIDEBAR */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 240px;
  background: rgba(10, 15, 26, 0.95);
  border-right: 1px solid rgba(20, 184, 166, 0.1);
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  transition: 0.3s;
}
.sidebar-logo {
  padding: 0 20px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 18px;
  color: #fff;
}
.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #14b8a6;
}
.admin-dot {
  background: #f59e0b;
}
.admin-badge-sm {
  font-size: 9px;
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 8px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: 0.2s;
  cursor: pointer;
}
.nav-item:hover,
.nav-item.on {
  background: rgba(20, 184, 166, 0.1);
  color: #14b8a6;
}
.ni {
  width: 18px;
  text-align: center;
  font-size: 14px;
}
.sidebar-logout {
  margin: 12px 8px 0;
  padding: 10px;
  border: 1px solid rgba(239, 68, 68, 0.2);
  background: rgba(239, 68, 68, 0.05);
  color: #ef4444;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: 0.2s;
}
.sidebar-logout:hover {
  background: rgba(239, 68, 68, 0.15);
}
.sidebar-overlay {
  display: none;
}

/* MAIN */
.dash-main {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
}
.hero-banner {
  position: relative;
  background: linear-gradient(135deg, #0f172a 0%, #0a1628 50%, #0d1a2d 100%);
  padding: 24px 32px 20px;
  overflow: hidden;
  border-bottom: 1px solid rgba(20, 184, 166, 0.1);
}
.hero-scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(20, 184, 166, 0.015) 2px,
    rgba(20, 184, 166, 0.015) 4px
  );
  pointer-events: none;
}
.hero-text {
  position: relative;
  z-index: 2;
}
.menu-btn {
  display: none;
  background: none;
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #14b8a6;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 16px;
  cursor: pointer;
  margin-bottom: 8px;
}
.topbar-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.dash-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #f59e0b;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
.dash-title {
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  letter-spacing: -0.3px;
}
.dash-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}
.topbar-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f59e0b;
  font-size: 18px;
}

/* CONTENT */
.dash-content {
  padding: 24px 32px;
}
.glass-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  position: relative;
}
.glass-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.3), transparent);
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.sec-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}
.sec-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  margin-top: 2px;
}

/* STATS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: rgba(20, 184, 166, 0.05);
  border: 1px solid rgba(20, 184, 166, 0.12);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: 0.2s;
}
.stat-card:hover {
  border-color: rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}
.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(20, 184, 166, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #14b8a6;
  font-size: 18px;
}
.stat-icon.tenants {
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
}
.stat-icon.rooms {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}
.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 24px;
  font-weight: 900;
  color: #fff;
}
.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* SEARCH */
.search-bar {
  position: relative;
  margin-bottom: 16px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.25);
  font-size: 13px;
}
.search-input {
  width: 100%;
  padding: 10px 14px 10px 38px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: 0.2s;
}
.search-input:focus {
  border-color: rgba(20, 184, 166, 0.4);
}

/* TABLE */
.loading-box {
  text-align: center;
  padding: 32px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.user-table-wrap {
  overflow-x: auto;
}
.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.user-table th {
  text-align: left;
  padding: 10px 12px;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.user-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.7);
}
.user-table tr:hover td {
  background: rgba(20, 184, 166, 0.03);
}
.empty-row {
  text-align: center;
  color: rgba(255, 255, 255, 0.25);
  padding: 24px !important;
}

/* STATUS PILL */
.status-pill {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}
.status-pill.active {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}
.status-pill.inactive {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}
.status-pill.occupied {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

/* ACTION BUTTONS */
.actions-cell {
  display: flex;
  gap: 6px;
}
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  transition: 0.2s;
}
.icon-btn.toggle:hover {
  border-color: rgba(20, 184, 166, 0.4);
  color: #14b8a6;
  background: rgba(20, 184, 166, 0.1);
}
.icon-btn.reset:hover {
  border-color: rgba(245, 158, 11, 0.4);
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}
.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
  .sidebar-open .sidebar {
    transform: translateX(0);
  }
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 99;
  }
  .dash-main {
    margin-left: 0;
  }
  .menu-btn {
    display: block;
  }
  .dash-content {
    padding: 16px;
  }
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
