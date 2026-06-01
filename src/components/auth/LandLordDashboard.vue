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

  initCanvas()
  buildCubes()
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
})

/* ── messages ── */
const successMessage = ref('')
const successPaymentMessage = ref('')
const successPaymentMethodMessage = ref('')
const fileInput = ref(null)
const successAddingRemarkMessage = ref('')
const successCreationRuleMessage = ref('')
const successAnnouncementMessage = ref('')
const successCommentMessage = ref('')
const successPasswordResetMessage = ref('')

/* ── logout ── */
const logoutUser = async () => {
  await auth.logout()
  router.push('/login')
}

/* ── income ── */
const monthlyIncome = computed(() =>
  paymentStore.payments
    ?.filter((p) => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount || 0), 0),
)

/* ── modals ── */
const showModal = ref(false)
const activePaymentsModal = ref(null)
const activePaymentMethodModal = ref(null)
const activeRoomsModal = ref(null)
const activeProfileModal = ref(null)
const activeRemarksModal = ref(null)
const activeAnnouncementModal = ref(null)
const activeCommentsModal = ref(null)
const activePasswordResetModal = ref(null)

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
      successAddingRemarkMessage.value = '✅ Remark created successfully!'
      setTimeout(() => {
        successAddingRemarkMessage.value = ''
      }, 3000)
    }
  }
}

/* ── forms ── */
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

/* ── fetchers ── */
const paymentMethodFetching = async () => await paymentMethodStore.fetchPaymentMethods()
const paymentFetching = async () => await paymentStore.fetchPayments()
const roomFetching = async () => await roomStore.fetchRooms()

/* ── savers ── */
const savePayment = async () => {
  const res = await paymentStore.registerPayment(paymentForm.value)
  if (res) {
    successPaymentMessage.value = '✅ Payment created successfully!'
    resetPaymentForm()
  }
}
const savePaymentMethod = async () => {
  const res = await paymentMethodStore.registerPaymentMethods(paymentMethodForm.value)
  if (res) {
    successPaymentMethodMessage.value = '✅ Payment method created!'
    resetPaymentMethodForm()
  }
}
const savingRules = async () => {
  const res = await ruleStore.registerRules(ruleForm.value)
  if (res) {
    successCreationRuleMessage.value = '✅ Rule created!'
    resetRulesForm()
  }
}
const saveRoom = async () => {
  const res = await roomStore.registerRoom(roomForm.value)
  if (res) {
    successMessage.value = '✅ Room created!'
    resetRoomForm()
  }
}
const saveAnnouncement = async () => {
  const res = await announcementStore.registerAnnouncement(announcementForm.value)
  if (res) {
    successAnnouncementMessage.value = '✅ Announcement created!'
    resetAnnouncementForm()
  }
}
const saveComment = async () => {
  const res = await commentStore.registerComments(commentForm.value)
  if (res) {
    successCommentMessage.value = '✅ Comment added!'
    commentForm.value.comment = ''
    commentForm.value.rating = 5
  }
}

/* ── deleters ── */
const deleteRoom = async (id) => {
  if (!confirm('⚠️ Delete this room permanently?')) return
  const res = await roomStore.deleteRoom(id)
  alert(res ? '✅ Room deleted!' : '❌ Failed to delete room')
}
const deletingPaymentMethod = async (id) => {
  if (!confirm('⚠️ Delete this payment method?')) return
  const res = await paymentMethodStore.deletePaymentMethod(id)
  alert(res ? '✅ Deleted!' : '❌ Failed')
  paymentMethodFetching()
}
const deletePayment = async (id) => {
  if (!confirm('⚠️ Delete this payment?')) return
  const res = await paymentStore.deletePayment(id)
  alert(res ? '✅ Deleted!' : '❌ Failed')
  paymentFetching()
}
const deleteComment = async (id) => await commentStore.deleteComment(id)

/* ── resets ── */
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

/* ── modal openers / closers ── */
const openPaymentsModal = (n) => {
  activePaymentsModal.value = n
  if (n === 'payments') paymentFetching()
}
const closePaymentsModal = () => {
  activePaymentsModal.value = null
}
const openPaymentMethodModal = (n) => {
  activePaymentMethodModal.value = n
  if (n === 'paymentMethod') paymentMethodFetching()
}
const closePaymentMethodModal = () => {
  activePaymentMethodModal.value = null
}
const openRoomsModal = (n) => {
  activeRoomsModal.value = n
  if (n === 'rooms') roomFetching()
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
  if (n === 'remarks') criticalRemarkStore.fetchCriticalRemarks()
}
const closeRemarksModal = () => {
  activeRemarksModal.value = null
}
const openAnnouncementModal = (n) => {
  activeAnnouncementModal.value = n
  if (n === 'announcements') announcementStore.fetchAnnouncements()
}
const closeAnnouncementsModal = () => {
  activeAnnouncementModal.value = null
}
const openCommentsModal = (n) => {
  activeCommentsModal.value = n
  if (n === 'comments') commentStore.fetchComments()
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
    successPasswordResetMessage.value = '✅ Reset link sent!'
    setTimeout(() => closePasswordResetModal(), 3000)
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
  alert(res ? '✅ Phone updated!' : auth.error || '❌ Failed')
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

/* ── utils ── */
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

/* ════════════════════════════════════════
   3D BACKGROUND CANVAS (same engine as other pages)
════════════════════════════════════════ */
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
  const rotZ = (p, a) => {
    const c = Math.cos(a),
      s = Math.sin(a)
    return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z }
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
    cube.style.cssText = `left:${Math.random() * 90}%;top:${Math.random() * 90}%;width:${size}px;height:${size}px;animation-duration:${6 + Math.random() * 8}s;animation-delay:-${Math.random() * 6}s`
    const tfs = [
      `translateZ(${hw}px)`,
      `translateZ(-${hw}px) rotateY(180deg)`,
      `translateX(${hw}px) rotateY(90deg)`,
      `translateX(-${hw}px) rotateY(-90deg)`,
      `translateY(-${hw}px) rotateX(90deg)`,
      `translateY(${hw}px) rotateX(-90deg)`,
    ]
    tfs.forEach((tf) => {
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
          <span class="ni">📊</span><span>{{ $t('dashboard') }}</span>
        </router-link>

        <a
          href="#"
          class="nav-item"
          :class="{ on: activeAnnouncementModal === 'announcements' }"
          @click.prevent="openAnnouncementModal('announcements')"
        >
          <span class="ni">📢</span><span>{{ $t('Announcements') }}</span>
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
          <span class="ni">👤</span><span>{{ $t('Profile') }}</span>
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
          <span class="ni">🚪</span><span>{{ $t('rooms') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentsModal === 'payments' }"
          @click.prevent="openPaymentsModal('payments')"
        >
          <span class="ni">💰</span><span>{{ $t('payments') }}</span>
        </a>
        <a
          href="#"
          class="nav-item"
          :class="{ on: activePaymentMethodModal === 'paymentMethod' }"
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
      <!-- ── hero canvas banner ── -->
      <div class="hero-banner">
        <canvas ref="canvasRef" class="hero-canvas"></canvas>
        <div class="hero-cubes" ref="cubesRef"></div>
        <div class="hero-scanlines"></div>
        <div class="hero-rings">
          <div class="hr hr1"></div>
          <div class="hr hr2"></div>
        </div>
        <div class="hero-text">
          <button class="menu-btn" @click="isSidebarOpen = !isSidebarOpen">☰</button>
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

      <!-- ── content wrapper ── -->
      <div class="main-body">
        <!-- ── STATS ── -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🏢</div>
            <div>
              <div class="stat-val">{{ totalRooms }}</div>
              <div class="stat-lbl">{{ $t('Total Rooms') }}</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏠</div>
            <div>
              <div class="stat-val">{{ roomsOccupiedCount }}</div>
              <div class="stat-lbl">{{ $t('Occupied') }}</div>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon">✅</div>
            <div>
              <div class="stat-val">{{ roomsAvailableCount }}</div>
              <div class="stat-lbl">{{ $t('Available') }}</div>
            </div>
          </div>
          <div class="stat-card amber">
            <div class="stat-icon">🔧</div>
            <div>
              <div class="stat-val">{{ roomsMaintananceCount }}</div>
              <div class="stat-lbl">{{ $t('Maintanance') }}</div>
            </div>
          </div>
          <div class="stat-card teal-card">
            <div class="stat-icon">💰</div>
            <div>
              <div class="stat-val income">TZS {{ Number(monthlyIncome).toLocaleString() }}</div>
              <div class="stat-lbl">{{ $t('Monthly Income') }}</div>
            </div>
          </div>
        </section>

        <!-- ── TENANTS TABLE ── -->
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
              {{ successAddingRemarkMessage }}
            </div>
          </Transition>

          <div class="table-wrap">
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
                  <td class="idx">{{ index + 1 }}</td>
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
                    <span v-else class="muted">🚫 None</span>
                  </td>
                  <td>
                    <button
                      class="btn-sm"
                      @click="addRemark(tenant)"
                      :disabled="!canAddRemark(tenant)"
                    >
                      {{ $t('addRemark') }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ── RULES ── -->
        <section class="glass-section">
          <div class="section-head">
            <div>
              <h2 class="sec-title">{{ $t('tenantRulesPolicies') }}</h2>
              <p class="sec-sub">Community guidelines and policies</p>
            </div>
            <button class="btn-teal" @click="openModal">{{ $t('addNewRule') }}</button>
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

    <!-- ════════════════════════════════════
         MODALS
    ════════════════════════════════════ -->

    <!-- ADD RULE -->
    <Transition name="modal-fade">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="glass-modal">
          <div class="modal-top">
            <h3>{{ $t('addNewRule') }}</h3>
            <button class="close-x" @click="closeModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successCreationRuleMessage" class="success-alert">
              {{ successCreationRuleMessage }}
            </div></Transition
          >
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
              <button type="submit" class="btn-teal">{{ $t('save') }}</button
              ><button type="button" class="btn-ghost" @click="closeModal">
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
                <button
                  class="btn-teal"
                  style="margin-top: 8px"
                  @click="updatingPhoneNumber(auth.user)"
                >
                  📱 {{ $t('updatePhone') }}
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
            <h3>{{ $t('roomManagement') }}</h3>
            <button class="close-x" @click="closeRoomsModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successMessage" class="success-alert">{{ successMessage }}</div></Transition
          >
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
                📷 {{ $t('selectImage') }}
              </button>
            </div>
            <div v-if="roomForm.preview" class="img-preview">
              <img :src="roomForm.preview" alt="Room" />
            </div>
            <div class="modal-actions">
              <button type="submit" class="btn-teal">{{ $t('addRoom') }}</button
              ><button type="button" class="btn-ghost" @click="closeRoomsModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingRooms') }}</h4>
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
                  <td>{{ room?.type || '—' }}</td>
                  <td>
                    <span class="status-pill" :class="room?.status?.toLowerCase()">{{
                      room?.status
                    }}</span>
                  </td>
                  <td>
                    <span class="row-actions"
                      ><router-link v-if="room.id" :to="`/room/show/${room.id}`" class="btn-edit">{{
                        $t('edit')
                      }}</router-link
                      ><button class="btn-del" @click="deleteRoom(room.id)">
                        {{ $t('delete') }}
                      </button></span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
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
            <h3>{{ $t('Remarks') }}</h3>
            <button class="close-x" @click="closeRemarksModal">✕</button>
          </div>
          <div class="modal-table-wrap">
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
                <tr v-if="!myRemarks.length">
                  <td colspan="4" class="no-data">🚫 No Remarks</td>
                </tr>
                <tr v-else v-for="(remark, i) in myRemarks" :key="remark.id">
                  <td class="idx">{{ i + 1 }}</td>
                  <td>{{ remark.user?.last_name || 'N/A' }}</td>
                  <td>
                    <span class="type-pill">{{ remark.type }}</span>
                  </td>
                  <td>{{ remark.reason_text }}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
            <h3>{{ $t('paymentManagement') }}</h3>
            <button class="close-x" @click="closePaymentsModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successPaymentMessage" class="success-alert">
              {{ successPaymentMessage }}
            </div></Transition
          >
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
              <button type="submit" class="btn-teal">Save Payment</button
              ><button type="button" class="btn-ghost" @click="closePaymentsModal">Close</button>
            </div>
          </form>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('payments') }}</h4>
            <table>
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
                <tr v-for="p in paymentStore.payments" :key="p.id">
                  <td>{{ p.room?.room_number || 'N/A' }}</td>
                  <td>{{ p.month_name }}</td>
                  <td>{{ p.year }}</td>
                  <td>{{ p.amount }}</td>
                  <td>
                    <span class="status-pill" :class="p.status?.toLowerCase()">{{ p.status }}</span>
                  </td>
                  <td>{{ formatDate(p.due_date) }}</td>
                  <td>
                    <span class="row-actions"
                      ><router-link :to="`/payment/show/${p.id}`" class="btn-edit">Edit</router-link
                      ><button class="btn-del" @click="deletePayment(p.id)">Delete</button></span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
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
            <h3>{{ $t('paymentMethodManagement') }}</h3>
            <button class="close-x" @click="closePaymentMethodModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successPaymentMethodMessage" class="success-alert">
              {{ successPaymentMethodMessage }}
            </div></Transition
          >
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
              <button type="submit" class="btn-teal">{{ $t('addPaymentMethod') }}</button
              ><button type="button" class="btn-ghost" @click="closePaymentMethodModal">
                {{ $t('close') }}
              </button>
            </div>
          </form>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('existingPaymentMethods') }}</h4>
            <table>
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
                <tr v-for="(pm, i) in paymentMethodStore.paymentMethods" :key="pm?.id">
                  <td class="idx">{{ i + 1 }}</td>
                  <td>{{ pm?.airtel_money_number || '—' }}</td>
                  <td>{{ pm?.m_pesa_number || '—' }}</td>
                  <td>{{ pm?.mixx_by_yas_number || '—' }}</td>
                  <td>{{ pm?.halopesa_number || '—' }}</td>
                  <td>{{ pm?.nmb_account_number || '—' }}</td>
                  <td>{{ pm?.crdb_account_number || '—' }}</td>
                  <td>{{ pm?.nbc_account_number || '—' }}</td>
                  <td>
                    <span class="row-actions"
                      ><router-link v-if="pm?.id" :to="`/method/show/${pm?.id}`" class="btn-edit">{{
                        $t('edit')
                      }}</router-link
                      ><button class="btn-del" @click="deletingPaymentMethod(pm.id)">
                        {{ $t('delete') }}
                      </button></span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
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
            <h3>{{ $t('announcements') }}</h3>
            <button class="close-x" @click="closeAnnouncementsModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successAnnouncementMessage" class="success-alert">
              {{ successAnnouncementMessage }}
            </div></Transition
          >
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
              <button type="submit" class="btn-teal">Save</button
              ><button type="button" class="btn-ghost" @click="closeAnnouncementsModal">
                Close
              </button>
            </div>
          </form>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('announcements') }}</h4>
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
                <tr v-if="!announcementStore.announcements.length">
                  <td colspan="4" class="no-data">🚫 No Announcements</td>
                </tr>
                <tr v-else v-for="a in announcementStore.announcements" :key="a.id">
                  <td>
                    <strong>{{ a.title }}</strong>
                  </td>
                  <td>{{ a.message }}</td>
                  <td>{{ formatDate(a.created_at) }}</td>
                  <td><button class="btn-del" @click="deleteAnnouncement(a.id)">Delete</button></td>
                </tr>
              </tbody>
            </table>
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
            <h3>{{ $t('Comments') }}</h3>
            <button class="close-x" @click="closeCommentsModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successCommentMessage" class="success-alert">
              {{ successCommentMessage }}
            </div></Transition
          >
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
              <button type="submit" class="btn-teal">Submit</button
              ><button type="button" class="btn-ghost" @click="closeCommentsModal">Close</button>
            </div>
          </form>
          <div class="modal-table-wrap">
            <h4 class="table-subtitle">{{ $t('All Comments') }}</h4>
            <table>
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
                <tr v-if="!commentStore.comments.length">
                  <td colspan="5" class="no-data">🚫 No Comments</td>
                </tr>
                <tr v-else v-for="c in commentStore.comments" :key="c.id">
                  <td>{{ c.user?.last_name || 'N/A' }}</td>
                  <td>{{ c.comment }}</td>
                  <td>{{ c.rating }} ⭐</td>
                  <td>{{ formatDate(c.created_at) }}</td>
                  <td><button class="btn-del" @click="deleteComment(c.id)">Delete</button></td>
                </tr>
              </tbody>
            </table>
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
            <h3>{{ $t('resetPasswordTitle') }}</h3>
            <button class="close-x" @click="closePasswordResetModal">✕</button>
          </div>
          <Transition name="alert-pop"
            ><div v-if="successPasswordResetMessage" class="success-alert">
              {{ successPasswordResetMessage }}
            </div></Transition
          >
          <Transition name="alert-pop"
            ><div v-if="auth.error" class="error-alert">{{ auth.error }}</div></Transition
          >
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
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

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
.stat-card.teal-card {
  border-left-color: #14b8a6;
}
.stat-icon {
  font-size: 1.8rem;
  flex-shrink: 0;
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

/* row actions */
.row-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.btn-edit {
  display: inline-block;
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

/* shared buttons */
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
  max-width: 480px;
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
  max-width: 820px;
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
  margin-bottom: 16px;
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

.form-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
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
  width: 100%;
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

/* img preview */
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

/* alerts */
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

@media (min-width: 769px) {
  .menu-btn {
    display: none !important;
  }
}
</style>
