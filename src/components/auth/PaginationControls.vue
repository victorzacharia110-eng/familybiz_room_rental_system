<script setup>
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'

library.add(faChevronLeft, faChevronRight)

const props = defineProps({
  currentPage: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  showingFrom: { type: Number, default: 0 },
  showingTo: { type: Number, default: 0 },
  totalItems: { type: Number, default: 0 },
})

const emit = defineEmits(['page-change'])

function getPages() {
  const pages = []
  const total = props.totalPages
  const current = props.currentPage
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
}
</script>

<template>
  <div v-if="totalPages > 1" class="pagination-wrap">
    <div class="pagination-info">
      Showing {{ showingFrom }}–{{ showingTo }} of {{ totalItems }}
    </div>
    <div class="pagination-controls">
      <button
        class="page-btn"
        :disabled="currentPage <= 1"
        @click="emit('page-change', currentPage - 1)"
      >
        <font-awesome-icon icon="chevron-left" />
      </button>
      <template v-for="p in getPages()" :key="p">
        <span v-if="p === '...'" class="page-dots">...</span>
        <button
          v-else
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="emit('page-change', p)"
        >
          {{ p }}
        </button>
      </template>
      <button
        class="page-btn"
        :disabled="currentPage >= totalPages"
        @click="emit('page-change', currentPage + 1)"
      >
        <font-awesome-icon icon="chevron-right" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pagination-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  flex-wrap: wrap;
}
.pagination-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}
.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  font-family: inherit;
}
.page-btn:hover:not(:disabled) {
  background: rgba(20, 184, 166, 0.12);
  border-color: rgba(20, 184, 166, 0.3);
  color: #14b8a6;
}
.page-btn.active {
  background: rgba(20, 184, 166, 0.15);
  border-color: #14b8a6;
  color: #14b8a6;
}
.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.page-dots {
  color: rgba(255, 255, 255, 0.3);
  padding: 0 4px;
  font-size: 13px;
}
</style>
