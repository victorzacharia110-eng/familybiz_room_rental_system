<script setup>
import Footer from './Footer.vue'
import { ref, onMounted } from 'vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRoomStore } from '@/stores/room'
import { usePaymentStore } from '@/stores/payment'
import { usePaymentMethodStore } from '@/stores/paymentMethod'
import { useCriticalRemarkStore } from '@/stores/criticalRemark'
import { useLatePaymentReasonStore } from '@/stores/latePaymentReason'
import { useAnnouncementStore } from '@/stores/announcement'
import { useRuleStore } from '@/stores/rules'
import { useCommentStore } from '@/stores/comment'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const paymentStore = usePaymentStore()
const paymentMethodStore = usePaymentMethodStore()
const criticalRemarkStore = useCriticalRemarkStore()
const latePaymentReasonStore = useLatePaymentReasonStore()
const ruleStore = useRuleStore()
const announcementStore = useAnnouncementStore()
const commentStore = useCommentStore()
const { roomsAvailableCount, roomsMaintananceCount, roomsOccupiedCount, totalRooms } =
  storeToRefs(roomStore)

onMounted(async () => {
  await roomStore.fetchRooms()
  await auth.fetchUsers()
  await auth.fetchUser()
  await paymentStore.fetchPayment()
  await paymentStore.fetchPayments()
  await paymentMethodStore.fetchPaymentMethods()
  await criticalRemarkStore.fetchCriticalRemarks()
  await latePaymentReasonStore.fetchLatePaymentReasons()
})

const successMessage = ref('')
const successPaymentMessage = ref('')
const successPaymentMethodMessage = ref('')
const fileInput = ref(null)

const logoutUser = async () => {
  await auth.logout()

  router.push('/login')
}

// This function computes the monthly income
const monthlyIncome = computed(() => {
  return paymentStore.payments
    ?.filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0)
})

// Modal toggle
const showModal = ref(false)

function openModal() {
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

const myRemarks = computed(() => criticalRemarkStore.criticalRemarks)
// This is the function for validating if the data is present
const getTenantLatePayments = (tenantId) => {
  return latePaymentReasonStore.latePaymentReasons?.filter((r) => r.user_id === tenantId) || []
}
// Same for the critical remarks
const successAddingRemarkMessage = ref('')

// This is the function that checks if the landlord can add remark
// to the tenant, it checks if the tenant has less than 3 remarks
// and if the latest payment is unpaid or doesn't exist
const canAddRemark = (tenant) => {
  const status = tenant.room?.latest_payment?.status?.toLowerCase()

  const remarksCount =
    latePaymentReasonStore.latePaymentReasons?.filter((r) => r.user_id === tenant.id).length ?? 0

  return remarksCount < 3 && (!status || status === 'unpaid')
}

// Add critical remark function
async function addRemark(tenant) {
  if (!canAddRemark(tenant)) return

  const remarksForTenant = criticalRemarkStore.criticalRemarks.filter(
    (r) => r.user_id === tenant.id,
  )

  if (remarksForTenant.length >= 3) {
    alert('Maximum critical remarks reached for this tenant!')
    return
  }

  const remark = prompt('Enter critical remark for tenant:')

  // ❗ Only proceed if valid input
  if (remark && remark.trim()) {
    const response = await criticalRemarkStore.registerCriticalRemarks({
      user_id: tenant.id,
      reason: remark,
      type: 'critical',
      active: true,
    })

    // ✅ Only show message if backend succeeded
    if (response) {
      successAddingRemarkMessage.value = '✅ Remark created successfully!'

      setTimeout(() => {
        successAddingRemarkMessage.value = ''
      }, 3000)
    }
  }
}

const roomForm = ref({
  room_number: '',
  room_price: 0,
  type: 'Single',
  status: 'Available',
  photo: null, // actual file
  preview: null, // preview image
})

const paymentForm = ref({
  room_id: '',
  month: '',
  year: '',
  due_date: '',
  amount: '',
  status: 'unpaid',
})

const paymentMethodForm = ref({
  airtel_money_number: 0,
  mixx_by_yas_number: 0,
  m_pesa_number: 0,
  halopesa_number: 0,
  nmb_account_number: 0,
  crdb_account_number: 0,
  nbc_account_number: 0,
})

const ruleForm = ref({
  title: '',
  description: '',
  type: '',
})

// Payment Method fetching ( from backend )
const paymentMethodFetching = async () => {
  const paymentMethodFetched = await paymentMethodStore.fetchPaymentMethods()
  console.log('Payment Methods Fetched : ', paymentMethodFetched)
}

// Ferch payments ( from backend )
const paymentFetching = async () => {
  const paymentFetched = await paymentStore.fetchPayments()
  console.log('fetched payments : ', paymentFetched)
}

// Save payment into the backend
const savePayment = async () => {
  const newPayment = await paymentStore.registerPayment(paymentForm.value)

  console.log('new payment data', newPayment)

  if (newPayment) {
    successPaymentMessage.value = '✅ Payment created successfully!'
    resetPaymentForm() //  invoking the form clearance function
  }
}

// Save Payment Methods into the backend
const savePaymentMethod = async () => {
  const newPaymentMethod = await paymentMethodStore.registerPaymentMethods(paymentMethodForm.value)
  console.log('New Payment Method : ', newPaymentMethod)

  if (newPaymentMethod) {
    successPaymentMethodMessage.value = '✅ Payment method created successfully!'
    // This function clears the data after being created
    resetPaymentMethodForm()
  }
}

const successCreationRuleMessage = ref('')
// Save Rules into the backend
const savingRules = async () => {
  const newRule = await ruleStore.registerRules(ruleForm.value)
  console.log('Rule added : ', newRule)

  if (newRule) {
    successCreationRuleMessage.value = '✅ Rule created successfully!'
    resetRulesForm()
  }
}

function resetRulesForm() {
  ruleForm.value = {
    title: '',
    description: '',
    type: '',
  }
}
// Fetch rooms (from backend)
const roomFetching = async () => {
  const roomsFetched = await roomStore.fetchRooms()
  console.log('Fetched Rooms:', roomsFetched)
}

// Save new room
const saveRoom = async () => {
  const newRoom = await roomStore.registerRoom(roomForm.value)

  console.log('Data saved :', newRoom)

  if (newRoom) {
    successMessage.value = '✅ Room created successfully!'
    resetRoomForm() //  invoking the form clearance function
  }
}

// room deletion process is done by this function here...
const deleteRoom = async (id) => {
  const confirmed = window.confirm('⚠️ This will permanently delete the room. Continue?')

  if (!confirmed) return

  try {
    const response = await roomStore.deleteRoom(id)

    if (response) {
      alert('✅ Room deleted successfully!')
    } else {
      alert('❌ Failed to delete room')
    }
  } catch (error) {
    console.error(error)
    alert('❌ Something went wrong while deleting the room')
  }
}

// payment method deletion action is done here
const deletingPaymentMethod = async (id) => {
  const confirmed = window.confirm('⚠️ This will permanently delete the payment method. Continue?')

  if (!confirmed) return

  try {
    const response = await paymentMethodStore.deletePaymentMethod(id)

    if (response) {
      alert('✅ Payment method deleted successfully!')
    } else {
      alert('❌ Failed to delete payment method')
    }
  } catch (error) {
    console.error(error)
    alert('❌ Something went wrong while deleting the payment method')
  }

  // After deletion, refresh the payment methods list
  paymentMethodFetching()
}
// Payment deletion action is done here
const deletePayment = async (id) => {
  const confirmed = window.confirm('⚠️ This will permanently delete the payment. Continue?')

  if (!confirmed) return

  try {
    const response = await paymentStore.deletePayment(id)

    if (response) {
      alert('✅ Payment deleted successfully!')
    } else {
      alert('❌ Failed to delete payment')
    }
  } catch (error) {
    console.error(error)
    alert('❌ Something went wrong while deleting the payment')
  }

  // After deletion, refresh the payments list
  paymentFetching()
}

// ------------------------- MODAL FUNCTIONS FOR THE PAYMENTS MODAL ---------------------------

// controls which modal is open AND which sidebar item is active
const activePaymentsModal = ref(null)

// opens payments modal
function openPaymentsModal(ModalName) {
  activePaymentsModal.value = ModalName

  if (ModalName === 'payments') {
    // this will log the fetched payments data
    paymentFetching()
  }
}

// closing payments modal
function closePaymentsModal() {
  activePaymentsModal.value = null
}

// ------------------- MODAL FUNCTIONS FOR THE PAYMENT METHOD MODAL -------------------------
// controls which modal is open  and which sidebar item is active
const activePaymentMethodModal = ref(null)

// open payment methods modal
function openPaymentMethodModal(ModalName) {
  activePaymentMethodModal.value = ModalName

  if (ModalName === 'paymentMethod') {
    // This function loads the data  from the backend into the modal when it opens
    paymentMethodFetching()
  }
}

// closing the payment method modal
function closePaymentMethodModal() {
  activePaymentMethodModal.value = null
}

// ---------- MODAL FUNCTIONS FOR THE ROOM MODAL---------------------

// controls which modal is open AND which sidebar item is active
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

// file handling
const handleImageUpload = (event) => {
  const file = event.target.files[0]

  if (!file) return

  roomForm.value.photo = file
  roomForm.value.preview = URL.createObjectURL(file)
}

// This is a reset function after the registration of newly added room
const resetRoomForm = () => {
  roomForm.value = {
    room_number: '',
    room_price: 0,
    type: 'Single',
    status: 'Available',
    photo: null,
    preview: null,
  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// This is a reset function after the creation of the payment
const resetPaymentForm = () => {
  paymentForm.value = {
    room_id: '',
    month: '',
    year: '',
    due_date: '',
    amount: 0,
    status: 'pending',
  }
}

const resetPaymentMethodForm = () => {
  paymentMethodForm.value = {
    airtel_money_number: '',
    m_pesa_number: '',
    mixx_by_yas_number: '',
    halopesa_number: '',
    nmb_account_number: '',
    crdb_account_number: '',
    nbc_account_number: '',
  }
}

// -------------------- LANGUAGE TOGGLE --------------------
const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// ---------------------- SIDEBAR RESPONSIVENESS FUNCTIONS -------------------------------------
const isSidebarOpen = ref(false)

// ----------------------------- User Profile Functions and variables -------------------------------------
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

// -------------------------- REMARKS FUNCTIONS AND VARIABLES ----------------------------------------------------
const activeRemarksModal = ref(null)

const remarksFetching = async () => {
  const remarksFetch = await criticalRemarkStore.fetchCriticalRemarks()

  console.log('remarks fetched from the component : ', remarksFetch)
}

const openRemarksModal = (ModalName) => {
  activeRemarksModal.value = ModalName

  if (ModalName === 'remarks') {
    remarksFetching()
  }
}

const closeRemarksModal = () => {
  activeRemarksModal.value = null
}

// ------------------------------ ANNOUNCEMENTS FUNCTIONS AND VARIABLES ---------------------------------
const activeAnnouncementModal = ref(null)
const successAnnouncementMessage = ref('')
const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}

const openAnnouncementModal = (ModalName) => {
  activeAnnouncementModal.value = ModalName
  if (ModalName === 'announcements') {
    announcementsFetching()
  }
}
const announcementsFetching = async () => {
  const fetchedAnnouncements = await announcementStore.fetchAnnouncements()
  console.log('announcements', fetchedAnnouncements)
}

const announcementForm = ref({
  title: '',
  message: '',
})

const saveAnnouncement = async () => {
  const newAnnouncement = await announcementStore.registerAnnouncement(announcementForm.value)
  console.log('new Announcement added : ', newAnnouncement)

  if (newAnnouncement) {
    successAnnouncementMessage.value = '✅ Announcement created successfully!'

    resetAnnouncementForm()
  }
}

const resetAnnouncementForm = () => {
  announcementForm.value = {
    title: '',
    message: '',
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

const deleteComment = async (id) => {
  await commentStore.deleteComment(id)
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

// Payment status function for dynamic styling in tenants table
const paymentStatus = (tenant) => {
  return tenant.room?.latest_payment?.status === 'paid' ? 'paid' : 'unpaid'
}
</script>

<template>
  <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">☰</button>
  <div class="dashboard">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ open: isSidebarOpen }">
      <h2 class="logo">FamilyBiz App</h2>

      <!-- Sidebar Navigation -->
      <nav>
        <!-- <router-link to="/landlord" class="nav-item">🏠 {{ $t('home') }}</router-link> -->
        <router-link to="/landlord" class="nav-item active">📊 {{ $t('dashboard') }}</router-link>

        <a
          href="#"
          class="nav-item"
          :class="{ active: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          📢 {{ $t('Announcements') }}
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
          👤 {{ $t('Profile') }}
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
          🚪 {{ $t('rooms') }}
        </a>
        <!-- <router-link to="/" class="nav-item">👥 {{ $t('tenants') }}</router-link> -->
        <a
          href="#"
          class="nav-item"
          :class="{ active: activePaymentsModal === 'payments' }"
          @click.prevent="openPaymentsModal('payments')"
          >💰 {{ $t('payments') }}</a
        >

        <a
          href="#"
          class="nav-item"
          :class="{ active: activePaymentMethodModal === 'paymentMethod' }"
          @click.prevent="openPaymentMethodModal('paymentMethod')"
          >💳 {{ $t('paymentMethods') }}</a
        >
        <!-- <router-link to="/" class="nav-item">⚙ {{ $t('settings') }}</router-link> -->
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
      <header class="topbar">
        <h1>{{ $t('landlordDashboard') }}</h1>
        <h2 v-if="auth.user?.last_name">{{ $t('welcome') }}, {{ auth.user?.last_name }}</h2>
        <p>{{ $t('manageRoomsTenants') }}</p>
      </header>

      <!-- Stats Cards -->
      <section class="stats">
        <div class="card">
          <h3>{{ $t('Total Rooms') }}</h3>
          <p class="number">{{ totalRooms }}</p>
        </div>

        <div class="card">
          <h3>{{ $t('Occupied') }}</h3>
          <p class="number">{{ roomsOccupiedCount }}</p>
        </div>

        <div class="card">
          <h3>{{ $t('Available') }}</h3>
          <p class="number">{{ roomsAvailableCount }}</p>
        </div>

        <div class="card">
          <h3>{{ $t('Maintanance') }}</h3>
          <p class="number">{{ roomsMaintananceCount }}</p>
        </div>

        <div class="card">
          <h3>{{ $t('Monthly Income') }}</h3>
          <p class="number">TZS : {{ Number(monthlyIncome).toLocaleString() }}</p>
        </div>
      </section>

      <!-- Tenants Table -->
      <section class="table-section">
        <div v-if="successAddingRemarkMessage" class="success-alert">
          {{ successAddingRemarkMessage }}
        </div>
        <h2>{{ $t('tenantsOverview') }}</h2>
        <button
          class="btn-primary"
          :class="{ active: activeRemarksModal === 'remarks' }"
          @click.prevent="openRemarksModal('remarks')"
        >
          {{ $t('viewRemark') }}
        </button>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>{{ $t('Last Name') }}</th>
              <th>{{ $t('Room') }}</th>
              <th>{{ $t('Phone Number') }}</th>
              <th>{{ $t('Payment Status') }}</th>
              <th>{{ $t('Number of Late Payments') }}</th>
              <th>{{ $t('Late Payments') }}</th>
              <th>{{ $t('Action') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(tenant, index) in auth.users" :key="tenant?.id">
              <td>{{ index + 1 }}</td>
              <td>{{ tenant.last_name }}</td>
              <td>
                <span v-if="tenant.room?.room_number">
                  {{ tenant.room.room_number }}
                </span>

                <span v-else class="text-muted"> No room assigned </span>
              </td>
              <td>{{ tenant.phone_number }}</td>
              <td :class="paymentStatus(tenant)">
                {{ tenant.room?.latest_payment?.status ?? 'unpaid' }}
              </td>

              <td>
                {{
                  latePaymentReasonStore.latePaymentReasons?.filter((r) => r.user_id === tenant.id)
                    .length
                }}
              </td>
              <td>
                <ul v-if="getTenantLatePayments(tenant.id).length">
                  <li
                    v-for="late_payment in getTenantLatePayments(tenant.id)"
                    :key="late_payment.id"
                  >
                    {{ late_payment.reason_text }}
                  </li>
                </ul>

                <span v-else class="no-data"> 🚫 No late payments </span>
              </td>
              <td style="display: flex; gap: 5%">
                <button
                  class="btn-primary"
                  @click="addRemark(tenant)"
                  :disabled="!canAddRemark(tenant)"
                >
                  {{ $t('addRemark') }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Rules Panel -->
      <section class="rules-section">
        <h2>{{ $t('tenantRulesPolicies') }}</h2>
        <button class="btn-primary" @click="openModal" style="margin-bottom: 15px">
          {{ $t('addNewRule') }}
        </button>
        <ul>
          <li>{{ $t('maintainCleanliness') }}</li>
          <li>{{ $t('noGangs') }}</li>
          <li>{{ $t('rentOnTime') }}</li>
          <li>{{ $t('maxCriticalRemarks') }}</li>
          <li>{{ $t('noIllegalParties') }}</li>
        </ul>

        <Transition name="modal-fade">
          <!-- Modal for adding rule -->
          <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal">
              <div v-if="successCreationRuleMessage" class="success-alert">
                {{ successCreationRuleMessage }}
              </div>

              <h3>{{ $t('addNewRule') }}</h3>
              <form @submit.prevent="savingRules">
                <div class="form-group">
                  <label>{{ $t('title') }}:</label>
                  <input
                    :placeholder="$t('ruleTitlePlaceholder')"
                    type="text"
                    v-model="ruleForm.title"
                  />
                </div>
                <div class="form-group">
                  <label>{{ $t('description') }}:</label>
                  <textarea
                    :placeholder="$t('ruleDescriptionPlaceholder')"
                    v-model="ruleForm.description"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>{{ $t('type') }}:</label>
                  <select v-model="ruleForm.type">
                    <option value="cleanliness">{{ $t('cleanliness') }}</option>
                    <option value="safety">{{ $t('safety') }}</option>
                    <option value="payment">{{ $t('payment') }}</option>
                  </select>
                </div>
                <div class="modal-actions">
                  <button type="submit" class="btn-primary">{{ $t('save') }}</button>
                  <button type="button" class="btn-secondary" @click="closeModal">
                    {{ $t('cancel') }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Transition>
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
      <!-- ROOMS MODAL -->
      <div v-if="activeRoomsModal === 'rooms'" class="modal-overlay" @click.self="closeModal">
        <div class="modal large">
          <h3 style="color: black">{{ $t('roomManagement') }}</h3>

          <div v-if="successMessage" class="success-alert">
            {{ successMessage }}
          </div>

          <!-- Room Form -->
          <form @submit.prevent="saveRoom">
            <div class="form-group">
              <label>{{ $t('roomNumber') }}:</label>
              <input
                v-model="roomForm.room_number"
                type="text"
                placeholder="Enter room number"
                required
              />
            </div>

            <div class="form-group">
              <label>{{ $t('roomPrice') }}:</label>
              <input
                v-model="roomForm.room_price"
                type="number"
                placeholder="Enter room price"
                required
              />
            </div>

            <div class="form-group">
              <label>{{ $t('roomType') }}:</label>
              <select v-model="roomForm.type" required>
                <option value="Single">{{ $t('single') }}</option>
                <option value="Double">{{ $t('double') }}</option>
                <option value="Empty">{{ $t('emptyRoom') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ $t('status') }}:</label>
              <select v-model="roomForm.status">
                <option :value="'Available'">{{ $t('available') }}</option>
                <option :value="'Occupied'">{{ $t('occupied') }}</option>
                <option :value="'Maintenance'">{{ $t('maintanance') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label>{{ $t('roomPhotoOptional') }}:</label>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                hidden
              />
              <button type="button" class="btn-select" @click="$refs.fileInput.click()">
                📷 {{ $t('selectImage') }}
              </button>
            </div>

            <div v-if="roomForm.preview" class="image-preview">
              <p>{{ $t('preview') }}:</p>
              <img :src="roomForm.preview" alt="Room Image" />
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">{{ $t('addRoom') }}</button>
              <button type="button" class="btn-secondary" @click="closeRoomsModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>

          <!-- Rooms Table -->
          <div class="table-wrapper">
            <h4>{{ $t('existingRooms') }}</h4>
            <table>
              <thead>
                <tr>
                  <th>{{ $t('room') }}</th>
                  <th>{{ $t('type') }}</th>
                  <th>{{ $t('status') }}</th>
                  <th>{{ $t('action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="room in roomStore.rooms" :key="room?.id">
                  <td>{{ room?.room_number || 'N/A' }}</td>
                  <td>{{ room?.type || 'Unknown' }}</td>
                  <td :class="room?.status ? room.status.toLowerCase() : 'unknown'">
                    {{ room?.status || 'Unknown' }}
                  </td>
                  <td>
                    <span class="room-actions">
                      <!-- Edit navigates to the edit form for this room -->
                      <router-link v-if="room.id" :to="`/room/show/${room.id}`" class="btn-edit">
                        {{ $t('edit') }}
                      </router-link>

                      <!-- Delete button can stay as an action -->
                      <button class="btn-delete" @click="deleteRoom(room.id)">
                        {{ $t('delete') }}
                      </button>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal-fade">
      <!-- REMARKS MODAL -->

      <div
        v-if="activeRemarksModal === 'remarks'"
        class="modal-overlay"
        @click.self="closeRemarksModal"
      >
        <div class="modal large">
          <!-- Remarks Table -->
          <button style="" type="button" class="btn-secondary" @click="closeRemarksModal">
            {{ $t('close') }}
          </button>
          <div class="table-wrapper">
            <h4>{{ $t('Remarks') }}</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tenant</th>
                  <th>Type</th>
                  <th>Reason</th>
                </tr>
              </thead>

              <tbody>
                <tr v-if="myRemarks.length === 0">
                  <td colspan="4" class="no-data">🚫 No Remarks</td>
                </tr>

                <tr v-else v-for="(remark, index) in myRemarks" :key="remark.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ remark.user?.last_name || 'N/A' }}</td>

                  <td>{{ remark.type }}</td>
                  <td>{{ remark.reason_text }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Transition>
    <Transition name="modal-fade">
      <!-- PAYMENTS MODAL -->
      <div v-if="activePaymentsModal === 'payments'" class="modal-overlay" @click.self="closeModal">
        <div class="modal large">
          <h3 style="color: black">{{ $t('paymentManagement') }}</h3>

          <div v-if="successPaymentMessage" class="success-alert">
            {{ successPaymentMessage }}
          </div>

          <!-- Payments Form -->
          <form @submit.prevent="savePayment">
            <!-- Room Selection -->
            <div class="form-group">
              <label>{{ $t('roomNumber') }}:</label>
              <select v-model="paymentForm.room_id" required>
                <option disabled value="">Select Room</option>
                <option v-for="room in roomStore.rooms" :key="room.id" :value="room.id">
                  {{ room.status }} - {{ room.room_number }} - {{ room.room_price }}
                </option>
              </select>
            </div>

            <!-- Month -->
            <div class="form-group">
              <label>Month:</label>
              <select v-model="paymentForm.month" required>
                <option disabled value="">Select Month</option>
                <option v-for="(name, index) in months" :key="index" :value="index + 1">
                  {{ name }}
                </option>
              </select>
            </div>

            <!-- Year -->
            <div class="form-group">
              <label>Year:</label>
              <input v-model="paymentForm.year" type="number" placeholder="Enter year" required />
            </div>

            <!-- Amount -->
            <div class="form-group">
              <label>Amount:</label>
              <input
                v-model="paymentForm.amount"
                type="number"
                min="0"
                placeholder="Enter amount"
                required
              />
            </div>

            <!-- Status -->
            <div class="form-group">
              <label>Status:</label>
              <select v-model="paymentForm.status" required>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            <!-- Due Date -->
            <div class="form-group">
              <label>Due Date:</label>
              <input v-model="paymentForm.due_date" type="date" required />
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="submit" class="btn-primary">Save Payment</button>
              <button type="button" class="btn-secondary" @click="closePaymentsModal">Close</button>
            </div>
          </form>

          <!-- Payments Table -->
          <div class="table-wrapper">
            <h4>{{ $t('payments') }}</h4>
            <table>
              <thead>
                <tr>
                  <th>{{ $t('Room') }}</th>
                  <th>{{ $t('Month') }}</th>
                  <th>{{ $t('Year') }}</th>
                  <th>{{ $t('Amount') }}</th>
                  <th>{{ $t('Status') }}</th>
                  <th>{{ $t('Due Date') }}</th>
                  <th>{{ $t('Action') }}</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="payment in paymentStore.payments" :key="payment.id">
                  <!-- Room Number from relationship -->
                  <td>
                    {{ payment.room?.room_number || 'N/A' }}
                  </td>

                  <td>{{ payment.month_name }}</td>
                  <td>{{ payment.year }}</td>
                  <td>{{ payment.amount }}</td>

                  <!-- Status with styling -->
                  <td :class="payment.status ? payment.status.toLowerCase() : 'unknown'">
                    {{ payment.status }}
                  </td>

                  <td>{{ formatDate(payment.due_date) }}</td>

                  <td>
                    <span class="room-actions">
                      <!-- Edit -->
                      <router-link :to="`/payment/show/${payment.id}`" class="btn-edit">
                        Edit
                      </router-link>

                      <!-- Delete -->
                      <button class="btn-delete" @click="deletePayment(payment.id)">Delete</button>
                    </span>
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
      <div
        v-if="activePaymentMethodModal === 'paymentMethod'"
        class="modal-overlay"
        @click.self="closePaymentMethodModal"
      >
        <div class="modal large">
          <h3 style="color: black">{{ $t('paymentMethodManagement') }}</h3>

          <div v-if="successPaymentMethodMessage" class="success-alert">
            {{ successPaymentMethodMessage }}
          </div>

          <!-- Payment Method Form -->
          <form @submit.prevent="savePaymentMethod">
            <div class="form-group">
              <label>{{ $t('airtelMoneyNumber') }}:</label>
              <input
                v-model="paymentMethodForm.airtel_money_number"
                type="number"
                placeholder="Enter airtel money number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('mPesaNumber') }}:</label>
              <input
                v-model="paymentMethodForm.m_pesa_number"
                type="number"
                placeholder="Enter m pesa number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('mixxByYasNumber') }}:</label>
              <input
                v-model="paymentMethodForm.mixx_by_yas_number"
                type="number"
                placeholder="Enter mixx by yas number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('halopesaNumber') }}:</label>
              <input
                v-model="paymentMethodForm.halopesa_number"
                type="number"
                placeholder="Enter halopesa number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('nmbAccountNumber') }}:</label>
              <input
                v-model="paymentMethodForm.nmb_account_number"
                type="number"
                placeholder="Enter nmb account number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('crdbAccountNumber') }}:</label>
              <input
                v-model="paymentMethodForm.crdb_account_number"
                type="number"
                placeholder="Enter crdb account number"
              />
            </div>

            <div class="form-group">
              <label>{{ $t('nbcAccountNumber') }}:</label>
              <input
                v-model="paymentMethodForm.nbc_account_number"
                type="number"
                placeholder="Enter nbc account number"
              />
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary">{{ $t('addPaymentMethod') }}</button>
              <button type="button" class="btn-secondary" @click="closePaymentMethodModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>

          <!-- Payment Methods Table -->
          <div class="table-wrapper">
            <h4>{{ $t('existingPaymentMethods') }}</h4>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('airtelMoneyNumber') }}</th>
                  <th>{{ $t('mPesaNumber') }}</th>
                  <th>{{ $t('mixxByYasNumber') }}</th>
                  <th>{{ $t('halopesaNumber') }}</th>
                  <th>{{ $t('nmbAccountNumber') }}</th>
                  <th>{{ $t('crdbAccountNumber') }}</th>
                  <th>{{ $t('nbcAccountNumber') }}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(payment_method, index) in paymentMethodStore.paymentMethods"
                  :key="payment_method?.id"
                >
                  <td>{{ index + 1 }}</td>
                  <td>{{ payment_method?.airtel_money_number || 'N/A' }}</td>
                  <td>{{ payment_method?.m_pesa_number || 'N/A' }}</td>
                  <td>{{ payment_method?.mixx_by_yas_number || 'N/A' }}</td>
                  <td>{{ payment_method?.halopesa_number || 'N/A' }}</td>
                  <td>{{ payment_method?.nmb_account_number || 'N/A' }}</td>
                  <td>{{ payment_method?.crdb_account_number || 'N/A' }}</td>
                  <td>{{ payment_method?.nbc_account_number || 'N/A' }}</td>
                  <td>
                    <span class="room-actions">
                      <!-- Edit navigates to the edit form for this room -->
                      <router-link
                        v-if="payment_method?.id"
                        :to="`/method/show/${payment_method?.id}`"
                        class="btn-edit"
                      >
                        {{ $t('edit') }}
                      </router-link>

                      <!-- Delete button can stay as an action -->
                      <button class="btn-delete" @click="deletingPaymentMethod(payment_method.id)">
                        {{ $t('delete') }}
                      </button>
                    </span>
                  </td>
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

          <!-- Success Message -->
          <div v-if="successAnnouncementMessage" class="success-alert">
            {{ successAnnouncementMessage }}
          </div>

          <!-- Announcement Form -->
          <form @submit.prevent="saveAnnouncement">
            <!-- Title -->
            <div class="form-group">
              <label>{{ $t('title') }}:</label>
              <input
                v-model="announcementForm.title"
                type="text"
                placeholder="Enter announcement title"
                required
              />
            </div>

            <!-- Message -->
            <div class="form-group">
              <label>{{ $t('message') }}:</label>
              <textarea
                v-model="announcementForm.message"
                placeholder="Enter announcement message"
                required
              ></textarea>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="submit" class="btn-primary">Save Announcement</button>
              <button type="button" class="btn-secondary" @click="closeAnnouncementsModal">
                Close
              </button>
            </div>
          </form>

          <!-- Table -->
          <div class="table-wrapper">
            <h4>{{ $t('announcements') }}</h4>

            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="announcement in announcementStore.announcements" :key="announcement.id">
                  <td>{{ announcement.title }}</td>
                  <td>{{ announcement.message }}</td>
                  <td>{{ formatDate(announcement.created_at) }}</td>

                  <td>
                    <span class="room-actions">
                      <button class="btn-delete" @click="deleteAnnouncement(announcement.id)">
                        Delete
                      </button>
                    </span>
                  </td>
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
      <!-- COMMENTS MODAL -->
      <div
        v-if="activeCommentsModal === 'comments'"
        class="modal-overlay"
        @click.self="closeCommentsModal"
      >
        <div class="modal large">
          <h3 style="color: black">{{ $t('Comments') }}</h3>

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
            <h4>{{ $t('All Comments') }}</h4>

            <table>
              <thead>
                <tr>
                  <th>{{ $t('Tenant') }}</th>
                  <th>{{ $t('Comment') }}</th>
                  <th>{{ $t('Rating') }}</th>
                  <th>{{ $t('Date') }}</th>
                  <th>{{ $t('Action') }}</th>
                </tr>
              </thead>

              <tbody>
                <tr v-for="comment in commentStore.comments" :key="comment.id">
                  <td>{{ comment.user?.last_name || 'N/A' }}</td>
                  <td>{{ comment.comment }}</td>
                  <td>{{ comment.rating }} ⭐</td>
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
.text-muted {
  color: black;
  font-size: 0.9rem;
  font-style: italic;
}
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
/* No data class for no payment table data  */
.no-data {
  color: black;
  font-style: italic;
  font-size: 0.9rem;
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

/* Action buttons styling */
.room-actions {
  display: flex;
  gap: 8px;
}

.room-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 5px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* Edit button styled as a link but looks like a button */
.btn-edit {
  display: inline-block;
  background-color: #0f766e; /* same teal as login/update button */
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
  transition: 0.3s;
  font-size: 0.9rem;
}

.btn-edit:hover {
  background-color: #022c22; /* darker shade on hover */
  transform: translateY(-1px);
}

.btn-edit:hover {
  background-color: #2980b9;
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
.btn-delete:hover {
  background-color: #c0392b;
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

/* overlay */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 999;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.modal {
  background: white;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  padding: 20px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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

/* Content */
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
  color: black;
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
.unpaid {
  color: red;
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
  background: #f9f9f9;
  z-index: 1;
}

/* Optional: row hover effect */
.table-wrapper tbody tr:hover {
  background-color: #f1f1f1;
}

.room-type {
  background: #14b8a6;
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.available {
  color: green;
  font-weight: bold;
}

.occupied {
  color: orange;
  font-weight: bold;
}

.maintenance {
  color: red;
  font-weight: bold;
}

.room-thumb {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.image-preview {
  width: 100%;
  max-width: 420px;
  height: 240px;
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
  background: #f7f7f7;

  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* prevents stretching */
  display: block;
}
/* Rules Panel */
.rules-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
}
.rules-section ul {
  list-style-type: disc;
  padding-left: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard {
    flex-direction: column;
  }

  .stats {
    grid-template-columns: 1fr;
  }
  /* image preview styles */
  .image-preview {
    margin-top: 15px;
    text-align: center;
  }

  .image-preview img {
    width: 100%;
    max-width: 250px;
    height: 160px;
    object-fit: cover;
    border-radius: 8px;
    border: 3px solid #14b8a6;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
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

  .modal {
    width: 95%;
    padding: 15px;
    max-height: 90vh;

    /* THIS is the key fix */
    overflow-y: auto;
  }

  .modal-overlay {
    align-items: flex-start; /* prevents top/bottom cut on small screens */
    padding: 10px;
  }
}

@media (min-width: 769px) {
  .menu-btn {
    display: none;
  }
}
</style>
