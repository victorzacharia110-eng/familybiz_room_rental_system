<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePaymentMethodStore } from '@/stores/paymentMethod'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const currentLocale = ref(locale.value)

const setLanguage = (lang) => {
  locale.value = lang
  currentLocale.value = lang
}

const router = useRouter()
const route = useRoute()

const paymentMethodStore = usePaymentMethodStore()

const methodId = route.params.id

onMounted(async () => {
  await paymentMethodStore.loadPaymentMethodForEdit(methodId)
})

const submit = async () => {
  const updated = await paymentMethodStore.updatePaymentMethod(methodId)

  if (updated) {
    router.push('/landlord')
  }
}
</script>

<template>
  <div class="page">
    <div class="card">
      <h2>Edit Payment Method</h2>

      <!-- Language -->
      <div class="language-toggle">
        <button :class="{ active: currentLocale === 'en' }" @click="setLanguage('en')">EN</button>
        <button :class="{ active: currentLocale === 'sw' }" @click="setLanguage('sw')">SW</button>
      </div>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Airtel Money</label>
          <input v-model="paymentMethodStore.paymentMethodForm.airtel_money_number" type="number" />
        </div>

        <div class="form-group">
          <label>M-Pesa</label>
          <input v-model="paymentMethodStore.paymentMethodForm.m_pesa_number" type="number" />
        </div>

        <div class="form-group">
          <label>Mixx by Yas</label>
          <input v-model="paymentMethodStore.paymentMethodForm.mixx_by_yas_number" type="number" />
        </div>

        <div class="form-group">
          <label>Halopesa</label>
          <input v-model="paymentMethodStore.paymentMethodForm.halopesa_number" type="number" />
        </div>

        <div class="form-group">
          <label>NMB Account</label>
          <input v-model="paymentMethodStore.paymentMethodForm.nmb_account_number" type="number" />
        </div>

        <div class="form-group">
          <label>CRDB Account</label>
          <input v-model="paymentMethodStore.paymentMethodForm.crdb_account_number" type="number" />
        </div>

        <div class="form-group">
          <label>NCB Account</label>
          <input v-model="paymentMethodStore.paymentMethodForm.nbc_account_number" type="number" />
        </div>

        <button class="btn-primary" :disabled="paymentMethodStore.loading">Save Changes</button>
      </form>

      <div v-if="paymentMethodStore.loading">Updating...</div>

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

input {
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
