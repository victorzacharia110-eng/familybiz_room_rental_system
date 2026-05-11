<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()
const { locale } = useI18n()

const currentLocale = ref(locale.value)

const form = ref({
  email: '',
  password: '',
})

const isLoading = ref(false)
const showPassword = ref(false)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// ---------------- LOGIN ----------------
const submit = async () => {
  if (isLoading.value) return

  isLoading.value = true

  const user = await auth.login(form.value)

  if (!user) {
    isLoading.value = false
    return
  }

  if (user.is_landlord) {
    router.push('/landlord')
  } else {
    router.push('/tenant')
  }

  isLoading.value = false
}

// ---------------- BACK HOME ----------------
const goHome = () => {
  if (isLoading.value) return

  isLoading.value = true

  setTimeout(() => {
    router.push('/')
    isLoading.value = false
  }, 800)
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- LANGUAGE -->
      <div class="language-toggle">
        <button :class="{ active: currentLocale === 'en' }" @click="setLanguage('en')">
          🇬🇧 English
        </button>

        <button :class="{ active: currentLocale === 'sw' }" @click="setLanguage('sw')">
          🇹🇿 Swahili
        </button>
      </div>

      <h2>{{ $t('Welcome') }}</h2>
      <p class="subtitle">{{ $t('Login to continue') }}</p>

      <!-- 🔥 WAIT SCREEN (replaces form) -->
      <div v-if="isLoading" class="wait-screen">
        {{ $t('waitMoment') || 'Wait a moment...' }}
      </div>

      <!-- FORM -->
      <form v-else @submit.prevent="submit">

        <div class="form-group">
          <label>{{ $t('Email') }}</label>
          <input v-model="form.email" type="email" required />
        </div>

        <div class="form-group">
          <label>{{ $t('Password') }}</label>

          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
            />

            <button
              type="button"
              class="toggle-eye"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <router-link to="/forgot-password">
            {{ $t('Forgot Password') || 'Forgot Password?' }}
          </router-link>
        </div>

        <!-- 🔘 BUTTON TEXT ONLY -->
        <button class="btn-primary" :disabled="isLoading">
          {{ isLoading ? ($t('Logging in...') || 'Logging in...') : $t('Login') }}
        </button>

      </form>

      <p class="switch">
        {{ $t('Do not have an account') || "Don't have an account?" }}
        <router-link to="/register">
          {{ $t('Register') || 'Register' }}
        </router-link>
      </p>

      <!-- BACK HOME -->
      <router-link
        to="/"
        class="back-home"
        @click.prevent="goHome"
      >
        ← {{ $t('Back to Home') || 'Back to Home' }}
      </router-link>

    </div>
  </div>
</template>

<style scoped>
/* WAIT SCREEN */
.wait-screen {
  text-align: center;
  padding: 50px 20px;
  font-weight: bold;
  color: #0f766e;
  font-size: 18px;
  animation: pulse 1s infinite;
}

/* PASSWORD */
.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-wrapper input {
  width: 100%;
  padding-right: 40px;
}

.toggle-eye {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

/* LANGUAGE */
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
  cursor: pointer;
  border-radius: 20px;
  font-weight: bold;
  transition: 0.25s ease;
}

.language-toggle button.active {
  background: rgba(0, 123, 255, 0.15);
  border-color: #007bff;
  color: #007bff;
}

/* PAGE */
.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(270deg, #0f766e, #14b8a6, #0f766e);
  background-size: 400% 400%;
  animation: gradientMove 12s ease infinite;
  padding: 20px;
}

.auth-card {
  background: white;
  padding: 35px;
  width: 100%;
  max-width: 400px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

h2 {
  text-align: center;
  color: #0f766e;
}

.subtitle {
  text-align: center;
  margin-bottom: 20px;
  color: #555;
}

/* FORM */
.form-group {
  margin-bottom: 15px;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

input:focus {
  border-color: #14b8a6;
  outline: none;
}

/* BUTTON */
.btn-primary {
  width: 100%;
  padding: 12px;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
}

.btn-primary:hover {
  background: #022c22;
}

/* LINKS */
.switch,
.back-home {
  text-align: center;
  margin-top: 10px;
  display: block;
  color: #0f766e;
}

/* ANIMATION */
@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}
</style>