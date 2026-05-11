<script setup>
import { ref } from 'vue'
import useRegister from '@/composables/guest/register'
const { register, data, error, loading } = useRegister()
import { useI18n } from 'vue-i18n'

const form = ref({
  last_name: '',
  phone_number: '',
  email: '',
  password: '',
  password_confirmation: '',
})

// 🔥 ADDED: local loading control for full card
const isLoading = ref(false)

const submit = async () => {
  if (isLoading.value || loading.value) return

  isLoading.value = true

  const res = await register(form.value)

  if (res?.status === 201 || res?.status === 200) {
    alert('Account created successfully! Please login.')
  }

  if (res?.status === 409) {
    alert('User already exists!')
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
const showConfirmPassword = ref(false)
</script>

<template>
  <div class="auth-page">
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

      <h2>{{ $t('Create Account') }}</h2>
      <p class="subtitle">{{ $t('Register to Get a Room') }}</p>

      <!-- 🔥 ADDED: FULL CARD LOADING SCREEN -->
      <div v-if="isLoading || loading" class="wait-screen">
        <p class="big-text">
          {{ $t('waitMoment') || 'Wait a moment...' }}
        </p>

        <p class="small-text">
          {{ $t('Registering...') }}
        </p>
      </div>

      <!-- FORM (UNCHANGED) -->
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
            :disabled="isLoading || loading"
          />
        </div>

        <!-- PHONE NUMBER -->
        <div class="form-group">
          <label>{{ $t('Phone Number') }}</label>
          <input
            v-model="form.phone_number"
            type="text"
            :placeholder="$t('Enter Phone Number')"
            pattern="^(0|\+255)[67][0-9]{8}$"
            required
            :disabled="isLoading || loading"
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
            :disabled="isLoading || loading"
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
              :disabled="isLoading || loading"
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
              :disabled="isLoading || loading"
            />

            <button type="button" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <!-- SUBMIT (UNCHANGED LOGIC) -->
        <button type="submit" class="btn-primary" :disabled="loading || isLoading">
          <div v-if="loading || isLoading" class="feedback info">
            {{ $t('Registering...') }}
          </div>

          <div v-else>
            {{ $t('Register') }}
          </div>
        </button>
      </form>

      <!-- ERRORS -->
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
/* 🔥 ADDED ONLY (nothing removed) */
.wait-screen {
  text-align: center;
  padding: 70px 20px;
  color: #0f766e;
}

.big-text {
  font-size: 20px;
  font-weight: bold;
  animation: pulse 1s infinite;
}

.small-text {
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.7;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* ===== YOUR ORIGINAL CSS (UNCHANGED BELOW) ===== */

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