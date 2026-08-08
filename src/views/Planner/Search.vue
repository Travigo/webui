<template>
  <div class="ui-page">
    <main class="mx-auto max-w-6xl space-y-4">
      <header class="ui-panel p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <router-link :to="editRoute" class="mb-3 inline-flex min-h-10 items-center gap-1 rounded-xl bg-slate-100 px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
              <span class="material-symbols-outlined text-[18px]">arrow_back</span>
              Edit journey
            </router-link>
            <div class="flex min-w-0 items-center gap-2 text-lg font-black tracking-tight text-slate-950 dark:text-slate-100 sm:text-2xl">
              <span class="truncate">{{ originName }}</span>
              <span class="material-symbols-outlined shrink-0 text-brand-blue dark:text-brand-blue-light">arrow_forward</span>
              <span class="truncate">{{ destinationName }}</span>
            </div>
            <p class="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">{{ searchDescription }}</p>
          </div>
          <button
            type="button"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue transition hover:bg-brand-blue/20 disabled:opacity-60 dark:bg-brand-blue/100/10 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/20"
            :disabled="loadingResults"
            aria-label="Refresh journey results"
            @click="getJourneyPlan"
          >
            <span class="material-symbols-outlined text-[22px]" :class="{ 'animate-spin': loadingResults }">refresh</span>
          </button>
        </div>
      </header>

      <div class="grid items-start gap-4 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside class="ui-panel p-4 lg:sticky lg:top-4">
          <h2 class="text-sm font-black text-slate-950 dark:text-slate-100">Your search</h2>
          <dl class="mt-3 space-y-3 text-sm">
            <div class="flex gap-2">
              <span class="material-symbols-outlined mt-0.5 text-[18px] text-brand-blue dark:text-brand-blue-light">schedule</span>
              <div><dt class="sr-only">When</dt><dd class="font-bold text-slate-700 dark:text-slate-200">{{ searchDescription }}</dd></div>
            </div>
            <div class="flex gap-2">
              <span class="material-symbols-outlined mt-0.5 text-[18px] text-slate-400">sync_alt</span>
              <div><dt class="sr-only">Maximum changes</dt><dd class="font-semibold text-slate-600 dark:text-slate-300">{{ preferenceSummary }}</dd></div>
            </div>
          </dl>
          <router-link :to="editRoute" class="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Change search
          </router-link>
        </aside>

        <section class="ui-panel min-w-0" aria-labelledby="journey-results-heading">
          <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h1 id="journey-results-heading" class="text-base font-black text-slate-950 dark:text-slate-100">Journey options</h1>
                <p class="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">{{ resultsStatus }}</p>
              </div>
              <button v-if="loadingResults" type="button" class="min-h-11 rounded-xl px-3 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800" @click="cancelSearch">Cancel</button>
            </div>

            <div v-if="!loadingResults && journeyPlans.length > 1" class="mt-3 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800" role="tablist" aria-label="Sort journeys">
              <button
                v-for="option in sortOptions"
                :key="option.value"
                type="button"
                role="tab"
                :aria-selected="sortMode === option.value"
                class="min-h-10 shrink-0 rounded-lg px-3 text-xs font-bold transition sm:flex-1"
                :class="sortMode === option.value ? 'bg-white text-brand-blue shadow-sm dark:bg-slate-950 dark:text-brand-blue-light' : 'text-slate-500 dark:text-slate-400'"
                @click="sortMode = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div v-if="loadingResults" class="p-4 sm:p-5" role="status">
            <LoadingState title="Finding journeys" :subtitle="loadingSubtitle" compact :rows="4" :show-tabs="false" />
            <div class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-blue/10 px-3 py-2 text-xs font-semibold text-brand-blue-dark dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
              <span>{{ slowSearch ? 'This search is taking longer than usual. You can keep waiting or edit it.' : 'Checking live and scheduled services…' }}</span>
              <router-link :to="editRoute" class="min-h-10 rounded-lg px-2.5 py-2 font-bold hover:bg-brand-blue/20 dark:hover:bg-brand-blue/100/10">Edit search</router-link>
            </div>
          </div>

          <div v-else-if="error !== undefined" class="p-4 sm:p-5">
            <div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <p class="font-black">Journeys unavailable</p>
              <p class="mt-1">{{ errorMessage }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="min-h-11 rounded-xl bg-amber-100 px-3 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="getJourneyPlan">Try this search again</button>
                <router-link :to="editRoute" class="inline-flex min-h-11 items-center rounded-xl px-3 font-bold">Edit search</router-link>
              </div>
            </div>
          </div>

          <div v-else-if="searchTruncated && journeyPlans.length === 0" class="p-4 sm:p-5">
            <div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <p class="font-black">Search took too long</p>
              <p class="mt-1">We could not finish checking every route, so this does not mean that no journey is possible.</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="min-h-11 rounded-xl bg-amber-100 px-3 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="getJourneyPlan">Try this search again</button>
                <router-link :to="editRoute" class="inline-flex min-h-11 items-center rounded-xl px-3 font-bold">Edit search</router-link>
              </div>
            </div>
          </div>

          <div v-else-if="journeyPlans.length === 0" class="p-4 sm:p-5">
            <div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
              <p class="font-black">No journeys found</p>
              <p class="mt-1">Try a later time, allow more changes, or increase the walking distance.</p>
              <router-link :to="editRoute" class="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-100 px-3 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100">Change search</router-link>
            </div>
          </div>

          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <div v-if="searchTruncated" class="bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">
              Showing the journeys found before this search reached its limit.
            </div>
            <template v-for="(journeyPlan, index) in sortedJourneyPlans" :key="journeyPlanKey(journeyPlan, index)">
              <div v-if="departureDayChange(index)" class="bg-slate-50 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:bg-slate-950/40 dark:text-slate-500 sm:px-5">
                {{ formatDay(journeyPlan.StartTime) }}
              </div>

              <button
                type="button"
                class="group block w-full bg-white p-4 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-blue dark:bg-slate-900 dark:hover:bg-slate-800/60 sm:p-5"
                @click="selectJourneyPlan(journeyPlan)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex min-w-0 flex-wrap items-center gap-2">
                    <span v-if="recommendationLabel(journeyPlan)" class="ui-status bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">{{ recommendationLabel(journeyPlan) }}</span>
                    <span class="ui-status bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <span class="h-1.5 w-1.5 rounded-full" :class="statusLabel(journeyPlan) === 'Live' ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                      {{ statusLabel(journeyPlan) }}
                    </span>
                    <span v-if="countdownLabel(journeyPlan.StartTime)" class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ countdownLabel(journeyPlan.StartTime) }}</span>
                  </div>
                  <span class="material-symbols-outlined shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-blue">chevron_right</span>
                </div>

                <div class="mt-3 grid grid-cols-[auto_minmax(4rem,1fr)_auto] items-center gap-3">
                  <div>
                    <p class="text-2xl font-black leading-none text-slate-950 dark:text-slate-100">{{ formatTime(journeyPlan.StartTime, originTimezone) }}</p>
                    <p class="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{{ shortPlaceName(originName) }}</p>
                  </div>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
                      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
                        <span class="material-symbols-outlined text-[20px]">{{ transportIcon(primaryMode(journeyPlan)) }}</span>
                      </span>
                      <span class="h-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
                    </div>
                    <p class="mt-1 text-center text-xs font-bold text-slate-500 dark:text-slate-400">{{ formatDuration(journeyPlan.Duration) || calculatedDuration(journeyPlan) }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-black leading-none text-slate-950 dark:text-slate-100">{{ formatTime(journeyPlan.ArrivalTime, destinationTimezone) }}</p>
                    <p class="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{{ shortPlaceName(destinationName) }}</p>
                  </div>
                </div>

                <div class="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined mt-0.5 text-[20px] text-slate-400">{{ transportIcon(primaryMode(journeyPlan)) }}</span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-black text-slate-900 dark:text-slate-100">{{ serviceSummary(journeyPlan) }}</p>
                      <p class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ itinerarySummary(journeyPlan) }}</p>
                    </div>
                    <span class="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ transfersLabel(journeyPlan) }}</span>
                  </div>
                </div>
              </button>
            </template>
          </div>
        </section>
      </div>
    </main>

    <Modal
      v-model:open="journeyPlanModalOpen"
      title="Journey itinerary"
      :subtitle="selectedJourneyPlanSubtitle"
      icon="route"
      size="lg"
      close-label="Close journey itinerary"
      body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
      @close="selectedJourneyPlan = undefined"
    >
      <div v-if="selectedJourneyPlan" class="space-y-4">
        <div class="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <div><p class="text-xs font-bold uppercase text-slate-500">Depart</p><p class="mt-1 text-lg font-black">{{ formatTime(selectedJourneyPlan.StartTime, originTimezone) }}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-500">Arrive</p><p class="mt-1 text-lg font-black">{{ formatTime(selectedJourneyPlan.ArrivalTime, destinationTimezone) }}</p></div>
          <div><p class="text-xs font-bold uppercase text-slate-500">Changes</p><p class="mt-1 text-lg font-black">{{ transferCount(selectedJourneyPlan) }}</p></div>
        </div>

        <ol class="space-y-3">
          <li v-for="(step, index) in selectedJourneySteps" :key="step.key" class="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3">
            <div class="relative flex justify-center">
              <span v-if="index < selectedJourneySteps.length - 1" class="absolute top-10 h-[calc(100%+0.75rem)] w-px bg-slate-200 dark:bg-slate-700"></span>
              <span class="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl" :class="step.isTransfer ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200' : 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'">
                <span class="material-symbols-outlined text-[21px]">{{ step.icon }}</span>
              </span>
            </div>
            <article class="min-w-0 rounded-xl border p-3" :class="step.isTransfer ? 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/10' : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="text-sm font-black text-slate-950 dark:text-slate-100">{{ step.title }}</h3>
                  <p v-if="step.subtitle" class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ step.subtitle }}</p>
                </div>
                <div class="shrink-0 text-right"><p class="text-sm font-black">{{ step.startTime }}</p><p v-if="step.arrivalTime !== '--'" class="mt-0.5 text-xs font-bold text-slate-500">{{ step.arrivalTime }}</p></div>
              </div>
              <div v-if="step.chips.length" class="mt-3 flex flex-wrap gap-2">
                <span v-for="chip in step.chips" :key="chip" class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{{ chip }}</span>
              </div>
              <router-link v-if="step.journeyId" :to="step.journeyRoute" class="mt-3 inline-flex min-h-11 items-center gap-1 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white" @click="closeJourneyPlanModal">
                View this service <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </router-link>
            </article>
          </li>
        </ol>
      </div>
    </Modal>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import axios from 'axios'
import API from '@/API'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import Pretty from '@/pretty'

export default {
  name: 'JourneyPlannerSearch',
  components: { LoadingState, Modal },
  data () {
    return {
      results: {},
      loadingResults: true,
      error: undefined,
      selectedJourneyPlan: undefined,
      journeyPlanModalOpen: false,
      stopNameCache: {},
      sortMode: 'recommended',
      currentTime: Date.now(),
      searchStartedAt: 0,
      requestController: undefined,
      requestToken: 0,
      clockTimer: undefined,
      sortOptions: [
        { value: 'recommended', label: 'Recommended' },
        { value: 'arrival', label: 'Earliest arrival' },
        { value: 'changes', label: 'Fewest changes' }
      ]
    }
  },
  computed: {
    journeyPlans() {
      const resultSet = [
        this.results?.JourneyPlans, this.results?.journeyPlans, this.results?.Plans, this.results?.plans,
        this.results?.data?.JourneyPlans, this.results?.data?.journeyPlans,
        this.results?.Data?.JourneyPlans, this.results?.Data?.journeyPlans, this.results
      ].find(result => Array.isArray(result))
      return resultSet || []
    },
    searchTruncated() {
      return Boolean(this.results?.SearchTruncated || this.results?.searchTruncated || this.results?.data?.SearchTruncated || this.results?.data?.searchTruncated)
    },
    sortedJourneyPlans() {
      const plans = [...this.journeyPlans]
      if (this.sortMode === 'arrival') return plans.sort((a, b) => this.timestamp(a.ArrivalTime) - this.timestamp(b.ArrivalTime))
      if (this.sortMode === 'changes') return plans.sort((a, b) => this.transferCount(a) - this.transferCount(b) || this.timestamp(a.ArrivalTime) - this.timestamp(b.ArrivalTime))
      return plans.sort((a, b) => this.recommendationScore(a) - this.recommendationScore(b))
    },
    originName() {
      return this.stopName(this.results?.OriginStop || this.results?.originStop) ||
        this.queryValue(this.$route.query.originName) ||
        (this.queryValue(this.$route.query.originType) === 'location' ? 'Current location' : 'Origin')
    },
    destinationName() {
      return this.stopName(this.results?.DestinationStop || this.results?.destinationStop) || this.queryValue(this.$route.query.destinationName) || 'Destination'
    },
    originTimezone() {
      return (this.results?.OriginStop || this.results?.originStop)?.Timezone || this.primaryJourney(this.journeyPlans[0])?.DepartureTimezone || this.queryValue(this.$route.query.originTimezone) || 'UTC'
    },
    destinationTimezone() {
      return (this.results?.DestinationStop || this.results?.destinationStop)?.Timezone || this.queryValue(this.$route.query.destinationTimezone) || this.originTimezone
    },
    searchDescription() {
      const datetime = this.queryValue(this.$route.query.datetime)
      if (!datetime) return 'Leaving now'
      const date = DateTime.fromISO(datetime).setZone(this.originTimezone)
      return date.isValid ? `Depart ${date.toLocaleString({ weekday: 'short', day: 'numeric', month: 'short' })} at ${date.toFormat('HH:mm')}` : 'Selected departure time'
    },
    preferenceSummary() {
      const changes = Number(this.queryValue(this.$route.query.maxChanges) || 3)
      const walking = Number(this.queryValue(this.$route.query.maxWalking) || 1000)
      return `${changes === 0 ? 'Direct only' : `Up to ${changes} change${changes === 1 ? '' : 's'}`} · ${walking >= 1000 ? `${walking / 1000} km` : `${walking} m`} walk`
    },
    editRoute() {
      return { name: 'journeyplanner/home', query: { ...this.$route.query } }
    },
    selectedJourneySteps() {
      return this.routeItems(this.selectedJourneyPlan).map((item, index) => this.normaliseStep(item, index))
    },
    selectedJourneyPlanSubtitle() {
      if (!this.selectedJourneyPlan) return ''
      return `${this.formatTime(this.selectedJourneyPlan.StartTime, this.originTimezone)}–${this.formatTime(this.selectedJourneyPlan.ArrivalTime, this.destinationTimezone)} · ${this.transfersLabel(this.selectedJourneyPlan)}`
    },
    errorMessage() {
      if (typeof this.error === 'string') return this.error
      if (this.error?.response?.status === 404) return 'The planner could not find one of these stops.'
      if (this.error?.code === 'ECONNABORTED') return 'The search timed out. Your route is still here, so you can try it again.'
      return this.error?.message || 'Journey results could not be loaded.'
    },
    resultsStatus() {
      if (this.loadingResults) return 'Searching live and scheduled services…'
      if (this.error !== undefined) return 'Results could not be loaded'
      return `${this.journeyPlans.length} option${this.journeyPlans.length === 1 ? '' : 's'} found`
    },
    slowSearch() {
      return this.loadingResults && this.currentTime - this.searchStartedAt > 4000
    },
    loadingSubtitle() {
      return this.slowSearch ? 'Still checking connections and live services.' : `${this.originName} to ${this.destinationName}`
    },
    fastestDuration() {
      return Math.min(...this.journeyPlans.map(plan => this.durationMilliseconds(plan)).filter(Number.isFinite))
    },
    earliestArrival() {
      return Math.min(...this.journeyPlans.map(plan => this.timestamp(plan.ArrivalTime)).filter(Number.isFinite))
    },
    fewestChanges() {
      return Math.min(...this.journeyPlans.map(plan => this.transferCount(plan)))
    }
  },
  watch: {
    '$route.fullPath'() {
      this.getJourneyPlan()
    }
  },
  mounted() {
    this.clockTimer = window.setInterval(() => { this.currentTime = Date.now() }, 30000)
    this.getJourneyPlan()
  },
  beforeUnmount() {
    this.requestController?.abort()
    window.clearInterval(this.clockTimer)
  },
  methods: {
    queryValue(value) { return Array.isArray(value) ? value[0] : value || '' },
    timestamp(value) { const result = Date.parse(value); return Number.isFinite(result) ? result : Number.POSITIVE_INFINITY },
    journeyPlanKey(plan, index) { return plan.PrimaryIdentifier || plan.Identifier || `${plan.StartTime || 'start'}-${plan.ArrivalTime || 'arrival'}-${index}` },
    routeItems(plan) {
      return [plan?.RouteItems, plan?.routeItems, plan?.Steps, plan?.steps, plan?.Legs, plan?.legs].find(Array.isArray) || []
    },
    rawItemJourney(item) { return item?.Journey || item?.journey || item?.RealtimeJourney || item?.realtimeJourney || null },
    itemJourney(item) {
      return this.rawItemJourney(item)
    },
    journeyLegs(plan) { return this.routeItems(plan).filter(item => this.itemJourney(item)) },
    primaryRouteItem(plan) { return this.journeyLegs(plan)[0] || this.routeItems(plan)[0] },
    primaryJourney(plan) { return this.itemJourney(this.primaryRouteItem(plan)) },
    isTransferItem(item) { return String(item?.Type || item?.type || '').toLowerCase() === 'transfer' },
    transportTypeForItem(item) {
      const journey = this.itemJourney(item)
      if (this.isTransferItem(item)) return item?.TransferType || item?.transferType || 'Transfer'
      return journey?.Service?.TransportType || item?.Service?.TransportType || item?.TransportType || item?.transportType || ''
    },
    primaryMode(plan) {
      const item = this.primaryRouteItem(plan)
      const explicitType = this.transportTypeForItem(item)
      if (explicitType) return explicitType
      const identifier = this.journeyIdentifier(this.itemJourney(item)).toLowerCase()
      if (identifier.includes('rail')) return 'Rail'
      if (identifier.includes('bus')) return 'Bus'
      if (identifier.includes('tram')) return 'Tram'
      if (identifier.includes('metro') || identifier.includes('tube')) return 'Metro'
      return 'Journey'
    },
    transportIcon(type) {
      return { Rail: 'train', Train: 'train', Bus: 'directions_bus', Coach: 'airport_shuttle', Tram: 'tram', Metro: 'subway', Ferry: 'directions_boat', Air: 'flight', Walk: 'directions_walk', Walking: 'directions_walk', Transfer: 'sync_alt', Interchange: 'sync_alt', Connection: 'sync_alt', Wait: 'schedule', Waiting: 'schedule' }[type] || 'route'
    },
    statusLabel(plan) {
      const items = this.journeyLegs(plan)
      return items.some(item => this.itemJourney(item)?.RealtimeJourney || /realtime/i.test(String(item?.JourneyType || item?.journeyType || ''))) ? 'Live' : 'Scheduled'
    },
    transferCount(plan) { return Math.max(this.journeyLegs(plan).length - 1, 0) },
    transfersLabel(plan) { const count = this.transferCount(plan); return count === 0 ? 'Direct' : `${count} change${count === 1 ? '' : 's'}` },
    serviceName(item) {
      const journey = this.itemJourney(item)
      const service = journey?.Service || item?.Service || {}
      const operator = this.operatorName(item)
      const mode = this.transportTypeForItem(item)
      return service.ServiceName || service.PrimaryName || service.Name || (operator && mode ? `${operator} ${mode.toLowerCase()}` : '') || mode || 'Service'
    },
    operatorName(item) {
      const journey = this.itemJourney(item)
      return journey?.Operator?.PrimaryName || item?.Operator?.PrimaryName || journey?.Service?.OperatorName || ''
    },
    serviceSummary(plan) {
      const labels = this.journeyLegs(plan).map(item => this.serviceName(item)).filter(Boolean)
      const summary = [...new Set(labels)].join(' + ')
      return summary === 'Service' ? `${this.primaryMode(plan)} service` : summary || `${this.primaryMode(plan)} service`
    },
    itinerarySummary(plan) {
      const changes = this.routeItems(plan).filter(item => this.isTransferItem(item)).map(item => this.routeItemStopName(item, 'origin') || this.routeItemStopName(item, 'destination')).filter(Boolean)
      const operator = this.operatorName(this.primaryRouteItem(plan))
      if (changes.length) return `Change at ${[...new Set(changes)].join(', ')}${operator ? ` · ${operator}` : ''}`
      return operator ? `${this.primaryMode(plan)} · ${operator}` : `${this.primaryMode(plan)} service`
    },
    durationMilliseconds(plan) {
      if (typeof plan?.Duration === 'number') return plan.Duration / 1000000
      const duration = this.timestamp(plan?.ArrivalTime) - this.timestamp(plan?.StartTime)
      return Number.isFinite(duration) ? duration : Number.POSITIVE_INFINITY
    },
    recommendationScore(plan) {
      return this.timestamp(plan.ArrivalTime) + this.transferCount(plan) * 12 * 60 * 1000
    },
    recommendationLabel(plan) {
      if (this.journeyPlans.length < 2) return ''
      if (this.durationMilliseconds(plan) === this.fastestDuration) return 'Fastest'
      if (this.transferCount(plan) === this.fewestChanges && this.fewestChanges < Math.max(...this.journeyPlans.map(item => this.transferCount(item)))) return 'Fewest changes'
      if (this.timestamp(plan.ArrivalTime) === this.earliestArrival) return 'Earliest arrival'
      return ''
    },
    countdownLabel(value) {
      const minutes = Math.round((this.timestamp(value) - this.currentTime) / 60000)
      if (!Number.isFinite(minutes) || minutes < -1 || minutes > 180) return ''
      if (minutes <= 0) return 'Leaving now'
      return `Leaves in ${minutes} min`
    },
    formatTime(value, timezone) { return value ? Pretty.time(value, timezone || this.originTimezone) : '--' },
    formatDay(value) {
      const date = DateTime.fromISO(value).setZone(this.originTimezone)
      const today = DateTime.now().setZone(this.originTimezone).startOf('day')
      if (date.hasSame(today, 'day')) return 'Today'
      if (date.hasSame(today.plus({ days: 1 }), 'day')) return 'Tomorrow'
      return date.toLocaleString({ weekday: 'long', day: 'numeric', month: 'short' })
    },
    formatDuration(value) {
      if (value === undefined || value === null || value === '') return ''
      if (typeof value === 'string') return value
      return Pretty.duration(value)
    },
    calculatedDuration(plan) {
      const minutes = Math.max(1, Math.round(this.durationMilliseconds(plan) / 60000))
      return minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`
    },
    formatSeconds(value) {
      if (!value) return ''
      const minutes = Math.max(1, Math.ceil(value / 60))
      return minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `${minutes} min`
    },
    shortPlaceName(name) { return name.length > 22 ? `${name.slice(0, 20)}…` : name },
    itemOriginStop(item) { return item?.OriginStop || item?.originStop || item?.FromStop || item?.fromStop || item?.StartStop || item?.startStop || null },
    itemOriginStopRef(item) { return item?.OriginStopRef || item?.originStopRef || item?.FromStopRef || item?.fromStopRef || item?.StartStopRef || item?.startStopRef || '' },
    itemDestinationStop(item) { return item?.DestinationStop || item?.destinationStop || item?.ToStop || item?.toStop || item?.EndStop || item?.endStop || null },
    itemDestinationStopRef(item) { return item?.DestinationStopRef || item?.destinationStopRef || item?.ToStopRef || item?.toStopRef || item?.EndStopRef || item?.endStopRef || '' },
    stopName(stop) { return stop?.PrimaryName || stop?.primaryName || stop?.Name || stop?.name || stop?.CommonName || stop?.commonName || stop?.DisplayName || stop?.displayName || '' },
    stopIdentifier(stop) { return stop?.PrimaryIdentifier || stop?.primaryIdentifier || stop?.Identifier || stop?.identifier || stop?.ID || stop?.id || '' },
    routeItemStopName(item, direction) {
      const stop = direction === 'origin' ? this.itemOriginStop(item) : this.itemDestinationStop(item)
      const ref = direction === 'origin' ? this.itemOriginStopRef(item) : this.itemDestinationStopRef(item)
      return this.stopName(stop) || this.stopNameCache[ref] || ''
    },
    transferTitle(item) {
      const type = item?.TransferType || item?.transferType
      if (['Interchange', 'Connection'].includes(type)) return 'Change services'
      if (this.hasWalkingTransferData(item) || ['Walking', 'Walk'].includes(type)) return 'Walk to the next service'
      return 'Transfer'
    },
    hasWalkingTransferData(item) { return Boolean(item?.DistanceMetres || item?.distanceMetres || item?.WalkDurationSeconds || item?.walkDurationSeconds) },
    routeItemDuration(item) {
      if (item?.Duration || item?.duration) return this.formatDuration(item.Duration || item.duration)
      return this.formatSeconds(item?.TotalDurationSeconds || item?.totalDurationSeconds || item?.WalkDurationSeconds || item?.walkDurationSeconds || item?.MinChangeDurationSeconds || item?.minChangeDurationSeconds)
    },
    routeItemDistance(item) {
      const metres = item?.DistanceMetres || item?.distanceMetres
      if (!metres) return ''
      return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${metres} m`
    },
    journeyIdentifier(journey) { return journey?.PrimaryIdentifier || journey?.primaryIdentifier || journey?.Identifier || journey?.identifier || journey?.ID || journey?.id || '' },
    journeyRunDate(plan, journey) {
      const timezone = journey?.DepartureTimezone || this.originTimezone
      const date = DateTime.fromISO(plan?.StartTime || journey?.DepartureTime).setZone(timezone)
      return date.isValid ? date.toISODate() : undefined
    },
    journeyRoute(plan, journey) {
      return { name: 'journeys/view', params: { id: this.journeyIdentifier(journey) }, query: { date: this.journeyRunDate(plan, journey) } }
    },
    normaliseStep(item, index) {
      const journey = this.itemJourney(item)
      const isTransfer = this.isTransferItem(item)
      const start = item?.StartTime || item?.DepartureTime || item?.startTime || item?.departureTime || journey?.DepartureTime
      const arrival = item?.ArrivalTime || item?.EndTime || item?.arrivalTime || item?.endTime
      const mode = this.transportTypeForItem(item)
      const origin = this.routeItemStopName(item, 'origin')
      const destination = this.routeItemStopName(item, 'destination')
      const chips = isTransfer
        ? [this.routeItemDistance(item), this.routeItemDuration(item)].filter(Boolean)
        : [mode, this.operatorName(item), this.routeItemDuration(item), this.statusLabel({ RouteItems: [item] })].filter(Boolean)
      return {
        key: item?.PrimaryIdentifier || item?.Identifier || this.journeyIdentifier(journey) || `${index}-${start || ''}`,
        title: isTransfer ? this.transferTitle(item) : this.serviceName(item),
        subtitle: [origin, destination].filter(Boolean).join(' to '),
        isTransfer,
        chips,
        startTime: this.formatTime(start, journey?.DepartureTimezone || this.originTimezone),
        arrivalTime: this.formatTime(arrival, journey?.DepartureTimezone || this.destinationTimezone),
        journeyId: this.journeyIdentifier(journey),
        journeyRoute: journey ? this.journeyRoute(this.selectedJourneyPlan, journey) : undefined,
        icon: this.transportIcon(mode)
      }
    },
    selectJourneyPlan(plan) {
      const legs = this.journeyLegs(plan)
      if (legs.length === 1 && !this.routeItems(plan).some(item => this.isTransferItem(item))) {
        const journey = this.itemJourney(legs[0])
        if (this.journeyIdentifier(journey)) {
          this.$router.push(this.journeyRoute(plan, journey))
          return
        }
      }
      this.selectedJourneyPlan = plan
      this.journeyPlanModalOpen = true
    },
    closeJourneyPlanModal() { this.journeyPlanModalOpen = false; this.selectedJourneyPlan = undefined },
    plannerPathSegment(value) { return encodeURIComponent(value).replace(/%2C/g, ',') },
    plannerRequestParams() {
      const params = {
        count: 5,
        max_changes: Number(this.queryValue(this.$route.query.maxChanges) || 3),
        max_transfer_distance_metres: Number(this.queryValue(this.$route.query.maxWalking) || 1000),
        view: 'web'
      }
      const datetime = this.queryValue(this.$route.query.datetime)
      if (datetime) params.datetime = datetime
      return params
    },
    cancelSearch() {
      this.requestController?.abort()
      this.loadingResults = false
      this.error = 'Search cancelled. Your route and preferences have been kept.'
    },
    getJourneyPlan() {
      const origin = this.queryValue(this.$route.query.origin)
      const destination = this.queryValue(this.$route.query.destination)
      if (!origin || !destination) {
        this.loadingResults = false
        this.error = 'Choose an origin and destination to search for journeys.'
        return
      }
      if (this.queryValue(this.$route.query.originType) !== 'location' && origin === destination) {
        this.loadingResults = false
        this.error = 'Choose two different stops for this journey.'
        return
      }

      this.requestController?.abort()
      this.requestController = new AbortController()
      const token = ++this.requestToken
      this.loadingResults = true
      this.searchStartedAt = Date.now()
      this.currentTime = Date.now()
      this.error = undefined
      this.results = {}
      this.stopNameCache = {}
      this.closeJourneyPlanModal()

      axios.get(`${API.URL}/core/planner/${this.plannerPathSegment(origin)}/${this.plannerPathSegment(destination)}`, {
        params: this.plannerRequestParams(),
        signal: this.requestController.signal,
        timeout: 12000
      }).then(response => {
        if (token !== this.requestToken) return
        this.results = response.data || {}
        this.loadingResults = false
      }).catch(error => {
        if (token !== this.requestToken || axios.isCancel(error) || error?.code === 'ERR_CANCELED') return
        console.log(error)
        this.error = error
        this.loadingResults = false
      })
    },
    departureDayChange(index) {
      const plans = this.sortedJourneyPlans
      if (index === 0) return true
      const previous = DateTime.fromISO(plans[index - 1].StartTime).setZone(this.originTimezone)
      const current = DateTime.fromISO(plans[index].StartTime).setZone(this.originTimezone)
      return !previous.hasSame(current, 'day')
    }
  }
}
</script>
