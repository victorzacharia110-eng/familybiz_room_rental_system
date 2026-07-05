<script setup>
import Footer from './Footer.vue'
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { usePaymentStore } from '@/stores/payment'
import { usePaymentMethodStore } from '@/stores/paymentMethod'
import { useLatePaymentReasonStore } from '@/stores/latePaymentReason'
import { useCommentStore } from '@/stores/comment'
import { useAnnouncementStore } from '@/stores/announcement'
import { useCriticalRemarkStore } from '@/stores/criticalRemark'
import { useFootballStore } from '@/stores/entertainment/football.js'
import EntertainmentModal from './EntertainmentModal.vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SkeletonLoader from './SkeletonLoader.vue'
import PaginationControls from './PaginationControls.vue'
import { usePagination } from '@/composables/usePagination'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faChartBar,
  faBullhorn,
  faComments,
  faUser,
  faLock,
  faDoorOpen,
  faCreditCard,
  faRightFromBracket,
  faBars,
  faBuilding,
  faCheckCircle,
  faHouse,
  faMoneyBill,
  faXmark,
  faMobileAlt,
  faTrash,
  faFloppyDisk,
  faBan,
  faStar,
  faTriangleExclamation,
  faKey,
  faSpinner,
  faEnvelope,
  faEye,
  faInfoCircle,
  faTv,
  faFutbol,
  faTrophy,
  faCalendarAlt,
  faSearch,
  faSync,
  faFilm,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faChartBar,
  faBullhorn,
  faComments,
  faUser,
  faLock,
  faDoorOpen,
  faCreditCard,
  faRightFromBracket,
  faBars,
  faBuilding,
  faCheckCircle,
  faHouse,
  faMoneyBill,
  faXmark,
  faMobileAlt,
  faTrash,
  faFloppyDisk,
  faBan,
  faStar,
  faTriangleExclamation,
  faKey,
  faSpinner,
  faEnvelope,
  faEye,
  faInfoCircle,
  faTv,
  faFutbol,
  faTrophy,
  faCalendarAlt,
  faSearch,
  faSync,
  faFilm,
)

const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const paymentStore = usePaymentStore()
const paymentMethodStore = usePaymentMethodStore()
const latePaymentReasonStore = useLatePaymentReasonStore()
const commentStore = useCommentStore()
const announcementStore = useAnnouncementStore()
const criticalRemarkStore = useCriticalRemarkStore()

const { totalRooms, roomsAvailableCount } = storeToRefs(roomStore)

const successLatePaymentReasonSubmissionMessage = ref('')
const successCommentMessage = ref('')
const successUpdateRoomStatus = ref('')
const successPasswordResetMessage = ref('')

// Add to state for entertainment modal
const footballStore = useFootballStore()
const activeEntertainmentModal = ref(null)

// Add modal functions
const openEntertainmentModal = (modalName) => {
  activeEntertainmentModal.value = modalName
}

const closeEntertainmentModal = () => {
  activeEntertainmentModal.value = null
}
// ----------------------------------------------------
const logoutUser = () => {
  auth.logout()
  router.push('/login')
}

const activeRoomsModal = ref(null)
const activePaymentMethod = ref(null)
const activeProfileModal = ref(null)
const activeCommentsModal = ref(null)
const activeAnnouncementModal = ref(null)
const activePasswordResetModal = ref(null)
const activeRemarksModal = ref(null) // NEW: for remarks modal

// NEW: Computed for tenant's own remarks
const myRemarks = computed(() => {
  return criticalRemarkStore.criticalRemarks?.filter((r) => r.user_id === auth.user?.id) || []
})

// NEW: Count critical remarks for warning
const criticalCount = computed(() => {
  return myRemarks.value.filter((r) => r.type === 'critical' && r.active).length
})

// NEW: Modal functions for remarks
const openRemarksModal = async (modalName) => {
  activeRemarksModal.value = modalName
  if (modalName === 'remarks') {
    await criticalRemarkStore.fetchCriticalRemarks()
  }
}
const closeRemarksModal = () => {
  activeRemarksModal.value = null
}

async function submitLateReason(payment) {
  if (latePaymentReasonStore.latePaymentReasons?.length >= 3) {
    alert('You have reached the maximum of 3 late payment submissions!')
    return
  }
  const reason_text = prompt(
    'Please enter your reason for late payment. Note: Max 3 submissions allowed.',
  )
  if (reason_text) {
    await latePaymentReasonStore.registerLatePaymentReasons({ payment_id: payment.id, reason_text })
    successLatePaymentReasonSubmissionMessage.value = 'Reason submitted successfully!'
    setTimeout(() => {
      successLatePaymentReasonSubmissionMessage.value = ''
    }, 3000)
    await paymentStore.fetchPayments()
  }
}

const paymentForm = ref({
  room_id: '',
  month: '',
  year: new Date().getFullYear(),
  due_date: '',
  amount: '',
  status: 'paid',
})

const savePayment = async () => {
  const response = await paymentStore.registerPayment(paymentForm.value)
  if (response) {
    alert('Payment registered successfully!')
    paymentForm.value = {
      room_id: '',
      month: '',
      year: '',
      due_date: '',
      amount: '',
      status: 'paid',
    }
    await paymentStore.fetchPayments()
  } else {
    alert('Failed to register payment')
  }
}

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const openRoomsModal = (modalName) => {
  activeRoomsModal.value = modalName
  if (modalName === 'rooms') { roomFetching(); resetRoomsPage() }
}
const closeRoomsModal = () => {
  activeRoomsModal.value = null
}
const roomFetching = async () => {
  await roomStore.fetchRooms()
  await roomStore.updateRoomStatus()
}
const isDisabled = (room) => room.status === 'Occupied' && room.user_id !== auth.user?.id
const confirmText = 'CONFIRMED'
const confirmToggle = async (room, checked) => {
  if (room.status === 'Occupied' && room.user_id !== auth.user?.id) {
    alert('This room is already occupied by another user')
    return
  }
  const input = prompt(`Type "${confirmText}" to confirm`)
  if (input?.trim() === confirmText) {
    await updatingRoomStatus(room.id, checked)
    successUpdateRoomStatus.value = 'Action completed successfully!'
    setTimeout(() => {
      successUpdateRoomStatus.value = ''
    }, 3000)
    await roomStore.fetchRooms()
  } else {
    alert('Incorrect text. Action Cancelled')
  }
}
const updatingRoomStatus = async (id, checked) => await roomStore.updateRoomStatus(id, checked)

const openPaymentMethodModal = (ModalName) => {
  activePaymentMethod.value = ModalName
  if (ModalName === 'paymentMethod') { paymentMethodFetching(); resetPaymentMethodsPage() }
}
const closePaymentMethodModal = () => {
  activePaymentMethod.value = null
}
const paymentMethodFetching = async () => await paymentMethodStore.fetchPaymentMethods()

const openProfileModal = (ModalName) => {
  activeProfileModal.value = ModalName
  if (ModalName === 'profile') profileFetching()
}
const closeProfileModal = () => {
  activeProfileModal.value = null
}
const profileFetching = async () => await auth.fetchUser()
const updatingPhoneNumber = async (user) => {
  const newPhone = prompt('Enter new phone number:')
  if (!newPhone || !newPhone.trim()) return
  const response = await auth.updatePhoneNumber(user.id, newPhone)
  if (response) {
    alert('Phone number updated successfully!')
    await auth.fetchUser()
  } else alert(auth.error || 'Failed to update phone number')
}

const openCommentsModal = (ModalName) => {
  activeCommentsModal.value = ModalName
  if (ModalName === 'comments') { commentFetching(); resetCommentsPage() }
}
const closeCommentsModal = () => {
  activeCommentsModal.value = null
}
const commentForm = ref({ comment: '', rating: 5 })
const commentFetching = async () => await commentStore.fetchComments()
const saveComment = async () => {
  const response = await commentStore.registerComments(commentForm.value)
  if (response) {
    successCommentMessage.value = 'Comment added successfully!'
    commentForm.value.comment = ''
    commentForm.value.rating = 5
    setTimeout(() => {
      successCommentMessage.value = ''
    }, 3000)
    await commentFetching()
  }
}
const deleteComment = async (id) => {
  if (!confirm('Delete this comment permanently?')) return
  const res = await commentStore.deleteComment(id)
  alert(res ? 'Comment deleted!' : 'Failed to delete comment')
  await commentFetching()
}

const openAnnouncementModal = async (ModalName) => {
  activeAnnouncementModal.value = ModalName
  if (ModalName === 'announcements') {
    await announcementsFetching()
    resetAnnouncementsPage()
    const announcements = announcementStore.announcements
    if (announcements.length > 0)
      localStorage.setItem('lastSeenAnnouncementId', announcements[0].id)
  }
}
const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}
const announcementsFetching = async () => await announcementStore.fetchAnnouncements()
const hasNewAnnouncements = computed(() => {
  const announcements = announcementStore.announcements
  if (!announcements.length) return false
  return String(announcements[0].id) !== localStorage.getItem('lastSeenAnnouncementId')
})

const openPasswordResetModal = (ModalName) => {
  activePasswordResetModal.value = ModalName
  if (ModalName === 'passwordReset') passwordResetForm.value.email = auth.user?.email || ''
}
const closePasswordResetModal = () => {
  activePasswordResetModal.value = null
  successPasswordResetMessage.value = ''
  passwordResetForm.value.email = ''
}
const passwordResetForm = ref({ email: '' })
const sendPasswordResetLink = async () => {
  const response = await auth.requestPasswordReset(passwordResetForm.value.email)
  if (response) {
    successPasswordResetMessage.value = 'Reset link sent!'
    setTimeout(() => closePasswordResetModal(), 3000)
  }
}

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

const { locale } = useI18n()
const currentLocale = ref(locale.value)
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const isSidebarOpen = ref(false)

const searchRooms = ref('')
const searchPaymentMethods = ref('')
const searchComments = ref('')
const searchAnnouncements = ref('')

const filteredRooms = computed(() => {
  if (!roomStore.rooms) return []
  const q = searchRooms.value.toLowerCase()
  if (!q) return roomStore.rooms
  return roomStore.rooms.filter(
    (r) =>
      (r.room_number || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.status || '').toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedRooms, currentPage: rp, totalPages: rtp, showingFrom: rsf, showingTo: rst, totalItems: rti, goToPage: rgp, resetPage: resetRoomsPage } = usePagination(filteredRooms)

const filteredPaymentMethods = computed(() => {
  if (!paymentMethodStore.paymentMethods) return []
  const q = searchPaymentMethods.value.toLowerCase()
  if (!q) return paymentMethodStore.paymentMethods
  return paymentMethodStore.paymentMethods.filter(
    (pm) =>
      String(pm.airtel_money_number || '').includes(q) ||
      String(pm.m_pesa_number || '').includes(q) ||
      String(pm.mixx_by_yas_number || '').includes(q) ||
      String(pm.halopesa_number || '').includes(q) ||
      String(pm.nmb_account_number || '').includes(q) ||
      String(pm.crdb_account_number || '').includes(q) ||
      String(pm.nbc_account_number || '').includes(q),
  )
})
const { paginatedData: paginatedPaymentMethods, currentPage: pmp, totalPages: pmtp, showingFrom: pmsf, showingTo: pmst, totalItems: pmti, goToPage: pmgp, resetPage: resetPaymentMethodsPage } = usePagination(filteredPaymentMethods)

const filteredComments = computed(() => {
  if (!commentStore.comments) return []
  const q = searchComments.value.toLowerCase()
  if (!q) return commentStore.comments
  return commentStore.comments.filter(
    (c) =>
      (c.user?.last_name || '').toLowerCase().includes(q) ||
      (c.comment || '').toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedComments, currentPage: cp, totalPages: ctp, showingFrom: csf, showingTo: cst, totalItems: cti, goToPage: cgp, resetPage: resetCommentsPage } = usePagination(filteredComments)

const filteredAnnouncements = computed(() => {
  if (!announcementStore.announcements) return []
  const q = searchAnnouncements.value.toLowerCase()
  if (!q) return announcementStore.announcements
  return announcementStore.announcements.filter(
    (a) =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.message || '').toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedAnnouncements, currentPage: ap, totalPages: atp, showingFrom: asf, showingTo: ast, totalItems: ati, goToPage: agp, resetPage: resetAnnouncementsPage } = usePagination(filteredAnnouncements)

const house = ref({ images: ['/assets/room1.jpg', '/assets/room2.jpg', '/assets/common.jpg'] })

const paymentLoading = ref(true)
onMounted(async () => {
  await auth.fetchUser()
  await roomStore.fetchRooms()
  await roomStore.updateRoomStatus()
  await paymentStore.fetchPayment()
  paymentLoading.value = false
  await paymentMethodStore.fetchPaymentMethods()
  await announcementStore.fetchAnnouncements()
  await criticalRemarkStore.fetchCriticalRemarks() // NEW: fetch remarks on mount
  if (announcementStore.announcements.length > 0) activeAnnouncementModal.value = 'announcements'
})
</script>

<template>
  <div class="dash-shell" :class="{ 'sidebar-open': isSidebarOpen }">
    <!-- ══════ SIDEBAR ══════ -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-dot"></span>
        <span>FamilyBiz</span>
      </div>

      <nav class="sidebar-nav">
        <router-link to="/tenant" class="nav-item active">
          <font-awesome-icon icon="chart-bar" class="ni" /><span>{{ $t('dashboard') }}</span>
        </router-link>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          <font-awesome-icon icon="bullhorn" class="ni" /><span>{{ $t('Announcements') }}</span>
          <span v-if="hasNewAnnouncements" class="badge-new"></span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeCommentsModal === 'comments' }"
          @click.prevent="openCommentsModal('comments')"
        >
          <font-awesome-icon icon="comments" class="ni" /><span>{{ $t('Comments') }}</span>
        </a>
        <!-- NEW: View Remarks link in sidebar -->
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeRemarksModal === 'remarks' }"
          @click.prevent="openRemarksModal('remarks')"
        >
          <font-awesome-icon icon="eye" class="ni" /><span>{{
            $t('viewRemarks') || 'View Remarks'
          }}</span>
          <span v-if="criticalCount > 0" class="badge-new"></span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeProfileModal === 'profile' }"
          @click.prevent="openProfileModal('profile')"
        >
          <font-awesome-icon icon="user" class="ni" /><span>{{ $t('profile') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePasswordResetModal === 'passwordReset' }"
          @click.prevent="openPasswordResetModal('passwordReset')"
        >
          <font-awesome-icon icon="lock" class="ni" /><span>{{ $t('resetPassword') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeRoomsModal === 'rooms' }"
          @click.prevent="openRoomsModal('rooms')"
        >
          <font-awesome-icon icon="door-open" class="ni" /><span>{{ $t('viewRooms') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentMethod === 'paymentMethod' }"
          @click.prevent="openPaymentMethodModal('paymentMethod')"
        >
          <font-awesome-icon icon="credit-card" class="ni" /><span>{{ $t('paymentMethods') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeEntertainmentModal === 'entertainment' }"
          @click.prevent="openEntertainmentModal('entertainment')"
        >
          <font-awesome-icon icon="tv" class="ni" />
          <span>{{ $t('entertainment') || 'Entertainment' }}</span>
        </a>
      </nav>

      <button class="sidebar-logout" @click="logoutUser">
        <font-awesome-icon icon="right-from-bracket" /> {{ $t('logout') }}
      </button>
    </aside>

    <div class="sidebar-overlay" v-if="isSidebarOpen" @click="isSidebarOpen = false"></div>

    <!-- ══════ MAIN ══════ -->
    <main class="dash-main">
      <div class="hero-banner">
        <div class="hero-text">
          <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">
            <font-awesome-icon icon="bars" />
          </button>
          <div class="topbar-inner">
            <div>
              <div class="dash-badge"><span class="badge-dot"></span>Tenant Portal</div>
              <h1 class="dash-title">{{ $t('tenantDashboard') }}</h1>
              <p class="dash-sub" v-if="auth.user?.last_name">
                {{ $t('welcome') }}, <strong>{{ auth.user.last_name }}</strong> —
                {{ $t('manageYourRental') }}
              </p>
            </div>
            <div class="topbar-right">
              <div class="lang-row">
                <button
                  class="lbtn"
                  :class="{ on: currentLocale === 'en' }"
                  @click="setLanguage('en')"
                >
                  🇬🇧 EN
                </button>
                <button
                  class="lbtn"
                  :class="{ on: currentLocale === 'sw' }"
                  @click="setLanguage('sw')"
                >
                  🇹🇿 SW
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="main-body">
        <!-- STATS -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon"><font-awesome-icon icon="building" /></div>
            <div>
              <div class="stat-val">{{ totalRooms }}</div>
              <div class="stat-lbl">{{ $t('totalRooms') }}</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><font-awesome-icon icon="check-circle" /></div>
            <div>
              <div class="stat-val">{{ roomsAvailableCount }}</div>
              <div class="stat-lbl">{{ $t('availableRooms') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><font-awesome-icon icon="house" /></div>
            <div>
              <div class="stat-val">
                <span v-if="auth.user?.room">{{ auth.user.room.room_number }}</span>
                <span v-else>{{ $t('noRoomAssigned') }}</span>
              </div>
              <div class="stat-lbl">{{ $t('yourRoom') }}</div>
            </div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon"><font-awesome-icon icon="money-bill" /></div>
            <div>
              <div class="stat-val">{{ paymentStore.count_tenant_unpaid_payment || 0 }}</div>
              <div class="stat-lbl">{{ $t('paymentsDue') }}</div>
            </div>
          </div>
        </section>

        <!-- PAYMENT HISTORY -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('rentPayments') }}</h2>
              <p class="sec-sub">{{ $t('yourPaymentHistory') }}</p>
            </div>
          </div>
          <Transition name="alert-pop">
            <div v-if="successLatePaymentReasonSubmissionMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" />
              {{ successLatePaymentReasonSubmissionMessage }}
            </div>
          </Transition>
          <div class="table-wrap">
            <div v-if="paymentLoading" class="payment-skeleton">
              <div class="skeleton"></div>
              <div class="skeleton"></div>
              <div class="skeleton"></div>
            </div>
            <table v-else-if="paymentStore.tenant_payment">
              <thead>
                <tr>
                  <th>{{ $t('Month') }}</th>
                  <th>{{ $t('Due Date') }}</th>
                  <th>{{ $t('Payment Status') }}</th>
                  <th>{{ $t('Action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ paymentStore.tenant_payment.month_name }}</td>
                  <td>{{ paymentStore.tenant_payment.due_date_formatted }}</td>
                  <td>
                    <span class="status-pill" :class="paymentStore.tenant_payment.status">
                      <font-awesome-icon
                        v-if="paymentStore.tenant_payment.status === 'paid'"
                        icon="check-circle"
                      />
                      {{ paymentStore.tenant_payment.status }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-sm"
                      @click="submitLateReason(paymentStore.tenant_payment)"
                      :disabled="paymentStore.tenant_payment.status === 'paid'"
                    >
                      {{ $t('submitLateReason') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="no-data">
              <font-awesome-icon icon="ban" /> {{ $t('noPaymentData') }}
            </div>
          </div>
        </section>

        <!-- HOUSE GALLERY -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('houseGallery') }}</h2>
              <p class="sec-sub">{{ $t('propertyImages') }}</p>
            </div>
          </div>
          <div class="gallery-grid">
            <div v-for="(img, idx) in house.images" :key="idx" class="gallery-card">
              <div class="gallery-placeholder">
                <font-awesome-icon icon="house" class="gallery-icon" /> Room {{ idx + 1 }}
              </div>
            </div>
          </div>
        </section>

        <!-- RULES -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('tenantRulesPolicies') }}</h2>
              <p class="sec-sub">{{ $t('communityGuidelines') }}</p>
            </div>
          </div>
          <ul class="rules-list">
            <li>{{ $t('maintainCleanliness') }}</li>
            <li>{{ $t('noGangs') }}</li>
            <li>{{ $t('rentOnTime') }}</li>
            <li>{{ $t('maxLateReasons') }}</li>
            <li>{{ $t('noIllegalParties') }}</li>
          </ul>
        </section>

        <Footer />
      </div>
    </main>

    <!-- ══════ MODALS ══════ -->

    <!-- NEW: REMARKS MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activeRemarksModal === 'remarks'"
        class="modal-overlay"
        @click.self="closeRemarksModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="eye" /> {{ $t('yourRemarks') || 'Your Remarks' }}</h3>
            <button class="close-x" @click="closeRemarksModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <div class="remarks-info">
            <p class="info-text">
              <font-awesome-icon icon="info-circle" />
              {{ $t('remarksDescription') || 'These are private remarks from your landlord.' }}
            </p>
            <p v-if="criticalCount >= 3" class="warning-text">
              <font-awesome-icon icon="triangle-exclamation" />
              {{
                $t('criticalRemarksWarning') ||
                'You have 3 or more critical remarks. Please address them urgently!'
              }}
            </p>
          </div>

          <!-- CARD LAYOUT INSTEAD OF TABLE -->
          <div v-if="myRemarks.length" class="remarks-cards-grid">
            <div v-for="(remark, index) in myRemarks" :key="remark.id" class="remark-card">
              <div class="remark-card-header">
                <span class="remark-number">#{{ index + 1 }}</span>
                <span class="type-pill" :class="remark.type">
                  <font-awesome-icon
                    :icon="remark.type === 'critical' ? 'triangle-exclamation' : 'info-circle'"
                  />
                  {{ remark.type }}
                </span>
                <span
                  class="status-pill"
                  :class="{ active: remark.active, inactive: !remark.active }"
                >
                  {{ remark.active ? $t('active') || 'Active' : $t('resolved') || 'Resolved' }}
                </span>
              </div>
              <div class="remark-card-body">
                <div class="remark-reason">
                  <strong
                    ><font-awesome-icon icon="comment" /> {{ $t('reason') || 'Reason' }}:</strong
                  >
                  <p>{{ remark.reason_text }}</p>
                </div>
                <div class="remark-date">
                  <strong
                    ><font-awesome-icon icon="calendar-alt" /> {{ $t('date') || 'Date' }}:</strong
                  >
                  <span>{{ formatDate(remark.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-data">
            <font-awesome-icon icon="check-circle" />
            {{ $t('noRemarks') || 'No remarks have been added for you yet.' }}
          </div>
        </div>
      </div>
    </Transition>

    <!-- ROOMS MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeRoomsModal === 'rooms'" class="modal-overlay" @click.self="closeRoomsModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="door-open" /> {{ $t('viewRooms') }}</h3>
            <button class="close-x" @click="closeRoomsModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successUpdateRoomStatus" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successUpdateRoomStatus }}
            </div>
          </Transition>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchRooms"
              class="search-input"
              placeholder="Search rooms..."
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingRooms') }}</h4>
            <SkeletonLoader v-if="roomStore.loading" :rows="4" :cols="6" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('room') }}</th>
                  <th>{{ $t('type') }}</th>
                  <th>{{ $t('status') }}</th>
                  <th>{{ $t('roomPrice') }}</th>
                  <th>{{ $t('action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedRooms.length">
                  <td colspan="6" class="no-data"><font-awesome-icon icon="ban" /> No Rooms</td>
                </tr>
                <tr v-else v-for="(room, index) in paginatedRooms" :key="room?.id">
                  <td class="idx">{{ rsf + index }}</td>
                  <td>
                    <strong>{{ room?.room_number || 'N/A' }}</strong>
                  </td>
                  <td>{{ room?.type || 'Unknown' }}</td>
                  <td>
                    <span class="status-pill" :class="room?.status?.toLowerCase()">{{
                      room?.status || 'Unknown'
                    }}</span>
                  </td>
                  <td>TZS {{ room?.room_price?.toLocaleString() }}</td>
                  <td>
                    <input
                      type="checkbox"
                      :checked="room.status === 'Occupied'"
                      :disabled="isDisabled(room)"
                      @click.prevent="confirmToggle(room, $event.target.checked)"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="rp"
              :total-pages="rtp"
              :showing-from="rsf"
              :showing-to="rst"
              :total-items="rti"
              @page-change="rgp"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- PAYMENT METHOD MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activePaymentMethod === 'paymentMethod'"
        class="modal-overlay"
        @click.self="closePaymentMethodModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="credit-card" /> {{ $t('paymentMethodManagement') }}</h3>
            <button class="close-x" @click="closePaymentMethodModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="payment-alert">
            {{ $t('method1Warning') }}<br />
            <span style="color: #f87171"
              ><font-awesome-icon icon="triangle-exclamation" />
              {{ $t('method1ApprovalWarning') }}</span
            >
          </div>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchPaymentMethods"
              class="search-input"
              placeholder="Search payment methods..."
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingPaymentMethods') }}</h4>
            <SkeletonLoader v-if="paymentMethodStore.loading" :rows="4" :cols="8" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Airtel</th>
                  <th>M-Pesa</th>
                  <th>Mixx</th>
                  <th>HaloPesa</th>
                  <th>NMB</th>
                  <th>CRDB</th>
                  <th>NBC</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedPaymentMethods.length">
                  <td colspan="8" class="no-data"><font-awesome-icon icon="ban" /> No Payment Methods</td>
                </tr>
                <tr v-else v-for="(pm, index) in paginatedPaymentMethods" :key="pm.id">
                  <td class="idx">{{ pmsf + index }}</td>
                  <td>{{ pm.airtel_money_number || 'N/A' }}</td>
                  <td>{{ pm.m_pesa_number || 'N/A' }}</td>
                  <td>{{ pm.mixx_by_yas_number || 'N/A' }}</td>
                  <td>{{ pm.halopesa_number || 'N/A' }}</td>
                  <td>{{ pm.nmb_account_number || 'N/A' }}</td>
                  <td>{{ pm.crdb_account_number || 'N/A' }}</td>
                  <td>{{ pm.nbc_account_number || 'N/A' }}</td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="pmp"
              :total-pages="pmtp"
              :showing-from="pmsf"
              :showing-to="pmst"
              :total-items="pmti"
              @page-change="pmgp"
            />
          </div>
          <hr class="divider" />
          <h4 class="section-subtitle">{{ $t('method2Title') }}</h4>
          <div class="payment-alert">{{ $t('method2Warning') }}</div>
          <form @submit.prevent="savePayment">
            <div class="form-2col">
              <div class="mfield">
                <label>{{ $t('room') }}</label>
                <select v-model="paymentForm.room_id" required>
                  <option disabled value="">{{ $t('selectRoom') }}</option>
                  <option v-for="room in roomStore.rooms" :key="room.id" :value="room.id">
                    {{ room.room_number }} - TZS {{ room.room_price }} - {{ room.status }}
                  </option>
                </select>
              </div>
              <div class="mfield">
                <label>{{ $t('Amount') }}</label
                ><input v-model="paymentForm.amount" type="number" required placeholder="0" />
              </div>
              <div class="mfield">
                <label>{{ $t('month') }}</label>
                <select v-model="paymentForm.month" required>
                  <option disabled value="">{{ $t('selectMonth') }}</option>
                  <option v-for="(name, idx) in months" :key="idx" :value="idx + 1">
                    {{ name }}
                  </option>
                </select>
              </div>
              <div class="mfield">
                <label>{{ $t('Year') }}</label
                ><input v-model="paymentForm.year" type="number" required placeholder="2025" />
              </div>
              <div class="mfield">
                <label>{{ $t('Due Date') }}</label
                ><input v-model="paymentForm.due_date" type="date" required />
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="floppy-disk" /> {{ $t('Make Payment') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- PROFILE MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activeProfileModal === 'profile'"
        class="modal-overlay"
        @click.self="closeProfileModal"
      >
        <div class="glass-modal">
          <div class="modal-top">
            <h3><font-awesome-icon icon="user" /> {{ $t('userProfile') }}</h3>
            <button class="close-x" @click="closeProfileModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="profile-box">
            <div class="profile-avatar"><font-awesome-icon icon="user" /></div>
            <div class="profile-details">
              <div class="mfield">
                <label>{{ $t('Last Name') }}</label>
                <p>{{ auth.user?.last_name || 'N/A' }}</p>
              </div>
              <div class="mfield">
                <label>{{ $t('email') }}</label>
                <p>{{ auth.user?.email || 'N/A' }}</p>
              </div>
              <div class="mfield">
                <label>{{ $t('Phone Number') }}</label>
                <p>{{ auth.user?.phone_number || 'N/A' }}</p>
                <button
                  class="btn-teal"
                  style="margin-top: 8px"
                  @click="updatingPhoneNumber(auth.user)"
                >
                  <font-awesome-icon icon="mobile-alt" /> {{ $t('updatePhone') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- COMMENTS MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activeCommentsModal === 'comments'"
        class="modal-overlay"
        @click.self="closeCommentsModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="comments" /> {{ $t('Comments') }}</h3>
            <button class="close-x" @click="closeCommentsModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successCommentMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successCommentMessage }}
            </div>
          </Transition>
          <form @submit.prevent="saveComment">
            <div class="mfield">
              <label>{{ $t('Comment') }}</label
              ><textarea
                v-model="commentForm.comment"
                placeholder="Write your comment..."
                required
              ></textarea>
            </div>
            <div class="mfield">
              <label>{{ $t('Rating') }}</label>
              <select v-model="commentForm.rating" required>
                <option v-for="n in 5" :key="n" :value="n">{{ n }} ⭐</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="floppy-disk" /> {{ $t('submit') }}
              </button>
              <button type="button" class="btn-ghost" @click="closeCommentsModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchComments"
              class="search-input"
              placeholder="Search comments..."
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('All Comments') }}</h4>
            <SkeletonLoader v-if="commentStore.loading" :rows="4" :cols="6" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('Tenant') }}</th>
                  <th>{{ $t('Comment') }}</th>
                  <th>{{ $t('Rating') }}</th>
                  <th>{{ $t('date') }}</th>
                  <th>{{ $t('Action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedComments.length">
                  <td colspan="6" class="no-data"><font-awesome-icon icon="ban" /> No Comments</td>
                </tr>
                <tr v-else v-for="(comment, index) in paginatedComments" :key="comment.id">
                  <td class="idx">{{ csf + index }}</td>
                  <td>{{ comment.user?.last_name || 'N/A' }}</td>
                  <td>{{ comment?.comment }}</td>
                  <td>{{ comment?.rating }} <font-awesome-icon icon="star" class="star-icon" /></td>
                  <td>{{ formatDate(comment.created_at) }}</td>
                  <td>
                    <button class="btn-del" @click="deleteComment(comment.id)">
                      <font-awesome-icon icon="trash" /> {{ $t('delete') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="cp"
              :total-pages="ctp"
              :showing-from="csf"
              :showing-to="cst"
              :total-items="cti"
              @page-change="cgp"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- ANNOUNCEMENTS MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activeAnnouncementModal === 'announcements'"
        class="modal-overlay"
        @click.self="closeAnnouncementsModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="bullhorn" /> {{ $t('announcements') }}</h3>
            <button class="close-x" @click="closeAnnouncementsModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchAnnouncements"
              class="search-input"
              placeholder="Search announcements..."
            />
          </div>
          <div class="announcements-list">
            <SkeletonLoader v-if="announcementStore.loading" :rows="4" :cols="1" />
            <template v-else>
              <div v-if="!paginatedAnnouncements.length" class="no-data">
                <font-awesome-icon icon="ban" /> {{ $t('noAnnouncements') }}
              </div>
              <div
                v-for="(announcement, index) in paginatedAnnouncements"
                :key="announcement.id"
                class="message-card"
              >
                <div class="message-header">
                  <span class="message-index">#{{ asf + index }}</span>
                  <span class="message-date">{{ formatDate(announcement.created_at) }}</span>
                </div>
                <div class="message-title">{{ announcement.title }}</div>
                <div class="message-body">{{ announcement.message }}</div>
              </div>
              <PaginationControls
                :current-page="ap"
                :total-pages="atp"
                :showing-from="asf"
                :showing-to="ast"
                :total-items="ati"
                @page-change="agp"
              />
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PASSWORD RESET MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activePasswordResetModal === 'passwordReset'"
        class="modal-overlay"
        @click.self="closePasswordResetModal"
      >
        <div class="glass-modal">
          <div class="modal-top">
            <h3><font-awesome-icon icon="key" /> {{ $t('resetPasswordTitle') }}</h3>
            <button class="close-x" @click="closePasswordResetModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successPasswordResetMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successPasswordResetMessage }}
            </div>
          </Transition>
          <Transition name="alert-pop">
            <div v-if="auth.error" class="error-alert">
              <font-awesome-icon icon="triangle-exclamation" /> {{ auth.error }}
            </div>
          </Transition>
          <p class="modal-desc">{{ $t('resetPasswordDescription') }}</p>
          <form @submit.prevent="sendPasswordResetLink">
            <div class="mfield">
              <label>{{ $t('email') }}</label
              ><input
                v-model="passwordResetForm.email"
                type="email"
                :placeholder="$t('email')"
                required
              />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal" :disabled="auth.loading">
                <font-awesome-icon
                  :icon="auth.loading ? 'spinner' : 'envelope'"
                  :spin="auth.loading"
                />
                {{ auth.loading ? 'Sending...' : $t('sendResetLink') }}
              </button>
              <button type="button" class="btn-ghost" @click="closePasswordResetModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- ENTERTAINMENT MODAL -->
    <EntertainmentModal
      :active="activeEntertainmentModal === 'entertainment'"
      @close="closeEntertainmentModal"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

* {
  box-sizing: border-box;
}

.payment-skeleton {
  padding: 20px;
}
.skeleton {
  height: 45px;
  margin-bottom: 12px;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

.dash-shell {
  display: flex;
  min-height: 100vh;
  background: #020810;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: rgba(2, 8, 20, 0.95);
  border-right: 1px solid rgba(20, 184, 166, 0.12);
  display: flex;
  flex-direction: column;
  padding: 24px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 100;
  transition: transform 0.3s ease;
  backdrop-filter: blur(12px);
}
.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.2rem;
  font-weight: 900;
  color: #14b8a6;
  margin-bottom: 32px;
  padding: 0 4px;
  letter-spacing: 0.04em;
}
.logo-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #14b8a6;
  box-shadow: 0 0 10px #14b8a6;
  animation: logoPulse 2s ease-in-out infinite;
}
.badge-new {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  margin-left: 8px;
  box-shadow: 0 0 6px #ef4444;
}
@keyframes logoPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.5);
  }
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  transition: 0.2s;
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  position: relative;
}
.nav-item:hover,
.nav-item.on,
.nav-item.active {
  background: rgba(20, 184, 166, 0.1);
  color: #14b8a6;
  border-left: 2px solid #14b8a6;
  padding-left: 10px;
}
.ni {
  font-size: 15px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.sidebar-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.25s;
  font-family: inherit;
  margin-top: 16px;
}
.sidebar-logout:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: translateY(-2px);
}
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 99;
  backdrop-filter: blur(4px);
}

.dash-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hero-banner {
  position: relative;
  overflow: hidden;
  height: 200px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #0a1428 0%, #020810 100%);
}
.hero-text {
  position: absolute;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  padding: 16px 24px;
}
.menu-btn {
  background: rgba(20, 184, 166, 0.15);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #14b8a6;
  font-size: 18px;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  margin-bottom: 12px;
  flex-shrink: 0;
}
.menu-btn:hover {
  background: rgba(20, 184, 166, 0.25);
}
.topbar-inner {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex: 1;
}
.dash-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #5dcaa5;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #14b8a6;
  animation: logoPulse 1.6s ease-in-out infinite;
}
.dash-title {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 4px;
}
.dash-sub {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
}
.topbar-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}
.lang-row {
  display: flex;
  gap: 6px;
}
.lbtn {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
  font-size: 11px;
  font-weight: 600;
  font-family: inherit;
  transition: 0.2s;
}
.lbtn.on,
.lbtn:hover {
  background: #0f766e;
  border-color: #14b8a6;
  color: #fff;
  transform: translateY(-1px);
}

.main-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
}
.stat-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: 0.3s;
  border-left: 3px solid rgba(20, 184, 166, 0.4);
}
.stat-card:hover {
  transform: translateY(-5px) rotateX(4deg);
  background: rgba(20, 184, 166, 0.07);
  border-color: rgba(20, 184, 166, 0.35);
  box-shadow: 0 12px 35px rgba(20, 184, 166, 0.12);
}
.stat-card.green {
  border-left-color: rgba(34, 197, 94, 0.5);
}
.stat-card.green:hover {
  background: rgba(34, 197, 94, 0.06);
}
.stat-card.amber {
  border-left-color: rgba(245, 158, 11, 0.5);
}
.stat-card.amber:hover {
  background: rgba(245, 158, 11, 0.06);
}
.stat-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
  color: #14b8a6;
  width: 36px;
  text-align: center;
}
.stat-val {
  font-size: clamp(1rem, 3vw, 1.4rem);
  font-weight: 900;
  color: #fff;
  line-height: 1;
}
.stat-lbl {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-top: 4px;
}

.glass-section {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 18px;
  padding: 24px;
  backdrop-filter: blur(8px);
}
.glass-section::before {
  content: '';
  display: block;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.3), transparent);
  margin-bottom: 20px;
  border-radius: 50%;
}
.section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
}
.sec-title {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 2px;
}
.sec-sub {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.table-wrap {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
thead tr {
  background: rgba(20, 184, 166, 0.06);
}
th {
  padding: 11px 14px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.5);
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  white-space: nowrap;
}
td {
  padding: 11px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.85);
  vertical-align: middle;
}
tbody tr:hover {
  background: rgba(20, 184, 166, 0.04);
}
tbody tr:last-child td {
  border-bottom: none;
}
.idx {
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}
.no-data {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.3);
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-pill.paid {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-pill.unpaid,
.status-pill.pending {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.status-pill.occupied,
.status-pill.Occupied {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.status-pill.available,
.status-pill.Available {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-pill.maintenance,
.status-pill.Maintenance {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
/* NEW: Status pill for remarks */
.status-pill.active {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-pill.inactive {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

.btn-teal {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  font-family: inherit;
  white-space: nowrap;
  flex-shrink: 0;
}
.btn-teal:hover {
  transform: translateY(-3px) scale(1.04);
  box-shadow: 0 10px 28px rgba(20, 184, 166, 0.4);
}
.btn-teal:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
.btn-sm {
  padding: 5px 12px;
  border-radius: 7px;
  border: 1px solid rgba(20, 184, 166, 0.25);
  background: rgba(20, 184, 166, 0.12);
  color: #14b8a6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}
.btn-sm:hover {
  background: rgba(20, 184, 166, 0.22);
}
.btn-sm:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.btn-del {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  background: rgba(239, 68, 68, 0.12);
  color: #f87171;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(239, 68, 68, 0.25);
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}
.btn-del:hover {
  background: rgba(239, 68, 68, 0.22);
  transform: translateY(-1px);
}

.star-icon {
  color: #fbbf24;
  font-size: 11px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}
.gallery-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s;
}
.gallery-card:hover {
  transform: translateY(-5px);
  border-color: rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.05);
}
.gallery-placeholder {
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 8px;
}
.gallery-icon {
  color: rgba(20, 184, 166, 0.6);
  font-size: 1.2rem;
}

.rules-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.rules-list li {
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  border-left: 3px solid rgba(20, 184, 166, 0.4);
  transition: 0.2s;
}
.rules-list li:hover {
  background: rgba(20, 184, 166, 0.05);
  color: #fff;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 8, 16, 0.8);
  backdrop-filter: blur(12px) saturate(1.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}
.glass-modal {
  background: rgba(10, 20, 35, 0.92);
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 20px;
  padding: 28px 26px;
  width: 100%;
  max-width: 780px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  backdrop-filter: blur(24px);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.6),
    0 0 60px rgba(20, 184, 166, 0.07);
}
.glass-modal::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.5), transparent);
}
.glass-modal.large {
  max-width: 1000px;
}
.modal-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-top h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}
.close-x {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
  flex-shrink: 0;
}
.close-x:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.3);
}
.modal-desc {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 18px;
}

.mfield {
  min-width: 0;
  margin-bottom: 14px;
}
.mfield label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 7px;
}
.mfield input,
.mfield textarea,
.mfield select {
  width: 100%;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  transition:
    border-color 0.2s,
    background 0.2s;
  outline: none;
}
.mfield input::placeholder,
.mfield textarea::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
.mfield input:focus,
.mfield textarea:focus,
.mfield select:focus {
  border-color: #14b8a6;
  background: rgba(20, 184, 166, 0.06);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}
.mfield textarea {
  resize: vertical;
  min-height: 90px;
}
.mfield select option {
  background: #0a1428;
  color: #fff;
}
.mfield p {
  font-size: 15px;
  color: #fff;
  margin: 0;
  font-weight: 600;
}

.form-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}
@media (max-width: 560px) {
  .form-2col {
    grid-template-columns: 1fr;
  }
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
  flex-wrap: wrap;
}
.modal-table-wrap {
  margin-top: 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
  max-height: 280px;
  overflow-y: auto;
  overflow-x: auto;
}
.table-subtitle {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: rgba(20, 184, 166, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.divider {
  margin: 20px 0;
  border-color: rgba(255, 255, 255, 0.1);
}
.section-subtitle {
  font-size: 1rem;
  font-weight: 700;
  color: #14b8a6;
  margin-bottom: 12px;
}
.payment-alert {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #fbbf24;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 12px;
  margin: 10px 0;
}

.profile-box {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.profile-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(20, 184, 166, 0.15);
  border: 2px solid rgba(20, 184, 166, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #14b8a6;
  flex-shrink: 0;
}
.profile-details {
  flex: 1;
}

.announcements-list {
  max-height: 60vh;
  overflow-y: auto;
}
.message-card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: 0.2s;
}
.message-card:hover {
  background: rgba(20, 184, 166, 0.05);
  border-color: rgba(20, 184, 166, 0.2);
}
.message-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}
.message-title {
  font-weight: 700;
  font-size: 15px;
  margin-bottom: 6px;
  color: #14b8a6;
}
.message-body {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
}

.success-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #5dcaa5;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}
.error-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* NEW: Remarks info and warning styles */
.remarks-info {
  background: rgba(20, 184, 166, 0.07);
  border: 1px solid rgba(20, 184, 166, 0.2);
  border-radius: 10px;
  padding: 12px 16px;
  margin-bottom: 20px;
}
.info-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
}
.warning-text {
  font-size: 12px;
  color: #f87171;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}
.info-text svg,
.warning-text svg {
  flex-shrink: 0;
}

/* NEW: Type pill for remarks */
/* Remarks Cards Layout - New styles only, doesn't affect existing classes */
.remarks-cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
  padding: 4px;
}

.remark-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.remark-card:hover {
  background: rgba(20, 184, 166, 0.05);
  border-color: rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}

.remark-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  background: rgba(20, 184, 166, 0.06);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}

.remark-number {
  font-size: 12px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.05);
  padding: 4px 10px;
  border-radius: 20px;
}

.remark-card-body {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.remark-reason strong,
.remark-date strong {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.remark-reason p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 8px 0 0 0;
  padding-left: 4px;
}

.remark-date span {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  display: inline-block;
  margin-top: 4px;
}

/* Make sure existing classes still work */
.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.type-pill.critical {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.type-pill.warning {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.type-pill.info {
  background: rgba(20, 184, 166, 0.15);
  color: #5dcaa5;
  border: 1px solid rgba(20, 184, 166, 0.3);
}

.status-pill.active {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.status-pill.inactive {
  background: rgba(156, 163, 175, 0.15);
  color: #9ca3af;
  border: 1px solid rgba(156, 163, 175, 0.3);
}

/* Responsive */
@media (max-width: 600px) {
  .remark-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .remarks-cards-grid {
    gap: 12px;
  }

  .remark-card-body {
    padding: 12px 14px;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .glass-modal,
.modal-fade-leave-active .glass-modal {
  transition: transform 0.25s ease;
}
.modal-fade-enter-from .glass-modal {
  transform: scale(0.92) translateY(20px);
}
.modal-fade-leave-to .glass-modal {
  transform: scale(0.95) translateY(10px);
}

.alert-pop-enter-active {
  animation: alertPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.alert-pop-leave-active {
  transition: opacity 0.2s ease;
}
.alert-pop-leave-to {
  opacity: 0;
}
@keyframes alertPop {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 200;
  }
  .dash-shell.sidebar-open .sidebar {
    transform: translateX(0);
  }
  .menu-btn {
    display: flex !important;
  }
  .hero-banner {
    height: 180px;
  }
  .main-body {
    padding: 16px;
    gap: 16px;
  }
  .topbar-right {
    display: none;
  }
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .glass-modal.large {
    max-width: 98vw;
  }
  .profile-box {
    flex-direction: column;
  }
}
@media (min-width: 769px) {
  .menu-btn {
    display: none !important;
  }
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 12px;
  transition: border-color 0.2s;
}
.search-bar:focus-within {
  border-color: #14b8a6;
  background: rgba(20, 184, 166, 0.06);
}
.search-icon {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.25);
}
</style>
