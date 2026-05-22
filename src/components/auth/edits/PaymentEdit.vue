<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentStore } from '@/stores/payment'
import { useRoomStore } from '@/stores/room'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const router = useRouter()
const route = useRoute()

const paymentStore = usePaymentStore()
const roomStore = useRoomStore()

const paymentId = route.params.id

onMounted(async () => {
  await roomStore.fetchRooms()
  await paymentStore.loadPaymentForEdit(paymentId)
})

const submit = async () => {
  const updated = await paymentStore.updatePayment(paymentId)

  if (updated) {
    router.push('/landlord')
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h2>Edit Payment</h2>

      <!-- Language -->
      <div class="language-toggle">
        <button :class="{ active: currentLocale === 'en' }" @click="setLanguage('en')">EN</button>
        <button :class="{ active: currentLocale === 'sw' }" @click="setLanguage('sw')">SW</button>
      </div>

      <form @submit.prevent="submit">
        <!-- Room -->
        <div class="form-group">
          <label>Room</label>
          <select v-model="paymentStore.paymentForm.room_id" required>
            <option disabled value="">Select Room</option>
            <option v-for="room in roomStore.rooms" :key="room.id" :value="room.id">
              {{ room.room_number }} - {{ room.status }}
            </option>
          </select>
        </div>

        <!-- Month -->
        <div class="form-group">
          <label>Month</label>
          <input v-model="paymentStore.paymentForm.month" type="text" required />
        </div>

        <!-- Year -->
        <div class="form-group">
          <label>Year</label>
          <input v-model="paymentStore.paymentForm.year" type="number" required />
        </div>

        <!-- Amount -->
        <div class="form-group">
          <label>Amount</label>
          <input v-model="paymentStore.paymentForm.amount" type="number" required />
        </div>

        <!-- Status -->
        <div class="form-group">
          <label>Status</label>
          <select v-model="paymentStore.paymentForm.status">
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <!-- Due Date -->
        <div class="form-group">
          <label>Due Date</label>
          <input v-model="paymentStore.paymentForm.due_date" type="date" required />
        </div>

        <button class="btn-primary" :disabled="paymentStore.loading">Save Changes</button>
      </form>

      <div v-if="paymentStore.loading">Updating payment...</div>

      <router-link to="/landlord">← Back</router-link>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f1f5f9;
  padding: 20px;
}

.card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 100%;
  max-width: 450px;
}

h2 {
  color: #0f766e;
  text-align: center;
}

.form-group {
  margin-bottom: 12px;
}

input,
select {
  width: 100%;
  padding: 10px;
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
}
.language-toggle {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 10px;
}
.language-toggle button.active {
  color: #007bff;
}
</style>
