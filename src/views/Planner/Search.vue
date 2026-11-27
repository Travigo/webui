<template>
  <div class="ui-page">
    <main class="mx-auto max-w-3xl space-y-4">
      <header class="ui-panel px-3 py-3 sm:px-4">
        <div class="flex items-start gap-2 sm:gap-3">
          <div class="relative mt-0.5 flex w-5 shrink-0 flex-col items-center gap-0.5 text-brand-blue dark:text-brand-blue-light" aria-hidden="true">
            <span class="material-symbols-outlined text-[15px]">trip_origin</span>
            <span class="h-1.5 w-px bg-current opacity-40"></span>
            <span class="material-symbols-outlined text-[16px]">location_on</span>
          </div>
          <h1 class="min-w-0 flex-1 wrap-anywhere text-(--ui-text)">
            <span class="block text-xs font-semibold leading-5 text-(--ui-muted)"><span class="sr-only">From </span>{{ originName }}</span>
            <span class="block text-base font-bold leading-6 sm:text-lg"><span class="sr-only">To </span>{{ destinationName }}</span>
          </h1>
          <div class="flex shrink-0 items-center">
            <router-link
              :to="editRoute"
              class="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-bold text-brand-blue hover:bg-brand-blue/10 dark:text-brand-blue-light sm:px-3"
              aria-label="Edit search"
            >
              <span class="material-symbols-outlined text-[17px]" aria-hidden="true">edit</span>
              Edit
            </router-link>
            <button
              type="button"
              class="flex size-11 shrink-0 items-center justify-center rounded-lg text-brand-blue hover:bg-brand-blue/10 disabled:opacity-60 dark:text-brand-blue-light"
              :disabled="loadingResults"
              aria-label="Refresh journey results"
              @click="getJourneyPlan"
            >
              <span class="material-symbols-outlined text-[19px]" :class="{ 'animate-spin': loadingResults }" aria-hidden="true">refresh</span>
            </button>
          </div>
        </div>
        <p class="mt-2 pl-7 text-xs leading-5 text-(--ui-muted) sm:pl-8">{{ searchDescription }} · {{ preferenceSummary }}</p>
      </header>

      <section class="min-w-0" aria-labelledby="journey-results-heading">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1">
          <div class="min-w-0">
            <h2 id="journey-results-heading" class="text-base font-bold text-(--ui-text)">Journey options</h2>
            <p class="text-xs leading-5 text-(--ui-muted)" aria-live="polite">{{ resultsStatus }}</p>
          </div>
          <button v-if="loadingResults" type="button" class="min-h-11 rounded-lg px-3 text-sm font-bold text-(--ui-muted) hover:bg-(--ui-subtle)" @click="cancelSearch">Cancel</button>
          <label v-else-if="journeyPlans.length > 1" class="min-w-0 max-w-full">
            <span class="sr-only">Sort journeys by</span>
            <select v-model="sortMode" class="min-h-11 max-w-full rounded-lg border border-(--ui-border) bg-(--ui-panel) py-2 pr-9 pl-2.5 text-base font-semibold text-(--ui-text) sm:text-sm">
              <option v-for="option in sortOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>

        <div v-if="loadingResults" class="ui-panel p-4 sm:p-5" role="status">
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

        <div v-else class="ui-results-reveal space-y-2">
          <p v-if="searchTruncated" class="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
            Showing the journeys found before this search reached its limit.
          </p>
          <template v-for="(journeyPlan, index) in sortedJourneyPlans" :key="journeyPlanKey(journeyPlan, index)">
            <h3 v-if="departureDayChange(index)" class="px-1 pt-1 text-xs font-semibold text-(--ui-muted)">
              {{ formatDay(journeyPlan.StartTime) }}
            </h3>

            <button
              type="button"
              class="ui-panel group flex w-full items-center gap-2.5 px-3 py-3 text-left transition hover:border-brand-blue/50 focus-visible:outline-2 focus-visible:outline-brand-blue sm:gap-4 sm:px-4"
              @click="selectJourneyPlan(journeyPlan)"
            >
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-xl leading-none font-bold tabular-nums text-(--ui-text)">
                    <span><span class="sr-only">Departs </span>{{ formatTime(journeyPlan.StartTime, originTimezone) }}</span>
                    <span class="material-symbols-outlined text-[17px] text-(--ui-muted)" aria-hidden="true">arrow_forward</span>
                    <span><span class="sr-only">Arrives </span>{{ formatTime(journeyPlan.ArrivalTime, destinationTimezone) }}</span>
                  </span>
                  <span v-if="recommendationLabel(journeyPlan)" class="rounded-md bg-brand-blue/10 px-1.5 py-0.5 text-xs font-semibold text-brand-blue dark:bg-brand-blue/100/15 dark:text-brand-blue-light">
                    {{ recommendationLabel(journeyPlan) }}
                  </span>
                </div>
                  <p class="mt-1 flex flex-wrap items-baseline gap-x-1 text-xs leading-5 text-(--ui-muted)">
                  <span>{{ formatDuration(journeyPlan.Duration) || calculatedDuration(journeyPlan) }}</span>
                  <span>· {{ transfersLabel(journeyPlan) }}</span>
                  <span v-if="countdownLabel(journeyPlan.StartTime)">· {{ countdownLabel(journeyPlan.StartTime) }}</span>
                    <span v-if="fareSummary(journeyPlan)" class="ml-auto inline-flex flex-wrap items-baseline gap-x-1 pl-1">
                      <span>{{ fareCertaintyLabel(fareQuote(journeyPlan)) }}</span>
                      <strong class="text-(--ui-text)">{{ fareSummary(journeyPlan) }}</strong>
                    </span>
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                  <template v-if="journeyLegs(journeyPlan).length">
                    <ServiceIcon
                      v-for="service in itineraryServices(journeyPlan)"
                      :key="service.PrimaryIdentifier || service.ServiceName"
                      class="max-w-full wrap-anywhere text-xs font-bold leading-5"
                      :service="service"
                    />
                  </template>
                  <span v-else class="text-xs font-semibold text-(--ui-text)">{{ primaryMode(journeyPlan) }} service</span>
                  <span class="inline-flex items-center gap-1 text-xs text-(--ui-muted)">
                    <span class="size-1.5 rounded-full" :class="statusLabel(journeyPlan) === 'Live' ? 'bg-emerald-500' : 'bg-slate-400'" aria-hidden="true"></span>
                    {{ statusLabel(journeyPlan) }}
                  </span>
                </div>
                <p v-if="changeStops(journeyPlan)" class="mt-1.5 wrap-anywhere text-xs leading-5 text-(--ui-muted)">Change at {{ changeStops(journeyPlan) }}</p>
              </div>
              <span class="material-symbols-outlined shrink-0 text-[19px] text-(--ui-muted) transition group-hover:translate-x-0.5 group-hover:text-brand-blue" aria-hidden="true">chevron_right</span>
            </button>
          </template>
        </div>
      </section>
    </main>

    <Modal
      v-model:open="journeyPlanModalOpen"
      title="Journey itinerary"
      :subtitle="selectedJourneyPlanSubtitle"
      icon="route"
      size="lg"
      close-label="Close journey itinerary"
      body-class="overflow-y-auto p-3 sm:p-5"
      @close="selectedJourneyPlan = undefined"
    >
      <div v-if="selectedJourneyPlan" class="space-y-3">
        <details v-if="selectedFare" class="group rounded-lg border border-(--ui-divider)">
          <summary class="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-(--ui-muted) hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-blue dark:hover:bg-slate-800/60 [&::-webkit-details-marker]:hidden">
            <span class="material-symbols-outlined shrink-0 text-[18px]" aria-hidden="true">confirmation_number</span>
            <span class="flex-1 font-semibold">{{ selectedFareLabel }}</span>
            <strong v-if="selectedFarePrice" class="text-(--ui-text)">{{ selectedFarePrice }}</strong>
            <span class="material-symbols-outlined shrink-0 text-[18px] group-open:rotate-180" aria-hidden="true">expand_more</span>
          </summary>
          <div class="border-t border-(--ui-divider) px-3 py-2.5">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ fareCertaintyLabel(selectedFare) }}<span v-if="fareAvailabilityLabel(selectedFare)"> · {{ fareAvailabilityLabel(selectedFare) }}</span><span v-if="selectedFare.source || selectedFare.Source"> · {{ selectedFare.source || selectedFare.Source }}</span></p>
            <p v-if="selectedFare.reason || selectedFare.Reason" class="mt-2 text-sm text-slate-600 dark:text-slate-300">{{ selectedFare.reason || selectedFare.Reason }}</p>

            <ul v-if="fareAssumptions(selectedJourneyPlan).length" class="mt-3 list-disc space-y-1 pl-5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <li v-for="assumption in fareAssumptions(selectedJourneyPlan)" :key="assumption">{{ assumption }}</li>
            </ul>

            <div v-if="fareAlternatives(selectedJourneyPlan).length" class="mt-4 space-y-2">
              <h3 class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Ticket options</h3>
              <article v-for="(alternative, index) in fareAlternatives(selectedJourneyPlan)" :key="alternative.product_ref || alternative.ProductRef || alternative.name || alternative.Name || index" class="rounded-lg bg-white/80 p-3 dark:bg-slate-900/70">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <p class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ alternative.name || alternative.Name || 'Ticket option' }}</p>
                  <p class="shrink-0 text-sm font-black text-slate-900 dark:text-slate-100">{{ formatFareMoney(alternative.price || alternative.Price) }}</p>
                </div>
                <ul v-if="fareConditions(alternative).length" class="mt-2 list-disc space-y-1 pl-5 text-xs font-medium text-slate-600 dark:text-slate-300">
                  <li v-for="condition in fareConditions(alternative)" :key="condition">{{ condition }}</li>
                </ul>
                <a v-if="farePurchaseURL(alternative)" :href="farePurchaseURL(alternative)" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-bold text-brand-blue underline-offset-4 hover:underline dark:text-brand-blue-light">
                  Buy this ticket <span class="material-symbols-outlined text-[16px]" aria-hidden="true">open_in_new</span>
                </a>
              </article>
            </div>

            <div v-if="selectedFareComponents.length" class="mt-4 space-y-2">
              <h3 class="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Fare breakdown</h3>
              <div v-for="({ component, service }, index) in selectedFareComponents" :key="component.journey_ref || component.JourneyRef || index" class="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 dark:bg-slate-900/70">
                <div class="min-w-0">
                  <ServiceIcon v-if="service" class="max-w-full wrap-anywhere text-xs font-bold leading-5" :service="service" />
                  <p v-else class="text-xs font-bold text-slate-700 dark:text-slate-200">Transit leg {{ index + 1 }}</p>
                  <p v-if="component.reason || component.Reason" class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ component.reason || component.Reason }}</p>
                </div>
                <p v-if="component.price || component.Price" class="shrink-0 text-xs font-black text-slate-900 dark:text-slate-100">{{ formatFareMoney(component.price || component.Price) }}</p>
                <div v-if="fareAlternativesFor(component).length" class="basis-full space-y-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <div v-for="(alternative, alternativeIndex) in fareAlternativesFor(component)" :key="alternative.product_ref || alternative.ProductRef || alternative.name || alternative.Name || alternativeIndex" class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
                    <span class="font-semibold text-slate-600 dark:text-slate-300">{{ alternative.name || alternative.Name || 'Ticket option' }}</span>
                    <span class="font-black text-slate-900 dark:text-slate-100">{{ formatFareMoney(alternative.price || alternative.Price) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </details>

        <ol class="space-y-2">
          <li v-for="(step, index) in selectedJourneySteps" :key="step.key" class="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-2">
            <div class="relative flex justify-center">
              <span v-if="index < selectedJourneySteps.length - 1" class="absolute top-4 -bottom-5 w-px bg-(--ui-divider)" aria-hidden="true"></span>
              <span class="relative mt-1.5 flex size-7 items-center justify-center rounded-full" :class="step.isTransfer ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'">
                <span class="material-symbols-outlined text-[17px]" aria-hidden="true">{{ step.icon }}</span>
              </span>
            </div>
            <component
              :is="step.journeyRoute ? 'router-link' : 'div'"
              v-bind="step.journeyRoute ? { to: step.journeyRoute } : {}"
              class="flex min-w-0 items-start gap-2 rounded-lg px-2 py-2 sm:gap-3 sm:px-3"
              :class="{
                'border border-(--ui-divider)': !step.isTransfer,
                'transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-blue dark:hover:bg-slate-800/60': step.journeyRoute
              }"
            >
              <div class="min-w-0 flex-1">
                <div v-if="step.service" class="font-bold">
                  <span v-if="step.service.TransportType" class="sr-only">{{ step.service.TransportType }} </span>
                  <ServiceIcon class="max-w-full wrap-anywhere text-xs leading-5" :service="step.service" />
                </div>
                <h3 v-else class="text-sm font-bold text-(--ui-text)">{{ step.title }}</h3>
                <p v-if="step.subtitle" class="mt-0.5 wrap-anywhere text-xs font-semibold leading-5 text-(--ui-text)">{{ step.subtitle }}</p>
                <p v-if="step.metadata" class="mt-0.5 wrap-anywhere text-xs text-(--ui-muted)">{{ step.metadata }}</p>
              </div>
              <div class="shrink-0 text-right tabular-nums">
                <p class="text-sm font-bold"><span class="sr-only">Departs </span>{{ step.startTime }}</p>
                <p v-if="step.arrivalTime !== '--'" class="text-xs font-medium text-(--ui-muted)"><span class="sr-only">Arrives </span>{{ step.arrivalTime }}</p>
              </div>
              <span v-if="step.journeyRoute" class="material-symbols-outlined shrink-0 self-center text-[18px] text-(--ui-muted)" aria-hidden="true">chevron_right</span>
            </component>
          </li>
        </ol>
      </div>
    </Modal>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import axios from 'axios'
import { useAuth0 } from '@auth0/auth0-vue'
import { getApiAccessToken } from '@/auth'
import API from '@/API'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import Pretty from '@/pretty'
import { journeyPlanForDisplay, journeyPlanRouteItems } from '@/plannerRouteItems'

const PLANNER_REQUEST_TIMEOUT_MS = 22000

export default {
  name: 'JourneyPlannerSearch',
  components: { LoadingState, Modal, ServiceIcon },
  data () {
    return {
      auth0: useAuth0(),
      fareProfile: { age: null, discount_cards: [] },
      fareProfileLoaded: false,
      fareProfileController: null,
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
      alternativesController: undefined,
      loadingAlternatives: false,
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
    fareProfileAccount() {
      if (this.auth0.isLoading) return null
      return this.auth0.isAuthenticated ? this.auth0.user?.sub || 'authenticated' : false
    },
    journeyPlans() {
      const resultSet = [
        this.results?.JourneyPlans, this.results?.journeyPlans, this.results?.Plans, this.results?.plans,
        this.results?.data?.JourneyPlans, this.results?.data?.journeyPlans,
        this.results?.Data?.JourneyPlans, this.results?.Data?.journeyPlans, this.results
      ].find(result => Array.isArray(result))
      return (resultSet || []).map(journeyPlanForDisplay)
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
    selectedFare() {
      return this.fareQuote(this.selectedJourneyPlan)
    },
    selectedFarePrice() {
      return this.fareSummary(this.selectedJourneyPlan)
    },
    selectedFareComponents() {
      return this.fareComponents(this.selectedJourneyPlan).map(component => ({
        component,
        service: this.fareComponentService(component)
      }))
    },
    selectedFareLabel() {
      const hasFare = this.selectedFarePrice || this.fareAlternatives(this.selectedJourneyPlan).length ||
        this.selectedFareComponents.some(({ component }) => this.formatFareMoney(component.price || component.Price) || this.fareAlternativesFor(component).length)
      return hasFare ? this.fareCertaintyLabel(this.selectedFare) : 'Fare unavailable'
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
      if (this.loadingAlternatives) return `${this.journeyPlans.length} option${this.journeyPlans.length === 1 ? '' : 's'} found · checking alternatives…`
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
    fareProfileAccount() {
      this.loadFareProfile()
    },
    '$route.fullPath'() {
      this.getJourneyPlan()
    }
  },
  mounted() {
    this.clockTimer = window.setInterval(() => { this.currentTime = Date.now() }, 30000)
    this.loadFareProfile()
  },
  beforeUnmount() {
    this.fareProfileController?.abort()
    this.requestController?.abort()
    this.alternativesController?.abort()
    window.clearInterval(this.clockTimer)
  },
  methods: {
    queryValue(value) { return Array.isArray(value) ? value[0] : value || '' },
    timestamp(value) { const result = Date.parse(value); return Number.isFinite(result) ? result : Number.POSITIVE_INFINITY },
    journeyPlanKey(plan, index) { return plan.PrimaryIdentifier || plan.Identifier || `${plan.StartTime || 'start'}-${plan.ArrivalTime || 'arrival'}-${index}` },
    routeItems(plan) {
      return journeyPlanRouteItems(plan)
    },
    fareQuote(plan) { return plan?.Fare || plan?.fare || null },
    fareMoneyAmount(money) {
      if (!money) return undefined
      const amountMinor = Number(money.amount_minor ?? money.amountMinor ?? money.AmountMinor)
      const exponent = Number(money.exponent ?? money.Exponent ?? 2)
      if (!Number.isFinite(amountMinor) || !Number.isInteger(exponent) || exponent < 0 || exponent > 4) return undefined
      return { amount: amountMinor / (10 ** exponent), exponent, currency: String(money.currency || money.Currency || '').toUpperCase() }
    },
    formatFareMoney(money) {
      const value = this.fareMoneyAmount(money)
      if (!value) return ''
      if (/^[A-Z]{3}$/.test(value.currency)) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: value.currency, minimumFractionDigits: value.exponent, maximumFractionDigits: value.exponent }).format(value.amount)
        } catch (_) {}
      }
      return `${value.currency ? `${value.currency} ` : ''}${value.amount.toFixed(value.exponent)}`
    },
    fareAlternatives(plan) {
      const fare = this.fareQuote(plan)
      return fare?.alternatives || fare?.Alternatives || []
    },
    fareSummary(plan) {
      const fare = this.fareQuote(plan)
      if (!fare) return ''
      const price = fare.price || fare.Price
      if (price) return this.formatFareMoney(price)
      const pricedAlternatives = this.fareAlternatives(plan).map(item => ({ item, amount: this.fareMoneyAmount(item.price || item.Price) })).filter(item => item.amount)
      if (!pricedAlternatives.length) return ''
      const currencies = new Set(pricedAlternatives.map(item => item.amount.currency))
      if (currencies.size !== 1) return ''
      pricedAlternatives.sort((a, b) => a.amount.amount - b.amount.amount)
      return `From ${this.formatFareMoney(pricedAlternatives[0].item.price || pricedAlternatives[0].item.Price)}`
    },
    fareCertaintyLabel(fare) {
      const certainty = String(fare?.certainty || fare?.Certainty || '').toLowerCase()
      return {
        authoritative: 'Published fare',
        computed: 'Calculated fare',
        catalogue_only: 'Catalogue fare',
        partial: 'Partial fare estimate',
        unavailable: 'Fare unavailable'
      }[certainty] || 'Fare information'
    },
    fareAvailabilityLabel(fare) {
      const availability = String(fare?.availability || fare?.Availability || '').toLowerCase()
      return { available: 'Availability confirmed', unavailable: 'Ticket unavailable', unknown: 'Availability unknown' }[availability] || ''
    },
    fareAssumptions(plan) {
      const fare = this.fareQuote(plan)
      return fare?.passenger_assumptions || fare?.PassengerAssumptions || []
    },
    fareConditions(alternative) { return alternative?.conditions || alternative?.Conditions || [] },
    fareAlternativesFor(component) { return component?.alternatives || component?.Alternatives || [] },
    fareComponents(plan) {
      const fare = this.fareQuote(plan)
      return fare?.components || fare?.Components || []
    },
    fareComponentService(component) {
      const refs = component?.journey_refs || component?.JourneyRefs || []
      const journeyRef = component?.journey_ref || component?.JourneyRef || refs[0]
      const item = journeyRef && this.journeyLegs(this.selectedJourneyPlan).find(leg => this.journeyIdentifier(this.itemJourney(leg)) === journeyRef)
      return item ? this.serviceForItem(item) : null
    },
    farePurchaseURL(alternative) {
      const url = alternative?.purchase_url || alternative?.PurchaseURL || ''
      return /^https?:\/\//i.test(url) ? url : ''
    },
    rawItemJourney(item) { return item?.Journey || item?.journey || item?.RealtimeJourney || item?.realtimeJourney || null },
    itemJourney(item) {
      return this.rawItemJourney(item)
    },
    itemService(item) {
      const journey = this.itemJourney(item)
      return journey?.Service || journey?.service || item?.Service || item?.service || null
    },
    journeyLegs(plan) { return this.routeItems(plan).filter(item => this.itemJourney(item)) },
    primaryRouteItem(plan) { return this.journeyLegs(plan)[0] || this.routeItems(plan)[0] },
    primaryJourney(plan) { return this.itemJourney(this.primaryRouteItem(plan)) },
    isTransferItem(item) { return String(item?.Type || item?.type || '').toLowerCase() === 'transfer' },
    transportTypeForItem(item) {
      if (this.isTransferItem(item)) return item?.TransferType || item?.transferType || 'Transfer'
      return this.itemService(item)?.TransportType || item?.Service?.TransportType || item?.TransportType || item?.transportType || ''
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
      const service = this.itemService(item) || {}
      const operator = this.operatorName(item)
      const mode = this.transportTypeForItem(item)
      return service.ServiceName || service.PrimaryName || service.Name || (operator && mode ? `${operator} ${mode.toLowerCase()}` : '') || mode || 'Service'
    },
    serviceForItem(item) {
      const service = this.itemService(item)
      return {
        ...service,
        ServiceName: this.serviceName(item),
        BrandIcon: service?.BrandIcon || '',
        TransportType: this.transportTypeForItem(item)
      }
    },
    operatorName(item) {
      const journey = this.itemJourney(item)
      return journey?.Operator?.PrimaryName || item?.Operator?.PrimaryName || journey?.Service?.OperatorName || ''
    },
    itineraryServices(plan) {
      const services = this.journeyLegs(plan).map(item => this.serviceForItem(item))
      return [...new Map(services.map(service => [service.PrimaryIdentifier || service.ServiceName, service])).values()]
    },
    changeStops(plan) {
      const stops = this.journeyLegs(plan).slice(1).map(item => this.routeItemStopName(item, 'origin')).filter(Boolean)
      return [...new Set(stops)].join(', ')
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
      const origin = this.routeItemStopName(item, 'origin')
      const destination = this.routeItemStopName(item, 'destination')
      const service = isTransfer ? null : this.serviceForItem(item)
      const operator = this.operatorName(item)
      const title = isTransfer ? this.transferTitle(item) : service.ServiceName
      const metadata = isTransfer
        ? [this.routeItemDistance(item), this.routeItemDuration(item)]
        : [operator === title ? '' : operator, this.routeItemDuration(item), this.statusLabel({ RouteItems: [item] })]
      const journeyId = this.journeyIdentifier(journey)
      return {
        key: item?.PrimaryIdentifier || item?.Identifier || journeyId || `${index}-${start || ''}`,
        title,
        service,
        subtitle: [origin, destination].filter(Boolean).join(' to '),
        isTransfer,
        metadata: metadata.filter(Boolean).join(' · '),
        startTime: this.formatTime(start, journey?.DepartureTimezone || this.originTimezone),
        arrivalTime: this.formatTime(arrival, journey?.DepartureTimezone || this.destinationTimezone),
        journeyRoute: journeyId ? this.journeyRoute(this.selectedJourneyPlan, journey) : undefined,
        icon: title === 'Walk to the next service' ? 'directions_walk' : this.transportIcon(this.transportTypeForItem(item))
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
    plannerRequestParams(count = 1) {
      const params = {
        count,
        max_changes: Number(this.queryValue(this.$route.query.maxChanges) || 3),
        max_transfer_distance_metres: Number(this.queryValue(this.$route.query.maxWalking) || 1000),
        include_fares: true,
        view: 'web'
      }
      const datetime = this.queryValue(this.$route.query.datetime)
      if (datetime) params.datetime = datetime
      if (Number.isInteger(this.fareProfile.age)) params.fare_age = this.fareProfile.age
      if (this.fareProfile.discount_cards?.length) params.fare_cards = JSON.stringify(this.fareProfile.discount_cards)
      return params
    },
    async loadFareProfile() {
      this.fareProfileController?.abort()
      this.fareProfileLoaded = false
      this.fareProfile = { age: null, discount_cards: [] }
      if (this.fareProfileAccount === null) return
      if (this.fareProfileAccount === false) {
        this.fareProfileLoaded = true
        this.getJourneyPlan()
        return
      }
      const controller = new AbortController()
      this.fareProfileController = controller
      try {
        const token = await getApiAccessToken(this.auth0)
        if (controller.signal.aborted) return
        const response = await axios.get(`${API.URL}/core/account/fareprofile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          timeout: PLANNER_REQUEST_TIMEOUT_MS
        })
        if (controller.signal.aborted) return
        this.fareProfile = {
          age: Number.isInteger(response.data?.age) ? response.data.age : null,
          discount_cards: Array.isArray(response.data?.discount_cards) ? response.data.discount_cards : []
        }
      } catch (error) {
        if (!controller.signal.aborted) console.log('Fare profile could not be loaded for planner search.', error)
      } finally {
        if (!controller.signal.aborted) {
          this.fareProfileLoaded = true
          if (this.error !== 'Search cancelled. Your route and preferences have been kept.') this.getJourneyPlan()
        }
      }
    },
    cancelSearch() {
      this.requestController?.abort()
      this.alternativesController?.abort()
      this.loadingAlternatives = false
      this.loadingResults = false
      this.error = 'Search cancelled. Your route and preferences have been kept.'
    },
    getJourneyPlan() {
      if (!this.fareProfileLoaded) return
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
      this.alternativesController?.abort()
      this.requestController = new AbortController()
      const token = ++this.requestToken
      this.loadingResults = true
      this.loadingAlternatives = false
      this.searchStartedAt = Date.now()
      this.currentTime = Date.now()
      this.error = undefined
      this.results = {}
      this.stopNameCache = {}
      this.closeJourneyPlanModal()

      axios.get(`${API.URL}/core/planner/${this.plannerPathSegment(origin)}/${this.plannerPathSegment(destination)}`, {
        params: this.plannerRequestParams(1),
        signal: this.requestController.signal,
        timeout: PLANNER_REQUEST_TIMEOUT_MS
      }).then(response => {
        if (token !== this.requestToken) return
        this.results = response.data || {}
        this.loadingResults = false
        if (this.journeyPlans.length > 0) this.getJourneyAlternatives(origin, destination, token)
      }).catch(error => {
        if (token !== this.requestToken || axios.isCancel(error) || error?.code === 'ERR_CANCELED') return
        console.log(error)
        this.error = error
        this.loadingResults = false
      })
    },
    getJourneyAlternatives(origin, destination, token) {
      this.alternativesController = new AbortController()
      this.loadingAlternatives = true
      axios.get(`${API.URL}/core/planner/${this.plannerPathSegment(origin)}/${this.plannerPathSegment(destination)}`, {
        params: this.plannerRequestParams(3),
        signal: this.alternativesController.signal,
        timeout: PLANNER_REQUEST_TIMEOUT_MS
      }).then(response => {
        if (token !== this.requestToken) return
        const nextResults = response.data || {}
        const nextPlans = this.plansFromResults(nextResults)
        if (nextPlans.length >= this.journeyPlans.length) this.results = nextResults
      }).catch(error => {
        if (!axios.isCancel(error) && error?.code !== 'ERR_CANCELED') console.log(error)
      }).finally(() => {
        if (token === this.requestToken) this.loadingAlternatives = false
      })
    },
    plansFromResults(results) {
      return [
        results?.JourneyPlans, results?.journeyPlans, results?.Plans, results?.plans,
        results?.data?.JourneyPlans, results?.data?.journeyPlans,
        results?.Data?.JourneyPlans, results?.Data?.journeyPlans, results
      ].find(result => Array.isArray(result)) || []
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
