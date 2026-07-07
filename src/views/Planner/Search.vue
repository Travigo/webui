<template>
  <div class="space-y-4 pb-16 pt-2 sm:pb-20">
    <Alert type="error" class="mt-4" v-if="error !== undefined">{{ errorMessage }}</Alert>

    <PageHeader
      title="Journey results"
      :subtitle="`${originName} to ${destinationName}`"
      icon="route"
    >
      <template #meta>
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
            Journey options
          </span>
        </div>
      </template>

      <template #actions>
        <IconButton
          icon="refresh"
          label="Refresh journey results"
          :disabled="loadingResults"
          :spinning="loadingResults"
          @click="getJourneyPlan()"
        />
      </template>
    </PageHeader>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Available journeys</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ journeyPlans.length }} result{{ journeyPlans.length === 1 ? '' : 's' }}</p>
        </div>
        <router-link
          :to="{ name: 'journeyplanner/home' }"
          class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Edit
          <span class="material-symbols-outlined text-[17px]">edit</span>
        </router-link>
      </div>

      <LoadingState
        v-if="loadingResults"
        title="Loading journeys"
        subtitle="Finding available journeys."
        compact
        :rows="3"
        :show-tabs="false"
      />

      <div v-else-if="journeyPlans.length === 0" class="px-4 py-6">
        <div class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
          No journeys were found.
        </div>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <template
          v-for="(journeyPlan, index) in journeyPlans"
          v-bind:key="journeyPlanKey(journeyPlan, index)"
        >
          <div class="px-4 pt-4 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500" v-if="departureDayChange(index)">
            {{ pretty.day(journeyPlan.StartTime) }}
          </div>

          <button
            type="button"
            class="block w-full px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/70 sm:px-5"
            @click="openJourneyPlanModal(journeyPlan)"
          >
            <div class="grid grid-cols-[1fr_auto] gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <div class="text-center">
                    <div class="text-xl font-extrabold leading-tight text-slate-950 dark:text-slate-100">
                      {{ formatTime(journeyPlan.StartTime) }}
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Depart</div>
                  </div>

                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <span class="h-px min-w-4 flex-1 bg-slate-200 dark:bg-slate-700"></span>
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                      <span class="material-symbols-outlined text-[19px]">{{ transportIcon(transportTypeForItem(primaryRouteItem(journeyPlan))) }}</span>
                    </span>
                    <span class="h-px min-w-4 flex-1 bg-slate-200 dark:bg-slate-700"></span>
                  </div>

                  <div class="text-center">
                    <div class="text-xl font-extrabold leading-tight text-slate-950 dark:text-slate-100">
                      {{ formatTime(journeyPlan.ArrivalTime) }}
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Arrive</div>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                    {{ primaryTransportLabel(journeyPlan) }}
                  </span>
                  <span class="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                    {{ transfersLabel(journeyPlan) }}
                  </span>
                  <span v-if="formatDuration(journeyPlan.Duration)" class="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                    {{ formatDuration(journeyPlan.Duration) }}
                  </span>
                  <span
                    v-if="index === earliestArrivalJourneyID"
                    class="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                  >
                    Earliest
                  </span>
                </div>

                <p class="mt-2 truncate text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {{ journeyPlanSummary(journeyPlan) }}
                </p>
              </div>

              <span class="material-symbols-outlined self-center text-lg text-slate-400">chevron_right</span>
            </div>
          </button>
        </template>
      </div>
    </section>

    <Modal
      v-model:open="journeyPlanModalOpen"
      title="Journey steps"
      :subtitle="selectedJourneyPlanSubtitle"
      icon="route"
      size="lg"
      close-label="Close journey steps"
      body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
      @close="selectedJourneyPlan = undefined"
    >
      <div v-if="selectedJourneyPlan" class="space-y-4">
        <div class="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Depart</p>
            <p class="mt-1 text-lg font-extrabold text-slate-950 dark:text-slate-100">{{ formatTime(selectedJourneyPlan.StartTime) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Arrive</p>
            <p class="mt-1 text-lg font-extrabold text-slate-950 dark:text-slate-100">{{ formatTime(selectedJourneyPlan.ArrivalTime) }}</p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Changes</p>
            <p class="mt-1 text-lg font-extrabold text-slate-950 dark:text-slate-100">{{ transferCount(selectedJourneyPlan) }}</p>
          </div>
        </div>

        <ol v-if="selectedJourneySteps.length > 0" class="space-y-3">
          <li
            v-for="(step, index) in selectedJourneySteps"
            v-bind:key="step.key"
            class="grid grid-cols-[2.5rem_1fr] gap-3"
          >
            <div class="relative flex justify-center">
              <span
                v-if="index < selectedJourneySteps.length - 1"
                class="absolute top-10 h-[calc(100%+0.75rem)] w-px bg-slate-200 dark:bg-slate-700"
              ></span>
              <span
                class="relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm"
                :class="step.journeyId
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200'
                  : step.isTransfer
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300'"
              >
                <span class="material-symbols-outlined text-[22px]">{{ step.icon }}</span>
              </span>
            </div>

            <article
              class="rounded-2xl border p-3 shadow-sm"
              :class="step.isTransfer
                ? 'border-emerald-100 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                : 'border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-950'"
            >
              <div v-if="step.isTransfer" class="flex items-center justify-between gap-3">
                <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ step.title }}</h3>
                <div class="flex shrink-0 flex-wrap justify-end gap-2">
                  <span
                    v-if="step.distanceLabel"
                    class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold text-emerald-800 shadow-sm dark:bg-slate-950/80 dark:text-emerald-200"
                  >
                    <span class="material-symbols-outlined text-[15px]">straighten</span>
                    {{ step.distanceLabel }}
                  </span>
                  <span
                    v-if="step.durationLabel"
                    class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-extrabold text-emerald-800 shadow-sm dark:bg-slate-950/80 dark:text-emerald-200"
                  >
                    <span class="material-symbols-outlined text-[15px]">schedule</span>
                    {{ step.durationLabel }}
                  </span>
                </div>
              </div>

              <div v-else class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ step.title }}</h3>
                  <p v-if="step.subtitle" class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{{ step.subtitle }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <p class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ step.startTime }}</p>
                  <p v-if="step.arrivalTime !== '--'" class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ step.arrivalTime }}</p>
                </div>
              </div>

              <div v-if="step.chips.length > 0" class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span
                  v-for="chip in step.chips"
                  v-bind:key="chip"
                  class="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800"
                >
                  {{ chip }}
                </span>
              </div>

              <router-link
                v-if="step.journeyId"
                :to="{ name: 'journeys/view', params: { id: step.journeyId } }"
                class="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                @click="closeJourneyPlanModal"
              >
                Open journey
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
              </router-link>
            </article>
          </li>
        </ol>

        <div v-else class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
          No step details are available for this journey option.
        </div>
      </div>
    </Modal>
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import IconButton from '@/components/IconButton.vue'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

export default {
  name: 'JourneyPlannerSearch',
  components: {
    Alert,
    IconButton,
    LoadingState,
    Modal,
    PageHeader
  },
  data () {
    return {
      pretty: Pretty,
      results: {},
      loadingResults: true,
      earliestArrivalJourneyID: 0,
      error: undefined,
      selectedJourneyPlan: undefined,
      journeyPlanModalOpen: false,
      stopNameCache: {}
    }
  },
  computed: {
    journeyPlans() {
      const resultSet = [
        this.results?.JourneyPlans,
        this.results?.journeyPlans,
        this.results?.Plans,
        this.results?.plans,
        this.results?.data?.JourneyPlans,
        this.results?.data?.journeyPlans,
        this.results?.Data?.JourneyPlans,
        this.results?.Data?.journeyPlans,
        this.results
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    originName() {
      return this.stopName(this.results?.OriginStop || this.results?.originStop) ||
        (this.queryValue(this.$route.query.originType) === 'location' ? 'Current location' : 'Origin')
    },
    destinationName() {
      return this.stopName(this.results?.DestinationStop || this.results?.destinationStop) || 'Destination'
    },
    selectedJourneySteps() {
      return this.routeItems(this.selectedJourneyPlan).map((item, index) => this.normaliseStep(item, index))
    },
    selectedJourneyPlanSubtitle() {
      if (!this.selectedJourneyPlan) {
        return ''
      }

      return `${this.formatTime(this.selectedJourneyPlan.StartTime)} to ${this.formatTime(this.selectedJourneyPlan.ArrivalTime)} · ${this.transfersLabel(this.selectedJourneyPlan)}`
    },
    errorMessage() {
      if (typeof this.error === 'string') {
        return this.error
      }

      return this.error?.message || 'Journey results could not be loaded.'
    }
  },
  methods: {
    queryValue(value) {
      return Array.isArray(value) ? value[0] : value || ''
    },
    journeyPlanKey(journeyPlan, index) {
      return journeyPlan.PrimaryIdentifier ||
        journeyPlan.Identifier ||
        `${journeyPlan.StartTime || 'start'}-${journeyPlan.ArrivalTime || 'arrival'}-${index}`
    },
    routeItems(journeyPlan) {
      const resultSet = [
        journeyPlan?.RouteItems,
        journeyPlan?.routeItems,
        journeyPlan?.Steps,
        journeyPlan?.steps,
        journeyPlan?.Legs,
        journeyPlan?.legs
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    journeyLegs(journeyPlan) {
      return this.routeItems(journeyPlan).filter(item => this.itemJourney(item))
    },
    primaryRouteItem(journeyPlan) {
      return this.journeyLegs(journeyPlan)[0] || this.routeItems(journeyPlan)[0]
    },
    primaryJourney(journeyPlan) {
      return this.itemJourney(this.primaryRouteItem(journeyPlan))
    },
    primaryTransportLabel(journeyPlan) {
      return this.transportTypeForItem(this.primaryRouteItem(journeyPlan)) ||
        this.primaryRouteItem(journeyPlan)?.JourneyType ||
        this.primaryRouteItem(journeyPlan)?.Type ||
        'Journey'
    },
    journeyPlanSummary(journeyPlan) {
      const routeItems = this.routeItems(journeyPlan)

      if (routeItems.length === 0) {
        return this.primaryJourney(journeyPlan)?.DestinationDisplay || this.destinationName
      }

      return routeItems
        .map(item => this.stepShortLabel(item))
        .filter(Boolean)
        .join(' · ')
    },
    stepShortLabel(item) {
      const journey = this.itemJourney(item)
      const service = journey?.Service || item?.Service || {}

      if (this.isTransferItem(item)) {
        return this.transferTitle(item)
      }

      return service.ServiceName ||
        journey?.DestinationDisplay ||
        item?.Summary ||
        item?.Description ||
        item?.JourneyType ||
        item?.Type ||
        this.transportTypeForItem(item)
    },
    transferCount(journeyPlan) {
      const journeyLegCount = this.journeyLegs(journeyPlan).length || this.routeItems(journeyPlan).length

      return Math.max(journeyLegCount - 1, 0)
    },
    transfersLabel(journeyPlan) {
      const transfers = this.transferCount(journeyPlan)

      if (transfers === 0) {
        return 'Direct'
      }

      return `${transfers} transfer${transfers === 1 ? '' : 's'}`
    },
    transportIcon(type) {
      return {
        Rail: 'train',
        Train: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Air: 'flight',
        Walk: 'directions_walk',
        Walking: 'directions_walk',
        Transfer: 'sync_alt',
        Interchange: 'sync_alt',
        Connection: 'sync_alt',
        Wait: 'schedule',
        Waiting: 'schedule'
      }[type] || 'route'
    },
    plannerPathSegment(value) {
      return encodeURIComponent(value).replace(/%2C/g, ',')
    },
    transportTypeForItem(item) {
      const journey = this.itemJourney(item)

      if (this.isTransferItem(item)) {
        return item?.TransferType || item?.transferType || 'Transfer'
      }

      return journey?.Service?.TransportType ||
        item?.Service?.TransportType ||
        item?.TransportType ||
        item?.transportType ||
        item?.JourneyType ||
        item?.Type ||
        ''
    },
    isTransferItem(item) {
      return String(item?.Type || item?.type || '').toLowerCase() === 'transfer'
    },
    itemJourney(item) {
      return item?.Journey ||
        item?.journey ||
        item?.RealtimeJourney ||
        item?.realtimeJourney ||
        null
    },
    journeyIdentifier(journey) {
      return journey?.PrimaryIdentifier ||
        journey?.primaryIdentifier ||
        journey?.Identifier ||
        journey?.identifier ||
        journey?.ID ||
        journey?.id ||
        ''
    },
    itemOriginStop(item) {
      return item?.OriginStop ||
        item?.originStop ||
        item?.FromStop ||
        item?.fromStop ||
        item?.StartStop ||
        item?.startStop ||
        null
    },
    itemOriginStopRef(item) {
      return item?.OriginStopRef ||
        item?.originStopRef ||
        item?.FromStopRef ||
        item?.fromStopRef ||
        item?.StartStopRef ||
        item?.startStopRef ||
        ''
    },
    itemDestinationStop(item) {
      return item?.DestinationStop ||
        item?.destinationStop ||
        item?.ToStop ||
        item?.toStop ||
        item?.EndStop ||
        item?.endStop ||
        null
    },
    itemDestinationStopRef(item) {
      return item?.DestinationStopRef ||
        item?.destinationStopRef ||
        item?.ToStopRef ||
        item?.toStopRef ||
        item?.EndStopRef ||
        item?.endStopRef ||
        ''
    },
    normaliseStep(item, index) {
      const journey = this.itemJourney(item)
      const service = journey?.Service || item?.Service || {}
      const transportType = this.transportTypeForItem(item)
      const originName = this.routeItemStopName(item, 'origin')
      const destinationName = this.routeItemStopName(item, 'destination')
      const startTime = item?.StartTime || item?.DepartureTime || item?.startTime || item?.departureTime || journey?.StartTime
      const arrivalTime = item?.ArrivalTime || item?.EndTime || item?.arrivalTime || item?.endTime || journey?.ArrivalTime
      const journeyId = this.journeyIdentifier(journey)
      const isTransfer = this.isTransferItem(item)
      const durationLabel = this.routeItemDuration(item)
      const distanceLabel = this.routeItemDistance(item)
      const title = isTransfer
        ? this.transferTitle(item)
        : service.ServiceName ||
          journey?.DestinationDisplay ||
          item?.Title ||
          item?.Summary ||
          item?.JourneyType ||
          item?.Type ||
          'Journey step'
      const chips = isTransfer ? [] : [
        transportType,
        durationLabel,
        distanceLabel,
        journey?.Operator?.PrimaryName || item?.Operator?.PrimaryName || service.OperatorName || ''
      ].filter(Boolean)

      return {
        key: item?.PrimaryIdentifier || item?.Identifier || journeyId || `${index}-${startTime || ''}-${arrivalTime || ''}`,
        title,
        subtitle: isTransfer ? '' : [originName, destinationName].filter(Boolean).join(' to '),
        isTransfer,
        distanceLabel,
        durationLabel,
        chips,
        startTime: this.formatTime(startTime),
        arrivalTime: this.formatTime(arrivalTime),
        journeyId,
        icon: this.transportIcon(transportType)
      }
    },
    routeItemStopName(item, direction) {
      const stop = direction === 'origin' ? this.itemOriginStop(item) : this.itemDestinationStop(item)
      const ref = direction === 'origin' ? this.itemOriginStopRef(item) : this.itemDestinationStopRef(item)

      return this.stopName(stop) || this.stopNameCache[ref] || ''
    },
    transferTitle(item) {
      const transferType = item?.TransferType || item?.transferType

      if (['Interchange', 'Connection'].includes(transferType)) {
        return 'Change services'
      }

      if (this.hasWalkingTransferData(item) || ['Walking', 'Walk'].includes(transferType)) {
        return 'Walk'
      }

      return 'Transfer'
    },
    hasWalkingTransferData(item) {
      return Boolean(
        item?.DistanceMetres ||
        item?.distanceMetres ||
        item?.WalkDurationSeconds ||
        item?.walkDurationSeconds
      )
    },
    routeItemDuration(item) {
      const duration = item?.Duration || item?.duration

      if (duration) {
        return this.formatDuration(duration)
      }

      const seconds = item?.TotalDurationSeconds ||
        item?.totalDurationSeconds ||
        item?.WalkDurationSeconds ||
        item?.walkDurationSeconds ||
        item?.MinChangeDurationSeconds ||
        item?.minChangeDurationSeconds

      return this.formatSeconds(seconds)
    },
    routeItemDistance(item) {
      const metres = item?.DistanceMetres || item?.distanceMetres

      if (!metres) {
        return ''
      }

      if (metres >= 1000) {
        return `${(metres / 1000).toFixed(1)} km`
      }

      return `${metres} m`
    },
    stopName(stop) {
      return stop?.PrimaryName ||
        stop?.primaryName ||
        stop?.Name ||
        stop?.name ||
        stop?.CommonName ||
        stop?.commonName ||
        stop?.DisplayName ||
        stop?.displayName ||
        ''
    },
    stopIdentifier(stop) {
      return stop?.PrimaryIdentifier ||
        stop?.primaryIdentifier ||
        stop?.Identifier ||
        stop?.identifier ||
        stop?.ID ||
        stop?.Id ||
        stop?.id ||
        ''
    },
    seedStopName(stop) {
      const identifier = this.stopIdentifier(stop)
      const name = this.stopName(stop)

      if (!identifier || !name) {
        return
      }

      this.stopNameCache = {
        ...this.stopNameCache,
        [identifier]: name
      }
    },
    collectPlannerStopRefs() {
      const refs = new Set()

      this.journeyPlans.forEach(journeyPlan => {
        this.routeItems(journeyPlan).forEach(item => {
          const originRef = this.itemOriginStopRef(item)
          const destinationRef = this.itemDestinationStopRef(item)

          if (originRef) {
            refs.add(originRef)
          }

          if (destinationRef) {
            refs.add(destinationRef)
          }
        })
      })

      return [...refs].filter(ref => !this.stopNameCache[ref])
    },
    hydratePlannerStopNames() {
      this.seedStopName(this.results?.OriginStop || this.results?.originStop)
      this.seedStopName(this.results?.DestinationStop || this.results?.destinationStop)

      const refs = this.collectPlannerStopRefs()

      if (refs.length === 0) {
        return Promise.resolve()
      }

      return Promise.allSettled(refs.map(ref => axios.get(`${API.URL}/core/stops/${encodeURIComponent(ref)}`)))
        .then(results => {
          const nextCache = { ...this.stopNameCache }

          results.forEach((result, index) => {
            if (result.status !== 'fulfilled') {
              return
            }

            const ref = refs[index]
            const stop = this.unwrapStop(result.value.data)
            const identifier = this.stopIdentifier(stop)
            const name = this.stopName(stop)

            if (ref && name) {
              nextCache[ref] = name
            }

            if (identifier && name) {
              nextCache[identifier] = name
            }
          })

          this.stopNameCache = nextCache
        })
    },
    unwrapStop(result) {
      if (Array.isArray(result)) {
        return undefined
      }

      return result?.Stop ||
        result?.stop ||
        result?.Station ||
        result?.station ||
        result?.Data?.Stop ||
        result?.Data?.stop ||
        result?.data?.Stop ||
        result?.data?.stop ||
        result?.Data ||
        result?.data ||
        result?.Result ||
        result?.result ||
        result
    },
    formatTime(value) {
      if (!value) {
        return '--'
      }

      return this.pretty.time(value)
    },
    formatDuration(value) {
      if (value === undefined || value === null || value === '') {
        return ''
      }

      if (typeof value === 'string') {
        return value
      }

      return this.pretty.duration(value)
    },
    formatSeconds(value) {
      if (!value) {
        return ''
      }

      const minutes = Math.max(1, Math.ceil(value / 60))

      if (minutes < 60) {
        return `${minutes} min`
      }

      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60

      return remainingMinutes === 0 ? `${hours} hr` : `${hours} hr ${remainingMinutes} min`
    },
    openJourneyPlanModal(journeyPlan) {
      this.selectedJourneyPlan = journeyPlan
      this.journeyPlanModalOpen = true
    },
    closeJourneyPlanModal() {
      this.journeyPlanModalOpen = false
      this.selectedJourneyPlan = undefined
    },
    getJourneyPlan() {
      const origin = this.queryValue(this.$route.query.origin)
      const destination = this.queryValue(this.$route.query.destination)

      if (!origin || !destination) {
        this.loadingResults = false
        this.error = 'Choose an origin and destination to search for journeys.'
        return
      }

      this.loadingResults = true
      this.error = undefined
      this.selectedJourneyPlan = undefined
      this.journeyPlanModalOpen = false
      this.stopNameCache = {}

      axios
        .get(`${API.URL}/core/planner/${this.plannerPathSegment(origin)}/${this.plannerPathSegment(destination)}`)
        .then(response => {
          this.results = response.data || {}

          let earliestTime = undefined
          this.earliestArrivalJourneyID = 0
          for (let index = 0; index < this.journeyPlans.length; index++) {
            const element = this.journeyPlans[index]
            const datetime = new Date(element.ArrivalTime)

            if ((earliestTime === undefined) || (datetime < earliestTime)) {
              earliestTime = datetime
              this.earliestArrivalJourneyID = index
            }
          }

          return this.hydratePlannerStopNames()
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loadingResults = false)
    },
    departureDayChange(index) {
      let comparisonDateTime

      if (index === 0) {
        comparisonDateTime = new Date(Date.now())
      } else {
        comparisonDateTime = new Date(Date.parse(this.journeyPlans[index - 1].StartTime))
      }

      const currentDateTime = new Date(Date.parse(this.journeyPlans[index].StartTime))

      return comparisonDateTime.getDate() !== currentDateTime.getDate()
    }
  },
  mounted () {
    this.getJourneyPlan()
  }
}
</script>
