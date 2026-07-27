<script setup>
import Footer from './Footer.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
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
import { useFootballStore } from '@/stores/entertainment/football.js'
import EntertainmentModal from './EntertainmentModal.vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import SkeletonLoader from './SkeletonLoader.vue'
import PaginationControls from './PaginationControls.vue'
import { usePagination } from '@/composables/usePagination'
import api from '@/composables/api'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faChartBar,
  faBullhorn,
  faComments,
  faUser,
  faLock,
  faDoorOpen,
  faMoneyBill,
  faCreditCard,
  faCheckCircle,
  faWrench,
  faBuilding,
  faHouse,
  faTriangleExclamation,
  faThumbtack,
  faFloppyDisk,
  faBars,
  faBan,
  faStar,
  faCamera,
  faMobileAlt,
  faRightFromBracket,
  faPencil,
  faTrash,
  faPlus,
  faEye,
  faXmark,
  faCircle,
  faSpinner,
  faEnvelope,
  faBell,
  faShield,
  faKey,
  faTag,
  faComment,
  faTimes,
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
  faMoneyBill,
  faCreditCard,
  faCheckCircle,
  faWrench,
  faBuilding,
  faHouse,
  faTriangleExclamation,
  faThumbtack,
  faFloppyDisk,
  faBars,
  faBan,
  faStar,
  faCamera,
  faMobileAlt,
  faRightFromBracket,
  faPencil,
  faTrash,
  faPlus,
  faEye,
  faXmark,
  faCircle,
  faSpinner,
  faEnvelope,
  faBell,
  faShield,
  faKey,
  faTag,
  faComment,
  faTimes,
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
const criticalRemarkStore = useCriticalRemarkStore()
const latePaymentReasonStore = useLatePaymentReasonStore()
const ruleStore = useRuleStore()
const announcementStore = useAnnouncementStore()
const commentStore = useCommentStore()

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

const { roomsAvailableCount, roomsMaintananceCount, roomsOccupiedCount, totalRooms } =
  storeToRefs(roomStore)

const tenantLoading = ref(true)
onMounted(async () => {
  await roomStore.fetchRooms()
  await auth.fetchUsers()
  tenantLoading.value = false
  await auth.fetchUser()
  await paymentStore.fetchPayment()
  await paymentStore.fetchPayments()
  await paymentMethodStore.fetchPaymentMethods()
  await criticalRemarkStore.fetchCriticalRemarks()
  await latePaymentReasonStore.fetchLatePaymentReasons()
  await fetchUnconfirmedPaymentsList()
  lastUnconfirmedCount.value = unconfirmedPayments.value.length
  startUnconfirmedPolling()
  initCanvas()
  buildCubes()
  await criticalRemarkStore.fetchCriticalRemarks()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  if (unconfirmedPollInterval) clearInterval(unconfirmedPollInterval)
})

let unconfirmedPollInterval = null
const lastUnconfirmedCount = ref(0)
const showAlertBanner = ref(false)

const startUnconfirmedPolling = () => {
  unconfirmedPollInterval = setInterval(async () => {
    try {
      const response = await api.get('/api/payment/unconfirmed')
      const payments = response.data.unconfirmed_payments || []
      if (payments.length > lastUnconfirmedCount.value && lastUnconfirmedCount.value > 0) {
        showAlertBanner.value = true
        try { new Audio('/alert.mp3').play().catch(() => {}) } catch (e) {}
      }
      lastUnconfirmedCount.value = payments.length
      unconfirmedPayments.value = payments
    } catch (err) {
      console.error('Polling error:', err)
    }
  }, 30000)
}

const successMessage = ref('')
const successPaymentMessage = ref('')
const successPaymentMethodMessage = ref('')
const fileInput = ref(null)
const successAddingRemarkMessage = ref('')
const successCreationRuleMessage = ref('')
const successAnnouncementMessage = ref('')
const successCommentMessage = ref('')
const successPasswordResetMessage = ref('')
const unconfirmedPayments = ref([])
const unconfirmedPaymentLoading = ref(false)
const activeUnconfirmedModal = ref(null)

const logoutUser = async () => {
  await auth.logout()
  router.push('/login')
}

const monthlyIncome = computed(() =>
  paymentStore.payments
    ?.filter((p) => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount || 0), 0),
)

const showModal = ref(false)
const activePaymentsModal = ref(null)
const activePaymentMethodModal = ref(null)
const activeRoomsModal = ref(null)
const activeProfileModal = ref(null)
const activeRemarksModal = ref(null)
const activeAnnouncementModal = ref(null)
const activeCommentsModal = ref(null)
const activePasswordResetModal = ref(null)

// The refs for the edit remark modal
const activeEditRemarkModal = ref(null)
const editRemarkForm = ref({
  id: null,
  reason_text: '',
  type: '',
  active: true,
  user: null,
})
const editRemarkLoading = ref(false)
const editRemarkSuccess = ref('')
const editRemarkError = ref('')

// Search & Pagination state
const searchTenants = ref('')
const searchRooms = ref('')
const searchPayments = ref('')
const searchPaymentMethods = ref('')
const searchRemarks = ref('')
const searchAnnouncements = ref('')
const searchComments = ref('')

const filteredTenants = computed(() => {
  if (!auth.users) return []
  const q = searchTenants.value.toLowerCase()
  if (!q) return auth.users
  return auth.users.filter(
    (t) =>
      (t.last_name || '').toLowerCase().includes(q) ||
      (t.phone_number || '').toLowerCase().includes(q) ||
      (t.room?.room_number || '').toString().toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedTenants, currentPage: tp, totalPages: ttp, showingFrom: tsf, showingTo: tst, totalItems: tti, goToPage: tgp } = usePagination(filteredTenants)

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

const filteredPayments = computed(() => {
  if (!paymentStore.payments) return []
  const q = searchPayments.value.toLowerCase()
  if (!q) return paymentStore.payments
  return paymentStore.payments.filter(
    (p) =>
      (p.room?.room_number || '').toLowerCase().includes(q) ||
      (p.month_name || '').toLowerCase().includes(q) ||
      String(p.year || '').includes(q) ||
      String(p.amount || '').includes(q) ||
      (p.status || '').toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedPayments, currentPage: pp, totalPages: ptp, showingFrom: psf, showingTo: pst, totalItems: pti, goToPage: pgp, resetPage: resetPaymentsPage } = usePagination(filteredPayments)

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

const filteredRemarks = computed(() => {
  if (!criticalRemarkStore.criticalRemarks) return []
  const q = searchRemarks.value.toLowerCase()
  if (!q) return criticalRemarkStore.criticalRemarks
  return criticalRemarkStore.criticalRemarks.filter(
    (r) =>
      (r.user?.last_name || '').toLowerCase().includes(q) ||
      (r.type || '').toLowerCase().includes(q) ||
      (r.reason_text || '').toLowerCase().includes(q),
  )
})
const { paginatedData: paginatedRemarks, currentPage: rmp, totalPages: rmtp, showingFrom: rmsf, showingTo: rmst, totalItems: rmit, goToPage: rmgp, resetPage: resetRemarksPage } = usePagination(filteredRemarks)

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

// Check if remark can be edited (only critical or warning types, not resolved)
const canEditRemark = (remark) => {
  return remark.type === 'critical' || remark.type === 'warning'
}

// Open edit remark modal
const openEditRemarkModal = async (remark) => {
  editRemarkForm.value = {
    id: remark.id,
    reason_text: remark.reason_text,
    type: remark.type,
    active: remark.active,
    user: remark.user,
  }
  activeEditRemarkModal.value = 'editRemark'
}

// Close edit remark modal
const closeEditRemarkModal = () => {
  activeEditRemarkModal.value = null
  editRemarkForm.value = {
    id: null,
    reason_text: '',
    type: '',
    active: true,
    user: null,
  }
  editRemarkSuccess.value = ''
  editRemarkError.value = ''
}

// Update remark
const updateRemark = async () => {
  editRemarkLoading.value = true
  editRemarkSuccess.value = ''
  editRemarkError.value = ''

  const result = await criticalRemarkStore.updateCriticalRemark(editRemarkForm.value.id, {
    reason_text: editRemarkForm.value.reason_text,
    type: editRemarkForm.value.type,
    active: editRemarkForm.value.active,
  })

  if (result && result.id) {
    editRemarkSuccess.value = 'Remark updated successfully!'
    setTimeout(() => {
      editRemarkSuccess.value = ''
      closeEditRemarkModal()
    }, 2000)
    await criticalRemarkStore.fetchCriticalRemarks()
  } else {
    editRemarkError.value = result || 'Failed to update remark'
  }

  editRemarkLoading.value = false
}

// Delete remark with confirmation
const deleteCriticalRemark = async (id) => {
  if (!confirm('Are you sure you want to delete this remark permanently?')) {
    return
  }

  const success = await criticalRemarkStore.deleteCriticalRemark(id)
  if (success) {
    alert('Remark deleted successfully!')
    await criticalRemarkStore.fetchCriticalRemarks()
  } else {
    alert('Failed to delete remark: ' + (criticalRemarkStore.error || 'Unknown error'))
  }
}

const openModal = () => {
  showModal.value = true
}
const closeModal = () => {
  showModal.value = false
}

const myRemarks = computed(() => criticalRemarkStore.criticalRemarks)

const getTenantLatePayments = (id) =>
  latePaymentReasonStore.latePaymentReasons?.filter((r) => r.user_id === id) || []

const canAddRemark = (tenant) => {
  const status = tenant.room?.latest_payment?.status?.toLowerCase()
  const count =
    latePaymentReasonStore.latePaymentReasons?.filter((r) => r.user_id === tenant.id).length ?? 0
  return count < 3 && (!status || status === 'unpaid')
}

async function addRemark(tenant) {
  if (!canAddRemark(tenant)) return
  if (criticalRemarkStore.criticalRemarks.filter((r) => r.user_id === tenant.id).length >= 3) {
    alert('Maximum critical remarks reached for this tenant!')
    return
  }
  const remark = prompt('Enter critical remark for tenant:')
  if (remark?.trim()) {
    const res = await criticalRemarkStore.registerCriticalRemarks({
      user_id: tenant.id,
      reason: remark,
      type: 'critical',
      active: true,
    })
    if (res) {
      successAddingRemarkMessage.value = 'Remark created successfully!'
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
  photo: null,
  preview: null,
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
const ruleForm = ref({ title: '', description: '', type: '' })
const announcementForm = ref({ title: '', message: '' })
const commentForm = ref({ comment: '', rating: 5 })
const passwordResetForm = ref({ email: '' })

const paymentMethodFetching = async () => await paymentMethodStore.fetchPaymentMethods()
const paymentFetching = async () => await paymentStore.fetchPayments()
const roomFetching = async () => await roomStore.fetchRooms()

const savePayment = async () => {
  const res = await paymentStore.registerPayment(paymentForm.value)
  if (res) {
    successPaymentMessage.value = 'Payment created successfully!'
    resetPaymentForm()
  }
}
const savePaymentMethod = async () => {
  const res = await paymentMethodStore.registerPaymentMethods(paymentMethodForm.value)
  if (res) {
    successPaymentMethodMessage.value = 'Payment method created!'
    resetPaymentMethodForm()
  }
}
const savingRules = async () => {
  const res = await ruleStore.registerRules(ruleForm.value)
  if (res) {
    successCreationRuleMessage.value = 'Rule created!'
    resetRulesForm()
  }
}
const saveRoom = async () => {
  const res = await roomStore.registerRoom(roomForm.value)
  if (res) {
    successMessage.value = 'Room created!'
    resetRoomForm()
  }
}
const saveAnnouncement = async () => {
  const res = await announcementStore.registerAnnouncement(announcementForm.value)
  if (res) {
    successAnnouncementMessage.value = 'Announcement created!'
    resetAnnouncementForm()
  }
}
const saveComment = async () => {
  const res = await commentStore.registerComments(commentForm.value)
  if (res) {
    successCommentMessage.value = 'Comment added!'
    commentForm.value.comment = ''
    commentForm.value.rating = 5
  }
}

const deleteRoom = async (id) => {
  if (!confirm('Delete this room permanently?')) return
  const res = await roomStore.deleteRoom(id)
  alert(res ? 'Room deleted!' : 'Failed to delete room')
}
const deletingPaymentMethod = async (id) => {
  if (!confirm('Delete this payment method?')) return
  const res = await paymentMethodStore.deletePaymentMethod(id)
  alert(res ? 'Deleted!' : 'Failed')
  paymentMethodFetching()
}
const deletePayment = async (id) => {
  if (!confirm('Delete this payment?')) return
  const res = await paymentStore.deletePayment(id)
  alert(res ? 'Deleted!' : 'Failed')
  paymentFetching()
}

const canDeleteTenant = (tenant) => {
  const hasActivePayment = paymentStore.payments?.some(
    (p) => p.user_id === tenant.id && p.status === 'unpaid',
  )

  return !hasActivePayment
}

const deleteTenant = async (tenant) => {
  if (!canDeleteTenant(tenant)) {
    alert('Cannot delete tenant with active unpaid payments.')
    return
  }
  if (!confirm('Delete this tenant permanently?')) return
  const res = await auth.deleteUser(tenant.id)
  alert(res ? 'Tenant deleted!' : 'Failed to delete tenant')
}

const deleteComment = async (id) => await commentStore.deleteComment(id)
const deletingAnnouncement = async (id) => {
  if (!confirm('Delete this announcement?')) return
  try {
    await announcementStore.deleteAnnouncement(id)
    alert('Deleted!')
    await announcementStore.fetchAnnouncements()
  } catch (error) {
    alert('Failed to delete')
  }
}

const resetRoomForm = () => {
  roomForm.value = {
    room_number: '',
    room_price: 0,
    type: 'Single',
    status: 'Available',
    photo: null,
    preview: null,
  }
  if (fileInput.value) fileInput.value.value = ''
}
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
const resetRulesForm = () => {
  ruleForm.value = { title: '', description: '', type: '' }
}
const resetAnnouncementForm = () => {
  announcementForm.value = { title: '', message: '' }
}

const openPaymentsModal = (n) => {
  activePaymentsModal.value = n
  if (n === 'payments') { paymentFetching(); resetPaymentsPage() }
}
const closePaymentsModal = () => {
  activePaymentsModal.value = null
}
const openPaymentMethodModal = (n) => {
  activePaymentMethodModal.value = n
  if (n === 'paymentMethod') { paymentMethodFetching(); resetPaymentMethodsPage() }
}
const closePaymentMethodModal = () => {
  activePaymentMethodModal.value = null
}
const openRoomsModal = (n) => {
  activeRoomsModal.value = n
  if (n === 'rooms') { roomFetching(); resetRoomsPage() }
}
const closeRoomsModal = () => {
  activeRoomsModal.value = null
}
const openProfileModal = (n) => {
  activeProfileModal.value = n
  if (n === 'profile') auth.fetchUser()
}
const closeProfileModal = () => {
  activeProfileModal.value = null
}
const openRemarksModal = (n) => {
  activeRemarksModal.value = n
  if (n === 'remarks') { criticalRemarkStore.fetchCriticalRemarks(); resetRemarksPage() }
}
const closeRemarksModal = () => {
  activeRemarksModal.value = null
}
const openAnnouncementModal = (n) => {
  activeAnnouncementModal.value = n
  if (n === 'announcements') { announcementStore.fetchAnnouncements(); resetAnnouncementsPage() }
}
const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}
const openCommentsModal = (n) => {
  activeCommentsModal.value = n
  if (n === 'comments') { commentStore.fetchComments(); resetCommentsPage() }
}
const closeCommentsModal = () => {
  activeCommentsModal.value = null
}
const openPasswordResetModal = (n) => {
  activePasswordResetModal.value = n
  if (n === 'passwordReset') passwordResetForm.value.email = auth.user?.email || ''
}
const closePasswordResetModal = () => {
  activePasswordResetModal.value = null
  successPasswordResetMessage.value = ''
  passwordResetForm.value.email = ''
}

const sendPasswordResetLink = async () => {
  const res = await auth.requestPasswordReset(passwordResetForm.value.email)
  if (res) {
    successPasswordResetMessage.value = 'Reset link sent!'
    setTimeout(() => closePasswordResetModal(), 3000)
  }
}

const openUnconfirmedModal = async (n) => {
  activeUnconfirmedModal.value = n
  if (n === 'unconfirmed') {
    unconfirmedPaymentLoading.value = true
    await fetchUnconfirmedPaymentsList()
    unconfirmedPaymentLoading.value = false
  }
}
const closeUnconfirmedModal = () => { activeUnconfirmedModal.value = null }

const fetchUnconfirmedPaymentsList = async () => {
  try {
    const response = await api.get('/api/payment/unconfirmed')
    unconfirmedPayments.value = response.data.unconfirmed_payments || []
  } catch (err) {
    console.error(err)
  }
}

const confirmTenantPayment = async (paymentId) => {
  const msg = prompt('Enter confirmation message (optional):')
  if (msg === null) return
  const result = await paymentStore.confirmPayment(paymentId, msg)
  if (result && result.message) {
    alert(result.message)
    await fetchUnconfirmedPaymentsList()
    await roomStore.fetchRooms()
    await auth.fetchUsers()
    await paymentStore.fetchPayments()
  } else {
    alert(paymentStore.error || 'Failed to confirm payment')
  }
}

const rejectTenantPayment = async (paymentId) => {
  if (!confirm('Reject this payment? The tenant\'s room selection will be released.')) return
  const result = await paymentStore.rejectPayment(paymentId)
  if (result && result.message) {
    alert(result.message)
    await fetchUnconfirmedPaymentsList()
    await roomStore.fetchRooms()
    await auth.fetchUsers()
    await paymentStore.fetchPayments()
  } else {
    alert(paymentStore.error || 'Failed to reject payment')
  }
}

const handleImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file) return
  roomForm.value.photo = file
  roomForm.value.preview = URL.createObjectURL(file)
}
const updatingPhoneNumber = async (user) => {
  const p = prompt('Enter new phone number:')
  if (!p?.trim()) return
  const res = await auth.updatePhoneNumber(user.id, p)
  alert(res ? 'Phone updated!' : auth.error || 'Failed')
}

const { locale } = useI18n()
const currentLocale = ref(locale.value)
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const isSidebarOpen = ref(false)

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

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
const paymentStatus = (t) => (t.room?.latest_payment?.status === 'paid' ? 'paid' : 'unpaid')

/* ════════ 3D CANVAS ════════ */
const canvasRef = ref(null)
const cubesRef = ref(null)
let rafId = null

function initCanvas() {
  const cv = canvasRef.value
  if (!cv) return
  const cx = cv.getContext('2d')
  let W,
    H,
    stars = [],
    mx,
    my

  function resize() {
    W = cv.width = document.querySelector('.dash-main')?.offsetWidth || window.innerWidth
    H = cv.height = 300
    mx = W / 2
    my = H / 2
    stars = Array.from({ length: 120 }, () => ({
      x: (Math.random() * 2 - 1) * 2,
      y: (Math.random() * 2 - 1) * 1.5,
      z: Math.random() * 0.8 + 0.1,
      vz: -0.003 - Math.random() * 0.005,
      sz: Math.random() * 1.4 + 0.4,
      ph: Math.random() * Math.PI * 2,
    }))
  }

  const rotX = (p, a) => {
    const c = Math.cos(a),
      s = Math.sin(a)
    return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c }
  }
  const rotY = (p, a) => {
    const c = Math.cos(a),
      s = Math.sin(a)
    return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c }
  }
  const rotZ = (p, a) => {
    const c = Math.cos(a),
      s = Math.sin(a)
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z }
  }
  const proj = (x, y, z) => {
    const dz = z + 5.5
    if (dz <= 0.1) return null
    const sc = 480 / dz
    return { sx: W / 2 + x * sc, sy: H / 2 + y * sc, sc }
  }

  const torus = Array.from({ length: 200 }, (_, i) => {
    const u = (i / 200) * Math.PI * 2,
      v = Math.random() * Math.PI * 2,
      R = 1.4,
      r = 0.5
    return {
      x: (R + r * Math.cos(v)) * Math.cos(u),
      y: (R + r * Math.cos(v)) * Math.sin(u),
      z: r * Math.sin(v),
      ph: Math.random() * Math.PI * 2,
      sz: Math.random() * 0.8 + 0.4,
    }
  })

  function mkCube(cx2, cy2, cz, sz) {
    const h = sz / 2
    const v = [
      [-h, -h, -h],
      [h, -h, -h],
      [h, h, -h],
      [-h, h, -h],
      [-h, -h, h],
      [h, -h, h],
      [h, h, h],
      [-h, h, h],
    ].map(([x, y, z]) => ({ x: x + cx2, y: y + cy2, z: z + cz }))
    return {
      verts: v,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
        [4, 5],
        [5, 6],
        [6, 7],
        [7, 4],
        [0, 4],
        [1, 5],
        [2, 6],
        [3, 7],
      ],
      rx: Math.random() * Math.PI * 2,
      ry: Math.random() * Math.PI * 2,
      rz: Math.random() * Math.PI * 2,
      vrx: (Math.random() - 0.5) * 0.014,
      vry: (Math.random() - 0.5) * 0.016,
      vrz: (Math.random() - 0.5) * 0.009,
      ox: cx2,
      oy: cy2,
      oz: cz,
    }
  }
  const cubesMath = Array.from({ length: 8 }, () =>
    mkCube(
      (Math.random() - 0.5) * 3.5,
      (Math.random() - 0.5) * 2.5,
      1.5 + Math.random() * 3.5,
      0.2 + Math.random() * 0.4,
    ),
  )

  let t = 0
  function draw() {
    t += 0.013
    cx.clearRect(0, 0, W, H)
    cx.fillStyle = 'rgba(2,8,16,1)'
    cx.fillRect(0, 0, W, H)
    stars.forEach((s) => {
      s.z += s.vz
      if (s.z < -0.9) s.z = 0.9
      const p = proj(s.x, s.y, s.z),
        p2 = proj(s.x, s.y, s.z + 0.07)
      if (!p) return
      const bright =
        Math.min(1, (0.9 - Math.abs(s.z + 0.2)) / 0.8) * (0.5 + 0.5 * Math.sin(t + s.ph))
      if (p2) {
        cx.beginPath()
        cx.moveTo(p.sx, p.sy)
        cx.lineTo(p2.sx, p2.sy)
        cx.strokeStyle = `rgba(20,184,166,${bright * 0.7})`
        cx.lineWidth = s.sz * 0.6
        cx.stroke()
      }
      cx.beginPath()
      cx.arc(p.sx, p.sy, s.sz * 0.45, 0, Math.PI * 2)
      cx.fillStyle = `rgba(200,255,245,${bright})`
      cx.fill()
    })
    const ta = t * 0.22
    torus.forEach((pt) => {
      let p = { x: pt.x, y: pt.y, z: pt.z }
      p = rotX(p, ta * 0.35)
      p = rotY(p, ta)
      const pp = proj(p.x, p.y, p.z + 2.8)
      if (!pp) return
      const bri = 0.2 + 0.7 * (Math.sin(t * 1.5 + pt.ph) * 0.5 + 0.5)
      cx.beginPath()
      cx.arc(pp.sx, pp.sy, pt.sz * pp.sc * 0.7, 0, Math.PI * 2)
      cx.fillStyle = `rgba(20,184,166,${bri})`
      cx.fill()
    })
    cubesMath.forEach((cb) => {
      cb.rx += cb.vrx
      cb.ry += cb.vry
      cb.rz += cb.vrz
      const prj = cb.verts.map((v) => {
        let p = { x: v.x - cb.ox, y: v.y - cb.oy, z: v.z - cb.oz }
        p = rotX(p, cb.rx)
        p = rotY(p, cb.ry)
        p = rotZ(p, cb.rz)
        p.x += cb.ox
        p.y += cb.oy
        p.z += cb.oz
        return proj(p.x, p.y, p.z)
      })
      cb.edges.forEach(([a, b]) => {
        const pa = prj[a],
          pb = prj[b]
        if (!pa || !pb) return
        cx.beginPath()
        cx.moveTo(pa.sx, pa.sy)
        cx.lineTo(pb.sx, pb.sy)
        cx.strokeStyle = 'rgba(20,184,166,.4)'
        cx.lineWidth = 1
        cx.stroke()
      })
    })
    cx.strokeStyle = 'rgba(20,184,166,.08)'
    cx.lineWidth = 0.7
    for (let r = 0; r <= 10; r++) {
      const z0 = 2 + r * 0.32,
        p0 = proj(-14 * 0.14, 1.1, z0),
        p1 = proj(14 * 0.14, 1.1, z0)
      if (p0 && p1) {
        cx.beginPath()
        cx.moveTo(p0.sx, p0.sy)
        cx.lineTo(p1.sx, p1.sy)
        cx.stroke()
      }
    }
    for (let c = 0; c <= 14; c++) {
      const x = c * 0.28 - 14 * 0.14,
        p0 = proj(x, 1.1, 2),
        p1 = proj(x, 1.1, 2 + 10 * 0.32)
      if (p0 && p1) {
        cx.beginPath()
        cx.moveTo(p0.sx, p0.sy)
        cx.lineTo(p1.sx, p1.sy)
        cx.stroke()
      }
    }
    rafId = requestAnimationFrame(draw)
  }
  resize()
  draw()
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX
    my = e.clientY
  })
  window.addEventListener('resize', resize)
}

function buildCubes() {
  const container = cubesRef.value
  if (!container) return
  for (let i = 0; i < 8; i++) {
    const size = 16 + Math.random() * 24,
      hw = size / 2
    const cube = document.createElement('div')
    cube.className = 'css-cube'
    cube.style.cssText =
      `left:${Math.random() * 90}%;top:${Math.random() * 90}%;width:${size}px;height:${size}px;animation-duration:${6 + Math.random() * 8}s;animation-delay:-${Math.random() * 6}s`[
        (`translateZ(${hw}px)`,
        `translateZ(-${hw}px) rotateY(180deg)`,
        `translateX(${hw}px) rotateY(90deg)`,
        `translateX(-${hw}px) rotateY(-90deg)`,
        `translateY(-${hw}px) rotateX(90deg)`,
        `translateY(${hw}px) rotateX(-90deg)`)
      ].forEach((tf) => {
        const f = document.createElement('div')
        f.className = 'css-cube-face'
        f.style.cssText = `width:${size}px;height:${size}px;position:absolute;transform:${tf};border:1px solid rgba(20,184,166,${0.12 + Math.random() * 0.2});background:rgba(20,184,166,.02)`
        cube.appendChild(f)
      })
    container.appendChild(cube)
  }
}
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
        <router-link to="/landlord" class="nav-item active">
          <font-awesome-icon icon="chart-bar" class="ni" /><span>{{ $t('dashboard') }}</span>
        </router-link>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          <font-awesome-icon icon="bullhorn" class="ni" /><span>{{ $t('Announcements') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeCommentsModal === 'comments' }"
          @click.prevent="openCommentsModal('comments')"
        >
          <font-awesome-icon icon="comments" class="ni" /><span>{{ $t('Comments') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activeProfileModal === 'profile' }"
          @click.prevent="openProfileModal('profile')"
        >
          <font-awesome-icon icon="user" class="ni" /><span>{{ $t('Profile') }}</span>
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
          <font-awesome-icon icon="door-open" class="ni" /><span>{{ $t('rooms') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentsModal === 'payments' }"
          @click.prevent="openPaymentsModal('payments')"
        >
          <font-awesome-icon icon="money-bill" class="ni" /><span>{{ $t('payments') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentMethodModal === 'paymentMethod' }"
          @click.prevent="openPaymentMethodModal('paymentMethod')"
        >
          <font-awesome-icon icon="credit-card" class="ni" /><span>{{ $t('paymentMethods') }}</span>
        </a>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeUnconfirmedModal === 'unconfirmed' }"
          @click.prevent="openUnconfirmedModal('unconfirmed')"
        >
          <font-awesome-icon icon="bell" class="ni" />
          <span>{{ $t('unconfirmedPayments') || 'Unconfirmed Payments' }}</span>
          <span v-if="unconfirmedPayments.length > 0" class="badge-new"></span>
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
      <!-- UNCONFIRMED PAYMENT ALERT BANNER -->
      <Transition name="alert-pop">
        <div v-if="showAlertBanner && unconfirmedPayments.length > 0" class="alert-banner" @click="showAlertBanner = false; openUnconfirmedModal('unconfirmed')">
          <font-awesome-icon icon="bell" class="alert-bell-icon" />
          <span>{{ unconfirmedPayments.length }} {{ $t('newUnconfirmedPayments') || 'new unconfirmed payment(s) require your attention!' }}</span>
          <button class="alert-dismiss" @click.stop="showAlertBanner = false">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>
      </Transition>
      <div class="hero-banner">
        <canvas ref="canvasRef" class="hero-canvas"></canvas>
        <div class="hero-cubes" ref="cubesRef"></div>
        <div class="hero-scanlines"></div>
        <div class="hero-rings">
          <div class="hr hr1"></div>
          <div class="hr hr2"></div>
        </div>
        <div class="hero-text">
          <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">
            <font-awesome-icon icon="bars" />
          </button>
          <div class="topbar-inner">
            <div>
              <div class="dash-badge"><span class="badge-dot"></span>Live Dashboard</div>
              <h1 class="dash-title">{{ $t('landlordDashboard') }}</h1>
              <p class="dash-sub" v-if="auth.user?.last_name">
                {{ $t('welcome') }}, <strong>{{ auth.user.last_name }}</strong> —
                {{ $t('manageRoomsTenants') }}
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
              <div class="stat-lbl">{{ $t('Total Rooms') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon"><font-awesome-icon icon="house" /></div>
            <div>
              <div class="stat-val">{{ roomsOccupiedCount }}</div>
              <div class="stat-lbl">{{ $t('Occupied') }}</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><font-awesome-icon icon="check-circle" /></div>
            <div>
              <div class="stat-val">{{ roomsAvailableCount }}</div>
              <div class="stat-lbl">{{ $t('Available') }}</div>
            </div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon"><font-awesome-icon icon="wrench" /></div>
            <div>
              <div class="stat-val">{{ roomsMaintananceCount }}</div>
              <div class="stat-lbl">{{ $t('Maintanance') }}</div>
            </div>
          </div>
          <div class="stat-card teal-card">
            <div class="stat-icon"><font-awesome-icon icon="money-bill" /></div>
            <div>
              <div class="stat-val income">TZS {{ Number(monthlyIncome).toLocaleString() }}</div>
              <div class="stat-lbl">{{ $t('Monthly Income') }}</div>
            </div>
          </div>
        </section>

        <!-- TENANTS TABLE -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('tenantsOverview') }}</h2>
              <p class="sec-sub">All active tenants and their payment status</p>
            </div>
            <button class="btn-teal" @click.prevent="openRemarksModal('remarks')">
              {{ $t('viewRemark') }}
            </button>
          </div>

          <Transition name="alert-pop">
            <div v-if="successAddingRemarkMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successAddingRemarkMessage }}
            </div>
          </Transition>

          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchTenants"
              class="search-input"
              :placeholder="$t('search') || 'Search tenants...'"
            />
          </div>
          <div class="table-wrap">
            <SkeletonLoader v-if="tenantLoading" :rows="5" :cols="8" />
            <table v-else>
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
                <tr v-for="(tenant, index) in paginatedTenants" :key="tenant?.id">
                  <td class="idx">{{ tsf + index }}</td>
                  <td>
                    <strong>{{ tenant.last_name }}</strong>
                  </td>
                  <td>
                    <span v-if="tenant.room?.room_number" class="room-badge">{{
                      tenant.room.room_number
                    }}</span>
                    <span v-else class="muted">No room</span>
                  </td>
                  <td>{{ tenant.phone_number }}</td>
                  <td>
                    <span class="status-pill" :class="paymentStatus(tenant)">{{
                      tenant.room?.latest_payment?.status ?? 'unpaid'
                    }}</span>
                  </td>
                  <td class="center">
                    {{
                      latePaymentReasonStore.latePaymentReasons?.filter(
                        (r) => r.user_id === tenant.id,
                      ).length
                    }}
                  </td>
                  <td>
                    <ul class="late-list" v-if="getTenantLatePayments(tenant.id).length">
                      <li v-for="lp in getTenantLatePayments(tenant.id)" :key="lp.id">
                        {{ lp.reason_text }}
                      </li>
                    </ul>
                    <span v-else class="muted"><font-awesome-icon icon="ban" /> None</span>
                  </td>
                  <td style="gap: 5px">
                    <button
                      class="btn-sm"
                      @click="addRemark(tenant)"
                      :disabled="!canAddRemark(tenant)"
                    >
                      {{ $t('addRemark') }}
                    </button>
                    <button
                      class="btn-del"
                      @click="deleteTenant(tenant)"
                      :disabled="!canDeleteTenant(tenant)"
                    >
                      {{ $t('deleteTenant') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              v-if="!tenantLoading"
              :current-page="tp"
              :total-pages="ttp"
              :showing-from="tsf"
              :showing-to="tst"
              :total-items="tti"
              @page-change="tgp"
            />
          </div>
        </section>

        <!-- RULES -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('tenantRulesPolicies') }}</h2>
              <p class="sec-sub">Community guidelines and policies</p>
            </div>
            <button class="btn-teal" @click="openModal">
              <font-awesome-icon icon="plus" /> {{ $t('addNewRule') }}
            </button>
          </div>
          <ul class="rules-list">
            <li>{{ $t('maintainCleanliness') }}</li>
            <li>{{ $t('noGangs') }}</li>
            <li>{{ $t('rentOnTime') }}</li>
            <li>{{ $t('maxCriticalRemarks') }}</li>
            <li>{{ $t('noIllegalParties') }}</li>
          </ul>
        </section>

        <Footer />
      </div>
    </main>

    <!-- ══════ MODALS ══════ -->

    <!-- ADD RULE -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="glass-modal">
          <div class="modal-top">
            <h3><font-awesome-icon icon="shield" /> {{ $t('addNewRule') }}</h3>
            <button class="close-x" @click="closeModal"><font-awesome-icon icon="xmark" /></button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successCreationRuleMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successCreationRuleMessage }}
            </div>
          </Transition>
          <form @submit.prevent="savingRules">
            <div class="mfield">
              <label>{{ $t('title') }}</label
              ><input :placeholder="$t('ruleTitlePlaceholder')" v-model="ruleForm.title" />
            </div>
            <div class="mfield">
              <label>{{ $t('description') }}</label
              ><textarea
                :placeholder="$t('ruleDescriptionPlaceholder')"
                v-model="ruleForm.description"
              ></textarea>
            </div>
            <div class="mfield">
              <label>{{ $t('type') }}</label>
              <select v-model="ruleForm.type">
                <option value="cleanliness">{{ $t('cleanliness') }}</option>
                <option value="safety">{{ $t('safety') }}</option>
                <option value="payment">{{ $t('payment') }}</option>
              </select>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="floppy-disk" /> {{ $t('save') }}
              </button>
              <button type="button" class="btn-ghost" @click="closeModal">
                {{ $t('cancel') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- PROFILE -->
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

    <!-- ROOMS -->
    <Transition name="modal-fade">
      <div v-if="activeRoomsModal === 'rooms'" class="modal-overlay" @click.self="closeRoomsModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="door-open" /> {{ $t('roomManagement') }}</h3>
            <button class="close-x" @click="closeRoomsModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successMessage }}
            </div>
          </Transition>
          <form @submit.prevent="saveRoom">
            <div class="form-2col">
              <div class="mfield">
                <label>{{ $t('roomNumber') }}</label
                ><input v-model="roomForm.room_number" placeholder="e.g. 101" required />
              </div>
              <div class="mfield">
                <label>{{ $t('roomPrice') }}</label
                ><input v-model="roomForm.room_price" type="number" placeholder="0" required />
              </div>
              <div class="mfield">
                <label>{{ $t('roomType') }}</label>
                <select v-model="roomForm.type" required>
                  <option value="Single">{{ $t('single') }}</option>
                  <option value="Double">{{ $t('double') }}</option>
                  <option value="Empty">{{ $t('emptyRoom') }}</option>
                </select>
              </div>
              <div class="mfield">
                <label>{{ $t('status') }}</label>
                <select v-model="roomForm.status">
                  <option value="Available">{{ $t('available') }}</option>
                  <option value="Occupied">{{ $t('occupied') }}</option>
                  <option value="Maintenance">{{ $t('maintanance') }}</option>
                </select>
              </div>
            </div>
            <div class="mfield">
              <label>{{ $t('roomPhotoOptional') }}</label>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                @change="handleImageUpload"
                hidden
              />
              <button type="button" class="btn-ghost" @click="$refs.fileInput.click()">
                <font-awesome-icon icon="camera" /> {{ $t('selectImage') }}
              </button>
            </div>
            <div v-if="roomForm.preview" class="img-preview">
              <img :src="roomForm.preview" alt="Room" />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="plus" /> {{ $t('addRoom') }}
              </button>
              <button type="button" class="btn-ghost" @click="closeRoomsModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchRooms"
              class="search-input"
              :placeholder="$t('search') || 'Search rooms...'"
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingRooms') }}</h4>
            <SkeletonLoader v-if="roomStore.loading" :rows="4" :cols="4" />
            <table v-else>
              <thead>
                <tr>
                  <th>{{ $t('photo') || 'Photo' }}</th>
                  <th>{{ $t('room') }}</th>
                  <th>{{ $t('type') }}</th>
                  <th>{{ $t('status') }}</th>
                  <th>{{ $t('action') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="room in paginatedRooms" :key="room?.id">
                  <td>
                    <img
                      v-if="room?.photo_url"
                      :src="room.photo_url"
                      alt="Room"
                      class="room-thumb"
                    />
                    <span v-else class="no-photo">&mdash;</span>
                  </td>
                  <td>{{ room?.room_number || 'N/A' }}</td>
                  <td>{{ room?.type || '—' }}</td>
                  <td>
                    <span class="status-pill" :class="room?.status?.toLowerCase()">{{
                      room?.status
                    }}</span>
                  </td>
                  <td>
                    <span class="row-actions">
                      <router-link v-if="room.id" :to="`/room/show/${room.id}`" class="btn-edit"
                        ><font-awesome-icon icon="pencil" /> {{ $t('edit') }}</router-link
                      >
                      <button class="btn-del" @click="deleteRoom(room.id)">
                        <font-awesome-icon icon="trash" /> {{ $t('delete') }}
                      </button>
                    </span>
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

    <!-- REMARKS -->
    <Transition name="modal-fade">
      <div
        v-if="activeRemarksModal === 'remarks'"
        class="modal-overlay"
        @click.self="closeRemarksModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="triangle-exclamation" /> {{ $t('Remarks') }}</h3>
            <button class="close-x" @click="closeRemarksModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchRemarks"
              class="search-input"
              placeholder="Search remarks..."
            />
          </div>
          <div class="modal-table-wrap">
            <SkeletonLoader v-if="criticalRemarkStore.loading" :rows="4" :cols="6" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Tenant</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedRemarks.length">
                  <td colspan="7" class="no-data"><font-awesome-icon icon="ban" /> No Remarks</td>
                </tr>
                <tr v-else v-for="(remark, i) in paginatedRemarks" :key="remark.id">
                  <td class="idx">{{ rmsf + i }}</td>
                  <td>{{ remark.user?.last_name || 'N/A' }}</td>
                  <td>
                    <span class="type-pill" :class="remark.type">
                      <font-awesome-icon
                        :icon="
                          remark.type === 'critical'
                            ? 'triangle-exclamation'
                            : remark.type === 'warning'
                              ? 'exclamation-triangle'
                              : 'info-circle'
                        "
                      />
                      {{ remark.type }}
                    </span>
                  </td>
                  <td>{{ remark.reason_text }}</td>
                  <td>
                    <span
                      class="status-pill"
                      :class="{ active: remark.active, inactive: !remark.active }"
                    >
                      {{ remark.active ? 'Active' : 'Resolved' }}
                    </span>
                  </td>
                  <td>
                    <button
                      class="btn-sm"
                      @click="openEditRemarkModal(remark)"
                      :disabled="!canEditRemark(remark)"
                    >
                      <font-awesome-icon icon="pencil" /> {{ $t('edit') }}
                    </button>
                  </td>
                  <td>
                    <button class="btn-del" @click="deleteCriticalRemark(remark.id)">
                      <font-awesome-icon icon="trash" /> {{ $t('delete') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="rmp"
              :total-pages="rmtp"
              :showing-from="rmsf"
              :showing-to="rmst"
              :total-items="rmit"
              @page-change="rmgp"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- EDIT REMARK MODAL -->
    <Transition name="modal-fade">
      <div
        v-if="activeEditRemarkModal === 'editRemark'"
        class="modal-overlay"
        @click.self="closeEditRemarkModal"
      >
        <div class="glass-modal">
          <div class="modal-top">
            <h3><font-awesome-icon icon="pencil" /> {{ $t('editRemark') || 'Edit Remark' }}</h3>
            <button class="close-x" @click="closeEditRemarkModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>

          <Transition name="alert-pop">
            <div v-if="editRemarkSuccess" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ editRemarkSuccess }}
            </div>
          </Transition>
          <Transition name="alert-pop">
            <div v-if="editRemarkError" class="error-alert">
              <font-awesome-icon icon="triangle-exclamation" /> {{ editRemarkError }}
            </div>
          </Transition>

          <form @submit.prevent="updateRemark">
            <div class="mfield">
              <label><font-awesome-icon icon="user" /> {{ $t('tenant') || 'Tenant' }}</label>
              <p>{{ editRemarkForm.user?.last_name || 'N/A' }}</p>
            </div>

            <div class="mfield">
              <label><font-awesome-icon icon="tag" /> {{ $t('type') || 'Type' }}</label>
              <select v-model="editRemarkForm.type" required>
                <option value="critical">{{ $t('critical') || 'Critical' }}</option>
                <option value="warning">{{ $t('warning') || 'Warning' }}</option>
                <option value="info">{{ $t('info') || 'Information' }}</option>
              </select>
            </div>

            <div class="mfield">
              <label><font-awesome-icon icon="comment" /> {{ $t('reason') || 'Reason' }}</label>
              <textarea
                v-model="editRemarkForm.reason_text"
                rows="4"
                :placeholder="$t('enterRemarkReason') || 'Enter remark reason...'"
                required
              ></textarea>
            </div>

            <div class="mfield">
              <label><font-awesome-icon icon="circle" /> {{ $t('status') || 'Status' }}</label>
              <select v-model="editRemarkForm.active" required>
                <option :value="true">{{ $t('active') || 'Active' }}</option>
                <option :value="false">{{ $t('resolved') || 'Resolved' }}</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="submit" class="btn-teal" :disabled="editRemarkLoading">
                <font-awesome-icon
                  :icon="editRemarkLoading ? 'spinner' : 'floppy-disk'"
                  :spin="editRemarkLoading"
                />
                {{ editRemarkLoading ? $t('saving') || 'Saving...' : $t('save') || 'Save Changes' }}
              </button>
              <button type="button" class="btn-ghost" @click="closeEditRemarkModal">
                <font-awesome-icon icon="times" /> {{ $t('cancel') || 'Cancel' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <!-- PAYMENTS -->
    <Transition name="modal-fade">
      <div
        v-if="activePaymentsModal === 'payments'"
        class="modal-overlay"
        @click.self="closePaymentsModal"
      >
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="money-bill" /> {{ $t('paymentManagement') }}</h3>
            <button class="close-x" @click="closePaymentsModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <Transition name="alert-pop">
            <div v-if="successPaymentMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successPaymentMessage }}
            </div>
          </Transition>
          <form @submit.prevent="savePayment">
            <div class="form-2col">
              <div class="mfield">
                <label>{{ $t('roomNumber') }}</label>
                <select v-model="paymentForm.room_id" required>
                  <option disabled value="">Select Room</option>
                  <option v-for="room in roomStore.rooms" :key="room.id" :value="room.id">
                    {{ room.status }} — {{ room.room_number }} — {{ room.room_price }}
                  </option>
                </select>
              </div>
              <div class="mfield">
                <label>Month</label>
                <select v-model="paymentForm.month" required>
                  <option disabled value="">Select Month</option>
                  <option v-for="(name, i) in months" :key="i" :value="i + 1">{{ name }}</option>
                </select>
              </div>
              <div class="mfield">
                <label>Year</label
                ><input v-model="paymentForm.year" type="number" placeholder="2025" required />
              </div>
              <div class="mfield">
                <label>Amount</label
                ><input
                  v-model="paymentForm.amount"
                  type="number"
                  min="0"
                  placeholder="0"
                  required
                />
              </div>
              <div class="mfield">
                <label>Status</label>
                <select v-model="paymentForm.status" required>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
              <div class="mfield">
                <label>Due Date</label><input v-model="paymentForm.due_date" type="date" required />
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="floppy-disk" /> Save Payment
              </button>
              <button type="button" class="btn-ghost" @click="closePaymentsModal">Close</button>
            </div>
          </form>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchPayments"
              class="search-input"
              placeholder="Search payments..."
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('payments') }}</h4>
            <SkeletonLoader v-if="paymentStore.loading" :rows="4" :cols="7" />
            <table v-else>
              <thead>
                <tr>
                  <th>{{ $t('Room') }}</th>
                  <th>Month</th>
                  <th>Year</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedPayments.length">
                  <td colspan="7" class="no-data"><font-awesome-icon icon="ban" /> No Payments</td>
                </tr>
                <tr v-else v-for="p in paginatedPayments" :key="p.id">
                  <td>{{ p.room?.room_number || 'N/A' }}</td>
                  <td>{{ p.month_name }}</td>
                  <td>{{ p.year }}</td>
                  <td>{{ p.amount }}</td>
                  <td>
                    <span class="status-pill" :class="p.status?.toLowerCase()">{{ p.status }}</span>
                  </td>
                  <td>{{ formatDate(p.due_date) }}</td>
                  <td>
                    <span class="row-actions">
                      <router-link :to="`/payment/show/${p.id}`" class="btn-edit"
                        ><font-awesome-icon icon="pencil" /> Edit</router-link
                      >
                      <button class="btn-del" @click="deletePayment(p.id)">
                        <font-awesome-icon icon="trash" /> Delete
                      </button>
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="pp"
              :total-pages="ptp"
              :showing-from="psf"
              :showing-to="pst"
              :total-items="pti"
              @page-change="pgp"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- PAYMENT METHODS -->
    <Transition name="modal-fade">
      <div
        v-if="activePaymentMethodModal === 'paymentMethod'"
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
          <Transition name="alert-pop">
            <div v-if="successPaymentMethodMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successPaymentMethodMessage }}
            </div>
          </Transition>
          <form @submit.prevent="savePaymentMethod">
            <div class="form-2col">
              <div class="mfield">
                <label>{{ $t('airtelMoneyNumber') }}</label
                ><input
                  v-model="paymentMethodForm.airtel_money_number"
                  type="number"
                  placeholder="Airtel Money"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('mPesaNumber') }}</label
                ><input
                  v-model="paymentMethodForm.m_pesa_number"
                  type="number"
                  placeholder="M-Pesa"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('mixxByYasNumber') }}</label
                ><input
                  v-model="paymentMethodForm.mixx_by_yas_number"
                  type="number"
                  placeholder="Mixx by Yas"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('halopesaNumber') }}</label
                ><input
                  v-model="paymentMethodForm.halopesa_number"
                  type="number"
                  placeholder="Halopesa"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('nmbAccountNumber') }}</label
                ><input
                  v-model="paymentMethodForm.nmb_account_number"
                  type="number"
                  placeholder="NMB"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('crdbAccountNumber') }}</label
                ><input
                  v-model="paymentMethodForm.crdb_account_number"
                  type="number"
                  placeholder="CRDB"
                />
              </div>
              <div class="mfield">
                <label>{{ $t('nbcAccountNumber') }}</label
                ><input
                  v-model="paymentMethodForm.nbc_account_number"
                  type="number"
                  placeholder="NBC"
                />
              </div>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="plus" /> {{ $t('addPaymentMethod') }}
              </button>
              <button type="button" class="btn-ghost" @click="closePaymentMethodModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
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
            <SkeletonLoader v-if="paymentMethodStore.loading" :rows="4" :cols="9" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Airtel</th>
                  <th>M-Pesa</th>
                  <th>Mixx</th>
                  <th>Halo</th>
                  <th>NMB</th>
                  <th>CRDB</th>
                  <th>NBC</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedPaymentMethods.length">
                  <td colspan="9" class="no-data"><font-awesome-icon icon="ban" /> No Payment Methods</td>
                </tr>
                <tr v-else v-for="(pm, i) in paginatedPaymentMethods" :key="pm?.id">
                  <td class="idx">{{ pmsf + i }}</td>
                  <td>{{ pm?.airtel_money_number || '—' }}</td>
                  <td>{{ pm?.m_pesa_number || '—' }}</td>
                  <td>{{ pm?.mixx_by_yas_number || '—' }}</td>
                  <td>{{ pm?.halopesa_number || '—' }}</td>
                  <td>{{ pm?.nmb_account_number || '—' }}</td>
                  <td>{{ pm?.crdb_account_number || '—' }}</td>
                  <td>{{ pm?.nbc_account_number || '—' }}</td>
                  <td>
                    <span class="row-actions">
                      <router-link v-if="pm?.id" :to="`/method/show/${pm?.id}`" class="btn-edit"
                        ><font-awesome-icon icon="pencil" /> {{ $t('edit') }}</router-link
                      >
                      <button class="btn-del" @click="deletingPaymentMethod(pm.id)">
                        <font-awesome-icon icon="trash" /> {{ $t('delete') }}
                      </button>
                    </span>
                  </td>
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
        </div>
      </div>
    </Transition>

    <!-- ANNOUNCEMENTS -->
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
          <Transition name="alert-pop">
            <div v-if="successAnnouncementMessage" class="success-alert">
              <font-awesome-icon icon="check-circle" /> {{ successAnnouncementMessage }}
            </div>
          </Transition>
          <form @submit.prevent="saveAnnouncement">
            <div class="mfield">
              <label>{{ $t('title') }}</label
              ><input v-model="announcementForm.title" placeholder="Announcement title" required />
            </div>
            <div class="mfield">
              <label>{{ $t('message') }}</label
              ><textarea
                v-model="announcementForm.message"
                placeholder="Write the announcement..."
                required
              ></textarea>
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">
                <font-awesome-icon icon="floppy-disk" /> Save
              </button>
              <button type="button" class="btn-ghost" @click="closeAnnouncementsModal">
                Close
              </button>
            </div>
          </form>
          <div class="search-bar">
            <font-awesome-icon icon="search" class="search-icon" />
            <input
              v-model="searchAnnouncements"
              class="search-input"
              placeholder="Search announcements..."
            />
          </div>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('announcements') }}</h4>
            <SkeletonLoader v-if="announcementStore.loading" :rows="4" :cols="5" />
            <table v-else>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Date</th>
                  <th>Edit</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedAnnouncements.length">
                  <td colspan="5" class="no-data">
                    <font-awesome-icon icon="ban" /> No Announcements
                  </td>
                </tr>
                <tr v-else v-for="a in paginatedAnnouncements" :key="a.id">
                  <td>
                    <strong>{{ a.title }}</strong>
                  </td>
                  <td>{{ a.message }}</td>
                  <td>{{ formatDate(a.created_at) }}</td>
                  <td>
                    <router-link :to="`/announcements/show/${a.id}`" class="btn-edit">
                      <font-awesome-icon icon="pencil" /> Edit
                    </router-link>
                  </td>
                  <td>
                    <button class="btn-del" @click="deletingAnnouncement(a.id)">
                      <font-awesome-icon icon="trash" /> Delete
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <PaginationControls
              :current-page="ap"
              :total-pages="atp"
              :showing-from="asf"
              :showing-to="ast"
              :total-items="ati"
              @page-change="agp"
            />
          </div>
        </div>
      </div>
    </Transition>

    <!-- COMMENTS -->
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
                <font-awesome-icon icon="floppy-disk" /> Submit
              </button>
              <button type="button" class="btn-ghost" @click="closeCommentsModal">Close</button>
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
            <SkeletonLoader v-if="commentStore.loading" :rows="4" :cols="5" />
            <table v-else>
              <thead>
                <tr>
                  <th>Tenant</th>
                  <th>Comment</th>
                  <th>Rating</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!paginatedComments.length">
                  <td colspan="5" class="no-data"><font-awesome-icon icon="ban" /> No Comments</td>
                </tr>
                <tr v-else v-for="c in paginatedComments" :key="c.id">
                  <td>{{ c.user?.last_name || 'N/A' }}</td>
                  <td>{{ c.comment }}</td>
                  <td>{{ c.rating }} <font-awesome-icon icon="star" class="star-icon" /></td>
                  <td>{{ formatDate(c.created_at) }}</td>
                  <td>
                    <button class="btn-del" @click="deleteComment(c.id)">
                      <font-awesome-icon icon="trash" /> Delete
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

    <!-- PASSWORD RESET -->
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

    <!-- UNCONFIRMED PAYMENTS MODAL -->
    <Transition name="modal-fade">
      <div v-if="activeUnconfirmedModal === 'unconfirmed'" class="modal-overlay" @click.self="closeUnconfirmedModal">
        <div class="glass-modal large">
          <div class="modal-top">
            <h3><font-awesome-icon icon="bell" /> {{ $t('unconfirmedPayments') || 'Unconfirmed Payments' }}</h3>
            <button class="close-x" @click="closeUnconfirmedModal">
              <font-awesome-icon icon="xmark" />
            </button>
          </div>
          <div class="modal-table-wrap">
            <SkeletonLoader v-if="unconfirmedPaymentLoading" :rows="4" :cols="5" />
            <table v-else>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ $t('Tenant') || 'Tenant' }}</th>
                  <th>{{ $t('room') || 'Room' }}</th>
                  <th>{{ $t('Amount') || 'Amount' }}</th>
                  <th>{{ $t('Action') || 'Action' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!unconfirmedPayments.length">
                  <td colspan="5" class="no-data">
                    <font-awesome-icon icon="check-circle" /> {{ $t('noUnconfirmedPayments') || 'No unconfirmed payments' }}
                  </td>
                </tr>
                <tr v-else v-for="(payment, i) in unconfirmedPayments" :key="payment.id">
                  <td class="idx">{{ i + 1 }}</td>
                  <td>{{ payment.user?.last_name || 'N/A' }}</td>
                  <td>{{ payment.room?.room_number || 'N/A' }}</td>
                  <td>TZS {{ payment.amount?.toLocaleString() }}</td>
                  <td>
                    <span class="row-actions">
                      <button class="btn-teal" @click="confirmTenantPayment(payment.id)">
                        <font-awesome-icon icon="check-circle" /> {{ $t('confirmPayment') || 'Confirm Payment' }}
                      </button>
                      <button class="btn-del" @click="rejectTenantPayment(payment.id)">
                        <font-awesome-icon icon="ban" /> {{ $t('rejectPayment') || 'Reject' }}
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
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

* {
  box-sizing: border-box;
}

.table-skeleton {
  padding: 15px;
}
.skeleton-row {
  height: 50px;
  border-radius: 8px;
  margin-bottom: 10px;
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
  height: 220px;
  flex-shrink: 0;
}
.hero-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.hero-cubes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
:deep(.css-cube) {
  position: absolute;
  transform-style: preserve-3d;
  animation: cubeFloat linear infinite;
}
:deep(.css-cube-face) {
  position: absolute;
}
@keyframes cubeFloat {
  0% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: translateY(-30px) rotateX(360deg) rotateY(360deg) rotateZ(180deg);
  }
}
.hero-scanlines {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.07) 2px,
    rgba(0, 0, 0, 0.07) 4px
  );
}
.hero-rings {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}
.hr {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(20, 184, 166, 0.12);
  animation: ringRotate linear infinite;
}
.hr1 {
  width: 500px;
  height: 500px;
  top: 50%;
  left: 50%;
  margin: -250px 0 0 -250px;
  animation-duration: 20s;
}
.hr2 {
  width: 300px;
  height: 300px;
  top: 50%;
  left: 50%;
  margin: -150px 0 0 -150px;
  animation-duration: 12s;
  animation-direction: reverse;
}
@keyframes ringRotate {
  from {
    transform: rotateX(70deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(70deg) rotateZ(360deg);
  }
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
.stat-card.teal-card {
  border-left-color: #14b8a6;
}
.stat-icon {
  font-size: 1.6rem;
  flex-shrink: 0;
  color: #14b8a6;
  width: 36px;
  text-align: center;
}
.stat-val {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 900;
  color: #fff;
  line-height: 1;
}
.stat-val.income {
  font-size: 1.1rem;
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
  overflow-x: scroll;
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
.center {
  text-align: center;
}
.muted {
  color: rgba(255, 255, 255, 0.3);
  font-style: italic;
  font-size: 12px;
}
.no-data {
  text-align: center;
  padding: 24px;
  color: rgba(255, 255, 255, 0.3);
}

.status-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-pill.paid,
.status-pill.available {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.status-pill.unpaid {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.status-pill.occupied {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.status-pill.maintenance {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.room-badge {
  background: rgba(20, 184, 166, 0.15);
  color: #5dcaa5;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.type-pill {
  background: rgba(20, 184, 166, 0.1);
  color: #5dcaa5;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
}
.late-list {
  padding-left: 14px;
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}
.star-icon {
  color: #fbbf24;
  font-size: 12px;
}

.row-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.btn-edit {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 7px;
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  border: 1px solid rgba(20, 184, 166, 0.3);
  transition: 0.2s;
}
.btn-edit:hover {
  background: rgba(20, 184, 166, 0.25);
  transform: translateY(-1px);
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
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
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
.mfield input[type='number']::-webkit-outer-spin-button,
.mfield input[type='number']::-webkit-inner-spin-button {
  margin: 0;
  -webkit-appearance: none;
}
.mfield input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
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

.room-thumb {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid rgba(20, 184, 166, 0.2);
}
.no-photo {
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.img-preview {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.2);
  margin-bottom: 16px;
}
.img-preview img {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  display: block;
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
    height: 200px;
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

@media (min-width: 769px) {
  .menu-btn {
    display: none !important;
  }
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  margin: 0 24px 16px;
  background: linear-gradient(135deg, #ff6b35, #ff4444);
  color: #fff;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  animation: alertPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 20px rgba(255, 68, 68, 0.3);
}
.alert-banner:hover {
  filter: brightness(1.05);
}
.alert-bell-icon {
  font-size: 20px;
  animation: ringBell 1s ease-in-out infinite;
}
@keyframes ringBell {
  0%, 100% { transform: rotate(0); }
  10%, 30%, 50% { transform: rotate(8deg); }
  20%, 40% { transform: rotate(-8deg); }
  60% { transform: rotate(0); }
}
.alert-dismiss {
  margin-left: auto;
  background: rgba(255,255,255,0.2);
  border: none;
  color: #fff;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.alert-dismiss:hover {
  background: rgba(255,255,255,0.35);
}
</style>
