<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faEnvelope,
  faLock,
  faCheckCircle,
  faExclamationTriangle,
  faArrowLeft,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

library.add(faEnvelope, faLock, faCheckCircle, faExclamationTriangle, faArrowLeft, faSpinner)

const auth = useAuthStore()
const router = useRouter()
const { locale, t } = useI18n()

const currentLocale = ref(locale.value)
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const form = ref({ email: '' })
const successMessage = ref('')
const errorMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const response = await auth.requestPasswordReset(form.value.email)

  if (response) {
    successMessage.value = t('resetLinkSent') || 'Password reset link has been sent to your email.'
    form.value.email = ''
    setTimeout(() => router.push('/login'), 3000)
  } else {
    errorMessage.value = auth.error || 'Failed to send reset link. Please try again.'
  }
}

/* ════════════════════════════════════════
   3D CANVAS — same engine as every other page
════════════════════════════════════════ */
const canvasRef = ref(null)
const pageRef = ref(null)
const cubesRef = ref(null)
const cardRef = ref(null)
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

  const torus = Array.from({ length: 340 }, (_, i) => {
    const u = (i / 340) * Math.PI * 2,
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
  const cubesMath = Array.from({ length: 14 }, () =>
    mkCube(
      (Math.random() - 0.5) * 3.5,
      (Math.random() - 0.5) * 2.5,
      1.5 + Math.random() * 3.5,
      0.2 + Math.random() * 0.4,
    ),
  )

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
    return {
      sx: W / 2 + x * sc + (mx - W / 2) * 0.03,
      sy: H / 2 + y * sc + (my - H / 2) * 0.02,
      sc,
    }
  }

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
    cx.strokeStyle = 'rgba(20,184,166,.1)'
    cx.lineWidth = 0.7
    for (let r = 0; r <= 12; r++) {
      const z0 = 2 + r * 0.32,
        p0 = proj(-16 * 0.14, 1.1, z0),
        p1 = proj(16 * 0.14, 1.1, z0)
      if (p0 && p1) {
        cx.beginPath()
        cx.moveTo(p0.sx, p0.sy)
        cx.lineTo(p1.sx, p1.sy)
        cx.stroke()
      }
    }
    for (let c = 0; c <= 16; c++) {
      const x = c * 0.28 - 16 * 0.14,
        p0 = proj(x, 1.1, 2),
        p1 = proj(x, 1.1, 2 + 12 * 0.32)
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

function buildCubes() {
  const container = cubesRef.value
  if (!container) return
  for (let i = 0; i < 10; i++) {
    const size = 18 + Math.random() * 28,
      hw = size / 2
    const cube = document.createElement('div')
    cube.className = 'css-cube'
    cube.style.cssText = `left:${Math.random() * 90}%;top:${Math.random() * 90}%;width:${size}px;height:${size}px;animation-duration:${6 + Math.random() * 8}s;animation-delay:-${Math.random() * 6}s`
    ;[
      `translateZ(${hw}px)`,
      `translateZ(-${hw}px) rotateY(180deg)`,
      `translateX(${hw}px) rotateY(90deg)`,
      `translateX(-${hw}px) rotateY(-90deg)`,
      `translateY(-${hw}px) rotateX(90deg)`,
      `translateY(${hw}px) rotateX(-90deg)`,
    ].forEach((tf) => {
      const f = document.createElement('div')
      f.className = 'css-cube-face'
      f.style.cssText = `width:${size}px;height:${size}px;position:absolute;transform:${tf};border:1px solid rgba(20,184,166,${0.15 + Math.random() * 0.25});background:rgba(20,184,166,.03)`
      cube.appendChild(f)
    })
    container.appendChild(cube)
  }
}

function onMouseMove(e) {
  const card = cardRef.value
  if (!card) return
  const r = card.getBoundingClientRect()
  const x = ((e.clientX - r.left - r.width / 2) / r.width) * 18
  const y = ((e.clientY - r.top - r.height / 2) / r.height) * 12
  card.style.transform = `perspective(900px) rotateX(${-y * 0.4}deg) rotateY(${x * 0.4}deg) translateZ(10px)`
}
function onMouseLeave() {
  if (cardRef.value)
    cardRef.value.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
}

onMounted(() => {
  initCanvas()
  buildCubes()
})
onUnmounted(() => cancelAnimationFrame(rafId))
</script>

<template>
  <div class="auth-page" ref="pageRef">
    <!-- ── star-field canvas ── -->
    <canvas class="auth-canvas" ref="canvasRef"></canvas>

    <!-- ── scanlines ── -->
    <div class="scanlines"></div>

    <!-- ── 3D CSS rings ── -->
    <div class="ring-wrap">
      <div class="ring r1"></div>
      <div class="ring r2"></div>
      <div class="ring r3"></div>
    </div>

    <!-- ── floating CSS cubes ── -->
    <div class="cubes-layer" ref="cubesRef"></div>

    <!-- ══════ GLASS CARD ══════ -->
    <div class="auth-card" ref="cardRef" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
      <!-- badge -->
      <div class="card-badge">
        <span class="badge-dot"></span>
        <span>Majohe Bwera Rooms</span>
      </div>

      <!-- language -->
      <div class="lang-row">
        <button class="lbtn" :class="{ on: currentLocale === 'en' }" @click="setLanguage('en')">
          🇬🇧 EN
        </button>
        <button class="lbtn" :class="{ on: currentLocale === 'sw' }" @click="setLanguage('sw')">
          🇹🇿 SW
        </button>
      </div>

      <!-- icon -->
      <div class="lock-icon">
        <font-awesome-icon icon="lock" />
      </div>

      <!-- heading -->
      <h2 class="card-title">{{ $t('resetPasswordTitle') || 'Reset Password' }}</h2>
      <p class="card-sub">
        {{ $t('resetPasswordDescription') || "Enter your email and we'll send you a reset link." }}
      </p>

      <!-- alerts -->
      <Transition name="shake-fade">
        <div v-if="successMessage" class="alert success-alert">
          <font-awesome-icon icon="check-circle" /><span>{{ successMessage }}</span>
        </div>
      </Transition>
      <Transition name="shake-fade">
        <div v-if="errorMessage" class="alert error-alert">
          <font-awesome-icon icon="exclamation-triangle" /><span>{{ errorMessage }}</span>
        </div>
      </Transition>

      <!-- FORM -->
      <form @submit.prevent="submit" novalidate>
        <div class="field">
          <label><font-awesome-icon icon="envelope" /> {{ $t('Email') }}</label>
          <div class="input-wrap">
            <input
              v-model="form.email"
              type="email"
              :placeholder="$t('Email')"
              required
              :disabled="auth.loading"
            />
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="auth.loading">
          <span v-if="!auth.loading">
            <font-awesome-icon icon="envelope" /> {{ $t('sendResetLink') || 'Send Reset Link' }}
          </span>
          <span v-else class="btn-loading">
            <font-awesome-icon icon="spinner" spin class="btn-spinner-icon" />
            <span>Sending...</span>
          </span>
        </button>
      </form>

      <!-- redirect note when success -->
      <Transition name="shake-fade">
        <p v-if="successMessage" class="redirect-note">
          <span class="mini-spin"></span>
          Redirecting to login in 3 seconds...
        </p>
      </Transition>

      <div class="auth-links">
        <router-link to="/login" class="link-back">
          <font-awesome-icon icon="arrow-left" /> {{ $t('Login') || 'Back to Login' }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');

/* ══════════════════════════════════════ PAGE ══════════════════════════════════════ */
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

.auth-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

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

/* rings */
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
.r1 {
  width: 700px;
  height: 700px;
  top: 50%;
  left: 50%;
  margin: -350px 0 0 -350px;
  animation-duration: 22s;
}
.r2 {
  width: 480px;
  height: 480px;
  top: 50%;
  left: 50%;
  margin: -240px 0 0 -240px;
  animation-duration: 14s;
  animation-direction: reverse;
  border-color: rgba(20, 184, 166, 0.09);
}
.r3 {
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

/* cubes */
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

/* ══════════════════════════════════════ GLASS CARD ══════════════════════════════════════ */
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
  animation: cardEntrance 0.85s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes cardEntrance {
  from {
    opacity: 0;
    transform: perspective(900px) translateY(70px) rotateX(22deg) scale(0.92);
  }
  to {
    opacity: 1;
    transform: perspective(900px) translateY(0) rotateX(0) scale(1);
  }
}
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
.auth-card:hover {
  box-shadow:
    0 0 0 1px rgba(20, 184, 166, 0.18) inset,
    0 40px 100px rgba(0, 0, 0, 0.6),
    0 0 80px rgba(20, 184, 166, 0.15);
}

/* badge */
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
  margin-bottom: 16px;
  animation: popIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.15s;
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

/* language */
.lang-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-bottom: 16px;
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

/* lock icon */
.lock-icon {
  text-align: center;
  font-size: 2.8rem;
  margin-bottom: 12px;
  animation: iconBounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.25s;
  color: #14b8a6;
}
@keyframes iconBounce {
  from {
    opacity: 0;
    transform: scale(0.3) rotateY(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotateY(0);
  }
}

/* heading */
.card-title {
  font-size: clamp(1.4rem, 4vw, 1.85rem);
  font-weight: 900;
  color: #fff;
  text-align: center;
  margin-bottom: 6px;
  animation: titleDrop 0.8s cubic-bezier(0.34, 1.4, 0.64, 1) both 0.3s;
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
  line-height: 1.6;
  animation: fadeUp 0.7s ease both 0.4s;
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

/* alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 16px;
}
.success-alert {
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.35);
  color: #5dcaa5;
}
.error-alert {
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.35);
  color: #fca5a5;
}
.alert svg {
  flex-shrink: 0;
}

/* field */
.field {
  margin-bottom: 20px;
  animation: fadeUp 0.6s ease both 0.45s;
}
label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 8px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
label svg {
  margin-right: 4px;
  font-size: 11px;
}
.input-wrap {
  position: relative;
}
.input-wrap input {
  width: 100%;
  padding: 12px 16px;
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
.input-wrap input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* submit */
.btn-submit {
  width: 100%;
  padding: 14px;
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
.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

/* spinners */
.btn-spinner-icon {
  font-size: 18px;
  animation: spin 0.8s linear infinite;
}
.mini-spin {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(20, 184, 166, 0.3);
  border-top-color: #14b8a6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* redirect note */
.redirect-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(20, 184, 166, 0.7);
  margin-top: 14px;
  text-align: center;
  animation: fadeUp 0.5s ease both;
}

/* auth links */
.auth-links {
  text-align: center;
  margin-top: 20px;
  animation: fadeUp 0.6s ease both 0.65s;
}
.link-back {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.link-back:hover {
  color: #14b8a6;
}
.link-back svg {
  font-size: 11px;
}

/* transitions */
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

/* responsive */
@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px;
    border-radius: 18px;
  }
  .r1 {
    width: 380px;
    height: 380px;
    margin: -190px 0 0 -190px;
  }
  .r2 {
    width: 260px;
    height: 260px;
    margin: -130px 0 0 -130px;
  }
  .r3 {
    width: 160px;
    height: 160px;
    margin: -80px 0 0 -80px;
  }
}
</style>
