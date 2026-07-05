<script setup>
defineProps({
  rows: { type: Number, default: 5 },
  cols: { type: Number, default: 4 },
})
</script>

<template>
  <div class="skeleton-table">
    <div v-for="r in rows" :key="r" class="skeleton-row">
      <div
        v-for="c in cols"
        :key="c"
        class="skeleton-cell"
        :style="{ width: c === 1 ? '40px' : c === cols ? '80px' : 'auto' }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.skeleton-table {
  padding: 15px;
}
.skeleton-row {
  display: flex;
  gap: 16px;
  height: 50px;
  margin-bottom: 10px;
  align-items: center;
}
.skeleton-cell {
  height: 20px;
  flex: 1;
  border-radius: 6px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.12) 50%,
    rgba(255, 255, 255, 0.05) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
