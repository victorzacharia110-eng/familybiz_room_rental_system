<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import useRegister from '@/composables/guest/register'
import { useI18n } from 'vue-i18n'

const router = useRouter()

const { register, data, error, loading } = useRegister()

const form = ref({
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  password_confirmation: '',
})

// local loading
const isLoading = ref(false)

// 🔥 FIX: unified loading state (LIKE LOGIN)
const isBusy = computed(() => isLoading.value || loading.value)

const submit = async () => {
  if (isBusy.value) return

  isLoading.value = true

  const res = await register(form.value)

  if (res?.status === 201 || res?.status === 200) {
    alert('Account created successfully! Please login.')

    isLoading.value = false

    // optional redirect like login flow
    router.push('/login')
    return
  }

  if (res?.status === 409) {
    alert('User already exists!')
  }

  isLoading.value = false
}

// LANGUAGE
const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// EYES
const showPassword = ref(false)
const showConfirmPassword = ref(false)
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

      <h2>{{ $t('Create Account') }}</h2>
      <p class="subtitle">{{ $t('Register to Get a Room') }}</p>

      <!-- 🔥 LOGIN STYLE BLUR OVERLAY -->
      <div v-if="isBusy" class="loading-overlay">
        <div class="spinner"></div>
        <p class="loading-text">
          {{ $t('Registering...') || 'Registering...' }}
        </p>
      </div>

      <!-- FORM (UNCHANGED LAYOUT) -->
      <form @submit.prevent="submit">

        <div class="form-group">
          <label>{{ $t('Last Name') }}</label>
          <input
            v-model="form.last_name"
            type="text"
            :placeholder="$t('Last Name')"
            @keydown.space.prevent
            @input="form.last_name = form.last_name.replace(/[^A-Za-z]/g, '')"
            required
            :disabled="isBusy"
          />
        </div>

        <div class="form-group">
          <label>{{ $t('Phone Number') }}</label>
          <input
            v-model="form.phone_number"
            type="text"
            :placeholder="$t('Enter Phone Number')"
            pattern="^(0|\+255)[67][0-9]{8}$"
            required
            :disabled="isBusy"
          />
        </div>

        <div class="form-group">
          <label>{{ $t('Email') }}</label>
          <input
            v-model="form.email"
            type="email"
            :placeholder="$t('Email')"
            required
            :disabled="isBusy"
          />
        </div>

        <!-- PASSWORD -->
        <div class="form-group">
          <label>{{ $t('Password') }}</label>

          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('Password')"
              required
              :disabled="isBusy"
            />

            <button type="button" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <!-- CONFIRM PASSWORD -->
        <div class="form-group">
          <label>{{ $t('Confirm Password') }}</label>

          <div class="password-wrapper">
            <input
              v-model="form.password_confirmation"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="$t('Confirm Password')"
              required
              :disabled="isBusy"
            />

            <button type="button" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="isBusy">
          {{ isBusy ? ($t('Registering...') || 'Registering...') : ($t('Register') || 'Register') }}
        </button>

      </form>

      <div v-if="error" class="feedback error">{{ error }}</div>
      <div v-if="data" class="feedback success">{{ data.message }}</div>

      <p class="switch">
        {{ $t('Already Have an Account') || 'Already have an account?' }}
        <router-link to="/login">{{ $t('Login') }}</router-link>
      </p>

      <router-link to="/" class="back-home">
        ← {{ $t('Back to Home') }}
      </router-link>

    </div>
  </div>
</template>

<style scoped>

/* ================= LOGIN STYLE OVERLAY ================= */

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 999;
  border-radius: 12px;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(0,0,0,0.1);
  border-top: 4px solid #0f766e;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.loading-text {
  margin-top: 12px;
  font-size: 14px;
  color: #0f766e;
  animation: pulse 1s infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* IMPORTANT FIX */
.auth-card {
  position: relative;
}

/* ================= YOUR ORIGINAL CSS (UNCHANGED) ================= */

.form-group {
  margin-bottom: 16px;
}

.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper input {
  width: 100%;
  height: 38px;
  padding: 0 40px 0 10px;
  box-sizing: border-box;
}

.password-wrapper button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
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
}

.language-toggle button.active {
  background: rgba(0, 123, 255, 0.15);
  border-color: #007bff;
  color: #007bff;
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
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  animation: fadeUp 0.6s ease;
}

h2 {
  text-align: center;
  color: #0f766e;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
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
}

.btn-primary:hover {
  background: #022c22;
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
</style>