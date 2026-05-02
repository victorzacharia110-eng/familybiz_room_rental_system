<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const auth = useAuthStore()
const router = useRouter()

const form = ref({
  email: '',
})

const successMessage = ref('')
const errorMessage = ref('')

const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  const response = await auth.requestPasswordReset(form.value.email)

  if (response) {
    successMessage.value = $t('resetLinkSent') || 'Password reset link has been sent to your email.'
    // Clear form
    form.value.email = ''
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } else {
    errorMessage.value = auth.error || 'Failed to send reset link. Please try again.'
  }
}

// -------------------- LANGUAGE TOGGLE --------------------
const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}
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

      <h2>{{ $t('resetPasswordTitle') || 'Reset Password' }}</h2>
      <p class="subtitle">
        {{
          $t('resetPasswordDescription') ||
          "Enter your email address and we'll send you a link to reset your password."
        }}
      </p>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-alert">
        {{ successMessage }}
      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="error-alert">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>{{ $t('Email') }}</label>
          <input v-model="form.email" type="email" :placeholder="$t('Email')" required />
        </div>

        <button class="btn-primary" :disabled="auth.loading">
          <!-- Feedback -->
          <div v-if="auth.loading" class="feedback info">Sending...</div>

          <div v-else>
            {{ $t('sendResetLink') || 'Send Reset Link' }}
          </div>
        </button>
      </form>

      <div class="auth-links">
        <router-link to="/login">{{ $t('Login') }}</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
  position: relative;
}

.language-toggle {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 5px;
}

.language-toggle button {
  padding: 5px 10px;
  background: transparent;
  border: 1px solid #ddd;
  color: #666;
  cursor: pointer;
  border-radius: 15px;
  font-size: 12px;
  transition: 0.3s;
}

.language-toggle button:hover {
  background: rgba(0, 0, 0, 0.05);
}

.language-toggle button.active {
  background: #0f766e;
  border-color: #0f766e;
  color: white;
}

h2 {
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
  text-align: center;
  font-size: 14px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #0f766e;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #0f766e;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.feedback {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.auth-links {
  text-align: center;
  margin-top: 20px;
}

.auth-links a {
  color: #0f766e;
  text-decoration: none;
}

.auth-links a:hover {
  text-decoration: underline;
}

.success-alert {
  background: #d1fae5;
  color: #065f46;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
  text-align: center;
}

.error-alert {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-weight: 500;
  text-align: center;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 30px 20px;
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
