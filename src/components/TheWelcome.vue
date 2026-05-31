<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const currentYear = new Date().getFullYear()

const changeLanguage = (lang) => {
  locale.value = lang
}

/* FLIP FEATURE CARDS */
const features = [
  {
    icon: '📍',
    title: 'homeFeature1Title',
    desc: 'homeFeature1Desc',
    backTitle: 'homeFeature1BackTitle',
    backDesc: 'homeFeature1BackDesc',
  },
  {
    icon: '🔐',
    title: 'homeFeature2Title',
    desc: 'homeFeature2Desc',
    backTitle: 'homeFeature2BackTitle',
    backDesc: 'homeFeature2BackDesc',
  },
  {
    icon: '💧',
    title: 'homeFeature3Title',
    desc: 'homeFeature3Desc',
    backTitle: 'homeFeature3BackTitle',
    backDesc: 'homeFeature3BackDesc',
  },
  {
    icon: '💰',
    title: 'homeFeature4Title',
    desc: 'homeFeature4Desc',
    backTitle: 'homeFeature4BackTitle',
    backDesc: 'homeFeature4BackDesc',
  },
]

/* STAT COUNTERS */
const stats = [
  { target: 120, label: 'homeStatTenants' },
  { target: 5, label: 'homeStatYears' },
  { target: 98, label: 'homeStatSatisfaction' },
  { target: 24, label: 'homeStatSecurity' },
]

/* TEMPLATE REFS */
const rootEl = ref(null)
const heroSec = ref(null)
const bgCanvas = ref(null)
const cubesContainer = ref(null)

/* RIPPLE on buttons */
const addRipple = (event) => {
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const ripple = document.createElement('span')
  ripple.style.cssText = `position:absolute;border-radius:50%;width:${size}px;height:${size}px;left:${(rect.width - size) / 2}px;top:${(rect.height - size) / 2}px;background:rgba(255,255,255,.25);transform:scale(0);animation:rpl .6s linear forwards;pointer-events:none`
  el.appendChild(ripple)
  setTimeout(() => ripple.remove(), 700)
}

/* lifecycle handles for cleanup */
let rafId = null
let observer = null
let onResize = null
let onMouseMove = null

onMounted(() => {
  /* ── STAR FIELD CANVAS ── */
  const canvas = bgCanvas.value
  const ctx = canvas ? canvas.getContext('2d') : null
  let stars = []

  const initStars = () => {
    if (!canvas || !heroSec.value) return
    canvas.width = canvas.offsetWidth || 680
    canvas.height = heroSec.value.offsetHeight || 600
    stars = []
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        opacity: Math.random(),
      })
    }
  }

  const drawStars = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    stars.forEach((s) => {
      s.a += 0.02
      s.opacity = 0.4 + Math.sin(s.a) * 0.4
      s.x += s.vx
      s.y += s.vy
      if (s.x < 0) s.x = canvas.width
      if (s.x > canvas.width) s.x = 0
      if (s.y < 0) s.y = canvas.height
      if (s.y > canvas.height) s.y = 0
      ctx.beginPath()
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(20,184,166,${s.opacity})`
      ctx.fill()
    })
    rafId = requestAnimationFrame(drawStars)
  }

  if (ctx) {
    initStars()
    drawStars()
  }

  onResize = () => initStars()
  window.addEventListener('resize', onResize)

  /* ── 3D FLOATING CUBES ── */
  const container = cubesContainer.value
  if (container) {
    for (let i = 0; i < 8; i++) {
      const size = 20 + Math.random() * 30
      const left = Math.random() * 90
      const top = Math.random() * 90
      const dur = 6 + Math.random() * 8
      const delay = Math.random() * 6
      const el = document.createElement('div')
      el.className = 'cube'
      el.style.cssText = `left:${left}%;top:${top}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:-${delay}s;transform-style:preserve-3d`
      const hw = size / 2
      const faces = [
        `translateZ(${hw}px)`,
        `translateZ(-${hw}px) rotateY(180deg)`,
        `translateX(${hw}px) rotateY(90deg)`,
        `translateX(-${hw}px) rotateY(-90deg)`,
        `translateY(-${hw}px) rotateX(90deg)`,
        `translateY(${hw}px) rotateX(-90deg)`,
      ]
      faces.forEach((t) => {
        const f = document.createElement('div')
        f.className = 'cube-face'
        f.style.cssText = `width:${size}px;height:${size}px;position:absolute;transform:${t};border:1px solid rgba(20,184,166,${0.15 + Math.random() * 0.2});background:rgba(20,184,166,.03)`
        el.appendChild(f)
      })
      container.appendChild(el)
    }
  }

  /* ── MOUSE PARALLAX ── */
  onMouseMove = (e) => {
    if (!rootEl.value) return
    const x = (e.clientX / window.innerWidth - 0.5) * 16
    const y = (e.clientY / window.innerHeight - 0.5) * 16
    const inner = rootEl.value.querySelector('.hero-inner')
    if (inner)
      inner.style.transform = `perspective(900px) rotateX(${-y * 0.25}deg) rotateY(${x * 0.25}deg) translateZ(10px)`
    rootEl.value.querySelectorAll('.ring').forEach((r, i) => {
      const f = (i + 1) * 0.5
      r.style.marginLeft = `${-250 + 180 * i + x * f}px`
    })
  }
  document.addEventListener('mousemove', onMouseMove)

  /* ── SCROLL REVEAL + COUNTERS ── */
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in')
          const n = entry.target.querySelector('[data-target]')
          if (n && !n._done) {
            n._done = 1
            const t = +n.dataset.target
            let c = 0
            const step = t / 55
            const tick = setInterval(() => {
              c = Math.min(c + step, t)
              n.textContent = Math.round(c)
              if (c >= t) clearInterval(tick)
            }, 16)
          }
        }
      })
    },
    { threshold: 0.15 },
  )
  if (rootEl.value) {
    rootEl.value.querySelectorAll('.rv').forEach((el) => observer.observe(el))
  }
})

onUnmounted(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (observer) observer.disconnect()
  if (onResize) window.removeEventListener('resize', onResize)
  if (onMouseMove) document.removeEventListener('mousemove', onMouseMove)
})
</script>

<template>
  <div id="root" ref="rootEl">
    <!-- HERO -->
    <section class="hero" id="hero-sec" ref="heroSec">
      <canvas id="bg-canvas" ref="bgCanvas"></canvas>
      <div class="scanlines"></div>
      <div class="ring-wrap">
        <div class="ring"></div>
        <div class="ring"></div>
        <div class="ring"></div>
      </div>
      <div class="cubes" ref="cubesContainer"></div>
      <div class="hero-inner">
        <div class="badge">
          <span class="badge-dot"></span><span>{{ $t('homeBadge') }}</span>
        </div>
        <h1>
          {{ $t('homeHeroPrefix') }} <span class="teal">Majohe Bwera</span><br />{{
            $t('homeHeroSuffix')
          }}
        </h1>
        <p>{{ $t('homeHeroTagline') }}</p>
        <div class="langs">
          <button class="lbtn" :class="{ on: locale === 'en' }" @click="changeLanguage('en')">
            🇬🇧 English
          </button>
          <button class="lbtn" :class="{ on: locale === 'sw' }" @click="changeLanguage('sw')">
            🇹🇿 Kiswahili
          </button>
        </div>
        <div class="btns">
          <router-link to="/login" class="bp" @click="addRipple">{{ $t('login') }}</router-link>
          <router-link to="/register" class="bs" @click="addRipple">{{
            $t('Register')
          }}</router-link>
        </div>
      </div>
    </section>

    <!-- FEATURES — flip cards -->
    <section class="sec sec-dark">
      <p class="sec-sub rv">{{ $t('homeFeaturesSub') }}</p>
      <h2 class="sec-title rv">{{ $t('homeFeaturesHeading') }}</h2>
      <br />
      <div class="flip-grid">
        <div v-for="(f, i) in features" :key="i" class="flip-card rv" :class="`d${i + 1}`">
          <div class="flip-inner">
            <div class="flip-front">
              <span class="flip-icon">{{ f.icon }}</span>
              <h3>{{ $t(f.title) }}</h3>
              <p>{{ $t(f.desc) }}</p>
            </div>
            <div class="flip-back">
              <h3>{{ $t(f.backTitle) }}</h3>
              <p>{{ $t(f.backDesc) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="sec sec-darker">
      <h2 class="sec-title rv" style="margin-bottom: 36px">{{ $t('homeStatsHeading') }}</h2>
      <div class="counter-row">
        <div v-for="(s, i) in stats" :key="i" class="ctr rv" :class="`d${i + 1}`">
          <span class="ctr-num" :data-target="s.target">0</span>
          <div class="ctr-lbl">{{ $t(s.label) }}</div>
        </div>
      </div>
    </section>

    <!-- LOCATION -->
    <section class="sec sec-dark">
      <p class="sec-sub rv">{{ $t('homeLocationSub') }}</p>
      <h2 class="sec-title rv" style="margin-bottom: 32px">{{ $t('homeLocationHeading') }}</h2>
      <div class="map-box rv">
        <iframe
          src="https://maps.google.com/maps?q=-6.9139299,39.1565626&z=17&output=embed"
          allowfullscreen
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
        <div class="map-info">
          <p>{{ $t('homeMapAddress') }}</p>
          <p>{{ $t('homeMapDirections') }}</p>
          <p>{{ $t('homeMapTransport') }}</p>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="foot">
      <div class="foot-grid">
        <div class="rv">
          <h3>{{ $t('homeFooterTitle') }}</h3>
          <p>{{ $t('homeFooterDescription') }}</p>
        </div>
        <div class="rv d1">
          <h3>{{ $t('homeContact') }}</h3>
          <p style="color: rgba(255, 255, 255, 0.7); font-weight: 600">Software Engineer Victor</p>
          <p>📞 0683 870 268</p>
          <p>📞 0794 770 268</p>
        </div>
        <div class="rv d2">
          <h3>{{ $t('homeAddress') }}</h3>
          <p>Gongo la Mboto<br />Majohe Bwera<br />Dar es Salaam, Tanzania</p>
        </div>
      </div>
      <div class="foot-btm">
        © {{ currentYear }} Majohe Bwera Rooms — {{ $t('homeRightsReserved') }}
      </div>
    </footer>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');

#root {
  font-family: 'Inter', sans-serif;
  background: #030810;
  color: #fff;
  overflow-x: hidden;
}

/* ── CANVAS BG ── */
#bg-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* ── HERO ── */
.hero {
  min-height: 600px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}
.hero-inner {
  position: relative;
  z-index: 3;
  text-align: center;
  max-width: 720px;
}

/* rotating ring */
.ring-wrap {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(20, 184, 166, 0.18);
  animation: ringRotate linear infinite;
}
.ring:nth-child(1) {
  width: 500px;
  height: 500px;
  top: 50%;
  left: 50%;
  margin: -250px 0 0 -250px;
  animation-duration: 18s;
}
.ring:nth-child(2) {
  width: 360px;
  height: 360px;
  top: 50%;
  left: 50%;
  margin: -180px 0 0 -180px;
  animation-duration: 12s;
  animation-direction: reverse;
  border-color: rgba(20, 184, 166, 0.12);
}
.ring:nth-child(3) {
  width: 220px;
  height: 220px;
  top: 50%;
  left: 50%;
  margin: -110px 0 0 -110px;
  animation-duration: 7s;
  border-color: rgba(20, 184, 166, 0.25);
}
@keyframes ringRotate {
  from {
    transform: rotateX(70deg) rotateZ(0deg);
  }
  to {
    transform: rotateX(70deg) rotateZ(360deg);
  }
}

/* floating 3d cubes */
.cubes {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
}
.cube {
  position: absolute;
  transform-style: preserve-3d;
  animation: cubeFloat linear infinite;
}
.cube-face {
  position: absolute;
  border: 1px solid rgba(20, 184, 166, 0.3);
  background: rgba(20, 184, 166, 0.04);
}
@keyframes cubeFloat {
  0% {
    transform: translateY(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg);
  }
  100% {
    transform: translateY(-40px) rotateX(360deg) rotateY(360deg) rotateZ(180deg);
  }
}

/* badge */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(20, 184, 166, 0.1);
  border: 1px solid rgba(20, 184, 166, 0.35);
  color: #5dcaa5;
  font-size: 11px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 20px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 20px;
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #14b8a6;
  animation: pulse2 1.5s ease-in-out infinite;
}
@keyframes pulse2 {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.4);
  }
}

/* hero title with 3d char animation */
.hero h1 {
  font-size: clamp(2rem, 5.5vw, 4rem);
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 16px;
  animation: titleDrop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.1s;
}
@keyframes titleDrop {
  from {
    opacity: 0;
    transform: perspective(600px) translateZ(-200px) rotateX(40deg);
  }
  to {
    opacity: 1;
    transform: perspective(600px) translateZ(0) rotateX(0);
  }
}
.hero h1 .teal {
  color: #14b8a6;
  display: inline-block;
  animation: tealSpin 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both 0.4s;
}
@keyframes tealSpin {
  from {
    opacity: 0;
    transform: rotateY(-90deg) scale(0.5);
  }
  to {
    opacity: 1;
    transform: rotateY(0) scale(1);
  }
}

.hero p {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 28px;
  line-height: 1.7;
  animation: fadeUp 0.8s ease both 0.5s;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.7) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* lang */
.langs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 24px;
  animation: fadeUp 0.8s ease both 0.6s;
}
.lbtn {
  padding: 7px 18px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: 0.25s;
  font-family: inherit;
  letter-spacing: 0.04em;
}
.lbtn.on,
.lbtn:hover {
  background: #0f766e;
  border-color: #14b8a6;
  color: #fff;
  transform: scale(1.07) translateY(-2px);
}

/* buttons */
.btns {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  animation: fadeUp 0.8s ease both 0.7s;
}
.bp,
.bs {
  padding: 13px 32px;
  border-radius: 50px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: 0.3s;
  font-family: inherit;
  position: relative;
  overflow: hidden;
  text-decoration: none;
  display: inline-block;
}
.bp {
  background: #0f766e;
  color: #fff;
}
.bp:hover {
  background: #14b8a6;
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 35px rgba(20, 184, 166, 0.4);
}
.bs {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
}
.bs:hover {
  background: rgba(255, 255, 255, 0.13);
  transform: translateY(-5px);
  border-color: #14b8a6;
}
.bp::after,
.bs::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(255, 255, 255, 0.15), transparent);
  opacity: 0;
  transition: 0.3s;
}
.bp:hover::after,
.bs:hover::after {
  opacity: 1;
}

/* ── 3D CARDS SECTION ── */
.sec {
  padding: 70px 16px;
  position: relative;
  overflow: hidden;
}
.sec-dark {
  background: #020608;
}
.sec-darker {
  background: #010406;
}
.sec-title {
  text-align: center;
  font-size: clamp(1.4rem, 3.5vw, 2.2rem);
  font-weight: 800;
  margin-bottom: 8px;
}
.sec-sub {
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 40px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

/* 3D flip cards */
.flip-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 20px;
  max-width: 880px;
  margin: 0 auto;
  perspective: 1000px;
}
.flip-card {
  height: 220px;
  cursor: pointer;
  perspective: 800px;
}
.flip-inner {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}
.flip-card:hover .flip-inner {
  transform: rotateY(180deg);
}
.flip-front,
.flip-back {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  text-align: center;
}
.flip-front {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(20, 184, 166, 0.15);
}
.flip-back {
  background: linear-gradient(135deg, #0f766e, #085041);
  border: 1px solid #14b8a6;
  transform: rotateY(180deg);
}
.flip-icon {
  font-size: 2.2rem;
  margin-bottom: 12px;
  display: block;
  transition: 0.4s;
}
.flip-card:hover .flip-icon {
  transform: scale(1.15) rotateZ(10deg);
}
.flip-front h3 {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 6px;
}
.flip-front p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}
.flip-back h3 {
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}
.flip-back p {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
}

/* ── COUNTER ── */
.counter-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 24px;
  max-width: 700px;
  margin: 0 auto;
}
.ctr {
  text-align: center;
  padding: 28px 16px;
  background: rgba(20, 184, 166, 0.06);
  border: 1px solid rgba(20, 184, 166, 0.12);
  border-radius: 16px;
  transition: 0.35s;
}
.ctr:hover {
  background: rgba(20, 184, 166, 0.12);
  transform: translateY(-6px) rotateX(4deg) scale(1.04);
  border-color: rgba(20, 184, 166, 0.4);
}
.ctr-num {
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 900;
  color: #14b8a6;
  display: block;
  line-height: 1;
}
.ctr-lbl {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* ── REVEAL ── */
.rv {
  opacity: 0;
  transform: translateY(50px) rotateX(15deg);
  transition:
    opacity 0.75s ease,
    transform 0.75s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.rv.in {
  opacity: 1;
  transform: translateY(0) rotateX(0);
}
.d1 {
  transition-delay: 0.1s;
}
.d2 {
  transition-delay: 0.2s;
}
.d3 {
  transition-delay: 0.3s;
}
.d4 {
  transition-delay: 0.4s;
}

/* ── LOCATION ── */
.map-box {
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(20, 184, 166, 0.2);
  max-width: 820px;
  margin: 0 auto;
}
.map-box iframe {
  width: 100%;
  height: 300px;
  display: block;
  border: 0;
}
.map-info {
  padding: 18px 20px;
  background: rgba(20, 184, 166, 0.07);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.map-info p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.7;
}

/* ── FOOTER ── */
.foot {
  background: #010304;
  padding: 50px 20px 0;
  border-top: 1px solid rgba(20, 184, 166, 0.12);
}
.foot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 32px;
  max-width: 860px;
  margin: 0 auto;
}
.foot h3 {
  color: #14b8a6;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
}
.foot p {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.8;
}
.foot-btm {
  text-align: center;
  padding: 20px;
  margin-top: 36px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
}

/* scan line effect on hero */
.scanlines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}
</style>

<!-- Global rules: a body reset so the dark hero is full-bleed, and the ripple
     keyframe, which animates a JS-injected element that scoped styles
     would not match (Vue renames scoped @keyframes). -->
<style>
body {
  margin: 0;
}
@keyframes rpl {
  to {
    transform: scale(3);
    opacity: 0;
  }
}
</style>
