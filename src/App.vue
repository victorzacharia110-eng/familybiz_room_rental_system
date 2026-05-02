<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

onMounted(async () => {
  await auth.fetchUser()
})
</script>

<template>


  <RouterView />
</template>

<style scoped>

</style>
