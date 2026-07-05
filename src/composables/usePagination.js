import { ref, computed } from 'vue'

export function usePagination(dataRef, perPage = 15) {
  const currentPage = ref(1)

  const totalPages = computed(() =>
    Math.max(1, Math.ceil((dataRef.value?.length || 0) / perPage)),
  )

  const paginatedData = computed(() => {
    if (!dataRef.value) return []
    const start = (currentPage.value - 1) * perPage
    return dataRef.value.slice(start, start + perPage)
  })

  const showingFrom = computed(() => (currentPage.value - 1) * perPage + 1)
  const showingTo = computed(() =>
    Math.min(currentPage.value * perPage, dataRef.value?.length || 0),
  )

  const totalItems = computed(() => dataRef.value?.length || 0)

  function goToPage(page) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function prevPage() {
    if (currentPage.value > 1) currentPage.value--
  }

  function resetPage() {
    currentPage.value = 1
  }

  return {
    currentPage,
    totalPages,
    paginatedData,
    showingFrom,
    showingTo,
    totalItems,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    perPage,
  }
}
