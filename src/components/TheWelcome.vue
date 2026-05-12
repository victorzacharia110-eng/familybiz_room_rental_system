<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const isLoading = ref(false)

const changeLanguage = (lang) => {
  locale.value = lang
}

// Simulate loading (replace with real auth logic later)
const handleAuthClick = () => {
  isLoading.value = true

  setTimeout(() => {
    isLoading.value = false
  }, 2000)
}

// Corousel functionality
import { ref, onMounted, onUnmounted } from 'vue'

const currentFeature = ref(0)

const features = [
  {
    icon: '📍',
    title: 'homeFeatureLocationTitle',
    desc: 'homeFeatureLocationDesc'
  },
  {
    icon: '🔐',
    title: 'homeFeatureSecurityTitle',
    desc: 'homeFeatureSecurityDesc'
  },
  {
    icon: '💧',
    title: 'homeFeatureUtilitiesTitle',
    desc: 'homeFeatureUtilitiesDesc'
  },
  {
    icon: '💰',
    title: 'homeFeaturePriceTitle',
    desc: 'homeFeaturePriceDesc'
  }
]

const nextFeature = () => {
  currentFeature.value = (currentFeature.value + 1) % features.length
}

const prevFeature = () => {
  currentFeature.value =
    (currentFeature.value - 1 + features.length) % features.length
}

/* AUTO PLAY */
let interval = null

onMounted(() => {
  interval = setInterval(() => {
    nextFeature()
  }, 3000)
})

onUnmounted(() => {
  clearInterval(interval)
})
</script>

<template>
  <div class="home-container">
    <!-- HERO SECTION -->
    <section class="hero">
      <div class="hero-content">
        <h1 class="fade-in">{{ $t('homeWelcomeTitle') }}</h1>

        <p class="location slide-up">
          {{ $t('homeLocationDescription') }}
        </p>

        <p class="description slide-up-delay">
          {{ $t('homeHeroDescription') }}
        </p>

        <!-- LANGUAGE SWITCH -->
        <div class="language-switch zoom-in">
          <button @click="changeLanguage('en')" :class="{ active: locale === 'en' }">
            🇬🇧 ENGLISH
          </button>

          <button @click="changeLanguage('sw')" :class="{ active: locale === 'sw' }">
            🇹🇿 SWAHILI
          </button>
        </div>

        <!-- ACTION BUTTONS -->
        <div class="actions zoom-in">
          <router-link
            to="/login"
            class="btn login-btn"
            :class="{ disabled: isLoading }"
            :aria-disabled="isLoading"
            @click.prevent="isLoading ? null : handleAuthClick()"
          >
            {{ $t('login') }}
          </router-link>

          <router-link
            to="/register"
            class="btn register-btn"
            :class="{ disabled: isLoading }"
            :aria-disabled="isLoading"
            @click.prevent="isLoading ? null : handleAuthClick()"
          >
            {{ $t('Register') }}
          </router-link>
        </div>

        <!-- WAIT MESSAGE -->
        <p v-if="isLoading" class="wait-message">
          {{ $t('waitMoment') }}
        </p>
      </div>
    </section>

<!-- FEATURES CAROUSEL -->
<section class="features">
  <h2>{{ $t('homeFeaturesTitle') }}</h2>

  <div class="carousel">

    <!-- LEFT ARROW -->
    <button class="nav-btn" @click="prevFeature">‹</button>

    <!-- CARD -->
    <div class="feature-wrapper">
      <div class="feature-card animate-slide">
        <h3>
          {{ features[currentFeature].icon }}
          {{ $t(features[currentFeature].title) }}
        </h3>

        <p>
          {{ $t(features[currentFeature].desc) }}
        </p>
      </div>
    </div>

    <!-- RIGHT ARROW -->
    <button class="nav-btn" @click="nextFeature">›</button>

  </div>

  <!-- DOTS -->
  <div class="dots">
    <span
      v-for="(f, i) in features"
      :key="i"
      :class="{ active: i === currentFeature }"
      @click="currentFeature = i"
    ></span>
  </div>
</section>

    <!-- LOCATION -->
    <section class="location-section">
      <div class="location-content">
        <h2>{{ $t('homeLocationTitle') }}</h2>

        <p>{{ $t('homeLocationDesc') }}</p>

        <p class="highlight">
          {{ $t('homeLocationHighlight') }}
        </p>

        <!-- MAP -->
        <div class="map-container">
          <iframe
            src="https://maps.google.com/maps?q=-6.9139299,39.1565626&z=17&output=embed"
            allowfullscreen=""
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>

          <div class="location-highlight">
            📍 Located opposite MASJD IBRAHIM MAJOHE, near Soko la Bwera, Majohe Bwera, Gongo la
            Mboto, Dar es Salaam.
          </div>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-container">
        <div>
          <h3>{{ $t('homeFooterTitle') }}</h3>
          <p>{{ $t('homeFooterDescription') }}</p>
        </div>

        <div>
          <h3>{{ $t('homeContact') }}</h3>
          <p><strong>Software Engineer Victor</strong></p>
          <p>📞 0683 870 268</p>
          <p>📞 0794 770 268</p>
        </div>

        <div>
          <h3>{{ $t('homeAddress') }}</h3>
          <p>Gongo la Mboto</p>
          <p>Majohe Bwera</p>
          <p>Dar es Salaam, Tanzania</p>
        </div>
      </div>

      <div class="footer-bottom">© {{ new Date().getFullYear() }} Majohe Bwera Rooms</div>
    </footer>
  </div>
</template>

<style scoped>

.feature-wrapper {
  width: 320px;
  overflow: hidden;
}

.animate-slide {
  animation: slideFade 0.5s ease-in-out;
}

@keyframes slideFade {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* keep arrows nice */
.nav-btn {
  background: #0f766e;
  color: white;
  border: none;
  font-size: 24px;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.3s;
}

.nav-btn:hover {
  transform: scale(1.1);
}

.carousel {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 30px;
}

.carousel-card {
  width: 300px;
  min-height: 160px;
  text-align: center;
  transition: 0.4s ease;
}

.nav-btn {
  background: #0f766e;
  color: white;
  border: none;
  font-size: 24px;
  padding: 10px 15px;
  border-radius: 50%;
  cursor: pointer;
  transition: 0.3s;
}

.nav-btn:hover {
  transform: scale(1.1);
}

.dots {
  margin-top: 15px;
  text-align: center;
}

.dots span {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin: 5px;
  background: #ccc;
  border-radius: 50%;
  cursor: pointer;
}

.dots span.active {
  background: #0f766e;
  transform: scale(1.3);
}


/* MAP */
.map-container {
  width: 100%;
  margin-top: 30px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 6px 18px rgba(0,0,0,0.15);
}

.map-container iframe {
  width: 100%;
  height: 350px;
  border: 0;
  display: block;
}

.location-highlight {
  padding: 12px 15px;
  background: rgba(20, 184, 166, 0.12);
  border-left: 4px solid #14b8a6;
  font-weight: 600;
  font-size: 14px;
  color: #0f172a;
}

/* GENERAL */
.home-container {
  font-family: Arial, Helvetica, sans-serif;
  color: #333;
}

/* LANGUAGE SWITCH */
.language-switch {
  margin-bottom: 20px;
}

.language-switch button {
  margin: 10px;
  padding: 8px 16px;
  border: 2px solid white;
  background: transparent;
  color: white;
  border-radius: 20px;
  cursor: pointer;
  transition: 0.3s ease;
  font-weight: bold;
}

.language-switch button.active {
  background: white;
  color: #0f766e;
  transform: scale(1.1);
  animation: pulse 1.5s infinite;
}

.language-switch button:hover {
  transform: scale(1.15);
  background: rgba(255, 255, 255, 0.2);
}

/* HERO */
.hero {
  background: linear-gradient(270deg, #0f766e, #14b8a6, #0f766e);
  background-size: 400% 400%;
  animation: gradientMove 10s ease infinite;
  color: white;
  padding: 80px 20px;
  text-align: center;
}

.hero-content {
  max-width: 800px;
  margin: auto;
}

.hero h1 {
  font-size: 2.6rem;
  margin-bottom: 20px;
}

/* BUTTONS */
.actions {
  margin-top: 30px;
}

.btn {
  padding: 12px 28px;
  border-radius: 20px;
  text-decoration: none;
  font-weight: bold;
  margin: 10px;
  transition: 0.3s ease;
  display: inline-block;
}

/* DISABLED STATE */
.disabled {
  pointer-events: none;
  opacity: 0.5;
  cursor: not-allowed;
}

.login-btn {
  background: white;
  color: #0f766e;
}

.register-btn {
  background: #022c22;
  color: white;
}

.btn:hover {
  transform: translateY(-4px);
}

/* WAIT MESSAGE */
.wait-message {
  margin-top: 15px;
  color: white;
  font-weight: bold;
  animation: pulse 1s infinite;
}

/* FEATURES */
.features {
  padding: 60px 20px;
  background: #f8fafc;
  text-align: center;
}

.feature-grid {
  margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
}

.feature-card {
  background: white;
  padding: 25px;
  border-radius: 8px;
  transition: 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.feature-card:hover {
  transform: translateY(-8px);
}

/* LOCATION */
.location-section {
  padding: 60px 20px;
  text-align: center;
}

.highlight {
  margin-top: 15px;
  font-weight: bold;
  color: #14b8a6;
}

/* FOOTER */
.footer {
  background: #022c22;
  color: #e2e8f0;
  padding-top: 40px;
}

.footer-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 30px;
  padding: 20px 30px;
}

.footer-bottom {
  text-align: center;
  padding: 15px;
  background: #021a15;
  margin-top: 20px;
}

/* ANIMATIONS */
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(40px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.9);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.fade-in {
  animation: fadeIn 1s ease-in-out;
}
.slide-up {
  animation: slideUp 1.2s ease;
}
.slide-up-delay {
  animation: slideUp 1.6s ease;
}
.zoom-in {
  animation: zoomIn 1.8s ease;
}

/* RESPONSIVE */
@media (max-width: 600px) {
  .hero h1 {
    font-size: 2rem;
  }

  .btn {
    display: block;
    width: 80%;
    margin: 10px auto;
  }

  .map-container iframe {
    height: 250px;
  }

  .location-highlight {
    font-size: 13px;
  }
}
</style>
