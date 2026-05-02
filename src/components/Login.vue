<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const submit = async () => {
  console.log('Form payload:', form.value)
  const user = await auth.login(form.value)
  console.log('Logged in user:', user)

  if (!user) {
    console.log('Login failed:', auth.error)
    return
  }

  if (user.is_landlord) {
    router.push('/landlord')
  } else {
    router.push('/tenant')
  }
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
const password = ref('')
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

      <h2>{{ $t('Welcome') }}</h2>
      <p class="subtitle">{{ $t('Login to continue') }}</p>
      
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>{{ $t('Email') }}</label>
          <input v-model="form.email" type="email" :placeholder="$t('Email')" required />
        </div>

        <div class="form-group">
          <label>{{ $t('Password') }}</label>

          <div class="password-wrapper">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="$t('Password')"
              required
            />

            <button type="button" class="toggle-eye" @click="showPassword = !showPassword">
              {{ showPassword ? '👁️' : '🙈' }}
            </button>
          </div>
        </div>

        <div class="form-options">
          <router-link to="/forgot-password">
            {{ $t('Forgot Password') || 'Forgot Password?' }}
          </router-link>
        </div>

        <button class="btn-primary" :disabled="auth.loading">
          <!-- Feedback -->
          <div v-if="auth.loading" class="feedback info">
            {{ $t('Logging in...') }}
          </div>

          <div v-else>
            {{ $t('Login') }}
          </div>
        </button>
      </form>

      <p class="switch">
        {{ $t('Do not have an account') || "Don't have an account?" }}
        <router-link to="/register">{{ $t('Register') || 'Register' }}</router-link>
      </p>

      <router-link to="/" class="back-home">
        ← {{ $t('Back to Home') || 'Back to Home' }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
/* Eye styles for password view */
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
/* translation buttons */
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
  color: black; /* 👈 key change */
  cursor: pointer;
  border-radius: 20px;
  font-weight: bold;
  transition: 0.25s ease;
}

.language-toggle button:hover {
  background: rgba(0, 0, 0, 0.05); /* light hover */
  transform: scale(1.05);
}

.language-toggle button.active {
  background: rgba(0, 123, 255, 0.15);
  border-color: #007bff;
  color: #007bff; /* active stays blue */
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
</style>
