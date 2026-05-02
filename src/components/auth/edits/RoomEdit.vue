<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRoomStore } from '@/stores/room'
import { useI18n } from 'vue-i18n'

// -------------------- I18n (legacy mode) --------------------
const { locale, t } = useI18n({ useScope: 'global' })

// -------------------- Router & Store --------------------
const router = useRouter()
const route = useRoute()
const roomStore = useRoomStore()

// Room ID from route
const roomId = route.params.id

// Destructure roomForm, store actions
const { roomForm, loadRoomForEdit, updateRoom } = roomStore

// Load room details on mount
onMounted(async () => {
  await loadRoomForEdit(roomId)
})

// Submit handler
const submit = async () => {
  const updated = await updateRoom()
  if (updated) {
    alert(t('save') + ' ' + t('room') + ' ' + t('success')) // Optional: create 'success' key in en.json
    router.push('/landlord') // redirect to room list after update
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ t('edit') }} {{ t('room') }}</h2>
      <p class="subtitle">{{ t('editRoomSubtitle') || 'Update room information below' }}</p>

      <!-- Language Toggle -->
      <div class="language-toggle">
        <button :class="{ active: locale === 'en' }" @click="locale = 'en'">English</button>
        <button :class="{ active: locale === 'sw' }" @click="locale = 'sw'">Swahili</button>
      </div>

      <!-- Room Edit Form -->
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>{{ t('roomNumber') }}</label>
          <input v-model="roomForm.number" type="text" :placeholder="t('roomNumber')" required />
        </div>

        <div class="form-group">
          <label>{{ t('roomType') }}</label>
          <select v-model="roomForm.type" required>
            <option value="">{{ t('type') }}</option>
            <option value="Single">{{ t('single') }}</option>
            <option value="Double">{{ t('double') }}</option>
            <option value="Empty Room">{{ t('emptyRoom') }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>{{ t('status') }}</label>
          <select v-model="roomForm.status" required>
            <option value="">{{ t('status') }}</option>
            <option value="Available">{{ t('available') }}</option>
            <option value="Occupied">{{ t('occupied') }}</option>
            <option value="Maintenance">{{ t('maintanance') }}</option>
          </select>
        </div>

        <button class="btn-primary" :disabled="roomStore.loading">
          {{ t('save') }}
        </button>
      </form>

      <!-- Feedback -->
      <div v-if="roomStore.loading" class="feedback info">
        {{ t('UpdatingRoom') || 'Updating room...' }}
      </div>

      <router-link to="/landlord" class="back-home">← {{ t('landlordDashboard') }}</router-link>
    </div>
  </div>
</template>

<style scoped>
/* Language toggle buttons */
.language-toggle {
  margin: 10px 0;
  display: flex;
  gap: 5px;
}

.language-toggle button {
  padding: 5px 12px;
  border: 1px solid #888;
  background: #f4f4f4;
  cursor: pointer;
  border-radius: 4px;
  font-weight: bold;
}

.language-toggle button.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
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

input:focus,
select:focus {
  outline: none;
  border-color: #14b8a6;
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
