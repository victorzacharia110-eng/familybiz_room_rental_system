<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
  faExclamationTriangle,
  faArrowLeft,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

library.add(faEnvelope, faLock, faEye, faEyeSlash, faExclamationTriangle, faArrowLeft, faSpinner)

const auth = useAuthStore()
const router = useRouter()
const { locale } = useI18n()

/* ── form state ── */
const form = ref({ email: '', password: '' })
const isLoading = ref(false)
const showPassword = ref(false)
const currentLocale = ref(locale.value)

const errors = reactive({ email: '', password: '', general: '' })

/* ── validation ── */
function validateEmail() {
  if (!form.value.email) errors.email = 'Email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    errors.email = 'Enter a valid email address.'
  else errors.email = ''
}
function validatePassword() {
  if (!form.value.password) errors.password = 'Password is required.'
  else if (form.value.password.length < 6)
    errors.password = 'Password must be at least 6 characters.'
  else errors.password = ''
}
function clearError(field) {
  errors[field] = ''
  errors.general = ''
}

/* ── submit ── */
const submit = async () => {
  validateEmail()
  validatePassword()
  if (errors.email || errors.password) return
  if (isLoading.value || auth.loading) return
  isLoading.value = true

  const user = await auth.login(form.value)
  if (!user) {
    errors.general = auth.error || 'Invalid email or password.'
    isLoading.value = false
    return
  }

  if (user.is_landlord) router.push('/landlord')
  else router.push('/tenant')
  isLoading.value = false
}

/* ── language ── */
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

/* ════════════════════════════════════════
   3D CANVAS — stars + torus + wireframe cubes + grid
   (identical engine to HomeView3D)
════════════════════════════════════════ */
const canvasRef = ref(null)
const pageRef = ref(null)
const cubesRef = ref(null)
const cardRef = ref(null)

let rafId = null
let ioInstance = null

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
    W = cv.width = pageRef.value?.offsetWidth || window.innerWidth
    H = cv.height = pageRef.value?.offsetHeight || window.innerHeight
    mx = W / 2
    my = H / 2
    stars = Array.from({ length: 200 }, () => ({
      x: (Math.random() * 2 - 1) * 2,
      y: (Math.random() * 2 - 1) * 1.5,
      z: Math.random() * 0.8 + 0.1,
      vz: -0.003 - Math.random() * 0.005,
      sz: Math.random() * 1.5 + 0.4,
      ph: Math.random() * Math.PI * 2,
    }))
  }

  /* ── torus ring ── */
  const torus = Array.from({ length: 340 }, (_, i) => {
    const u = (i / 340) * Math.PI * 2
    const v = Math.random() * Math.PI * 2
    const R = 1.4,
      r = 0.5
    return {
      x: (R + r * Math.cos(v)) * Math.cos(u),
      y: (R + r * Math.cos(v)) * Math.sin(u),
      z: r * Math.sin(v),
      ph: Math.random() * Math.PI * 2,
      sz: Math.random() * 0.8 + 0.4,
    }
  })

  /* ── wireframe cubes ── */
  function mkCube(cx2, cy2, cz, sz) {
    const h = sz / 2
    const verts = [
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
      verts,
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
  const cubes = Array.from({ length: 14 }, () =>
    mkCube(
      (Math.random() - 0.5) * 3.5,
      (Math.random() - 0.5) * 2.5,
      1.5 + Math.random() * 3.5,
      0.2 + Math.random() * 0.4,
    ),
  )

  /* ── math helpers ── */
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
    const fov = 480
    const mxO = (mx - W / 2) * 0.03
    const myO = (my - H / 2) * 0.02
    const dz = z + 5.5
    if (dz <= 0.1) return null
    const sc = fov / dz
    return { sx: W / 2 + x * sc + mxO, sy: H / 2 + y * sc + myO, sc }
  }

  let t = 0
  function draw() {
    t += 0.013
    cx.clearRect(0, 0, W, H)
    cx.fillStyle = 'rgba(2,8,16,1)'
    cx.fillRect(0, 0, W, H)

    /* zoom stars with trails */
    stars.forEach((s) => {
      s.z += s.vz
      if (s.z < -0.9) s.z = 0.9
      const p = proj(s.x, s.y, s.z)
      const p2 = proj(s.x, s.y, s.z + 0.07)
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

    /* torus */
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

    /* wireframe cubes */
    cubes.forEach((cb) => {
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
        cx.strokeStyle = 'rgba(20,184,166,.5)'
        cx.lineWidth = 1
        cx.stroke()
      })
      prj.forEach((p) => {
        if (!p) return
        cx.beginPath()
        cx.arc(p.sx, p.sy, 2.5, 0, Math.PI * 2)
        cx.fillStyle = 'rgba(93,202,165,.95)'
        cx.fill()
      })
    })

    /* perspective grid floor */
    cx.strokeStyle = 'rgba(20,184,166,.1)'
    cx.lineWidth = 0.7
    const gY = 1.1,
      rows = 12,
      cols = 16
    for (let r = 0; r <= rows; r++) {
      const z0 = 2 + r * 0.32
      const p0 = proj(-cols * 0.14, gY, z0),
        p1 = proj(cols * 0.14, gY, z0)
      if (p0 && p1) {
        cx.beginPath()
        cx.moveTo(p0.sx, p0.sy)
        cx.lineTo(p1.sx, p1.sy)
        cx.stroke()
      }
    }
    for (let c = 0; c <= cols; c++) {
      const x = c * 0.28 - cols * 0.14
      const p0 = proj(x, gY, 2),
        p1 = proj(x, gY, 2 + rows * 0.32)
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
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX
    my = e.clientY
  })
}

/* ── CSS 3D floating cubes ── */
function buildCubes() {
  const container = cubesRef.value
  if (!container) return
  for (let i = 0; i < 10; i++) {
    const size = 18 + Math.random() * 28
    const hw = size / 2
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
      f.style.cssText = `width:${size}px;height:${size}px;position:absolute;transform:${tf};border:1px solid rgba(20,184,166,${0.15 + Math.random() * 0.25});background:rgba(20,184,166,.03)`
      cube.appendChild(f)
    })
    container.appendChild(cube)
  }
}

/* ── mouse parallax on card ── */
function onMouseMove(e) {
  const card = cardRef.value
  if (!card) return
  const r = card.getBoundingClientRect()
  const x = ((e.clientX - r.left - r.width / 2) / r.width) * 18
  const y = ((e.clientY - r.top - r.height / 2) / r.height) * 12
  card.style.transform = `perspective(900px) rotateX(${-y * 0.4}deg) rotateY(${x * 0.4}deg) translateZ(10px)`
}
function onMouseLeave() {
  const card = cardRef.value
  if (card) card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
}

/* ── lifecycle ── */
onMounted(() => {
  initCanvas()
  buildCubes()
  // scroll reveal (reuse home page class)
  ioInstance = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in')
      })
    },
    { threshold: 0.1 },
  )
  document.querySelectorAll('.rv').forEach((el) => ioInstance.observe(el))
})

onUnmounted(() => {
  cancelAnimationFrame(rafId)
  ioInstance?.disconnect()
})
</script>

<template>
  <div class="auth-page" ref="pageRef">
    <!-- ── star-field canvas ── -->
    <canvas class="auth-canvas" ref="canvasRef"></canvas>

    <!-- ── scanlines ── -->
    <div class="scanlines"></div>

    <!-- ── 3D CSS rings ── -->
    <div class="ring-wrap">
      <div class="ring"></div>
      <div class="ring"></div>
      <div class="ring"></div>
    </div>

    <!-- ── floating CSS cubes ── -->
    <div class="cubes-layer" ref="cubesRef"></div>

    <!-- ══════ OVERLAY LOADER ══════ -->
    <Transition name="overlay-fade">
      <div v-if="isLoading || auth.loading" class="overlay">
        <div class="loader-box">
          <div class="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
          <p class="wait-text">{{ $t('waitMoment') || 'Wait a moment...' }}</p>
          <p class="loading-text">{{ $t('Logging in...') || 'Logging in...' }}</p>
        </div>
      </div>
    </Transition>

    <!-- ══════ GLASS CARD ══════ -->
    <div class="auth-card rv" ref="cardRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <!-- badge -->
      <div class="card-badge">
        <span class="badge-dot"></span>
        <span>Majohe Bwera Rooms</span>
      </div>

      <!-- language toggle -->
      <div class="lang-row">
        <button class="lbtn" :class="{ on: currentLocale === 'en' }" @click="setLanguage('en')">
          🇬🇧 EN
        </button>
        <button class="lbtn" :class="{ on: currentLocale === 'sw' }" @click="setLanguage('sw')">
          🇹🇿 SW
        </button>
      </div>

      <!-- heading -->
      <h2 class="card-title">{{ $t('Welcome') }}</h2>
      <p class="card-sub">{{ $t('Login to continue') }}</p>

      <!-- general error -->
      <Transition name="shake-fade">
        <div v-if="errors.general" class="error-alert">
          <font-awesome-icon icon="exclamation-triangle" />
          <span>{{ errors.general }}</span>
        </div>
      </Transition>

      <form @submit.prevent="submit" novalidate>
        <!-- email -->
        <div
          class="field"
          :class="{ 'field-error': errors.email, 'field-ok': !errors.email && form.email }"
        >
          <label>{{ $t('Email') }}</label>
          <div class="input-wrap">
            <span class="input-icon"><font-awesome-icon icon="envelope" /></span>
            <input
              v-model="form.email"
              type="email"
              :placeholder="$t('Email')"
              @blur="validateEmail"
              @input="clearError('email')"
            />
          </div>
          <Transition name="shake-fade">
            <span v-if="errors.email" class="err-msg">
              <font-awesome-icon icon="exclamation-triangle" /> {{ errors.email }}
            </span>
          </Transition>
        </div>

        <!-- password -->
        <div
          class="field"
          :class="{ 'field-error': errors.password, 'field-ok': !errors.password && form.password }"
        >
          <label>{{ $t('Password') }}</label>
          <div class="input-wrap">
            <span class="input-icon"><font-awesome-icon icon="lock" /></span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('Password')"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
            </button>
          </div>
          <Transition name="shake-fade">
            <span v-if="errors.password" class="err-msg">
              <font-awesome-icon icon="exclamation-triangle" /> {{ errors.password }}
            </span>
          </Transition>
        </div>

        <!-- forgot -->
        <div class="form-opts">
          <router-link to="/forgot-password" class="forgot-link">
            {{ $t('Forgot Password') || 'Forgot Password?' }}
          </router-link>
        </div>

        <!-- submit -->
        <button type="submit" class="btn-submit" :disabled="auth.loading || isLoading">
          <span v-if="!(auth.loading || isLoading)">{{ $t('login') || 'Login' }}</span>
          <font-awesome-icon v-else icon="spinner" spin class="btn-spinner-icon" />
        </button>
      </form>

      <p class="switch-text">
        {{ $t('Do not have an account') || "Don't have an account?" }}
        <router-link to="/register" class="switch-link">{{ $t('Register') }}</router-link>
      </p>

      <router-link to="/" class="back-home">
        <font-awesome-icon icon="arrow-left" /> {{ $t('Back to Home') || 'Back to Home' }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

/* ══════════════════════════════════════════════
   PAGE SHELL  — full viewport, dark bg, overflow hidden
══════════════════════════════════════════════ */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #030810;
  overflow: hidden;
  position: relative;
  font-family: 'Inter', sans-serif;
  padding: 40px 20px;
}

/* ── canvas ── */
.auth-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── scanlines ── */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.07) 2px,
    rgba(0, 0, 0, 0.07) 4px
  );
}

/* ── 3D rings ── */
.ring-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(20, 184, 166, 0.15);
  animation: ringRotate linear infinite;
}
.ring:nth-child(1) {
  width: 700px;
  height: 700px;
  top: 50%;
  left: 50%;
  margin: -350px 0 0 -350px;
  animation-duration: 22s;
}
.ring:nth-child(2) {
  width: 480px;
  height: 480px;
  top: 50%;
  left: 50%;
  margin: -240px 0 0 -240px;
  animation-duration: 14s;
  animation-direction: reverse;
  border-color: rgba(20, 184, 166, 0.09);
}
.ring:nth-child(3) {
  width: 280px;
  height: 280px;
  top: 50%;
  left: 50%;
  margin: -140px 0 0 -140px;
  animation-duration: 8s;
  border-color: rgba(20, 184, 166, 0.22);
}
@keyframes ringRotate {
  from {
    transform: rotateX(70deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(70deg) rotateZ(360deg);
  }
}

/* ── CSS floating cubes ── */
.cubes-layer {
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
    transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: translateY(-35px) rotateX(360deg) rotateY(360deg) rotateZ(180deg);
  }
}

/* ══════════════════════════════════════════════
   GLASS CARD
══════════════════════════════════════════════ */
.auth-card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(20, 184, 166, 0.25);
  border-radius: 24px;
  padding: 36px 32px;
  backdrop-filter: blur(28px) saturate(1.4);
  -webkit-backdrop-filter: blur(28px) saturate(1.4);
  box-shadow:
    0 0 0 1px rgba(20, 184, 166, 0.08) inset,
    0 30px 80px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(20, 184, 166, 0.08);
  transition:
    transform 0.15s ease,
    box-shadow 0.3s ease;
  transform-style: preserve-3d;

  /* entrance */
  opacity: 0;
  transform: perspective(900px) translateY(60px) rotateX(20deg) scale(0.93);
}
.auth-card.in {
  opacity: 1;
  transform: perspective(900px) translateY(0) rotateX(0) scale(1);
  transition:
    opacity 0.8s cubic-bezier(0.34, 1.2, 0.64, 1),
    transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1),
    box-shadow 0.3s ease;
}
.auth-card:hover {
  box-shadow:
    0 0 0 1px rgba(20, 184, 166, 0.18) inset,
    0 40px 100px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(20, 184, 166, 0.15);
}

/* inner glow line at top */
.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.6), transparent);
  border-radius: 50%;
}

/* ── badge ── */
.card-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.3);
  color: #5dcaa5;
  font-size: 10px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 20px;
  animation: popIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.2s;
}
.badge-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #14b8a6;
  animation: dotPulse 1.4s ease-in-out infinite;
}
@keyframes dotPulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.3;
    transform: scale(1.6);
  }
}
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.6) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* ── language row ── */
.lang-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 20px;
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
  transition: 0.25s;
}
.lbtn.on,
.lbtn:hover {
  background: #0f766e;
  border-color: #14b8a6;
  color: #fff;
  transform: scale(1.07) translateY(-1px);
}

/* ── heading ── */
.card-title {
  font-size: clamp(1.6rem, 4vw, 2rem);
  font-weight: 900;
  color: #fff;
  text-align: center;
  margin-bottom: 6px;
  animation: titleDrop 0.8s cubic-bezier(0.34, 1.4, 0.64, 1) both 0.15s;
}
@keyframes titleDrop {
  from {
    opacity: 0;
    transform: perspective(500px) rotateX(35deg) translateY(30px);
  }
  to {
    opacity: 1;
    transform: perspective(500px) rotateX(0) translateY(0);
  }
}
.card-sub {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 24px;
  animation: fadeUp 0.7s ease both 0.3s;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ── general error alert ── */
.error-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.35);
  color: #fca5a5;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}
.error-alert svg {
  flex-shrink: 0;
}

/* ── form fields ── */
.field {
  margin-bottom: 18px;
  animation: fadeUp 0.6s ease both;
}
.field:nth-child(2) {
  animation-delay: 0.35s;
}
.field:nth-child(3) {
  animation-delay: 0.45s;
}

label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 7px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.input-icon {
  position: absolute;
  left: 13px;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
  color: rgba(255, 255, 255, 0.5);
}
.input-wrap input {
  width: 100%;
  padding: 12px 44px 12px 40px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
  color: #fff;
  font-size: 14px;
  font-family: inherit;
  transition:
    border-color 0.25s,
    background 0.25s,
    box-shadow 0.25s;
  outline: none;
}
.input-wrap input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}
.input-wrap input:focus {
  border-color: #14b8a6;
  background: rgba(20, 184, 166, 0.07);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
}

/* field states */
.field-error .input-wrap input {
  border-color: rgba(220, 38, 38, 0.5);
  background: rgba(220, 38, 38, 0.06);
}
.field-ok .input-wrap input {
  border-color: rgba(20, 184, 166, 0.4);
}

.eye-btn {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  line-height: 1;
  transition: transform 0.2s;
  color: rgba(255, 255, 255, 0.6);
}
.eye-btn:hover {
  transform: scale(1.15);
  color: #14b8a6;
}

.err-msg {
  display: block;
  color: #fca5a5;
  font-size: 11px;
  margin-top: 6px;
  padding-left: 4px;
}
.err-msg svg {
  font-size: 10px;
  margin-right: 3px;
}

/* ── forgot link ── */
.form-opts {
  text-align: right;
  margin-bottom: 20px;
}
.forgot-link {
  font-size: 12px;
  color: #14b8a6;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}
.forgot-link:hover {
  color: #5dcaa5;
}

/* ── submit button ── */
.btn-submit {
  width: 100%;
  padding: 13px;
  border-radius: 50px;
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
  animation: fadeUp 0.6s ease both 0.55s;
}
.btn-submit::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(255, 255, 255, 0.15), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.btn-submit:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 14px 40px rgba(20, 184, 166, 0.45);
}
.btn-submit:hover::before {
  opacity: 1;
}
.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* button inline spinner */
.btn-spinner-icon {
  font-size: 18px;
  animation: spin 0.8s linear infinite;
}

/* ── switch / back ── */
.switch-text {
  text-align: center;
  margin-top: 18px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  animation: fadeUp 0.6s ease both 0.65s;
}
.switch-link {
  color: #14b8a6;
  font-weight: 700;
  text-decoration: none;
  margin-left: 4px;
  transition: color 0.2s;
}
.switch-link:hover {
  color: #5dcaa5;
}

.back-home {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  margin-top: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  text-decoration: none;
  transition: color 0.2s;
  animation: fadeUp 0.6s ease both 0.7s;
  width: 100%;
}
.back-home:hover {
  color: #14b8a6;
}
.back-home svg {
  font-size: 11px;
}

/* ══════════════════════════════════════════════
   OVERLAY LOADER
══════════════════════════════════════════════ */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 8, 16, 0.75);
  backdrop-filter: blur(14px) saturate(1.2);
  -webkit-backdrop-filter: blur(14px) saturate(1.2);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.loader-box {
  text-align: center;
  color: #fff;
}
/* ring spinner */
.spinner-ring {
  display: inline-block;
  position: relative;
  width: 60px;
  height: 60px;
  margin-bottom: 18px;
}
.spinner-ring div {
  box-sizing: border-box;
  display: block;
  position: absolute;
  width: 48px;
  height: 48px;
  margin: 6px;
  border: 4px solid transparent;
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 1.1s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}
.spinner-ring div:nth-child(1) {
  animation-delay: -0.45s;
}
.spinner-ring div:nth-child(2) {
  animation-delay: -0.3s;
  border-top-color: rgba(20, 184, 166, 0.5);
}
.spinner-ring div:nth-child(3) {
  animation-delay: -0.15s;
  border-top-color: rgba(20, 184, 166, 0.25);
}
.spinner-ring div:nth-child(4) {
  animation-delay: 0s;
  border-top-color: rgba(20, 184, 166, 0.1);
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.wait-text {
  font-size: 17px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
  animation: pulse 1.2s ease-in-out infinite;
}
.loading-text {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

/* ══════════════════════════════════════════════
   REVEAL & TRANSITIONS
══════════════════════════════════════════════ */
.rv {
  opacity: 0;
  transform: perspective(900px) translateY(60px) rotateX(20deg) scale(0.93);
}
.rv.in {
  opacity: 1;
  transform: perspective(900px) translateY(0) rotateX(0) scale(1);
  transition:
    opacity 0.8s cubic-bezier(0.34, 1.2, 0.64, 1),
    transform 0.8s cubic-bezier(0.34, 1.2, 0.64, 1);
}

/* shake-fade for error messages */
.shake-fade-enter-active {
  animation: shake 0.45s ease;
}
.shake-fade-leave-active {
  transition: opacity 0.2s ease;
}
.shake-fade-leave-to {
  opacity: 0;
}
@keyframes shake {
  0% {
    transform: translateX(0);
    opacity: 0;
  }
  20% {
    transform: translateX(-6px);
    opacity: 1;
  }
  40% {
    transform: translateX(6px);
  }
  60% {
    transform: translateX(-4px);
  }
  80% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(0);
  }
}

/* overlay transition */
.overlay-fade-enter-active,
.overlay-fade-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-fade-enter-from,
.overlay-fade-leave-to {
  opacity: 0;
}

/* ══════════════════════════════════════════════
   RESPONSIVE
══════════════════════════════════════════════ */
@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px;
    border-radius: 18px;
  }
  .ring:nth-child(1) {
    width: 380px;
    height: 380px;
    margin: -190px 0 0 -190px;
  }
  .ring:nth-child(2) {
    width: 260px;
    height: 260px;
    margin: -130px 0 0 -130px;
  }
  .ring:nth-child(3) {
    width: 160px;
    height: 160px;
    margin: -80px 0 0 -80px;
  }
}
</style>
