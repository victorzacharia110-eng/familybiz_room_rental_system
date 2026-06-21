import { ref, computed } from 'vue'
import api from '@/composables/api'
import { defineStore } from 'pinia'

export const useFootballStore = defineStore('football', () => {
  // State
  const liveMatches = ref([])
  const fixtures = ref([])
  const standings = ref([])
  const matchDetails = ref(null)
  const teamDetails = ref(null)
  const topScorers = ref([])
  const footballNews = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Computed
  const hasLiveMatches = computed(() => liveMatches.value.length > 0)
  const hasFixtures = computed(() => fixtures.value.length > 0)
  const hasStandings = computed(() => standings.value.length > 0)

  // Live matches
  const fetchLiveMatches = async () => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/football/live')
      liveMatches.value = response.data.data || []
      return liveMatches.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching live matches:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Fixtures
  const fetchFixtures = async (date = null) => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const url = date ? `/api/football/fixtures?date=${date}` : '/api/football/fixtures'
      const response = await api.get(url)
      fixtures.value = response.data.data || []
      return fixtures.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching fixtures:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Standings
  const fetchStandings = async () => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/football/standings')
      standings.value = response.data.data || []
      return standings.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching standings:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Match details
  const fetchMatchDetails = async (fixtureId) => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get(`/api/football/match/${fixtureId}`)
      matchDetails.value = response.data.data || null
      return matchDetails.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching match details:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Team details
  const fetchTeamDetails = async (teamId) => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get(`/api/football/team/${teamId}`)
      teamDetails.value = response.data.data || null
      return teamDetails.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching team details:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Top scorers
  const fetchTopScorers = async () => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/football/scorers')
      topScorers.value = response.data.data || []
      return topScorers.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching top scorers:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Football News (existing)
  const fetchFootballNews = async () => {
    try {
      loading.value = true
      error.value = null
      await api.get('/sanctum/csrf-cookie')
      const response = await api.get('/api/football/fetch')
      footballNews.value = response.data.footballNews || []
      return footballNews.value
    } catch (err) {
      error.value = err.response?.data?.message || err.message
      console.error('Error fetching football news:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Clear all data
  const clearData = () => {
    liveMatches.value = []
    fixtures.value = []
    standings.value = []
    matchDetails.value = null
    teamDetails.value = null
    topScorers.value = []
    footballNews.value = []
    error.value = null
  }

  return {
    // State
    liveMatches,
    fixtures,
    standings,
    matchDetails,
    teamDetails,
    topScorers,
    footballNews,
    loading,
    error,
    // Computed
    hasLiveMatches,
    hasFixtures,
    hasStandings,
    // Actions
    fetchLiveMatches,
    fetchFixtures,
    fetchStandings,
    fetchMatchDetails,
    fetchTeamDetails,
    fetchTopScorers,
    fetchFootballNews,
    clearData,
  }
})