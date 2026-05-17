<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const isLoading = ref(false)

const errors = reactive({
  email: '',
  password: '',
  general: '', // ✅ ADDED: for backend errors
})

function validateEmail() {
  if (!form.value.email) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.email = 'Enter a valid email address.'
  } else {
    errors.email = ''
  }
}

function validatePassword() {
  if (!form.value.password) {
    errors.password = 'Password is required.'
  } else if (form.value.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.'
  } else {
    errors.password = ''
  }
}

function clearError(field) {
  errors[field] = ''
  errors.general = '' // ✅ ADDED: also clear backend error when user starts typing
}

const submit = async () => {
  validateEmail()
  validatePassword()
  if (errors.email || errors.password) return

  console.log('Form payload:', form.value)
  if (isLoading.value || auth.loading) return
  isLoading.value = true

  const user = await auth.login(form.value)
  console.log('Logged in user:', user)

  if (!user) {
    console.log('Login failed:', auth.error)
    errors.general = auth.error || 'Invalid email or password.' // ✅ MODIFIED: show backend error
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

// -------------------- LANGUAGE TOGGLE --------------------
const { locale } = useI18n()
const currentLocale = ref(locale.value)
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// Eye for password view
const showPassword = ref(false)
</script>

<template>
  <div class="auth-page">
    <!-- 🔥 OVERLAY LOADER (ADDED ONLY) -->
    <div v-if="isLoading || auth.loading" class="overlay">
      <div class="loader-box">
        <div class="spinner"></div>

        <p class="wait-text">
          {{ $t('waitMoment') || 'Wait a moment...' }}
        </p>

        <p class="loading-text">
          {{ $t('Logging in...') }}
        </p>
      </div>
    </div>

    <div class="auth-card">
      <!-- Language Toggle -->
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

      <form @submit.prevent="submit">
        <!-- Email -->
        <div class="form-group" :class="{ 'has-error': errors.email }">
          <label>{{ $t('Email') }}</label>
          <input
            v-model="form.email"
            type="email"
            :placeholder="$t('Email')"
            @blur="validateEmail"
            @input="clearError('email')"
          />
          <transition name="shake-fade">
            <span v-if="errors.email" class="error-msg">⚠️ {{ errors.email }}</span>
          </transition>
        </div>

        <!-- Password -->
        <div class="form-group" :class="{ 'has-error': errors.password }">
          <label>{{ $t('Password') }}</label>
          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('Password')"
              @blur="validatePassword"
              @input="clearError('password')"
            />
            <button type="button" class="toggle-eye" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
          <transition name="shake-fade">
            <span v-if="errors.password" class="error-msg">⚠️ {{ errors.password }}</span>
          </transition>
        </div>

        <!-- Forgot Password -->
        <div class="form-options">
          <router-link to="/forgot-password">
            {{ $t('Forgot Password') || 'Forgot Password?' }}
          </router-link>
        </div>

        <!-- ✅ ADDED: backend error message -->
        <transition name="shake-fade">
          <span v-if="errors.general" class="error-msg">⚠️ {{ errors.general }}</span>
        </transition>

        <button class="btn-primary" :disabled="auth.loading || isLoading">
          {{ auth.loading || isLoading ? $t('Logging in...') || 'Logging in...' : $t('Login') }}
        </button>
      </form>

      <p class="switch">
        {{ $t('Do not have an account') || "Don't have an account?" }}
        <router-link to="/register">{{ $t('Register') }}</router-link>
      </p>

      <router-link to="/" class="back-home"> ← {{ $t('Back to Home') }} </router-link>
    </div>
  </div>
</template>

<style scoped>
/* Error input border */
.form-group.has-error input {
  border-color: #e74c3c;
  background-color: #fff5f5;
}

/* Error message */
.error-msg {
  display: block;
  color: #e74c3c;
  font-size: 0.78rem;
  margin-top: 4px;
}

/* Shake + fade animation */
.shake-fade-enter-active {
  animation: shake 0.4s ease;
}

.shake-fade-leave-active {
  transition: opacity 0.2s ease;
}

.shake-fade-leave-to {
  opacity: 0;
}

/* ================= YOUR ORIGINAL STYLES (UNCHANGED) ================= */

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
  color: black;
  cursor: pointer;
  border-radius: 20px;
  font-weight: bold;
  transition: 0.25s ease;
}

.language-toggle button:hover {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(1.05);
}

.language-toggle button.active {
  background: rgba(0, 123, 255, 0.15);
  border-color: #007bff;
  color: #007bff;
}

.dashboard {
  display: flex;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}

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
  animation: fadeUp 0.6s ease;
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
  outline: none;
  border-color: #14b8a6;
}

.form-options {
  text-align: right;
  margin-bottom: 15px;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

.btn-primary:hover {
  background: #022c22;
  transform: translateY(-2px);
}

.switch {
  text-align: center;
  margin-top: 15px;
}

.back-home {
  display: block;
  text-align: center;
  margin-top: 10px;
  color: #0f766e;
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

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ================= 🔥 NEW FEATURE ADDED ================= */

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 118, 110, 0.25);
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loader-box {
  text-align: center;
  color: #0f766e;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 255, 255, 0.3);
  border-top: 5px solid #0f766e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

.wait-text {
  font-size: 18px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.loading-text {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 5px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
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
</style>
