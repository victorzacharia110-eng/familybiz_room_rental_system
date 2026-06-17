<script setup>
import { ref, watch, onMounted } from 'vue'
import { useFootballStore } from '@/stores/football'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  active: Boolean,
})

const emit = defineEmits(['close'])

const footballStore = useFootballStore()
const refreshing = ref(false)

// Tabs configuration
const tabs = [
  { id: 'live', label: 'Live', icon: '⚡' },
  { id: 'fixtures', label: 'Fixtures', icon: '📅' },
  { id: 'standings', label: 'Standings', icon: '🏆' },
  { id: 'scorers', label: 'Top Scorers', icon: '⚽' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
]

const activeTab = ref('live')
const selectedDate = ref(new Date().toISOString().split('T')[0])

// Helper functions for data extraction (adjust based on SportMonks response structure)
const getTeamName = (match, side) => {
  if (!match || !match.participants) return 'TBD'
  const participant = match.participants[side === 'home' ? 0 : 1]
  return participant?.name || 'TBD'
}

const getScore = (match, side) => {
  if (!match || !match.scores) return '0'
  const score = match.scores[side === 'home' ? 'home' : 'away']
  return score || '0'
}

const getLeagueName = (match) => {
  return match?.league?.name || 'Unknown League'
}

const getVenue = (match) => {
  return match?.venue?.name || 'TBD'
}

const getParticipantName = (standing) => {
  return standing?.participant?.name || 'Unknown'
}

const getElapsed = (match) => {
  return match?.time?.elapsed || match?.timer?.elapsed || null
}

const getProgress = (match) => {
  const elapsed = getElapsed(match)
  if (!elapsed) return 0
  return Math.min((elapsed / 90) * 100, 100)
}

const formatTime = (timestamp) => {
  if (!timestamp) return 'TBD'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

// Methods
const close = () => {
  emit('close')
}

const switchTab = async (tabId) => {
  activeTab.value = tabId
  await loadTabData(tabId)
}

const loadTabData = async (tabId) => {
  switch (tabId) {
    case 'live':
      await footballStore.fetchLiveMatches()
      break
    case 'fixtures':
      await footballStore.fetchFixtures(selectedDate.value)
      break
    case 'standings':
      await footballStore.fetchStandings()
      break
    case 'scorers':
      await footballStore.fetchTopScorers()
      break
  }
}

const loadFixtures = async () => {
  await footballStore.fetchFixtures(selectedDate.value)
}

const refreshData = async () => {
  refreshing.value = true
  await loadTabData(activeTab.value)
  refreshing.value = false
}

const viewMatch = (fixtureId) => {
  // Navigate to match details or open a details modal
  console.log('View match:', fixtureId)
  // You can implement a match details modal or route
  // router.push(`/tenant/match/${fixtureId}`)
}

const viewTeam = (teamId) => {
  console.log('View team:', teamId)
  // Navigate to team details
  // router.push(`/tenant/team/${teamId}`)
}

// Watch for tab changes
watch(activeTab, async (newTab) => {
  await loadTabData(newTab)
})

// Load initial data when modal opens
watch(() => props.active, async (isActive) => {
  if (isActive) {
    await loadTabData(activeTab.value)
  }
})

onMounted(async () => {
  // Initial load when component mounts
  await loadTabData('live')
})
</script>


<template>
  <Transition name="modal-fade">
    <div v-if="active" class="modal-overlay" @click.self="close">
      <div class="glass-modal entertainment-modal large">
        <!-- Header -->
        <div class="modal-top">
          <h3><font-awesome-icon icon="tv" /> Entertainment Hub</h3>
          <button class="close-x" @click="close">
            <font-awesome-icon icon="xmark" />
          </button>
        </div>

        <!-- Tabs -->
        <div class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab-btn"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <span class="tab-icon">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Content -->
        <div class="modal-body">
          <!-- Loading State -->
          <div v-if="footballStore.loading" class="loading-state">
            <font-awesome-icon icon="spinner" spin />
            <span>Loading...</span>
          </div>

          <!-- Error State -->
          <div v-else-if="footballStore.error" class="error-state">
            <font-awesome-icon icon="triangle-exclamation" />
            <span>{{ footballStore.error }}</span>
          </div>

          <!-- Live Football Tab -->
          <div v-else-if="activeTab === 'live'" class="tab-content">
            <div v-if="!footballStore.hasLiveMatches" class="no-data">
              <font-awesome-icon icon="futbol" />
              <p>No live matches at the moment</p>
            </div>
            <div
              v-for="match in footballStore.liveMatches"
              :key="match.id"
              class="match-card"
              @click="viewMatch(match.id)"
            >
              <div class="match-teams">
                <span class="team home">
                  {{ getTeamName(match, 'home') }}
                </span>
                <span class="score">
                  {{ getScore(match, 'home') }} - {{ getScore(match, 'away') }}
                </span>
                <span class="team away">
                  {{ getTeamName(match, 'away') }}
                </span>
              </div>
              <div class="match-info">
                <span class="league">{{ getLeagueName(match) }}</span>
                <span class="status live">
                  <span class="live-dot"></span>
                  Live
                </span>
              </div>
              <div class="match-progress" v-if="getElapsed(match)">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: getProgress(match) + '%' }"></div>
                </div>
                <span class="elapsed">{{ getElapsed(match) }}'</span>
              </div>
            </div>
          </div>

          <!-- Fixtures Tab -->
          <div v-else-if="activeTab === 'fixtures'" class="tab-content">
            <div class="date-selector">
              <input type="date" v-model="selectedDate" @change="loadFixtures" />
              <button class="btn-teal" @click="loadFixtures">
                <font-awesome-icon icon="search" /> Load
              </button>
            </div>
            <div v-if="!footballStore.hasFixtures" class="no-data">
              <font-awesome-icon icon="calendar-alt" />
              <p>No fixtures for this date</p>
            </div>
            <div
              v-for="fixture in footballStore.fixtures"
              :key="fixture.id"
              class="fixture-card"
              @click="viewMatch(fixture.id)"
            >
              <div class="match-teams">
                <span class="team">{{ getTeamName(fixture, 'home') }}</span>
                <span class="vs">vs</span>
                <span class="team">{{ getTeamName(fixture, 'away') }}</span>
              </div>
              <div class="match-info">
                <span class="time">{{ formatTime(fixture.starting_at) }}</span>
                <span class="venue">{{ getVenue(fixture) }}</span>
                <span class="league">{{ getLeagueName(fixture) }}</span>
              </div>
            </div>
          </div>

          <!-- Standings Tab -->
          <div v-else-if="activeTab === 'standings'" class="tab-content">
            <div v-if="!footballStore.hasStandings" class="no-data">
              <font-awesome-icon icon="trophy" />
              <p>No standings available</p>
            </div>
            <div class="standings-container">
              <div class="standings-header">
                <span class="pos">#</span>
                <span class="team-name">Team</span>
                <span class="stat">P</span>
                <span class="stat">W</span>
                <span class="stat">D</span>
                <span class="stat">L</span>
                <span class="stat pts">Pts</span>
              </div>
              <div
                v-for="(standing, index) in footballStore.standings"
                :key="standing.id"
                class="standings-row"
                :class="{
                  'top-four': index < 4,
                  'relegation': index >= footballStore.standings.length - 2,
                }"
                @click="viewTeam(standing.participant_id)"
              >
                <span class="pos">{{ index + 1 }}</span>
                <span class="team-name">{{ getParticipantName(standing) }}</span>
                <span class="stat">{{ standing.played || 0 }}</span>
                <span class="stat">{{ standing.won || 0 }}</span>
                <span class="stat">{{ standing.drawn || 0 }}</span>
                <span class="stat">{{ standing.lost || 0 }}</span>
                <span class="stat pts"><strong>{{ standing.points || 0 }}</strong></span>
              </div>
            </div>
          </div>

          <!-- Top Scorers Tab -->
          <div v-else-if="activeTab === 'scorers'" class="tab-content">
            <div v-if="!footballStore.topScorers.length" class="no-data">
              <font-awesome-icon icon="futbol" />
              <p>No top scorers data</p>
            </div>
            <div
              v-for="(scorer, index) in footballStore.topScorers"
              :key="scorer.id"
              class="scorer-card"
            >
              <span class="scorer-rank">{{ index + 1 }}</span>
              <span class="scorer-name">{{ scorer.participant?.name || 'Unknown' }}</span>
              <span class="scorer-team">{{ scorer.team?.name || 'Unknown' }}</span>
              <span class="scorer-goals">{{ scorer.goals || 0 }} ⚽</span>
            </div>
          </div>

          <!-- Movies Tab (Coming Soon) -->
          <div v-else-if="activeTab === 'movies'" class="tab-content">
            <div class="coming-soon">
              <font-awesome-icon icon="film" class="coming-icon" />
              <h4>🎬 Movies Coming Soon</h4>
              <p>We're working on bringing you the best movies</p>
              <div class="coming-features">
                <span>🎥 Latest Releases</span>
                <span>⭐ Top Rated</span>
                <span>🎭 Genres</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="modal-footer">
          <button class="btn-ghost" @click="close">
            <font-awesome-icon icon="xmark" /> Close
          </button>
          <button class="btn-teal" @click="refreshData">
            <font-awesome-icon icon="sync" :spin="refreshing" /> Refresh
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>



<style scoped>
.entertainment-modal {
  max-width: 900px;
  width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.modal-top {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
  overflow-x: auto;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
  font-family: inherit;
  white-space: nowrap;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

.tab-btn.active {
  background: rgba(20, 184, 166, 0.15);
  color: #14b8a6;
}

.tab-icon {
  margin-right: 6px;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-shrink: 0;
}

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 0;
  font-size: 14px;
}

.loading-state {
  color: rgba(255, 255, 255, 0.6);
}

.error-state {
  color: #f87171;
}

.error-state svg {
  font-size: 20px;
}

/* Match Cards */
.match-card,
.fixture-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.match-card:hover,
.fixture-card:hover {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.3);
  transform: translateY(-2px);
}

.match-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
  font-weight: 600;
}

.team {
  flex: 1;
}

.team.home {
  text-align: right;
  margin-right: 12px;
}

.team.away {
  text-align: left;
  margin-left: 12px;
}

.score {
  font-size: 22px;
  font-weight: 900;
  color: #14b8a6;
  padding: 0 16px;
  flex-shrink: 0;
}

.vs {
  padding: 0 12px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

.match-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  flex-wrap: wrap;
  gap: 8px;
}

.status.live {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ef4444;
  font-weight: 700;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ef4444;
  animation: pulse-dot 1s ease-in-out infinite;
}

@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(0.7); }
}

.match-progress {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #14b8a6, #0f766e);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.elapsed {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  flex-shrink: 0;
}

/* Date Selector */
.date-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.date-selector input {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
  font-size: 13px;
  font-family: inherit;
  outline: none;
}

.date-selector input:focus {
  border-color: #14b8a6;
}

/* Standings */
.standings-container {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.standings-header {
  display: grid;
  grid-template-columns: 40px 1fr 30px 30px 30px 30px 40px;
  padding: 10px 16px;
  background: rgba(20, 184, 166, 0.08);
  font-size: 11px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.standings-row {
  display: grid;
  grid-template-columns: 40px 1fr 30px 30px 30px 30px 40px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  align-items: center;
}

.standings-row:hover {
  background: rgba(20, 184, 166, 0.06);
}

.standings-row.top-four {
  background: rgba(20, 184, 166, 0.04);
}

.standings-row.relegation {
  background: rgba(239, 68, 68, 0.04);
}

.standings-row .pos {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.4);
}

.standings-row .team-name {
  font-weight: 600;
}

.standings-row .stat {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.standings-row .stat.pts {
  color: #14b8a6;
}

/* Top Scorers */
.scorer-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.2s;
}

.scorer-card:hover {
  background: rgba(20, 184, 166, 0.06);
  border-color: rgba(20, 184, 166, 0.2);
}

.scorer-rank {
  font-weight: 700;
  color: rgba(255, 255, 255, 0.3);
  min-width: 30px;
}

.scorer-name {
  flex: 1;
  font-weight: 600;
}

.scorer-team {
  color: rgba(255, 255, 255, 0.5);
  font-size: 13px;
}

.scorer-goals {
  font-weight: 700;
  color: #fbbf24;
  font-size: 16px;
}

/* Coming Soon */
.coming-soon {
  text-align: center;
  padding: 40px 20px;
}

.coming-icon {
  font-size: 48px;
  color: rgba(20, 184, 166, 0.3);
  margin-bottom: 16px;
}

.coming-soon h4 {
  font-size: 24px;
  margin-bottom: 8px;
  color: #fff;
}

.coming-soon p {
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 24px;
}

.coming-features {
  display: flex;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.coming-features span {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}

/* No Data */
.no-data {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.no-data svg {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.no-data p {
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .entertainment-modal {
    max-width: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .tabs {
    padding: 8px 12px;
  }

  .tab-btn {
    font-size: 12px;
    padding: 6px 12px;
  }

  .modal-body {
    padding: 16px;
  }

  .match-teams {
    font-size: 14px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .team {
    flex: 0 1 auto;
    font-size: 13px;
  }

  .team.home {
    text-align: left;
    margin-right: 0;
  }

  .team.away {
    text-align: left;
    margin-left: 0;
  }

  .score {
    font-size: 18px;
    padding: 0 8px;
  }

  .standings-header,
  .standings-row {
    grid-template-columns: 30px 1fr 25px 25px 25px 25px 30px;
    font-size: 12px;
    padding: 8px 12px;
  }

  .scorer-card {
    flex-wrap: wrap;
    gap: 8px;
  }

  .modal-footer {
    padding: 12px 16px;
  }

  .date-selector {
    flex-direction: column;
  }

  .date-selector input {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .tabs {
    gap: 2px;
  }

  .tab-btn {
    font-size: 11px;
    padding: 4px 10px;
  }

  .tab-icon {
    margin-right: 4px;
  }

  .standings-header,
  .standings-row {
    grid-template-columns: 25px 1fr 20px 20px 20px 20px 25px;
    font-size: 11px;
    padding: 6px 8px;
  }

  .match-card,
  .fixture-card {
    padding: 12px 14px;
  }
}
</style>