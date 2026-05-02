<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { locale } = useI18n()

const changeLanguage = (lang) => {
  locale.value = lang
}
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

        <div class="language-switch zoom-in">
          <button @click="changeLanguage('en')" :class="{ active: locale === 'en' }">
            🇬🇧 ENGLISH
          </button>

          <button @click="changeLanguage('sw')" :class="{ active: locale === 'sw' }">
            🇹🇿 SWAHILI
          </button>
        </div>

        <div class="actions zoom-in">
          <router-link to="/login" class="btn login-btn">
            {{ $t('login') }}
          </router-link>
          <router-link to="/register" class="btn register-btn">
            {{ $t('Register') }}
          </router-link>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="features">
      <h2>{{ $t('homeFeaturesTitle') }}</h2>

      <div class="feature-grid">
        <div class="feature-card">
          <h3>📍 {{ $t('homeFeatureLocationTitle') }}</h3>
          <p>{{ $t('homeFeatureLocationDesc') }}</p>
        </div>

        <div class="feature-card">
          <h3>🔐 {{ $t('homeFeatureSecurityTitle') }}</h3>
          <p>{{ $t('homeFeatureSecurityDesc') }}</p>
        </div>

        <div class="feature-card">
          <h3>💧 {{ $t('homeFeatureUtilitiesTitle') }}</h3>
          <p>{{ $t('homeFeatureUtilitiesDesc') }}</p>
        </div>

        <div class="feature-card">
          <h3>💰 {{ $t('homeFeaturePriceTitle') }}</h3>
          <p>{{ $t('homeFeaturePriceDesc') }}</p>
        </div>
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

/* ACTIVE STATE */
.language-switch button.active {
  background: white;
  color: #0f766e;
  transform: scale(1.1);
}

/* HOVER EFFECT */
.language-switch button:hover {
  transform: scale(1.15);
  background: rgba(255, 255, 255, 0.2);
}

/* ANIMATION */
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

.language-switch button.active {
  animation: pulse 1.5s infinite;
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
}
</style>
