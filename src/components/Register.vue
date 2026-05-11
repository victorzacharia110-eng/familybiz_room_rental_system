<script setup>
import { ref } from 'vue'
import useRegister from '@/composables/guest/register'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { register, data, error } = useRegister()
const router = useRouter()

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const form = ref({
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const isLoading = ref(false)

// ---------------- LANGUAGE ----------------
const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

// ---------------- SUBMIT REGISTER ----------------
const submit = async () => {
  if (isLoading.value) return

  isLoading.value = true

  const res = await register(form.value)

  if (res?.status === 201 || res?.status === 200) {
    alert('Account created successfully! Please login.')
    router.push('/login')
  }

  if (res?.status === 409) {
    alert('User already exists!')
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

// ---------------- PASSWORD ----------------
const showPassword = ref(false)
const showConfirmPassword = ref(false)
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">

      <!-- LANGUAGE SWITCH -->
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

      <!-- 🔥 WAIT SCREEN (replaces form) -->
      <div v-if="isLoading" class="wait-screen">
        {{ $t('waitMoment') || 'Wait a moment...' }}
      </div>

      <!-- FORM -->
      <form v-else @submit.prevent="submit">

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
          />
        </div>

        <!-- PHONE -->
        <div class="form-group">
          <label>{{ $t('Phone Number') }}</label>
          <input
            v-model="form.phone_number"
            type="text"
            :placeholder="$t('Enter Phone Number')"
            pattern="^(0|\+255)[67][0-9]{8}$"
            required
          />
        </div>

        <!-- EMAIL -->
        <div class="form-group">
          <label>{{ $t('Email') }}</label>
          <input
            v-model="form.email"
            type="email"
            required
          />
        </div>

        <!-- PASSWORD -->
        <div class="form-group password-wrapper">
          <label>{{ $t('Password') }}</label>

          <input
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'"
            required
          />

          <button type="button" @click="showPassword = !showPassword">
            {{ showPassword ? '👁️' : '🙈' }}
          </button>
        </div>

        <!-- CONFIRM PASSWORD -->
        <div class="form-group password-wrapper">
          <label>{{ $t('Confirm Password') }}</label>

          <input
            v-model="form.password_confirmation"
            :type="showConfirmPassword ? 'text' : 'password'"
            required
          />

          <button type="button" @click="showConfirmPassword = !showConfirmPassword">
            {{ showConfirmPassword ? '👁️' : '🙈' }}
          </button>
        </div>

        <!-- SUBMIT BUTTON -->
        <button class="btn-primary" :disabled="isLoading">
          {{ isLoading ? ($t('Registering...') || 'Registering...') : $t('Register') }}
        </button>

      </form>

      <!-- API FEEDBACK -->
      <div v-if="error" class="feedback error">{{ error }}</div>
      <div v-if="data" class="feedback success">{{ data.message }}</div>

      <!-- SWITCH -->
      <p class="switch">
        {{ $t('Already Have an Account') || 'Already have an account?' }}
        <router-link to="/login">{{ $t('Login') }}</router-link>
      </p>

      <!-- BACK HOME -->
      <router-link
        to="/"
        class="back-home"
        @click.prevent="goHome"
        :class="{ disabled: isLoading }"
      >
        ← {{ $t('Back to Home') }}
      </router-link>

    </div>
  </div>
</template>

<style scoped>
/* WAIT SCREEN */
.wait-screen {
  text-align: center;
  padding: 40px 20px;
  font-weight: bold;
  color: #0f766e;
  font-size: 18px;
  animation: pulse 1s infinite;
}

/* DISABLED */
.disabled {
  pointer-events: none;
  opacity: 0.5;
}

/* PASSWORD */
.password-wrapper {
  position: relative;
}

.password-wrapper button {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
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
  border: 1px solid #888;
  background: transparent;
  border-radius: 20px;
  cursor: pointer;
  font-weight: bold;
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
  max-width: 420px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
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