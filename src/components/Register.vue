<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import useRegister from '@/composables/guest/register'
import { useI18n } from 'vue-i18n'

const router = useRouter()

// COMPOSABLE
const { register, data, error, loading } = useRegister()

// FORM
const form = ref({
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  password_confirmation: '',
})

// VALIDATION ERROR
const validationError = ref('')

// SINGLE SOURCE OF TRUTH
const isBusy = loading

// SUBMIT
const submit = async () => {
  if (loading.value) return

  validationError.value = ''

  // LAST NAME
  if (!form.value.last_name.trim()) {
    validationError.value = 'Last name is required'
    return
  }

  // PHONE VALIDATION
  const phoneRegex = /^(0|\+255)[67][0-9]{8}$/

  if (!phoneRegex.test(form.value.phone_number)) {
    validationError.value = 'Invalid Tanzanian phone number'
    return
  }

  // PASSWORD VALIDATION
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/

  if (!passwordRegex.test(form.value.password)) {
    validationError.value =
      'Password must be at least 6 characters and include uppercase, lowercase, and a number.'

    return
  }

  // PASSWORD MATCH
  if (form.value.password !== form.value.password_confirmation) {
    validationError.value = 'Passwords do not match'
    return
  }

  // REGISTER
  const res = await register(form.value)

  if (res?.status === 201 || res?.status === 200) {
    alert('Account created successfully! Please login!')
    router.push('/login')
    return
  }

  if (res?.status === 409) {
    validationError.value = 'User already exists!'
  }
}

// LANGUAGE
const { locale } = useI18n()

const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// PASSWORD TOGGLES
const showPassword = ref(false)
const showConfirmPassword = ref(false)
</script>

<template>
  <div class="auth-page">

    <div class="auth-card">

      <!-- LANGUAGE -->
      <div class="language-toggle">

        <button
          :class="{ active: currentLocale === 'en' }"
          @click="setLanguage('en')"
        >
          🇬🇧 English
        </button>

        <button
          :class="{ active: currentLocale === 'sw' }"
          @click="setLanguage('sw')"
        >
          🇹🇿 Swahili
        </button>

      </div>

      <h2>{{ $t('Create Account') }}</h2>

      <p class="subtitle">
        {{ $t('Register to Get a Room') }}
      </p>

      <!-- LOADING OVERLAY -->
      <div v-if="isBusy" class="loading-overlay">
        <div class="spinner"></div>

        <p class="loading-text">
          {{ $t('Registering...') || 'Registering...' }}
        </p>
      </div>

      <!-- FORM -->
      <form @submit.prevent="submit">

        <!-- LAST NAME -->
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

        <!-- PHONE -->
        <div class="form-group">

          <label>{{ $t('Phone Number') }}</label>

          <input
            v-model="form.phone_number"
            type="text"
            :placeholder="$t('Enter Phone Number')"
            required
            :disabled="isBusy"
          />

        </div>

        <!-- EMAIL -->
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

            <button
              type="button"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁️' : '🙈' }}
            </button>

          </div>

          <!-- PASSWORD REQUIREMENTS -->
          <small class="password-hint">
            Password must contain:
            <br />
            • At least 6 characters
            <br />
            • One uppercase letter
            <br />
            • One lowercase letter
            <br />
            • One number
          </small>

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

            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '👁️' : '🙈' }}
            </button>

          </div>

        </div>

        <!-- BUTTON -->
        <button
          type="submit"
          class="btn-primary"
          :disabled="isBusy"
        >
          {{
            isBusy
              ? ($t('Registering...') || 'Registering...')
              : ($t('Register') || 'Register')
          }}
        </button>

      </form>

      <!-- VALIDATION ERROR -->
      <div v-if="validationError" class="feedback error">
        {{ validationError }}
      </div>

      <!-- API ERROR -->
      <div v-if="error" class="feedback error">
        {{ error }}
      </div>

      <!-- SUCCESS -->
      <div v-if="data" class="feedback success">
        {{ data.message }}
      </div>

      <!-- LOGIN -->
      <p class="switch">

        {{ $t('Already Have an Account') || 'Already have an account?' }}

        <router-link to="/login">
          {{ $t('Login') }}
        </router-link>

      </p>

      <!-- HOME -->
      <router-link to="/" class="back-home">
        ← {{ $t('Back to Home') }}
      </router-link>

    </div>

  </div>
</template>

<style scoped>

/* OVERLAY */

.loading-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  border-radius: 12px;
  pointer-events: all;
}

/* SPINNER */

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

/* CARD */

.auth-card {
  position: relative;
  min-height: 420px;
  background: white;
  padding: 35px;
  width: 100%;
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

/* PAGE */

.auth-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(270deg, #0f766e, #14b8a6, #0f766e);
  background-size: 400% 400%;
  padding: 20px;
}

/* FORM */

.form-group {
  margin-bottom: 16px;
}

input {
  width: 100%;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

/* PASSWORD */

.password-wrapper {
  position: relative;
  width: 100%;
}

.password-wrapper input {
  width: 100%;
  padding-right: 40px;
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

.password-hint {
  display: block;
  margin-top: 6px;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
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

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* TEXT */

h2 {
  text-align: center;
  color: #0f766e;
}

.subtitle {
  text-align: center;
  margin-bottom: 20px;
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

/* FEEDBACK */

.feedback {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
}

.feedback.error {
  color: red;
}

.feedback.success {
  color: green;
}

/* LINKS */

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