<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useRoomStore } from '@/stores/room'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'

const { locale, t } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const router = useRouter()
const route = useRoute()

const paymentStore = usePaymentStore()
const roomStore = useRoomStore()

// ✅ FIX HERE (THIS IS THE KEY)
const { paymentForm } = storeToRefs(paymentStore)
const { loadPaymentForEdit, updatePayments } = paymentStore

const paymentId = route.params.id

onMounted(async () => {
  await roomStore.fetchRooms()
  await loadPaymentForEdit(paymentId)
    console.log('FORM AFTER LOAD:', paymentForm.value)
})

const submit = async () => {
  const updated = await updatePayments(paymentId, paymentForm.value)

  if (updated) {
    router.push('/landlord')
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ t('editPayment') }}</h2>
      <p class="subtitle">{{ t('editPaymentSubtitle') }}</p>

      <!-- Language Toggle -->
      <div class="language-toggle">
        <button :class="{ active: currentLocale === 'en' }" @click="setLanguage('en')">
          🇬🇧 English
        </button>

        <button :class="{ active: currentLocale === 'sw' }" @click="setLanguage('sw')">
          🇹🇿 Swahili
        </button>
      </div>

      <div v-if="!paymentForm">
        {{ t('loadingForm') }}
      </div>

      <form v-else @submit.prevent="submit">
        <!-- Room -->
        <div class="form-group">
          <label>{{ t('room') }}</label>

          <select v-model="paymentForm.room_id" required>
            <option disabled value="">
              {{ t('selectRoom') }}
            </option>

            <option
              v-for="room in roomStore.rooms"
              :key="room.id"
              :value="room.id"
            >
              {{ room.room_number }} - {{ room.status }}
            </option>
          </select>
        </div>

        <!-- Month -->
        <div class="form-group">
          <label>{{ t('month') }}</label>

          <input
            v-model="paymentForm.month"
            type="text"
            :placeholder="t('month')"
            required
          />
        </div>

        <!-- Year -->
        <div class="form-group">
          <label>{{ t('year') }}</label>

          <input
            v-model="paymentForm.year"
            type="number"
            :placeholder="t('year')"
            required
          />
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label>{{ t('amount') }}</label>

          <input
            v-model="paymentForm.amount"
            type="number"
            :placeholder="t('amount')"
            required
          />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label>{{ t('status') }}</label>

          <select v-model="paymentForm.status">
            <option value="paid">
              {{ t('paid') }}
            </option>

            <option value="unpaid">
              {{ t('unpaid') }}
            </option>
          </select>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <label>{{ t('dueDate') }}</label>

          <input
            v-model="paymentForm.due_date"
            type="date"
            required
          />
        </div>

        <button class="btn-primary" :disabled="paymentStore.loading">
          {{ t('saveChanges') }}
        </button>
      </form>

      <div v-if="paymentStore.loading" class="feedback info">
        {{ t('updatingPayment') }}
      </div>

      <router-link to="/landlord" class="back-home">
        ← {{ t('back') }}
      </router-link>
    </div>
  </div>
</template>

<style scoped>
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

/* Layout */
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

input,
select {
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
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  transition: 0.3s;
}

.btn-primary:hover {
  background: #022c22;
  transform: translateY(-2px);
}

.feedback.info {
  margin-top: 10px;
  text-align: center;
  color: #0f766e;
}

.back-home {
  display: block;
  text-align: center;
  margin-top: 15px;
  color: #0f766e;
}

@keyframes gradientMove {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>