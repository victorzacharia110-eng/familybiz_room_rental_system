<script setup>
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
import Footer from './Footer.vue'

// -------------------- AUTH --------------------
const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const paymentStore = usePaymentStore()
const paymentMethodStore = usePaymentMethodStore()
const commentStore = useCommentStore()
const latePaymentReasonStore = useLatePaymentReasonStore()
const announcementStore = useAnnouncementStore()

const { totalRooms, roomsAvailableCount } = storeToRefs(roomStore)

const logoutUser = () => {
  auth.logout()
  router.push('/login')
}

onMounted(async () => {
  activeAnnouncementModal.value = null
  hasSeenAnnouncements.value = false

  await roomStore.fetchRooms()
  await roomStore.updateRoomStatus()
  await paymentStore.fetchPayment()
  await paymentMethodStore.fetchPaymentMethods()
  await announcementStore.fetchAnnouncements()

  if (announcementStore.announcements.length > 0) {
    activeAnnouncementModal.value = 'announcements'
    console.log('trigger', activeAnnouncementModal.value)
  }
})

// -------------------- HOUSE DATA --------------------
const house = ref({
  // totalRooms: 24,
  // availableRooms: 6,
  // images: ['/assets/room1.jpg', '/assets/room2.jpg', '/assets/common.jpg'],
})

// -------------------- LATE PAYMENT FUNCTION --------------------
const successLatePaymentReasonSubmissionMessage = ref('')

async function submitLateReason(payment) {
  if (latePaymentReasonStore.latePaymentReasons.length >= 3) {
    alert('You have reached the maximum of 3 late payment submissions!')
    return
  }

  const reason_text = prompt(
    'Please enter your reason for late payment. Note: Max 3 submissions allowed.',
  )

  if (reason_text) {
    await latePaymentReasonStore.registerLatePaymentReasons({
      payment_id: payment.id,
      reason_text: reason_text,
    })

    successLatePaymentReasonSubmissionMessage.value = '✅ Reason Submitted successfully!'
  }
}
// ----------------------- SIDEBAR RESPONSIVE FUNCTIONS --------------------------------------
const isSidebarOpen = ref(false)

// ---------- MODAL FUNCTIONS FOR THE ROOM MODAL---------------------

// controls which active modal is open AND which sidebar item is active
const activeRoomsModal = ref(null)

// open rooms modal
function openRoomsModal(modalName) {
  activeRoomsModal.value = modalName

  if (modalName === 'rooms') {
    roomFetching() // Now this will log the fetched rooms
  }
}

// close modal
function closeRoomsModal() {
  activeRoomsModal.value = null
}

// Fetch rooms (from backend)
const roomFetching = async () => {
  const roomsFetched = await roomStore.fetchRooms()
  console.log('Fetched Rooms:', roomsFetched)
}

// Payment Method fetching ( from backend )
const paymentMethodFetching = async () => {
  const paymentMethodFetched = await paymentMethodStore.fetchPaymentMethods()
  console.log('Payment Methods Fetched : ', paymentMethodFetched)
  console.log('API URL:', import.meta.env.VITE_API_URL)
}

// Payment form data and functions
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
  } else {
    alert('❌ Failed to register payment')
  }
}
// Months array used in payment management modal
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
// ----------- MODAL FUNCTIONS FOR ROOM PAYMENT METHOD MODAL -------------
// controls which active modal is open AND which sidebar item is active
const activePaymentMethod = ref(null)

// open payment methods modal
function openPaymentMethodModal(ModalName) {
  activePaymentMethod.value = ModalName

  if (ModalName === 'paymentMethod') {
    // This function loads the data  from the backend into the modal when it opens
    paymentMethodFetching()
  }
}

const closePaymentMethodModal = () => {
  activePaymentMethod.value = null
}

// -------------------- LANGUAGE TOGGLE --------------------
const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

console.log('total rooms  :', roomsAvailableCount)

async function updatingRoomStatus(id, checked) {
  const updating = await roomStore.updateRoomStatus(id, checked)
  console.log('show me the response : ', updating)
}

// CONFIRM ROOM SELECTION FUNCTIONS
// TEXT = I HAVE CONFIRMED THAT I HAVE SELECTED THIS ROOM IN MY RIGHT MIND AND I HAVE INTENDED TO GET THIS ROOM AND WHATEVER HAPPENS I SHALL PAY

const isDisabled = (room) => {
  return room.status === 'Occupied' && room.user_id !== auth.user?.id
}
const confirmText = 'CONFIRMED'
const successUpdateRoomStatus = ref('')

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

    roomStore.fetchRooms()
  } else {
    alert('Incorrect text. Action Cancelled')
  }
}

// ----------------------------- User Profile Functiona and variables -------------------------------------
const activeProfileModal = ref(null)

const profileFetching = async () => {
  const profile = await auth.fetchUser()
  console.log('User Profile : ', profile)
}

const openProfileModal = (ModalName) => {
  activeProfileModal.value = ModalName

  if (ModalName === 'profile') {
    profileFetching()
  }
}

const closeProfileModal = () => {
  activeProfileModal.value = null
}

// -------------------- Update Phone Number Function ------------------------------
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

// ------------------------------------------- COMMENTS FUNCTIONS AND VARIABLES ------------------------------------
const activeCommentsModal = ref(null)

const successCommentMessage = ref('')

const commentForm = ref({
  comment: '',
  rating: 5,
})

const openCommentsModal = (ModalName) => {
  activeCommentsModal.value = ModalName

  if (ModalName === 'comments') {
    commentFetching()
  }
}

const closeCommentsModal = () => {
  activeCommentsModal.value = null
}

const commentFetching = async () => {
  await commentStore.fetchComments()
}

const saveComment = async () => {
  const response = await commentStore.registerComments(commentForm.value)

  if (response) {
    successCommentMessage.value = '✅ Comment added successfully!'
    commentForm.value.comment = ''
    commentForm.value.rating = 5
  }
}

// ------------------------------ ANNOUNCEMENTS FUNCTIONS AND VARIABLES ---------------------------------
const activeAnnouncementModal = ref(null)
const hasSeenAnnouncements = ref(false)
const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}

const openAnnouncementModal = async (ModalName) => {
  activeAnnouncementModal.value = ModalName

  if (ModalName === 'announcements') {
    await announcementsFetching()

    // ✅ mark latest announcement as seen
    const announcements = announcementStore.announcements

    if (announcements.length > 0) {
      const latest = announcements[0] // newest one
      localStorage.setItem('lastSeenAnnouncementId', latest.id)
    }
  }
}
const announcementsFetching = async () => {
  const fetchedAnnouncements = await announcementStore.fetchAnnouncements()
  console.log('announcements', fetchedAnnouncements)
}

// -------- PASSWORD RESET FUNCTIONS AND VARIABLES -----------------------------
const activePasswordResetModal = ref(null)
const successPasswordResetMessage = ref('')
const passwordResetForm = ref({
  email: '',
})

const openPasswordResetModal = (ModalName) => {
  activePasswordResetModal.value = ModalName
  if (ModalName === 'passwordReset') {
    // Pre-fill with current user's email
    passwordResetForm.value.email = auth.user?.email || ''
  }
}

const closePasswordResetModal = () => {
  activePasswordResetModal.value = null
  successPasswordResetMessage.value = ''
  passwordResetForm.value.email = ''
}

const sendPasswordResetLink = async () => {
  const response = await auth.requestPasswordReset(passwordResetForm.value.email)

  if (response) {
    successPasswordResetMessage.value = $t('resetLinkSent')
    setTimeout(() => {
      closePasswordResetModal()
    }, 3000)
  }
}

// -------- Date function --------------------------
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

// Has new announcements
const hasNewAnnouncements = computed(() => {
  const announcements = announcementStore.announcements

  if (!announcements.length) return false

  const latest = announcements[0] // assuming latest comes first
  const lastSeenId = localStorage.getItem('lastSeenAnnouncementId')

  return String(latest.id) !== lastSeenId
})
</script>

<template>
  <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">☰</button>
  <div class="dashboard">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <h2 class="logo">FamilyBiz App</h2>
      <nav>
        <!-- <router-link to="/tenant" class="nav-item">🏠 {{ $t('home') }}</router-link> -->
        <router-link to="/tenant" class="nav-item active">📊 {{ $t('dashboard') }}</router-link>

        <a
          href="#"
          class="nav-item"
          :class="{ active: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          📢 {{ $t('Announcements') }}

          <!-- 🔴 Badge -->
          <span v-if="hasNewAnnouncements" class="badge"></span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ active: activeCommentsModal === 'comments' }"
          @click.prevent="openCommentsModal('comments')"
        >
          💬 {{ $t('Comments') }}
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ active: activeProfileModal === 'profile' }"
          @click.prevent="openProfileModal('profile')"
        >
          👤 {{ $t('profile') }}
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ active: activePasswordResetModal === 'passwordReset' }"
          @click.prevent="openPasswordResetModal('passwordReset')"
        >
          🔒 {{ $t('resetPassword') }}
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ active: activeRoomsModal === 'rooms' }"
          @click.prevent="openRoomsModal('rooms')"
        >
          🚪 {{ $t('viewRooms') }}
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ active: activePaymentMethod === 'paymentMethod' }"
          @click.prevent="openPaymentMethodModal('paymentMethod')"
          >💳 {{ $t('paymentMethods') }}</a
        >

        <!-- <router-link to="/tenant/rules" class="nav-item"
          >⚠ {{ $t('tenantRulesPolicies') }}</router-link
        > -->
      </nav>
    </aside>
    <div v-if="isSidebarOpen" class="overlay" @click="isSidebarOpen = false"></div>
    <!-- Main Content -->
    <main class="content">
      <!-- Language Toggle -->
      <div class="language-toggle">
        <button :class="{ active: currentLocale === 'en' }" @click="setLanguage('en')">
          🇬🇧 English
        </button>

        <button :class="{ active: currentLocale === 'sw' }" @click="setLanguage('sw')">
          🇹🇿 Swahili
        </button>

        <button id="logout" @click="logoutUser">{{ $t('logout') }}</button>
      </div>

      <!-- Header -->
      <header class="topbar">
        <h2 v-if="auth.user?.last_name">{{ $t('welcome') }}, {{ auth.user?.last_name }}</h2>
        <p>
          {{ $t('yourRoom') }}:
          <span v-if="auth.user.room">
            {{ auth.user.room.room_number }}
          </span>
          <span v-else>
            {{ $t('noRoomAssigned') }}
          </span>
          |
          {{ $t('phoneNumber') }}: {{ auth.user?.phone_number }}
        </p>
      </header>

      <Transition name="modal-fade">
        <!-- ROOMS MODAL -->
        <div v-if="activeRoomsModal === 'rooms'" class="modal-overlay" @click.self="closeModal">
          <div class="modal large">
            <!-- <h3 style="color: black">{{ $t('viewRooms') }}</h3> -->

            <div v-if="successUpdateRoomStatus" class="success-alert">
              {{ successUpdateRoomStatus }}
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="closeRoomsModal">
                {{ $t('close') }}
              </button>
            </div>
            <!-- Rooms Table -->
            <div class="table-wrapper">
              <h4>{{ $t('existingRooms') }}</h4>
              <table class="room-table">
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
                    <td>{{ index + 1 }}</td>
                    <td>{{ room?.room_number || 'N/A' }}</td>
                    <td>{{ room?.type || 'Unknown' }}</td>
                    <td :class="room?.status ? room.status.toLowerCase() : 'unknown'">
                      {{ room?.status || 'Unknown' }}
                    </td>
                    <td>
                      {{ room?.room_price }}
                    </td>
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

      <!-- Stats Cards -->
      <section class="stats">
        <div class="card">
          <h3>{{ $t('totalRooms') }}</h3>
          <p class="number">{{ totalRooms }}</p>
        </div>
        <div class="card">
          <h3>{{ $t('availableRooms') }}</h3>
          <p class="number">{{ roomsAvailableCount }}</p>
        </div>
        <div class="card">
          <h3>{{ $t('yourRoom') }}</h3>
          <p class="number">
            <span v-if="auth.user.room">
              {{ auth.user.room.room_number }}
            </span>
            <span v-else>
              {{ $t('noRoomAssigned') }}
            </span>
          </p>
        </div>
        <div class="card">
          <h3>{{ $t('paymentsDue') }}</h3>
          <p class="number">
            {{ paymentStore.count_tenant_unpaid_payment }}
          </p>
        </div>
      </section>

      <!-- Payment History -->
      <section class="table-section">
        <div v-if="successLatePaymentReasonSubmissionMessage" class="success-alert">
          {{ successLatePaymentReasonSubmissionMessage }}
        </div>
        <h2>{{ $t('rentPayments') }}</h2>
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
              <td>
                {{ paymentStore.tenant_payment.month_name }}
              </td>
              <td>{{ paymentStore.tenant_payment.due_date_formatted }}</td>
              <td>
                <span :class="paymentStore.tenant_payment.status">
                  <span v-if="paymentStore.tenant_payment.status === 'paid'">✅ </span>
                  {{ paymentStore.tenant_payment.status }}
                </span>
              </td>
              <td>
                <button
                  class="btn-primary"
                  @click="submitLateReason(paymentStore.tenant_payment)"
                  :disabled="paymentStore.tenant_payment.status === 'paid'"
                >
                  {{ $t('submitLateReason') }}
                </button>
              </td>
            </tr>
            <tr v-else>
              <td colspan="100%" class="no-data-class-statement">
                {{ $t('noPaymentData') }}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Rooms / House Gallery -->
      <section class="gallery-section">
        <h2>{{ $t('houseGallery') }}</h2>
        <div class="gallery">
          <div v-for="img in house.images" :key="img" class="gallery-card">
            <img :src="img" alt="Room / House" />
          </div>
        </div>
      </section>

      <!-- Tenant Rules & Policies -->
      <section class="rules-section">
        <h2>{{ $t('tenantRulesPolicies') }}</h2>
        <ul>
          <li>{{ $t('maintainCleanliness') }}</li>
          <li>{{ $t('noGangs') }}</li>
          <li>{{ $t('rentOnTime') }}</li>
          <li>{{ $t('maxLateReasons') }}</li>
          <li>{{ $t('noIllegalParties') }}</li>
        </ul>
      </section>
      <Footer />
    </main>

    <Transition name="modal-fade">
      <!-- PROFILE MODAL -->
      <div
        v-if="activeProfileModal === 'profile'"
        class="modal-overlay"
        @click.self="closeProfileModal"
      >
        <div class="modal large">
          <!-- Header / Actions -->
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closeProfileModal">
              {{ $t('close') }}
            </button>
          </div>

          <!-- Title -->
          <h3 class="modal-title">{{ $t('userProfile') }}</h3>

          <!-- Profile Content  -->
          <div class="profile-container">
            <!-- Profile Avatar (optional) -->
            <div class="profile-avatar">
              <span>👤</span>
            </div>

            <!-- Profile Details -->
            <div class="profile-details">
              <div class="profile-item">
                <label>{{ $t('Last Name') }}</label>
                <p>{{ auth.user?.last_name || 'N/A' }}</p>
              </div>

              <div class="profile-item">
                <label>{{ $t('email') }}</label>
                <p>{{ auth.user?.email || 'N/A' }}</p>
              </div>

              <div class="profile-item">
                <label>{{ $t('Phone Number') }}</label>
                <p>{{ auth.user?.phone_number || 'N/A' }}</p>
                <!-- Update Button -->
                <button class="btn-update" @click="updatingPhoneNumber(auth.user)">
                  📱 {{ $t('updatePhone') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <!-- PAYMENT METHOD MODAL -->
      <div
        v-if="activePaymentMethod === 'paymentMethod'"
        class="modal-overlay"
        @click.self="closePaymentMethodModal"
      >
        <div class="modal large">
          <!-- CLOSE -->
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="closePaymentMethodModal">
              {{ $t('close') }}
            </button>
          </div>

          <!-- ========================= -->
          <!-- METHOD 1 -->
          <!-- ========================= -->
          <h4>{{ $t('method1Title') }}</h4>

          <div class="payment-alert">
            {{ $t('method1Warning') }} <br />
            <span style="color: red"> ⚠️ {{ $t('method1ApprovalWarning') }} </span>
          </div>

          <div class="table-wrapper">
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
                  <td>
                    <strong>{{ $t('method') }} {{ index + 1 }}</strong>
                  </td>
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

          <hr />

          <!-- ========================= -->
          <!-- METHOD 2 -->
          <!-- ========================= -->
          <h4>{{ $t('method2Title') }}</h4>

          <div class="payment-alert">
            {{ $t('method2Warning') }}
          </div>

          <form @submit.prevent="savePayment">
            <!-- Room -->
            <div class="form-group">
              <label>{{ $t('room') }}:</label>
              <select v-model="paymentForm.room_id" required>
                <option disabled value="">{{ $t('selectRoom') }}</option>
                <option v-for="room in roomStore.rooms" :key="room.id" :value="room.id">
                  {{ room.room_number }} - {{ room.room_price }} - {{ room.status }}
                </option>
              </select>
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label>{{ $t('Amount') }}:</label>
              <input v-model="paymentForm.amount" type="number" required />
            </div>

            <!-- Month -->
            <div class="form-group">
              <label>{{ $t('month') }}:</label>
              <select v-model="paymentForm.month" required>
                <option disabled value="">{{ $t('selectMonth') }}</option>
                <option v-for="(name, index) in months" :key="index" :value="index + 1">
                  {{ name }}
                </option>
              </select>
            </div>

            <!-- Year -->
            <div class="form-group">
              <label>{{ $t('Year') }}:</label>
              <input v-model="paymentForm.year" type="number" required />
            </div>

            <!-- Due Date -->
            <div class="form-group">
              <label>{{ $t('Due Date') }}:</label>
              <input v-model="paymentForm.due_date" type="date" required />
            </div>

            <!-- Submit -->
            <div class="modal-actions">
              <button type="submit" class="btn-primary">
                {{ $t('Make Payment') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <!-- COMMENTS MODAL -->
      <div
        v-if="activeCommentsModal === 'comments'"
        class="modal-overlay"
        @click.self="closeCommentsModal"
      >
        <div class="modal large">
          <h3 style="color: black">Comments</h3>

          <!-- Success Message -->
          <div v-if="successCommentMessage" class="success-alert">
            {{ successCommentMessage }}
          </div>

          <!-- COMMENT FORM -->
          <form @submit.prevent="saveComment">
            <div class="form-group">
              <label>{{ $t('Comment') }}:</label>
              <textarea
                v-model="commentForm.comment"
                placeholder="Write your comment..."
                required
              ></textarea>
            </div>

            <div class="form-group">
              <label>{{ $t('Rating') }}:</label>
              <select v-model="commentForm.rating" required>
                <option v-for="n in 5" :key="n" :value="n">{{ n }} ⭐</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">Submit</button>
              <button type="button" class="btn-secondary" @click="closeCommentsModal">Close</button>
            </div>
          </form>

          <!-- COMMENTS TABLE -->
          <div class="table-wrapper">
            <h4>All Comments</h4>

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
                  <td>{{ index + 1 }}</td>
                  <td>{{ comment.user?.last_name || 'N/A' }}</td>
                  <td>{{ comment?.comment }}</td>
                  <td>{{ comment?.rating }} ⭐</td>
                  <td>{{ formatDate(comment.created_at) }}</td>
                  <td>
                    <button class="btn-delete" @click="deleteComment(comment.id)">Delete</button>
                  </td>
                </tr>

                <tr v-if="!commentStore.comments.length">
                  <td colspan="5" class="no-data">🚫 No Comments</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <!-- ANNOUNCEMENTS MODAL -->
      <div
        v-if="activeAnnouncementModal === 'announcements'"
        class="modal-overlay"
        @click.self="closeAnnouncementsModal"
      >
        <div class="modal large">
          <h3 style="color: black">{{ $t('announcements') }}</h3>

          <!-- Table -->
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('Title') }}</th>
                  <th>{{ $t('Message') }}</th>
                  <th>{{ $t('Date') }}</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(announcement, index) in announcementStore.announcements"
                  :key="announcement.id"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ announcement.title }}</td>
                  <td>{{ announcement.message }}</td>
                  <td>{{ formatDate(announcement.created_at) }}</td>
                </tr>

                <tr v-if="!announcementStore.announcements.length">
                  <td colspan="4" class="no-data">🚫 No Announcements</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <!-- PASSWORD RESET MODAL -->
      <div
        v-if="activePasswordResetModal === 'passwordReset'"
        class="modal-overlay"
        @click.self="closePasswordResetModal"
      >
        <div class="modal">
          <h3 style="color: black">{{ $t('resetPasswordTitle') }}</h3>

          <!-- Success Message -->
          <div v-if="successPasswordResetMessage" class="success-alert">
            {{ successPasswordResetMessage }}
          </div>

          <!-- Error Message -->
          <div v-if="auth.error" class="error-alert">
            {{ auth.error }}
          </div>

          <p>{{ $t('resetPasswordDescription') }}</p>

          <!-- PASSWORD RESET FORM -->
          <form @submit.prevent="sendPasswordResetLink">
            <div class="form-group">
              <label>{{ $t('email') }}:</label>
              <input
                v-model="passwordResetForm.email"
                type="email"
                :placeholder="$t('email')"
                required
              />
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary" :disabled="auth.loading">
                {{ auth.loading ? 'Sending...' : $t('sendResetLink') }}
              </button>
              <button type="button" class="btn-secondary" @click="closePasswordResetModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.payment-alert {
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  margin: 10px 0;
}
/* Badge styles */
.badge {
  display: inline-block;
  width: 10px;
  height: 10px;
  background: red;
  border-radius: 50%;
  margin-left: 8px;
}
/* button for delete styles */
.btn-delete {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-delete:hover {
  background: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(192, 57, 43, 0.25);
}
/* payment status styles */
.paid {
  color: #16a34a;
  background: #dcfce7;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.unpaid {
  color: #dc2626;
  background: #fee2e2;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
/* Update Phone Number button styles */

.btn-update {
  margin-top: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #14b8a6, #0f766e);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* hover animation */
.btn-update:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 6px 15px rgba(20, 184, 166, 0.4);
}

/* click animation */
.btn-update:active {
  transform: scale(0.95);
}

/* ----- END --- */

/* Modal fade background */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.25s ease;
}

/* Start & end state */
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Slight zoom effect for modal box */
.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: scale(0.9);
}

.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal {
  transition: transform 0.25s ease;
}

/* User Profile classes */
.profile-container {
  display: flex;
  gap: 20px;
  margin-top: 20px;
  align-items: center;
}

.profile-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f1f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
}

.profile-details {
  flex: 1;
}

.profile-item {
  margin-bottom: 15px;
}

.profile-item label {
  font-weight: bold;
  display: block;
  color: #555;
}

.profile-item p {
  margin: 5px 0 0;
  font-size: 16px;
}

.no-data-class-statement {
  text-align: center; /* text-center */
  padding-top: 1.5rem; /* py-6 */
  padding-bottom: 1.5rem; /* py-6 */
  color: #6b7280; /* text-gray-500 */
}
/* Success message color */
.success-alert {
  background: #d1fae5;
  color: #065f46;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: 500;
}

/* Error message color */
.error-alert {
  background: #fee2e2;
  color: #dc2626;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
  font-weight: 500;
}

/* menu button styles */
.menu-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  margin-bottom: 20px;
  cursor: pointer;
}
/* Rooms table inside a modal styles */

.room-table {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.room-table thead {
  background-color: #0f766e;
  color: white;
}

.room-table thead th {
  padding: 12px 15px;
  text-align: left;
}

.room-table tbody td {
  padding: 10px 15px;
  border-bottom: 1px solid #ddd;
}

.room-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.room-table tbody tr:hover {
  background-color: #eef4fc;
}

.room-table td.occupied {
  color: #e74c3c;
  font-weight: bold;
}

.room-table td.available {
  color: #27ae60;
  font-weight: bold;
}

.room-table td.maintenance {
  color: #f39c12;
  font-weight: bold;
}

.room-table td.unknown {
  color: #7f8c8d;
  font-style: italic;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: black;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-primary {
  background: #0f766e;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.btn-primary:hover {
  background: #022c22;
}

.btn-secondary {
  background: #ccc;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.dashboard {
  display: flex;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}

.table-wrapper {
  max-height: 300px; /* Fixed height */
  overflow-y: auto; /* Vertical scroll if content exceeds height */
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px; /* Optional padding */
  background: #fff; /* Optional background */
}

.table-wrapper table {
  width: 100%;
  border-collapse: collapse;
}

.table-wrapper th,
.table-wrapper td {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.table-wrapper thead th {
  position: sticky;
  top: 0;
  z-index: 1;
}

/* Optional: row hover effect */
.table-wrapper tbody tr:hover {
  background-color: #f1f1f1;
}
/* translation buttons */
.language-toggle {
  margin: 10px 0;
  display: flex;
  gap: 5px;
  justify-content: flex-end;
}

.language-toggle button {
  padding: 5px 12px;
  background: transparent;
  border: 1px solid #888;
  color: black; /* 👈 key change */
  cursor: pointer;
  border-radius: 20px;
  font-weight: bold;
  transition: 0.25s ease;
}

.language-toggle button:hover {
  background: rgba(0, 0, 0, 0.05); /* light hover */
  transform: scale(1.05);
}

.language-toggle button.active {
  background: rgba(0, 123, 255, 0.15);
  border-color: #007bff;
  color: #007bff; /* active stays blue */
}

.dashboard {
  display: flex;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}

/* Sidebar */
.sidebar {
  width: 240px;
  background: #022c22;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
}

/* overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

.logo {
  margin-bottom: 30px;
  color: #14b8a6;
}

.nav-item {
  display: block;
  padding: 12px;
  margin-bottom: 8px;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  transition: 0.3s;
}

.nav-item:hover,
.nav-item.active {
  background: #0f766e;
}

#logout {
  margin-top: auto;
  background: #14b8a6;
  padding: 10px;
  text-align: center;
  border-radius: 20px;
  color: white;
  text-decoration: none;
  cursor: pointer;
}

/* Main Content */
.content {
  flex: 1;
  padding: 30px;
  background: #f1f5f9;
}

/* Topbar */
.topbar h1 {
  color: #0f766e;
}

.topbar h2 {
  color: #0f766e;
}

.topbar p {
  margin-bottom: 20px;
  color: #333;
}

/* Stats */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  padding: 20px;
  border-left: 6px solid #14b8a6;
  border-radius: 8px;
  transition: 0.3s;
}
.card:hover {
  transform: translateY(-5px);
}
.number {
  font-size: 1.8rem;
  font-weight: bold;
  color: #022c22;
}

/* Table */
.table-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th,
td {
  padding: 12px;
  border-bottom: 1px solid #ddd;
}
.paid {
  color: green;
  font-weight: bold;
}
.pending {
  color: orange;
  font-weight: bold;
}

.btn-primary {
  background: #0f766e;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-primary:hover {
  background: #022c22;
}
.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Gallery */
.gallery-section {
  margin-bottom: 30px;
}
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
}
.gallery-card img {
  width: 100%;
  border-radius: 8px;
}

/* Rules */
.rules-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
.rules-section ul {
  list-style-type: disc;
  padding-left: 20px;
}

/* Alerts */
.alert {
  color: red;
  font-weight: bold;
  margin-top: 10px;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }
  .stats {
    grid-template-columns: 1fr;
  }
  .gallery {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    transform: translateX(-100%);
    z-index: 1000;
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .menu-btn {
    display: block;
    background: none;
    border: none;
    color: black;
    font-size: 24px;
    margin-bottom: 15px;
    cursor: pointer;
    margin-left: 90%;
  }
}

@media (min-width: 769px) {
  .menu-btn {
    display: none;
  }
}
</style>
