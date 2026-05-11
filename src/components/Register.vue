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

      <div v-if="isLoading || loading" class="wait-screen">
        <p class="big-text">{{ $t('waitMoment') || 'Wait a moment...' }}</p>
        <p class="small-text">{{ $t('Registering...') }}</p>
      </div>

      <form v-else @submit.prevent="submit">

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

            <!-- ONLY FIX: proper alignment -->
            <button type="button" class="eye-btn" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

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

            <button type="button" class="eye-btn" @click="showConfirmPassword = !showConfirmPassword">
              {{ showConfirmPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-primary" :disabled="loading || isLoading">
          {{ loading || isLoading ? $t('Registering...') : $t('Register') }}
        </button>
      </form>

      <div v-if="error" class="feedback error">{{ error }}</div>
      <div v-if="data" class="feedback success">{{ data.message }}</div>

      <router-link to="/login">Login</router-link>
      <router-link to="/">Back</router-link>

    </div>
  </div>
</template>

<style scoped>

/* ========== YOUR ORIGINAL CSS (UNCHANGED) ========== */

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

/* 🔥 FIX ONLY (eye alignment) */
.eye-btn {
  position: absolute;
  right: 10px;
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

/* animations */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

</style>