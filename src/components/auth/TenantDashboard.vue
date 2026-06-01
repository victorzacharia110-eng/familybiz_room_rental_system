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
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const paymentStore = usePaymentStore()
const paymentMethodStore = usePaymentMethodStore()
const latePaymentReasonStore = useLatePaymentReasonStore()
const commentStore = useCommentStore()
const announcementStore = useAnnouncementStore()

const { totalRooms, roomsAvailableCount } = storeToRefs(roomStore)

/* ── messages ── */
const successLatePaymentReasonSubmissionMessage = ref('')
const successCommentMessage = ref('')
const successUpdateRoomStatus = ref('')
const successPasswordResetMessage = ref('')

/* ── logout ── */
const logoutUser = () => {
  auth.logout()
  router.push('/login')
}

/* ── modals ── */
const activeRoomsModal = ref(null)
const activePaymentMethod = ref(null)
const activeProfileModal = ref(null)
const activeCommentsModal = ref(null)
const activeAnnouncementModal = ref(null)
const activePasswordResetModal = ref(null)
const hasSeenAnnouncements = ref(false)

/* ── late payment reason ── */
async function submitLateReason(payment) {
  if (latePaymentReasonStore.latePaymentReasons.length >= 3) {
    alert('You have reached the maximum of 3 late payment submissions!')
    return
  }

  const reason_text = prompt('Please enter your reason for late payment. Note: Max 3 submissions allowed.')

  if (reason_text) {
    await latePaymentReasonStore.registerLatePaymentReasons({
      payment_id: payment.id,
      reason_text: reason_text,
    })
    successLatePaymentReasonSubmissionMessage.value = '✅ Reason Submitted successfully!'
    setTimeout(() => {
      successLatePaymentReasonSubmissionMessage.value = ''
    }, 3000)
  }
}

/* ── payment form ── */
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
    alert('✅ Payment registered successfully!')
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
    alert('❌ Failed to register payment')
  }
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/* ── rooms modal ── */
const openRoomsModal = (modalName) => {
  activeRoomsModal.value = modalName
  if (modalName === 'rooms') {
    roomFetching()
  }
}

const closeRoomsModal = () => {
  activeRoomsModal.value = null
}

const roomFetching = async () => {
  await roomStore.fetchRooms()
  await roomStore.updateRoomStatus()
}

const isDisabled = (room) => {
  return room.status === 'Occupied' && room.user_id !== auth.user?.id
}

const confirmText = 'CONFIRMED'

const confirmToggle = async (room, checked) => {
  if (room.status === 'Occupied' && room.user_id !== auth.user?.id) {
    alert('This room is already occupied by another user')
    return
  }

  const input = prompt(`Type "${confirmText}" to confirm`)

  if (input?.trim() === confirmText) {
    await updatingRoomStatus(room.id, checked)
    successUpdateRoomStatus.value = '✅ Action Completed successfully!'
    setTimeout(() => {
      successUpdateRoomStatus.value = ''
    }, 3000)
    await roomStore.fetchRooms()
  } else {
    alert('Incorrect text. Action Cancelled')
  }
}

const updatingRoomStatus = async (id, checked) => {
  return await roomStore.updateRoomStatus(id, checked)
}

/* ── payment method modal ── */
const openPaymentMethodModal = (ModalName) => {
  activePaymentMethod.value = ModalName
  if (ModalName === 'paymentMethod') {
    paymentMethodFetching()
  }
}

const closePaymentMethodModal = () => {
  activePaymentMethod.value = null
}

const paymentMethodFetching = async () => {
  await paymentMethodStore.fetchPaymentMethods()
}

/* ── profile modal ── */
const openProfileModal = (ModalName) => {
  activeProfileModal.value = ModalName
  if (ModalName === 'profile') {
    profileFetching()
  }
}

const closeProfileModal = () => {
  activeProfileModal.value = null
}

const profileFetching = async () => {
  await auth.fetchUser()
}

const updatingPhoneNumber = async (user) => {
  const newPhone = prompt('Enter new phone number:')
  if (!newPhone || !newPhone.trim()) return
  const response = await auth.updatePhoneNumber(user.id, newPhone)
  if (response) {
    alert('✅ Phone number updated successfully!')
  } else {
    alert(auth.error || '❌ Failed to update phone number')
  }
}

/* ── comments modal ── */
const openCommentsModal = (ModalName) => {
  activeCommentsModal.value = ModalName
  if (ModalName === 'comments') {
    commentFetching()
  }
}

const closeCommentsModal = () => {
  activeCommentsModal.value = null
}

const commentForm = ref({
  comment: '',
  rating: 5,
})

const commentFetching = async () => {
  await commentStore.fetchComments()
}

const saveComment = async () => {
  const response = await commentStore.registerComments(commentForm.value)
  if (response) {
    successCommentMessage.value = '✅ Comment added successfully!'
    commentForm.value.comment = ''
    commentForm.value.rating = 5
    setTimeout(() => {
      successCommentMessage.value = ''
    }, 3000)
    await commentFetching()
  }
}

const deleteComment = async (id) => {
  if (!confirm('⚠️ Delete this comment permanently?')) return
  const res = await commentStore.deleteComment(id)
  alert(res ? '✅ Comment deleted!' : '❌ Failed to delete comment')
  await commentFetching()
}

/* ── announcements modal ── */
const openAnnouncementModal = async (ModalName) => {
  activeAnnouncementModal.value = ModalName
  if (ModalName === 'announcements') {
    await announcementsFetching()
    const announcements = announcementStore.announcements
    if (announcements.length > 0) {
      const latest = announcements[0]
      localStorage.setItem('lastSeenAnnouncementId', latest.id)
    }
  }
}

const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}

const announcementsFetching = async () => {
  await announcementStore.fetchAnnouncements()
}

const hasNewAnnouncements = computed(() => {
  const announcements = announcementStore.announcements
  if (!announcements.length) return false
  const latest = announcements[0]
  const lastSeenId = localStorage.getItem('lastSeenAnnouncementId')
  return String(latest.id) !== lastSeenId
})

/* ── password reset modal ── */
const openPasswordResetModal = (ModalName) => {
  activePasswordResetModal.value = ModalName
  if (ModalName === 'passwordReset') {
    passwordResetForm.value.email = auth.user?.email || ''
  }
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
    successPasswordResetMessage.value = '✅ Reset link sent!'
    setTimeout(() => closePasswordResetModal(), 3000)
  }
}

/* ── utils ── */
const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/* ── language ── */
const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

/* ── sidebar ── */
const isSidebarOpen = ref(false)

/* ── house gallery ── */
const house = ref({
  images: ['/assets/room1.jpg', '/assets/room2.jpg', '/assets/common.jpg'],
})

onMounted(async () => {
  await roomStore.fetchRooms()
  await roomStore.updateRoomStatus()
  await paymentStore.fetchPayments()
  await paymentMethodStore.fetchPaymentMethods()
  await announcementStore.fetchAnnouncements()
  await paymentStore.fetchTenantPayment()

  if (announcementStore.announcements.length > 0) {
    activeAnnouncementModal.value = 'announcements'
  }
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
          <span class="ni">📊</span><span>{{ $t('dashboard') }}</span>
        </router-link>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          <span class="ni">📢</span><span>{{ $t('Announcements') }}</span>
          <span v-if="hasNewAnnouncements" class="badge-new"></span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeCommentsModal === 'comments' }"
          @click.prevent="openCommentsModal('comments')"
        >
          <span class="ni">💬</span><span>{{ $t('Comments') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeProfileModal === 'profile' }"
          @click.prevent="openProfileModal('profile')"
        >
          <span class="ni">👤</span><span>{{ $t('profile') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activePasswordResetModal === 'passwordReset' }"
          @click.prevent="openPasswordResetModal('passwordReset')"
        >
          <span class="ni">🔒</span><span>{{ $t('resetPassword') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeRoomsModal === 'rooms' }"
          @click.prevent="openRoomsModal('rooms')"
        >
          <span class="ni">🚪</span><span>{{ $t('viewRooms') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentMethod === 'paymentMethod' }"
          @click.prevent="openPaymentMethodModal('paymentMethod')"
        >
          <span class="ni">💳</span><span>{{ $t('paymentMethods') }}</span>
        </a>
      </nav>

      <button class="sidebar-logout" @click="logoutUser"><span>🚪</span> {{ $t('logout') }}</button>
    </aside>

    <!-- sidebar overlay (mobile) -->
    <div class="sidebar-overlay" v-if="isSidebarOpen" @click="isSidebarOpen = false"></div>

    <!-- ══════ MAIN ══════ -->
    <main class="dash-main">
      <!-- ── hero banner ── -->
      <div class="hero-banner">
        <div class="hero-text">
          <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">☰</button>
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
                <button class="lbtn" :class="{ on: currentLocale === 'en' }" @click="setLanguage('en')">🇬🇧 EN</button>
                <button class="lbtn" :class="{ on: currentLocale === 'sw' }" @click="setLanguage('sw')">🇹🇿 SW</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── content wrapper ── -->
      <div class="main-body">
        <!-- ── STATS ── -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div>
              <div class="stat-val">{{ totalRooms }}</div>
              <div class="stat-lbl">{{ $t('totalRooms') }}</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">✅</div>
            <div>
              <div class="stat-val">{{ roomsAvailableCount }}</div>
              <div class="stat-lbl">{{ $t('availableRooms') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div>
              <div class="stat-val">
                <span v-if="auth.user.room">{{ auth.user.room.room_number }}</span>
                <span v-else>{{ $t('noRoomAssigned') }}</span>
              </div>
              <div class="stat-lbl">{{ $t('yourRoom') }}</div>
            </div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon">💰</div>
            <div>
              <div class="stat-val">{{ paymentStore.count_tenant_unpaid_payment }}</div>
              <div class="stat-lbl">{{ $t('paymentsDue') }}</div>
            </div>
          </div>
        </section>

        <!-- ── PAYMENT HISTORY ── -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('rentPayments') }}</h2>
              <p class="sec-sub">{{ $t('yourPaymentHistory') }}</p>
            </div>
          </div>

          <Transition name="alert-pop">
            <div v-if="successLatePaymentReasonSubmissionMessage" class="success-alert">
              {{ successLatePaymentReasonSubmissionMessage }}
            </div>
          </Transition>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('Month') }}</th>
                  <th>{{ $t('Due Date') }}</th>
                  <th>{{ $t('Payment Status') }}</th>
                  <th>{{ $t('Action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="paymentStore.tenant_payment">
                  <td>{{ paymentStore.tenant_payment.month_name }}</td>
                  <td>{{ paymentStore.tenant_payment.due_date_formatted }}</td>
                  <td>
                    <span class="status-pill" :class="paymentStore.tenant_payment.status">
                      <span v-if="paymentStore.tenant_payment.status === 'paid'">✅ </span>
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
                <tr v-else>
                  <td colspan="4" class="no-data">{{ $t('noPaymentData') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── HOUSE GALLERY ── -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('houseGallery') }}</h2>
              <p class="sec-sub">{{ $t('propertyImages') }}</p>
            </div>
          </div>
          <div class="gallery-grid">
            <div v-for="(img, idx) in house.images" :key="idx" class="gallery-card">
              <div class="gallery-placeholder">🏠 Room {{ idx + 1 }}</div>
            </div>
          </div>
        </section>

        <!-- ── RULES ── -->
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

    <!-- ════════════════════════════════════
         MODALS
    ════════════════════════════════════ -->

    <!-- ROOMS MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeRoomsModal === 'rooms'" class="modal-overlay" @click.self="closeRoomsModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3>{{ $t('viewRooms') }}</h3>
            <button class="close-x" @click="closeRoomsModal">✕</button>
          </div>

          <Transition name="alert-pop">
            <div v-if="successUpdateRoomStatus" class="success-alert">{{ successUpdateRoomStatus }}</div>
          </Transition>

          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingRooms') }}</h4>
            <table>
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
                <tr v-for="(room, index) in roomStore.rooms" :key="room?.id">
                  <td class="idx">{{ index + 1 }}</td>
                  <td><strong>{{ room?.room_number || 'N/A' }}</strong></td>
                  <td>{{ room?.type || 'Unknown' }}</td>
                  <td>
                    <span class="status-pill" :class="room?.status?.toLowerCase()">{{ room?.status || 'Unknown' }}</span>
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
          </div>
        </div>
      </div>
    </Transition>

    <!-- PAYMENT METHOD MODAL -->
    <Transition name="modal-fade">
      <div v-if="activePaymentMethod === 'paymentMethod'" class="modal-overlay" @click.self="closePaymentMethodModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3>{{ $t('paymentMethodManagement') }}</h3>
            <button class="close-x" @click="closePaymentMethodModal">✕</button>
          </div>

          <div class="payment-alert">
            {{ $t('method1Warning') }}<br />
            <span style="color: #f87171">⚠️ {{ $t('method1ApprovalWarning') }}</span>
          </div>

          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingPaymentMethods') }}</h4>
            <table>
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
                <tr v-for="(pm, index) in paymentMethodStore.paymentMethods" :key="pm.id">
                  <td class="idx">{{ $t('method') }} {{ index + 1 }}</td>
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
                <label>{{ $t('Amount') }}</label>
                <input v-model="paymentForm.amount" type="number" required placeholder="0" />
              </div>
              <div class="mfield">
                <label>{{ $t('month') }}</label>
                <select v-model="paymentForm.month" required>
                  <option disabled value="">{{ $t('selectMonth') }}</option>
                  <option v-for="(name, idx) in months" :key="idx" :value="idx + 1">{{ name }}</option>
                </select>
              </div>
              <div class="mfield">
                <label>{{ $t('Year') }}</label>
                <input v-model="paymentForm.year" type="number" required placeholder="2025" />
              </div>
              <div class="mfield">
                <label>{{ $t('Due Date') }}</label>
                <input v-model="paymentForm.due_date" type="date" required />
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">{{ $t('Make Payment') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- PROFILE MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeProfileModal === 'profile'" class="modal-overlay" @click.self="closeProfileModal">
        <div class="glass-modal">
          <div class="modal-top">
            <h3>{{ $t('userProfile') }}</h3>
            <button class="close-x" @click="closeProfileModal">✕</button>
          </div>
          <div class="profile-box">
            <div class="profile-avatar">👤</div>
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
                <button class="btn-teal" style="margin-top: 8px" @click="updatingPhoneNumber(auth.user)">
                  📱 {{ $t('updatePhone') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- COMMENTS MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeCommentsModal === 'comments'" class="modal-overlay" @click.self="closeCommentsModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3>{{ $t('Comments') }}</h3>
            <button class="close-x" @click="closeCommentsModal">✕</button>
          </div>

          <Transition name="alert-pop">
            <div v-if="successCommentMessage" class="success-alert">{{ successCommentMessage }}</div>
          </Transition>

          <form @submit.prevent="saveComment">
            <div class="mfield">
              <label>{{ $t('Comment') }}</label>
              <textarea v-model="commentForm.comment" placeholder="Write your comment..." required></textarea>
            </div>
            <div class="mfield">
              <label>{{ $t('Rating') }}</label>
              <select v-model="commentForm.rating" required>
                <option v-for="n in 5" :key="n" :value="n">{{ n }} ⭐</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">{{ $t('submit') }}</button>
              <button type="button" class="btn-ghost" @click="closeCommentsModal">{{ $t('close') }}</button>
            </div>
          </form>

          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('All Comments') }}</h4>
            <table>
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
                <tr v-for="(comment, index) in commentStore.comments" :key="comment.id">
                  <td class="idx">{{ index + 1 }}</td>
                  <td>{{ comment.user?.last_name || 'N/A' }}</td>
                  <td>{{ comment?.comment }}</td>
                  <td>{{ comment?.rating }} ⭐</td>
                  <td>{{ formatDate(comment.created_at) }}</td>
                  <td>
                    <button class="btn-del" @click="deleteComment(comment.id)">{{ $t('delete') }}</button>
                  </td>
                </tr>
                <tr v-if="!commentStore.comments.length">
                  <td colspan="6" class="no-data">🚫 No Comments</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ANNOUNCEMENTS MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeAnnouncementModal === 'announcements'" class="modal-overlay" @click.self="closeAnnouncementsModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3>{{ $t('announcements') }}</h3>
            <button class="close-x" @click="closeAnnouncementsModal">✕</button>
          </div>

          <div class="announcements-list">
            <div v-if="!announcementStore.announcements.length" class="no-data">
              🚫 {{ $t('noAnnouncements') }}
            </div>
            <div v-for="(announcement, index) in announcementStore.announcements" :key="announcement.id" class="message-card">
              <div class="message-header">
                <span class="message-index">#{{ index + 1 }}</span>
                <span class="message-date">{{ formatDate(announcement.created_at) }}</span>
              </div>
              <div class="message-title">{{ announcement.title }}</div>
              <div class="message-body">{{ announcement.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PASSWORD RESET MODAL -->
    <Transition name="modal-fade">
      <div v-if="activePasswordResetModal === 'passwordReset'" class="modal-overlay" @click.self="closePasswordResetModal">
        <div class="glass-modal">
          <div class="modal-top">
            <h3>{{ $t('resetPasswordTitle') }}</h3>
            <button class="close-x" @click="closePasswordResetModal">✕</button>
          </div>

          <Transition name="alert-pop">
            <div v-if="successPasswordResetMessage" class="success-alert">{{ successPasswordResetMessage }}</div>
          </Transition>
          <Transition name="alert-pop">
            <div v-if="auth.error" class="error-alert">{{ auth.error }}</div>
          </Transition>

          <p class="modal-desc">{{ $t('resetPasswordDescription') }}</p>

          <form @submit.prevent="sendPasswordResetLink">
            <div class="mfield">
              <label>{{ $t('email') }}</label>
              <input v-model="passwordResetForm.email" type="email" :placeholder="$t('email')" required />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal" :disabled="auth.loading">
                {{ auth.loading ? 'Sending...' : $t('sendResetLink') }}
              </button>
              <button type="button" class="btn-ghost" @click="closePasswordResetModal">{{ $t('close') }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

* {
  box-sizing: border-box;
}

/* ════════════════════════════════════════
   SHELL
════════════════════════════════════════ */
.dash-shell {
  display: flex;
  min-height: 100vh;
  background: #020810;
  font-family: 'Inter', sans-serif;
  color: #fff;
}

/* ════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════ */
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

.logo-dot.red {
  background: #ef4444;
  box-shadow: 0 0 10px #ef4444;
  width: 8px;
  height: 8px;
  margin-left: 6px;
}

@keyframes logoPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.5); }
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

.badge-new {
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 0 6px #ef4444;
}

.ni {
  font-size: 16px;
  flex-shrink: 0;
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

/* ════════════════════════════════════════
   MAIN
════════════════════════════════════════ */
.dash-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* ── HERO BANNER ── */
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

/* ── MAIN BODY ── */
.main-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── STATS ── */
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
  font-size: 1.8rem;
  flex-shrink: 0;
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

/* ── GLASS SECTIONS ── */
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

/* ── TABLE ── */
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

/* pills */
.status-pill {
  display: inline-block;
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

/* buttons */
.btn-teal {
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
  border: none;
  background: rgba(20, 184, 166, 0.12);
  color: #14b8a6;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid rgba(20, 184, 166, 0.25);
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

/* gallery */
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
  font-size: 2rem;
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
}

/* rules list */
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

/* ════════════════════════════════════════
   MODALS
════════════════════════════════════════ */
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
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(20, 184, 166, 0.07);
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
  transition: border-color 0.2s, background 0.2s;
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

/* profile */
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
  flex-shrink: 0;
}

.profile-details {
  flex: 1;
}

.mfield p {
  font-size: 15px;
  color: #fff;
  margin: 0;
  font-weight: 600;
}

/* announcements */
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

/* alerts */
.success-alert {
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
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}

/* ════════════════════════════════════════
   TRANSITIONS
════════════════════════════════════════ */
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

/* ════════════════════════════════════════
   RESPONSIVE
════════════════════════════════════════ */
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
</style>