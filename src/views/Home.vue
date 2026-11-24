<template>
  <div class="ui-page ui-page-stack">
    <!-- <LocationPicker /> -->

    <SearchBar
      ref="stopSearch"
      input-id="home-stop-search"
      label="Search stops, stations or routes"
      placeholder="Search stops, stations or routes"
      searchClasses="h-14 rounded-xl border-slate-200 bg-white px-4 text-base text-slate-900 shadow-sm placeholder:text-slate-600 sm:h-[4.25rem] sm:px-5 sm:text-lg lg:h-20 lg:text-xl"
      :showIcons="true"
    />

    <CommuteJourneyCard
      v-if="featuredCommute"
      :commute="featuredCommute"
      :alert-summary="featuredCommuteAlertSummary"
      :alerts="commuteAlerts"
      :alert-groups="featuredCommuteAlertGroups"
      :compact="featuredCommuteIsCompact"
    />

    <component
      :is="featuredSavedJourney.identifier ? 'router-link' : 'div'"
      v-else-if="featuredSavedJourney"
      v-bind="featuredSavedJourney.identifier ? { to: { name: 'journeys/view', params: { id: featuredSavedJourney.identifier } } } : {}"
      class="ui-panel group block overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
    >
      <div class="px-4 py-3 sm:px-5 sm:py-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <span class="inline-flex items-center gap-1.5 text-xs font-bold text-(--ui-muted)">
              <span
                aria-hidden="true"
                class="size-1.5 shrink-0 rounded-full"
                :class="featuredSavedJourney.inProgress ? 'bg-emerald-500' : 'bg-brand-blue'"
              ></span>
              {{ featuredSavedJourney.status }}
            </span>
          </div>
          <span v-if="featuredSavedJourney.identifier" class="material-symbols-outlined shrink-0 text-xl text-(--ui-muted) group-hover:text-brand-blue dark:group-hover:text-brand-blue-light" aria-hidden="true">chevron_right</span>
        </div>

        <div
          class="mt-2 grid items-start gap-x-2.5 sm:gap-x-4"
          :class="{'grid-cols-[minmax(0,1fr)_auto_minmax(0,1.2fr)] sm:grid-cols-[minmax(0,13rem)_auto_minmax(0,1fr)]': featuredSavedJourney.origin || featuredSavedJourney.departureTime}"
        >
          <template v-if="featuredSavedJourney.origin || featuredSavedJourney.departureTime">
            <div class="min-w-0">
              <p class="text-base font-bold leading-tight text-(--ui-text) wrap-anywhere">{{ featuredSavedJourney.origin || 'Origin' }}</p>
              <p v-if="featuredSavedJourney.departureTime" class="mt-1 text-xs text-(--ui-muted)">Departs <strong class="tabular-nums text-(--ui-text)">{{ featuredSavedJourney.departureTime }}</strong></p>
            </div>
            <span class="material-symbols-outlined self-start text-[18px] text-(--ui-muted)" aria-hidden="true">arrow_forward</span>
          </template>
          <div class="min-w-0">
            <p class="text-base font-bold leading-tight text-(--ui-text) wrap-anywhere"><span class="sr-only">To </span>{{ featuredSavedJourney.title }}</p>
            <p v-if="featuredJourneyLiveInfo?.destinationArrival || featuredSavedJourney.arrivalTime" class="mt-1 text-xs text-(--ui-muted)">
              Arrives <strong class="tabular-nums text-(--ui-text)">{{ featuredJourneyLiveInfo?.destinationArrival || featuredSavedJourney.arrivalTime }}</strong>
            </p>
          </div>
        </div>

        <div v-if="featuredJourneyLiveInfo?.service || featuredSavedJourney.service" class="mt-2">
          <ServiceIcon
            class="max-w-full text-xs leading-5"
            :service="featuredJourneyLiveInfo?.service || featuredSavedJourney.service"
          />
        </div>

        <p v-if="featuredJourneyLiveInfo?.nextStop" class="mt-2 text-sm text-(--ui-muted) wrap-anywhere">
          Next stop <strong class="text-(--ui-text)">{{ featuredJourneyLiveInfo.nextStop }}</strong><span v-if="featuredJourneyLiveInfo.nextStopTime" class="whitespace-nowrap tabular-nums"> · {{ featuredJourneyLiveInfo.nextStopTime }}</span>
        </p>
      </div>

      <div v-if="featuredJourneyAlertSummary" class="flex items-start gap-2 border-t border-(--ui-divider) bg-amber-50 px-4 py-2 text-xs font-semibold leading-4 text-amber-900 sm:px-5 dark:bg-amber-400/5 dark:text-amber-200">
        <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">warning</span>
        <span class="line-clamp-2 wrap-anywhere">{{ featuredJourneyAlertSummary }}</span>
      </div>
    </component>

    <section>
      <div class="ui-panel">
        <TabBar
          :tabs="stopPanelTabs"
          :model-value="stopPanelTab"
          :persist="false"
          @update:model-value="changeStopPanel"
        />

        <Transition name="ui-fade" @leave="(_, remove) => remove()">
        <div v-if="stopPanelTab === 'nearby'" key="nearby">
        <div class="mb-2 px-3 pt-3 sm:mb-4 sm:px-5 sm:pt-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="ui-section-title">Nearby stops</h2>
              <p v-if="nearbyStopsStatus" class="ui-body mt-0.5">{{ nearbyStopsStatus }}</p>
            </div>
            <button
              type="button"
              class="-my-1 inline-flex min-h-11 shrink-0 items-center disabled:opacity-70"
              :disabled="loadingNearbyStops"
              @click="requestNearbyStops"
            >
              <span class="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue-dark sm:rounded-xl">
                <span class="material-symbols-outlined text-[19px]" :class="{'animate-spin': loadingNearbyStops}">{{ loadingNearbyStops ? 'progress_activity' : 'near_me' }}</span>
                <span>{{ nearbyStopsButtonLabel }}</span>
              </span>
            </button>
          </div>
        </div>
        <StopInfo
          v-for="stop in nearbyStops"
          v-bind:key="stopKey(stop)"
          :stop="stop"
          :current-position="nearbyPosition"
          compact
          compact-services
        />

        <div v-if="nearbyStopsError" class="mx-4 mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100 sm:mx-5">
          <p role="status">{{ nearbyStopsError }}</p>
          <button type="button" class="min-h-11 shrink-0 rounded-lg px-2 font-bold underline underline-offset-2 hover:bg-amber-100 dark:hover:bg-amber-500/20" @click="$refs.stopSearch.focusSearch()">
            Search for a stop
          </button>
        </div>

        <router-link :to="{ name: 'map' }" class="flex items-center justify-center gap-1 px-4 py-3 text-sm font-bold text-brand-blue dark:text-brand-blue-light sm:gap-2 sm:px-5">
          {{ nearbyStops.length ? 'See all nearby stops' : 'Explore map' }}
          <span class="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
        </router-link>
        </div>

        <div v-else key="saved">
          <div class="flex items-center justify-between gap-3 px-3 pb-2 pt-3 sm:px-5 sm:pb-3 sm:pt-5">
            <div>
              <h2 class="ui-section-title">Saved stops</h2>
            </div>
            <router-link
              :to="{ name: 'saved/home' }"
              class="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-xl px-2 text-sm font-bold text-brand-blue transition hover:bg-brand-blue/10 sm:min-h-10 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/10"
            >
              Manage
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </router-link>
          </div>

          <LoadingState
            v-if="loadingSavedStops"
            title="Loading saved stops"
            subtitle="Fetching your quick-access stops."
            compact
            bare
            :rows="3"
            :show-tabs="false"
          />

          <div v-else-if="savedStopsError" class="px-4 pb-4 sm:px-5 sm:pb-5">
            <div class="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
              {{ savedStopsError }}
            </div>
          </div>

          <div v-else-if="!auth0.isAuthenticated" class="px-4 pb-4 sm:px-5 sm:pb-5">
            <div class="rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-3 py-3 text-sm font-medium text-brand-blue-dark dark:border-brand-blue/40 dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
              Sign in to see your saved stops.
            </div>
          </div>

          <div v-else-if="savedStops.length === 0" class="px-4 pb-4 sm:px-5 sm:pb-5">
            <div class="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
              You do not have any saved stops yet.
            </div>
          </div>

          <StopInfo
            v-for="stop in savedStops"
            v-bind:key="stopKey(stop)"
            :stop="stop"
            :bordered="true"
            compact
            compact-services
            meta-icon=""
            distance-label-fallback=""
          />
        </div>
        </Transition>
      </div>
    </section>

    <section class="ui-panel p-4 sm:p-5">
      <div class="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="ui-section-title">Network summary</h2>
        <p v-if="statsGeneratedAt" class="text-xs font-medium text-slate-600 dark:text-slate-300">Generated {{ statsGeneratedAt }}</p>
      </div>

      <div v-if="statsLoading" class="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Loading network summary">
        <div v-for="index in 4" :key="index" class="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <div v-else class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          v-for="summary in networkSummary"
          v-bind:key="summary.label"
          @click="openStatsModal(summary.view)"
          class="rounded-lg bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:hover:bg-slate-700"
          :disabled="!stats"
        >
          <div class="flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[18px] text-brand-blue dark:text-brand-blue-light" aria-hidden="true">{{ summary.icon }}</span>
            <span class="text-base font-bold tabular-nums text-slate-950 dark:text-slate-100">{{ summary.value }}</span>
          </div>
          <p class="text-xs font-semibold leading-snug text-slate-600 dark:text-slate-300">{{ summary.label }}</p>
        </button>
      </div>

      <div v-if="statsError" class="mt-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
        <span>{{ statsError }}</span>
        <button type="button" class="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-bold text-amber-800 shadow-sm dark:bg-slate-900 dark:text-amber-100" @click="getStats">
          Retry
        </button>
      </div>

      <router-link
        :to="{ name: 'datasources/home' }"
        class="mt-4 flex items-center gap-3 border-t border-slate-100 px-1 pt-4 text-left transition hover:text-brand-blue dark:border-slate-800 sm:px-0"
      >
        <span class="ui-icon">
          <span class="material-symbols-outlined text-[22px]">database</span>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-bold text-slate-950 dark:text-slate-100 sm:text-base">Supported data</span>
          <span class="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">
            View transport data providers, datasets, coverage, and supported object types.
          </span>
        </span>
        <span class="material-symbols-outlined shrink-0 text-xl text-slate-400">chevron_right</span>
      </router-link>
    </section>

    <Modal
      v-model:open="statsModalOpen"
      :title="selectedStatsSummary?.label || ''"
      :subtitle="selectedStatsSummary?.description || ''"
      :icon="selectedStatsSummary?.icon || 'monitoring'"
      size="lg"
      close-label="Close stats detail"
      body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
    >
            <div :class="selectedStatsSummary?.bg" class="mb-4 rounded-xl p-4">
              <div class="flex items-center gap-3">
                <span :class="selectedStatsSummary?.iconColor" class="material-symbols-outlined text-3xl">{{ selectedStatsSummary?.icon }}</span>
                <div>
                  <div class="text-2xl font-bold text-slate-950">{{ selectedStatsSummary?.value }}</div>
                  <div class="text-sm text-slate-600">{{ selectedStatsSummary?.pill }}</div>
                </div>
              </div>
            </div>

            <div v-if="statsDetailSections.length > 0" class="space-y-4">
              <section
                v-for="section in statsDetailSections"
                v-bind:key="section.title"
                class="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{{ section.title }}</h3>
                <div class="divide-y divide-slate-200 overflow-hidden rounded-xl bg-white">
                  <div
                    v-for="item in section.items"
                    v-bind:key="item.name"
                    class="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <span class="min-w-0 truncate text-slate-700">{{ item.name }}</span>
                    <span class="shrink-0 font-semibold text-slate-950">{{ formatNumber(item.count, item.count) }}</span>
                  </div>
                </div>
              </section>
            </div>

            <div v-else class="rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
              {{ statsDetailEmptyMessage }}
            </div>
    </Modal>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar.vue'
import CommuteJourneyCard from '@/components/CommuteJourneyCard.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { getApiAccessToken } from '@/auth'
import LocationPicker from '@/components/LocationPicker.vue'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import StopInfo from '@/components/Stops/StopInfo.vue'
import TabBar from '@/components/TabBar.vue'
import Pretty from '@/pretty'
import commutesApi from '@/commutes'
import { DateTime } from 'luxon'
import { journeyPlanForDisplay, journeyPlanRouteItems } from '@/plannerRouteItems'

import axios from 'axios'
import API from '@/API'
import { isConnected, reportRequestFailure, reportRequestSuccess } from '@/offline/connectivity'
import {
  auth0CacheScope,
  CACHE_MAX_AGE,
  cacheKeys,
  getCachedResource,
  putCachedResource
} from '@/offline/resourceCache'

const stopPanelStorageKey = 'travigo_home_stops_tab'
const COMMUTE_UPCOMING_WINDOW_MS = 2 * 60 * 60 * 1000
const COMMUTE_PLAN_LOOKBACK_MS = 4 * 60 * 60 * 1000
const COMMUTE_MAX_JOURNEY_DURATION_MS = 12 * 60 * 60 * 1000
const URGENT_COMMUTE_ALERT_TYPES = new Set([
  'Delays',
  'JourneyDelayed',
  'JourneyCancelled',
  'JourneyPartiallyCancelled',
  'ServiceSuspended',
  'ServicePartSuspended',
  'StopClosed',
  'SevereDelays'
])

export default {
  name: 'Home',
  components: {
    SearchBar,
    CommuteJourneyCard,
    LocationPicker,
    LoadingState,
    Modal,
    ServiceIcon,
    StopInfo,
    TabBar
  },
  data () {
    return {
      stats: undefined,
      statsLoading: true,
      statsError: '',
      statsGeneratedAt: '',
      selectedStatsView: undefined,
      statsModalOpen: false,
      refreshTimer: undefined,
      nearbyLocationRefreshTimer: undefined,
      nearbyLocationPollIntervalMs: 60000,
      nearbyRefreshDistanceMetres: 100,
      savedJourneyStatusTimer: undefined,
      currentTime: Date.now(),
      featuredJourneyDetails: null,
      featuredJourneyDetailsIdentifier: '',
      featuredJourneyRealtimeFetchedAt: 0,
      featuredJourneyAlerts: [],
      featuredJourneyRequestVersion: 0,
      commuteListRequestVersion: 0,
      commutePlanRequestVersion: 0,
      commuteAlertRequestVersion: 0,
      commutePlanLoading: false,
      savedCommutes: [],
      commutePlanCandidates: [],
      commuteAlerts: [],
      savedItemsLoading: false,
      loadingNearbyStops: false,
      nearbyStopsError: '',
      nearbyPosition: undefined,
      nearbyStopsPosition: undefined,
      auth0: useAuth0(),
      stopPanelTab: (localStorage.getItem(stopPanelStorageKey) ?? sessionStorage.getItem(stopPanelStorageKey)) === 'saved'
        ? 'saved'
        : 'nearby',
      loadingSavedStops: false,
      savedStopsError: '',
      savedStops: [],
      savedJourneys: [],
      nearbyStops: []
    }
  },
  computed: {
    stopPanelTabs() {
      return [
        { id: 'nearby', name: 'Nearby', icon: 'near_me' },
        { id: 'saved', name: 'Saved', icon: 'bookmark' }
      ]
    },
    nearbyStopsStatus() {
      if (this.loadingNearbyStops) {
        return 'Finding stops near your current location...'
      }

      if (this.nearbyStops.length > 0) {
        return 'Closest stops to your current location'
      }

      if (this.nearbyStopsError) return ''
      return this.nearbyStopsPosition ? 'No stops found nearby' : 'Find stops around you'
    },
    nearbyStopsButtonLabel() {
      if (this.loadingNearbyStops) {
        return 'Finding'
      }

      return this.nearbyStops.length > 0 ? 'Refresh' : 'Use location'
    },
    featuredSavedJourney() {
      const journeys = this.savedJourneys
        .map(journey => {
          const identifier = journey.PrimaryIdentifier || journey.Identifier || journey.SavedObjectIdentifier
          const finalPath = journey.Path?.[journey.Path.length - 1]
          const departure = this.journeyTimestamp(journey.DepartureTime) ??
            this.journeyTimestamp(journey.Path?.[0]?.OriginDepartureTime) ??
            this.journeyTimestamp(journey.Path?.[0]?.OriginArrivalTime)
          const arrival = this.journeyTimestamp(journey.ArrivalTime) ??
            this.journeyTimestamp(finalPath?.DestinationArrivalTime) ??
            this.journeyTimestamp(finalPath?.DestinationDepartureTime)
          const currentDetails = this.featuredJourneyDetailsIdentifier === identifier ? this.featuredJourneyDetails : null
          const realtime = currentDetails?.RealtimeJourney || journey.RealtimeJourney
          const cancelled = realtime?.Cancelled === true
          const lastRealtimeUpdate = this.journeyTimestamp(realtime?.ModificationDateTime || realtime?.VehicleLocationObservedAt)
          const responseIsRecent = currentDetails && this.currentTime - this.featuredJourneyRealtimeFetchedAt < 5 * 60 * 1000
          const recentlyTracked = realtime?.ActivelyTracked === true && !cancelled && (responseIsRecent || (lastRealtimeUpdate !== null && this.currentTime - lastRealtimeUpdate < 5 * 60 * 1000))
          const inProgress = !cancelled && ((departure !== null && arrival !== null && departure <= this.currentTime && arrival > this.currentTime) || recentlyTracked)
          const upcoming = !cancelled && departure !== null && departure > this.currentTime

          if (!identifier) return undefined

          const origin = journey.OriginDisplay || journey.Path?.[0]?.OriginStop?.PrimaryName || ''
          const title = journey.DestinationDisplay || finalPath?.DestinationStop?.PrimaryName || 'Saved journey'

          return {
            identifier,
            inProgress,
            upcoming,
            journey,
            departure,
            arrival,
            origin,
            title,
            status: inProgress ? 'In progress' : upcoming ? 'Upcoming' : cancelled ? 'Cancelled' : 'Saved journey'
          }
        })
        .filter(Boolean)

      const active = journeys.filter(journey => journey.inProgress)
        .sort((first, second) => (first.arrival ?? Infinity) - (second.arrival ?? Infinity))[0]
      const upcoming = journeys.filter(journey => journey.upcoming)
        .sort((first, second) => first.departure - second.departure)[0]
      const selected = active || upcoming
      if (selected) {
        const { journey } = selected
        const firstLeg = journey.Path?.[0]
        const lastLeg = journey.Path?.at(-1)
        return {
          ...selected,
          service: journey.Service,
          departureTime: this.firstJourneyClockTime([
            journey.DepartureTime, firstLeg?.OriginDepartureTime, firstLeg?.OriginArrivalTime
          ], journey.DepartureTimezone),
          arrivalTime: this.firstJourneyClockTime([
            journey.ArrivalTime, lastLeg?.DestinationArrivalTime, lastLeg?.DestinationDepartureTime
          ], journey.DepartureTimezone)
        }
      }
      return undefined
    },
    featuredCommute() {
      const candidates = this.commutePlanCandidates.map(candidate => ({
        ...candidate,
        inProgress: candidate.start <= this.currentTime && candidate.arrival > this.currentTime,
        upcoming: candidate.start > this.currentTime
      })).filter(candidate => candidate.inProgress || candidate.upcoming)

      const active = candidates.filter(candidate => candidate.inProgress)
        .sort((first, second) => first.arrival - second.arrival)[0]
      if (active) return active

      const todayEnd = DateTime.fromMillis(this.currentTime).endOf('day').toMillis()
      const upcoming = candidates.filter(candidate => candidate.upcoming && candidate.start <= todayEnd)
        .sort((first, second) => first.start - second.start)[0]
      if (!upcoming) return undefined

      const savedJourney = this.featuredSavedJourney
      if (savedJourney?.inProgress) return undefined
      if (savedJourney?.upcoming && savedJourney.departure <= upcoming.start) return undefined
      return upcoming
    },
    featuredCommuteHasUrgentAlert() {
      return this.commuteAlerts.some(alert => URGENT_COMMUTE_ALERT_TYPES.has(String(alert.AlertType || '').trim()))
    },
    featuredCommuteIsCompact() {
      if (!this.featuredCommute || this.featuredCommute.inProgress || this.featuredCommuteHasUrgentAlert) return false
      return this.featuredCommute.start > this.currentTime + COMMUTE_UPCOMING_WINDOW_MS
    },
    featuredCommuteAlertGroups() {
      const groups = (this.featuredCommute?.alertEntities || []).map(entity => ({
        ...entity,
        typeLabel: { journey: 'Journey', service: 'Service', stop: 'Stop' }[entity.type] || 'Related update',
        alerts: [],
        seenAlertKeys: new Set()
      }))
      const groupsByIdentifier = new Map()
      for (const group of groups) {
        for (const identifier of group.identifiers) {
          const matchedGroups = groupsByIdentifier.get(identifier) || []
          matchedGroups.push(group)
          groupsByIdentifier.set(identifier, matchedGroups)
        }
      }
      const other = { key: 'other', title: 'Other related updates', typeLabel: '', alerts: [], seenAlertKeys: new Set() }

      for (const alert of this.commuteAlerts) {
        const matchedIdentifiers = alert.MatchedIdentifiers || alert.matchedIdentifiers || []
        const matchedGroups = new Set(matchedIdentifiers.flatMap(identifier => groupsByIdentifier.get(identifier) || []))
        const targets = matchedGroups.size ? matchedGroups : [other]
        const alertKey = alert.PrimaryIdentifier || alert.primaryIdentifier || `${alert.AlertType || alert.alertType}|${alert.Title || alert.title}|${alert.Text || alert.text}`
        for (const group of targets) {
          if (group.seenAlertKeys.has(alertKey)) continue
          group.seenAlertKeys.add(alertKey)
          group.alerts.push(alert)
        }
      }

      return [...groups, other].filter(group => group.alerts.length)
    },
    featuredJourneyLiveInfo() {
      const selected = this.featuredSavedJourney
      const journey = this.featuredJourneyDetailsIdentifier === selected?.identifier ? this.featuredJourneyDetails : null
      if (!journey) return null

      const path = journey.Path || []
      const points = path.map(leg => ({
        stop: leg.OriginStop,
        stopRef: leg.OriginStopRef,
        arrivalTime: leg.OriginArrivalTime,
        departureTime: leg.OriginDepartureTime
      }))
      const finalLeg = path[path.length - 1]
      if (finalLeg) {
        points.push({
          stop: finalLeg.DestinationStop,
          stopRef: finalLeg.DestinationStopRef,
          arrivalTime: finalLeg.DestinationArrivalTime,
          departureTime: finalLeg.DestinationDepartureTime
        })
      }

      const realtime = journey.RealtimeJourney
      const realtimeIsFresh = this.featuredJourneyRealtimeFetchedAt > 0 && this.currentTime - this.featuredJourneyRealtimeFetchedAt < 2 * 60 * 1000
      const matchesStop = (point, identifier) => Boolean(identifier && (
        point.stopRef === identifier ||
        point.stop?.PrimaryIdentifier === identifier ||
        point.stop?.OtherIdentifiers?.includes(identifier)
      ))
      const realtimeStopForPoint = (point, index) => {
        const stops = Object.entries(realtime?.Stops || {})
        return stops.find(([key, stop]) => {
          if (stop?.JourneyStopIndex !== undefined) return stop.JourneyStopIndex === index
          return matchesStop(point, stop?.StopRef || key)
        })?.[1]
      }
      const nextStopIndex = Number.isInteger(realtime?.NextStopIndex) && realtime.NextStopIndex > 0 && realtime.NextStopIndex < points.length
        ? realtime.NextStopIndex
        : points.findIndex(point => matchesStop(point, realtime?.NextStopRef))
      const nextPoint = realtime?.ActivelyTracked && realtimeIsFresh && !realtime.Cancelled && nextStopIndex >= 0
        ? points[nextStopIndex]
        : null
      const nextRealtimeStop = nextPoint ? realtimeStopForPoint(nextPoint, nextStopIndex) : null
      const nextStopTime = nextPoint
        ? this.firstJourneyClockTime([
            nextRealtimeStop?.ArrivalTime,
            nextRealtimeStop?.DepartureTime,
            nextPoint.arrivalTime,
            nextPoint.departureTime
          ], journey.DepartureTimezone)
        : ''
      const destinationPoint = points[points.length - 1]
      const destinationRealtimeStop = destinationPoint ? realtimeStopForPoint(destinationPoint, points.length - 1) : null
      const destinationArrival = this.firstJourneyClockTime([
        realtimeIsFresh ? destinationRealtimeStop?.ArrivalTime : '',
        realtimeIsFresh ? destinationRealtimeStop?.DepartureTime : '',
        journey.ArrivalTime,
        destinationPoint?.arrivalTime,
        destinationPoint?.departureTime
      ], journey.DepartureTimezone)

      return {
        service: journey.Service,
        nextStop: nextPoint?.stop?.PrimaryName || nextPoint?.stopRef || '',
        nextStopTime,
        destinationArrival
      }
    },
    featuredJourneyAlertSummary() {
      const count = this.featuredJourneyAlerts.length
      if (!count) return ''
      const title = this.featuredJourneyAlerts.map(alert => alert.Title?.trim())
        .find(title => title && !/^service alerts?[.!]?$/i.test(title))
      if (!title) return count === 1 ? 'Service alert' : `${count} service alerts`
      return count === 1 ? title : `${title} · +${count - 1} more`
    },
    featuredCommuteAlertSummary() {
      const count = this.commuteAlerts.length
      if (!count) return ''
      const title = this.commuteAlerts.map(alert => alert.Title?.trim())
        .find(title => title && !/^service alerts?[.!]?$/i.test(title))
      if (!title) return count === 1 ? 'Service alert' : `${count} service alerts`
      return count === 1 ? title : `${title} · +${count - 1} more`
    },
    networkSummary() {
      return [
        {
          icon: 'rss_feed',
          iconColor: 'text-brand-blue',
          value: this.formatNumber(this.stats?.realtimejourneys?.stats?.current, '--'),
          label: 'Realtime trips',
          description: 'Realtime trips currently tracked',
          pill: 'Currently tracked',
          pillClass: 'bg-brand-blue/20 text-brand-blue',
          bg: 'bg-brand-blue/10',
          view: 'realtimejourneys'
        },
        {
          icon: 'location_on',
          iconColor: 'text-green-600',
          value: this.formatNumber(this.stats?.stops?.stats?.total, '--'),
          label: 'Stops',
          description: 'Known stops and stations',
          pill: 'Total indexed',
          pillClass: 'bg-green-100 text-green-700',
          bg: 'bg-green-50',
          view: 'stops'
        },
        {
          icon: 'route',
          iconColor: 'text-purple-600',
          value: this.formatNumber(this.stats?.services?.stats?.total, '--'),
          label: 'Services',
          description: 'Routes and services available',
          pill: 'Total indexed',
          pillClass: 'bg-purple-100 text-purple-700',
          bg: 'bg-purple-50',
          view: 'services'
        },
        {
          icon: 'warning',
          iconColor: 'text-amber-600',
          value: this.formatNumber(this.stats?.servicealerts?.stats?.total, '--'),
          label: 'Service alerts',
          description: 'Current and stored service alerts',
          pill: 'Alert records',
          pillClass: 'bg-amber-100 text-amber-700',
          bg: 'bg-amber-50',
          view: 'servicealerts'
        },
      ]
    },
    selectedStatsSummary() {
      return this.networkSummary.find((summary) => summary.view === this.selectedStatsView)
    },
    statsDetailSections() {
      let stat = this.stats?.[this.selectedStatsView]?.stats

      if (stat === undefined) {
        return []
      }

      return [
        { title: 'Transport Types', items: this.formatEntries(stat.transporttypes) },
        { title: 'Countries', items: this.formatEntries(stat.countries) },
        { title: 'Datasets', items: this.formatEntries(stat.datasets) },
        { title: 'Providers', items: this.formatEntries(stat.providers) },
        { title: 'Alert Types', items: this.formatEntries(stat.alerttypes) },
      ].filter((section) => section.items.length > 0)
    },
    statsDetailEmptyMessage() {
      if (this.stats === undefined) {
        return 'Stats are still loading. Try again in a moment.'
      }

      if (this.stats?.[this.selectedStatsView] === undefined) {
        return 'This statistic is not available from the stats API yet.'
      }

      return 'No breakdown data is available for this statistic yet.'
    }
  },
  methods: {
    formatNumber(value, fallback) {
      if (value === undefined || value === null) {
        return fallback
      }

      return value.toLocaleString('en', { useGrouping: true })
    },
    formatEntries(entries) {
      if (entries === undefined || entries === null) {
        return []
      }

      return Object.entries(entries)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    },
    openStatsModal(viewName) {
      this.selectedStatsView = viewName
      this.statsModalOpen = true
    },
    changeStopPanel(tab) {
      this.stopPanelTab = tab
      localStorage.setItem(stopPanelStorageKey, tab)

      if (tab === 'saved') {
        this.getSavedItems()
      }
    },
    journeyTimestamp(value) {
      if (!value || /^000[01]-/.test(value)) return null
      const timestamp = new Date(value).getTime()
      return Number.isFinite(timestamp) ? timestamp : null
    },
    journeyClockTime(value, timezone) {
      if (!value || value === '0001-01-01T00:00:00Z') return ''
      try {
        return Pretty.time(value, timezone)
      } catch {
        return ''
      }
    },
    firstJourneyClockTime(values, timezone) {
      for (const value of values) {
        const time = this.journeyClockTime(value, timezone)
        if (time) return time
      }
      return ''
    },
    journeyServiceDate(journey) {
      const runDate = journey?.RealtimeJourney?.JourneyRunDate?.slice(0, 10)
      if (/^\d{4}-\d{2}-\d{2}$/.test(runDate || '')) return runDate

      const departureValue = journey?.DepartureTime || journey?.Path?.[0]?.OriginDepartureTime || journey?.Path?.[0]?.OriginArrivalTime
      const departureTimestamp = this.journeyTimestamp(departureValue)
      const timezone = journey?.DepartureTimezone || 'UTC'
      const date = departureTimestamp === null ? new Date(this.currentTime) : new Date(departureTimestamp)

      try {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date)
      } catch {
        return new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date)
      }
    },
    async refreshFeaturedJourneyInfo(identifier = this.featuredSavedJourney?.identifier) {
      if (!identifier || !isConnected()) return

      const requestVersion = ++this.featuredJourneyRequestVersion
      const savedJourney = this.savedJourneys.find(journey => {
        return (journey.PrimaryIdentifier || journey.Identifier || journey.SavedObjectIdentifier) === identifier
      })
      const dayInstance = `DAYINSTANCEOF:${this.journeyServiceDate(savedJourney)}:${identifier}`
      const needsJourneyDetails = this.featuredJourneyDetailsIdentifier !== identifier || !this.featuredJourneyDetails

      try {
        const requests = [
          needsJourneyDetails ? axios.get(`${API.URL}/core/journeys/${identifier}`, { params: { view: 'web' } }) : null,
          axios.get(`${API.URL}/core/journeys/${identifier}`, { params: { realtime_only: true, view: 'web' } }),
          axios.get(`${API.URL}/core/service_alerts/matching/${identifier},${dayInstance}`, { params: { view: 'web' } })
        ]
        const results = await Promise.all(requests.map(request => {
          if (!request) return Promise.resolve({ status: 'skipped' })
          return request.then(
            value => ({ status: 'fulfilled', value }),
            reason => ({ status: 'rejected', reason })
          )
        }))

        if (requestVersion !== this.featuredJourneyRequestVersion || identifier !== this.featuredSavedJourney?.identifier) return

        const [journeyResult, realtimeResult, alertsResult] = results
        const succeeded = results.some(result => result.status === 'fulfilled')
        if (!succeeded) {
          reportRequestFailure(results.find(result => result.status === 'rejected')?.reason)
          return
        }

        reportRequestSuccess()
        if (journeyResult.status === 'fulfilled' || realtimeResult.status === 'fulfilled') {
          const journey = {
            ...(journeyResult.status === 'fulfilled'
              ? journeyResult.value.data
              : this.featuredJourneyDetails || savedJourney || {})
          }
          if (realtimeResult.status === 'fulfilled') {
            journey.RealtimeJourney = realtimeResult.value.data
            this.featuredJourneyRealtimeFetchedAt = Date.now()
          }
          this.featuredJourneyDetails = journey
          this.featuredJourneyDetailsIdentifier = identifier
        }

        if (alertsResult.status === 'fulfilled') {
          this.featuredJourneyAlerts = Array.isArray(alertsResult.value.data) ? alertsResult.value.data : []
        }
      } catch (error) {
        reportRequestFailure(error)
      }
    },
    async getSavedCommutes() {
      const requestVersion = ++this.commuteListRequestVersion
      this.commutePlanRequestVersion++
      this.commutePlanLoading = false
      if (!this.auth0.isAuthenticated) {
        this.commuteAlertRequestVersion++
        this.savedCommutes = []
        this.commutePlanCandidates = []
        this.commuteAlerts = []
        return
      }

      try {
        const commutes = await commutesApi.list(this.auth0)
        if (requestVersion !== this.commuteListRequestVersion) return
        this.savedCommutes = commutes
        reportRequestSuccess()
        this.refreshCommutePlans()
      } catch (error) {
        if (requestVersion !== this.commuteListRequestVersion) return
        reportRequestFailure(error)
      }
    },
    commuteDateTime(date, time) {
      if (!date?.isValid || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return null
      const value = DateTime.fromFormat(`${date.toISODate()} ${time}`, 'yyyy-MM-dd HH:mm', { zone: date.zoneName })
      return value.isValid ? value : null
    },
    commuteRunsOnDate(commute, date) {
      const weekday = date.setLocale('en').toFormat('cccc').toLowerCase()
      return (commute.daysOfWeek || []).some(day => String(day).trim().toLowerCase() === weekday)
    },
    plannerPathSegment(value) {
      return encodeURIComponent(value).replace(/%2C/g, ',')
    },
    plannerPlans(results) {
      return [
        results?.JourneyPlans, results?.journeyPlans, results?.Plans, results?.plans,
        results?.data?.JourneyPlans, results?.data?.journeyPlans,
        results?.Data?.JourneyPlans, results?.Data?.journeyPlans, results
      ].find(Array.isArray) || []
    },
    async requestCommutePlans(originRef, destinationRef, datetime) {
      const response = await axios.get(`${API.URL}/core/planner/${this.plannerPathSegment(originRef)}/${this.plannerPathSegment(destinationRef)}`, {
        params: {
          count: 8,
          max_changes: 3,
          max_transfer_distance_metres: 1000,
          max_journey_duration_minutes: 720,
          view: 'web',
          datetime: datetime.toISO()
        }
      })
      return this.plannerPlans(response.data)
    },
    planCandidate(commute, direction, target, plans) {
      const outbound = direction === 'outbound'
      const now = this.currentTime
      const viable = plans.map(plan => {
        const displayPlan = journeyPlanForDisplay(plan)
        const start = this.journeyTimestamp(displayPlan.StartTime || displayPlan.startTime)
        const arrival = this.journeyTimestamp(displayPlan.ArrivalTime || displayPlan.arrivalTime)
        return { plan, displayPlan, start, arrival }
      }).filter(({ plan, start, arrival }) => {
        if (!Number.isFinite(start) || !Number.isFinite(arrival) || arrival <= now) return false
        if (outbound) return start < now || arrival <= target.toMillis() + 30 * 60 * 1000
        return start >= target.toMillis() - 60 * 1000
      })

      const active = viable.filter(item => item.start <= now && item.arrival > now)
      const upcoming = viable.filter(item => item.start > now)
      const selected = active.length
        ? active.sort((first, second) => first.arrival - second.arrival)[0]
        : upcoming.sort((first, second) => outbound
          ? second.arrival - first.arrival
          : first.start - second.start)[0]
      if (!selected) return null

      const routeItems = journeyPlanRouteItems(selected.plan)
      const displayRouteItems = journeyPlanRouteItems(selected.displayPlan)
      if (!displayRouteItems.some(item => item?.Journey || item?.journey || item?.RealtimeJourney || item?.realtimeJourney)) return null

      const steps = this.commuteSteps(displayRouteItems, commute, outbound, now, selected.displayPlan)
      const alertEntities = this.commuteAlertTargets(routeItems, selected.plan)

      return {
        key: `${commute.id || commute.originRef}-${direction}-${selected.plan.StartTime || selected.plan.startTime}`,
        name: commute.name || 'Saved commute',
        directionLabel: outbound ? 'Outward' : 'Return',
        start: selected.start,
        arrival: selected.arrival,
        steps,
        alertEntities,
        alertIdentifiers: [...new Set(alertEntities.flatMap(entity => entity.identifiers))]
      }
    },
    commuteStopName(stop, fallback) {
      return stop?.PrimaryName || stop?.primaryName || stop?.name || stop?.Name || fallback
    },
    commuteSteps(routeItems, commute, outbound, now, plan) {
      const originName = outbound ? this.commuteStopName(commute.origin, '') : this.commuteStopName(commute.destination, '')
      const destinationName = outbound ? this.commuteStopName(commute.destination, '') : this.commuteStopName(commute.origin, '')
      const items = routeItems.filter(item => item && typeof item === 'object')
      return items.map((item, index) => {
        const journey = item.Journey || item.journey || item.RealtimeJourney || item.realtimeJourney || null
        const isTransfer = String(item.Type || item.type || '').toLowerCase() === 'transfer'
        const start = item.StartTime || item.startTime || item.DepartureTime || item.departureTime || journey?.DepartureTime
        const arrival = item.ArrivalTime || item.arrivalTime || item.EndTime || item.endTime
        const startTimestamp = this.journeyTimestamp(start)
        const arrivalTimestamp = this.journeyTimestamp(arrival)
        const isActive = startTimestamp !== null && arrivalTimestamp !== null && startTimestamp <= now && arrivalTimestamp > now
        const itemOrigin = item.OriginStop || item.originStop || item.FromStop || item.fromStop
        const itemDestination = item.DestinationStop || item.destinationStop || item.ToStop || item.toStop
        const itemOriginRef = item.OriginStopRef || item.originStopRef || item.FromStopRef || item.fromStopRef || ''
        const itemDestinationRef = item.DestinationStopRef || item.destinationStopRef || item.ToStopRef || item.toStopRef || ''
        const origin = this.commuteStopName(itemOrigin, index === 0 ? originName : itemOriginRef)
        const destination = this.commuteStopName(itemDestination, index === items.length - 1 ? destinationName : itemDestinationRef)
        const realtime = journey?.RealtimeJourney || journey?.realtimeJourney || null
        const realtimeIsFresh = realtime?.ActivelyTracked && !realtime.Cancelled
        const service = journey?.Service || item.Service || item.service || null
        const transportType = service?.TransportType || item.TransportType || item.transportType || ''
        const serviceName = service?.ServiceName || service?.PrimaryName || service?.Name || transportType || 'Service'
        const realtimeStopForRef = ref => Object.values(realtime?.Stops || {}).find(stop => stop?.StopRef === ref)
        const realtimeOrigin = realtimeIsFresh ? realtimeStopForRef(itemOriginRef) : null
        const realtimeDestination = realtimeIsFresh ? realtimeStopForRef(itemDestinationRef) : null
        const journeyTimezone = journey?.DepartureTimezone
        const displayTimezone = journeyTimezone || DateTime.local().zoneName
        const displayStart = realtimeOrigin?.DepartureTime || realtimeOrigin?.ArrivalTime || start
        const displayArrival = realtimeDestination?.ArrivalTime || realtimeDestination?.DepartureTime || arrival
        const journeyId = journey?.PrimaryIdentifier || journey?.primaryIdentifier || journey?.Identifier || journey?.identifier || journey?.ID || journey?.id || ''
        const realtimeRunDate = realtime?.JourneyRunDate?.slice(0, 10)
        const journeyRunDate = /^\d{4}-\d{2}-\d{2}$/.test(realtimeRunDate || '')
          ? realtimeRunDate
          : DateTime.fromISO(plan?.StartTime || start || journey?.DepartureTime || '', { setZone: true })
            .setZone(displayTimezone)
            .toISODate()

        let nextStop = ''
        let nextStopTime = ''
        if (!isTransfer && isActive && realtimeIsFresh) {
          const nextRef = realtime.NextStopRef
          const path = journey?.Path || journey?.path || []
          const points = path.map(leg => ({
            stop: leg.OriginStop || leg.originStop,
            ref: leg.OriginStopRef || leg.originStopRef,
            time: leg.OriginArrivalTime || leg.OriginDepartureTime
          }))
          const finalLeg = path[path.length - 1]
          if (finalLeg) points.push({
            stop: finalLeg.DestinationStop || finalLeg.destinationStop,
            ref: finalLeg.DestinationStopRef || finalLeg.destinationStopRef,
            time: finalLeg.DestinationArrivalTime || finalLeg.DestinationDepartureTime
          })
          const nextIndex = Number.isInteger(realtime.NextStopIndex) && realtime.NextStopIndex > 0 && realtime.NextStopIndex < points.length
            ? realtime.NextStopIndex
            : -1
          const point = (nextIndex >= 0 ? points[nextIndex] : null) || points.find(value => value.ref === nextRef)
          const realtimeNextStop = Object.values(realtime?.Stops || {}).find(stop => nextIndex >= 0 && stop?.JourneyStopIndex === nextIndex) || realtimeStopForRef(nextRef)
          nextStop = this.commuteStopName(point?.stop || realtime.NextStop, '') ||
            (nextRef === itemOriginRef ? origin : nextRef === itemDestinationRef ? destination : '')
          nextStopTime = this.firstJourneyClockTime([
            realtimeNextStop?.ArrivalTime,
            realtimeNextStop?.DepartureTime,
            point?.time
          ], displayTimezone)
        }

        const isWalking = ['walking', 'walk'].includes(String(item.TransferType || item.transferType || '').toLowerCase()) ||
          Boolean(item.DistanceMetres || item.distanceMetres || item.WalkDurationSeconds || item.walkDurationSeconds)
        const transferDetails = []
        if (origin && destination && origin !== destination) transferDetails.push(`${origin} to ${destination}`)
        const transferDistance = item.DistanceMetres || item.distanceMetres
        if (transferDistance) transferDetails.push(transferDistance >= 1000 ? `${(transferDistance / 1000).toFixed(1)} km` : `${transferDistance} m`)
        const transferDuration = item.TotalDurationSeconds || item.totalDurationSeconds || item.WalkDurationSeconds || item.walkDurationSeconds
        if (transferDuration) transferDetails.push(Pretty.duration(transferDuration * 1e9))

        return {
          key: item.PrimaryIdentifier || item.Identifier || itemOriginRef || `${index}-${start || ''}`,
          isTransfer,
          isActive,
          title: isTransfer
            ? isWalking ? 'Walk' : `Change at ${destination || origin || 'station'}`
            : serviceName,
          subtitle: isTransfer ? transferDetails.join(' · ') || 'Transfer' : '',
          service: isTransfer ? null : service,
          journeyRoute: !isTransfer && journeyId
            ? { name: 'journeys/view', params: { id: journeyId }, query: { date: journeyRunDate || undefined } }
            : undefined,
          icon: ({ rail: 'train', train: 'train', bus: 'directions_bus', coach: 'airport_shuttle', tram: 'tram', metro: 'subway', ferry: 'directions_boat', air: 'flight', walk: 'directions_walk', walking: 'directions_walk' })[transportType.toLowerCase()] || 'route',
          origin,
          destination,
          nextStop,
          nextStopRef: isActive && realtimeIsFresh && !nextStop ? (realtime?.NextStopRef || '') : '',
          nextStopTime,
          startTime: this.firstJourneyClockTime([displayStart], displayTimezone),
          arrivalTime: this.firstJourneyClockTime([displayArrival], displayTimezone)
        }
      })
    },
    commuteAlertTargets(routeItems, plan) {
      const entities = new Map()
      const addEntity = (type, id, title, subtitle, identifier = id) => {
        if (!id || !identifier) return null
        const key = `${type}:${id}`
        const entity = entities.get(key) || { key, type, title, subtitle, identifiers: new Set() }
        entity.identifiers.add(identifier)
        entities.set(key, entity)
        return entity
      }

      for (const item of routeItems) {
        const journey = item.Journey || item.journey || item.RealtimeJourney || item.realtimeJourney
        const journeyId = journey?.PrimaryIdentifier || journey?.primaryIdentifier || journey?.Identifier || journey?.identifier || journey?.ID || journey?.id
        const service = journey?.Service || journey?.service || item.Service || item.service
        const serviceId = service?.PrimaryIdentifier || service?.primaryIdentifier || service?.Identifier || service?.identifier
        const serviceName = service?.ServiceName || service?.serviceName || service?.PrimaryName || service?.primaryName || service?.Name || service?.name || service?.TransportType || service?.transportType || 'Service'

        const originStop = item.OriginStop || item.originStop || item.FromStop || item.fromStop
        const destinationStop = item.DestinationStop || item.destinationStop || item.ToStop || item.toStop
        const originRef = item.OriginStopRef || item.originStopRef || item.FromStopRef || item.fromStopRef
        const destinationRef = item.DestinationStopRef || item.destinationStopRef || item.ToStopRef || item.toStopRef
        const originName = this.commuteStopName(originStop, originRef || '')
        const destinationName = this.commuteStopName(destinationStop, destinationRef || '')

        if (journeyId) {
          const realtime = journey?.RealtimeJourney || journey?.realtimeJourney
          const runDate = realtime?.JourneyRunDate?.slice(0, 10) ||
            DateTime.fromISO(plan.StartTime || plan.startTime, { setZone: true }).toISODate()
          const journeyKey = runDate ? `${journeyId}:${runDate}` : journeyId
          const journeyName = originName && destinationName
            ? `${originName} → ${destinationName}`
            : serviceName
          const journeyEntity = addEntity('journey', journeyKey, journeyName, serviceName, journeyId)
          if (runDate) journeyEntity.identifiers.add(`DAYINSTANCEOF:${runDate}:${journeyId}`)
        }

        if (serviceId) addEntity('service', serviceId, serviceName, '')
        if (originRef) {
          const descriptor = originStop?.Descriptor || originStop?.descriptor || ''
          const label = descriptor && !originName.toLowerCase().includes(descriptor.toLowerCase())
            ? `${originName} · ${descriptor}`
            : originName
          addEntity('stop', originRef, label, '')
        }
        if (destinationRef) {
          const descriptor = destinationStop?.Descriptor || destinationStop?.descriptor || ''
          const label = descriptor && !destinationName.toLowerCase().includes(descriptor.toLowerCase())
            ? `${destinationName} · ${descriptor}`
            : destinationName
          addEntity('stop', destinationRef, label, '')
        }

        const realtime = journey?.RealtimeJourney || journey?.realtimeJourney
        const nextStopRef = realtime?.NextStopRef || realtime?.nextStopRef
        if (nextStopRef) addEntity('stop', nextStopRef, realtime?.NextStopName || realtime?.nextStopName || nextStopRef, '')
      }

      return [...entities.values()].map(entity => ({ ...entity, identifiers: [...entity.identifiers] }))
    },
    async refreshCommutePlans() {
      if (this.commutePlanLoading) return
      if (!this.auth0.isAuthenticated || this.savedCommutes.length === 0) {
        this.commutePlanRequestVersion++
        this.commutePlanCandidates = []
        return
      }

      const requestVersion = ++this.commutePlanRequestVersion
      this.commutePlanLoading = true
      const candidates = []
      let completedRequest = false
      let firstError

      try {
        const now = DateTime.fromMillis(this.currentTime)
        for (const commute of this.savedCommutes) {
          if (!commute.originRef || !commute.destinationRef || !(commute.daysOfWeek || []).length) continue

          let occurrencesAttempted = 0
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const date = now.startOf('day').plus({ days: dayOffset })
            if (!this.commuteRunsOnDate(commute, date)) continue
            const outwardTarget = this.commuteDateTime(date, commute.arrivalAtDestinationTime)
            const returnTarget = this.commuteDateTime(date, commute.returnDepartureTime)
            const targetHorizon = dayOffset === 0
              ? now.endOf('day').toMillis()
              : this.currentTime + COMMUTE_UPCOMING_WINDOW_MS
            const outwardIsRelevant = outwardTarget &&
              outwardTarget.toMillis() > this.currentTime - COMMUTE_PLAN_LOOKBACK_MS &&
              outwardTarget.toMillis() <= targetHorizon + (dayOffset === 0 ? 0 : COMMUTE_MAX_JOURNEY_DURATION_MS)
            const returnIsRelevant = returnTarget &&
              returnTarget.toMillis() > this.currentTime - COMMUTE_PLAN_LOOKBACK_MS &&
              returnTarget.toMillis() <= targetHorizon
            if (!outwardIsRelevant && !returnIsRelevant) continue

            const candidateCountBeforeDate = candidates.length
            const requests = []
            if (outwardIsRelevant) {
              requests.push({
                direction: 'outbound',
                target: outwardTarget,
                promise: this.requestCommutePlans(commute.originRef, commute.destinationRef, outwardTarget.minus({ hours: 12 }))
              })
            }
            if (returnIsRelevant) {
              requests.push({
                direction: 'return',
                target: returnTarget,
                promise: this.requestCommutePlans(commute.destinationRef, commute.originRef, returnTarget)
              })
            }

            const results = await Promise.all(requests.map(request => request.promise.then(
              plans => ({ status: 'fulfilled', request, plans }),
              error => ({ status: 'rejected', request, error })
            )))
            if (requestVersion !== this.commutePlanRequestVersion) return
            occurrencesAttempted++

            for (const result of results) {
              if (result.status === 'fulfilled') {
                completedRequest = true
                const candidate = this.planCandidate(commute, result.request.direction, result.request.target, result.plans)
                if (candidate) candidates.push(candidate)
              } else {
                firstError ||= result.error
              }
            }
            if (candidates.length > candidateCountBeforeDate) break
            if (occurrencesAttempted >= 2) break
          }
        }

        if (requestVersion === this.commutePlanRequestVersion && (completedRequest || !firstError)) {
          this.commutePlanCandidates = candidates
          if (completedRequest) reportRequestSuccess()
        } else if (firstError) {
          reportRequestFailure(firstError)
        }
      } finally {
        if (requestVersion === this.commutePlanRequestVersion) this.commutePlanLoading = false
      }
    },
    async refreshCommuteAlerts(commute = this.featuredCommute) {
      const requestVersion = ++this.commuteAlertRequestVersion
      if (!commute || !commute.alertIdentifiers?.length || !isConnected()) {
        this.commuteAlerts = []
        return
      }

      try {
        const identifiers = encodeURIComponent(commute.alertIdentifiers.join(',')).replace(/%2C/g, ',')
        const stopLookups = commute.steps
          .map((step, index) => step.nextStopRef ? { step, index, promise: axios.get(`${API.URL}/core/stops/${encodeURIComponent(step.nextStopRef)}`, { params: { view: 'summary' } }) } : null)
          .filter(Boolean)
        const results = await Promise.allSettled([
          axios.get(`${API.URL}/core/service_alerts/matching/${identifiers}`, { params: { view: 'web' } }),
          ...stopLookups.map(lookup => lookup.promise)
        ])
        if (requestVersion !== this.commuteAlertRequestVersion || commute.key !== this.featuredCommute?.key) return
        if (results[0].status === 'fulfilled') {
          this.commuteAlerts = Array.isArray(results[0].value.data) ? results[0].value.data : []
        } else {
          reportRequestFailure(results[0].reason)
        }
        stopLookups.forEach((lookup, index) => {
          const result = results[index + 1]
          if (result?.status !== 'fulfilled') return
          const stopName = this.commuteStopName(result.value.data, '')
          lookup.step.nextStop = stopName
          if (stopName) {
            const stopEntity = commute.alertEntities?.find(entity => entity.type === 'stop' && entity.identifiers.includes(lookup.step.nextStopRef))
            if (stopEntity?.title === lookup.step.nextStopRef) stopEntity.title = stopName
            lookup.step.nextStopRef = ''
          }
        })
      } catch (error) {
        if (requestVersion === this.commuteAlertRequestVersion) reportRequestFailure(error)
      }
    },
    async getSavedItems() {
      if (this.savedItemsLoading) return
      this.savedItemsLoading = true
      this.savedStopsError = ''

      if (!this.auth0.isAuthenticated) {
        this.savedStops = []
        this.savedJourneys = []
        this.savedItemsLoading = false
        return
      }

      const scope = auth0CacheScope(this.auth0)
      const cached = scope
        ? await getCachedResource(cacheKeys.savedItems, { maxAgeMs: CACHE_MAX_AGE.savedItems, scope })
        : null

      if (cached) {
        this.savedStops = cached.data?.savedStops || []
        this.savedJourneys = cached.data?.savedJourneys || []
      }

      this.loadingSavedStops = !cached

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        const response = await axios.get(`${API.URL}/core/saved`, {
          headers: { Authorization: `Bearer ${auth0token}` },
          params: { view: 'web' }
        })
        reportRequestSuccess()
        const savedObjects = this.normaliseSavedObjects(response.data)
        this.savedStops = this.hydrateSavedStops(savedObjects)
        this.savedJourneys = this.hydrateSavedJourneys(savedObjects)

        if (scope) {
          await putCachedResource(cacheKeys.savedItems, {
            savedStops: this.savedStops,
            savedJourneys: this.savedJourneys
          }, { scope })
        }
      } catch (error) {
        console.log(error)
        reportRequestFailure(error)
        if (!cached) {
          this.savedStops = []
          this.savedStopsError = 'Saved stops could not be loaded.'
        }
      } finally {
        this.loadingSavedStops = false
        this.savedItemsLoading = false
      }
    },
    normaliseSavedObjects(responseData) {
      const resultSet = [
        responseData,
        responseData?.SavedObjects,
        responseData?.savedObjects,
        responseData?.data,
        responseData?.Data
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    hydrateSavedStops(savedObjects) {
      const stopObjects = savedObjects.filter(savedObject => ['stop', 'stops'].includes(String(savedObject.Type || '').toLowerCase()))
      const hydratedStops = stopObjects.map(savedObject => {
        if (!savedObject.Object) {
          return undefined
        }

        return {
          ...savedObject.Object,
          SavedObjectPrimaryIdentifier: savedObject.PrimaryIdentifier,
          SavedObjectIdentifier: savedObject.ObjectIdentifier
        }
      })

      return hydratedStops.filter(Boolean)
    },
    hydrateSavedJourneys(savedObjects) {
      const journeyObjects = savedObjects.filter(savedObject => ['journey', 'journeys'].includes(String(savedObject.Type || '').toLowerCase()))
      return journeyObjects
        .filter(savedObject => savedObject.Object)
        .map(savedObject => ({
          ...savedObject.Object,
          SavedObjectPrimaryIdentifier: savedObject.PrimaryIdentifier,
          SavedObjectIdentifier: savedObject.ObjectIdentifier
        }))
    },
    closeStatsModal() {
      this.statsModalOpen = false
    },
    requestNearbyStops() {
      this.pollNearbyLocation({ force: true, userInitiated: true })
      this.startNearbyLocationPolling()
    },
    enableNearbyLocationRefresh() {
      localStorage.setItem('travigo_nearby_location_enabled', 'true')
      this.startNearbyLocationPolling()
    },
    disableNearbyLocationRefresh() {
      localStorage.removeItem('travigo_nearby_location_enabled')
      this.stopNearbyLocationPolling()
    },
    startNearbyLocationPolling() {
      if (this.nearbyLocationRefreshTimer !== undefined) {
        return
      }

      this.nearbyLocationRefreshTimer = setInterval(() => {
        this.pollNearbyLocation()
      }, this.nearbyLocationPollIntervalMs)
    },
    stopNearbyLocationPolling() {
      clearInterval(this.nearbyLocationRefreshTimer)
      this.nearbyLocationRefreshTimer = undefined
    },
    startNearbyLocationPollingIfAllowed() {
      if (localStorage.getItem('travigo_nearby_location_enabled') === 'true') {
        this.pollNearbyLocation({ force: true })
        this.startNearbyLocationPolling()
        return
      }

      if (!navigator.permissions?.query) {
        return
      }

      navigator.permissions
        .query({ name: 'geolocation' })
        .then(permissionStatus => {
          const handlePermissionChange = () => {
            if (permissionStatus.state === 'granted') {
              this.enableNearbyLocationRefresh()
              this.pollNearbyLocation({ force: true })
            } else {
              this.disableNearbyLocationRefresh()
            }
          }

          if (permissionStatus.state === 'granted') {
            this.enableNearbyLocationRefresh()
            this.pollNearbyLocation({ force: true })
          }

          if (permissionStatus.addEventListener) {
            permissionStatus.addEventListener('change', handlePermissionChange)
          } else {
            permissionStatus.onchange = handlePermissionChange
          }
        })
        .catch(error => console.log(error))
    },
    pollNearbyLocation({ force = false, userInitiated = false } = {}) {
      this.nearbyStopsError = ''

      if (!navigator.geolocation) {
        this.nearbyStopsError = 'Location is not available in this browser.'
        return
      }

      if (userInitiated || force && this.nearbyStops.length === 0) {
        this.loadingNearbyStops = true
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          if (userInitiated) {
            this.enableNearbyLocationRefresh()
          }

          this.handleNearbyPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }, force)
        },
        error => {
          this.loadingNearbyStops = false

          if (error.code === error.PERMISSION_DENIED) {
            this.disableNearbyLocationRefresh()
          }

          if (userInitiated || this.nearbyStops.length === 0) {
            this.nearbyStopsError = error.code === error.PERMISSION_DENIED
              ? 'Location permission was denied. Enable location access to show nearby stops.'
              : 'Could not get your location. Try again in a moment.'
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    },
    handleNearbyPosition(position, force = false) {
      this.nearbyPosition = position

      const movedSignificantly = this.nearbyStopsPosition === undefined ||
        this.distanceBetween(
          this.nearbyStopsPosition.latitude,
          this.nearbyStopsPosition.longitude,
          position.latitude,
          position.longitude
        ) >= this.nearbyRefreshDistanceMetres

      if (force || movedSignificantly) {
        this.getNearbyStops(position)
        return
      }

      this.loadingNearbyStops = false
    },
    getNearbyStops(position = this.nearbyPosition) {
      const point = `${position.longitude},${position.latitude}`

      axios
        .get(`${API.URL}/core/stops/`, {
          params: {
            point,
            view: 'map'
          }
        })
        .then(response => {
          this.nearbyStops = this.normaliseNearbyStops(response.data).slice(0, 5)
          this.nearbyStopsPosition = position
        })
        .catch(error => {
          console.log(error)
          this.nearbyStopsError = 'Nearby stops could not be loaded.'
        })
        .finally(() => this.loadingNearbyStops = false)
    },
    normaliseNearbyStops(responseData) {
      const resultSet = [
        responseData,
        responseData?.stops,
        responseData?.Stops,
        responseData?.data,
        responseData?.Data,
        responseData?.data?.stops,
        responseData?.data?.Stops,
        responseData?.Data?.stops,
        responseData?.Data?.Stops,
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    stopKey(stop) {
      return stop.PrimaryIdentifier || stop.id || stop.PrimaryName
    },
    distanceBetween(latitudeA, longitudeA, latitudeB, longitudeB) {
      const earthRadiusMetres = 6371000
      const toRadians = degrees => degrees * Math.PI / 180
      const latitudeDelta = toRadians(latitudeB - latitudeA)
      const longitudeDelta = toRadians(longitudeB - longitudeA)
      const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) *
        Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      return earthRadiusMetres * c
    },
    getStats() {
      this.statsLoading = this.stats === undefined
      this.statsError = ''

      axios
        .get(`${API.URL}/stats/calculated`, { params: { view: 'web' } })
        .then(response => {
          if (!response.data || typeof response.data !== 'object' || Array.isArray(response.data)) {
            throw new Error('Unexpected stats response')
          }

          this.stats = response.data

          const generatedAt = Object.values(response.data)
            .map(stat => new Date(stat?.timestamp || stat?.Timestamp))
            .filter(timestamp => !Number.isNaN(timestamp.getTime()))
            .sort((first, second) => second.getTime() - first.getTime())[0]

          this.statsGeneratedAt = generatedAt
            ? new Intl.DateTimeFormat('en-GB', {
              hour: '2-digit',
              minute: '2-digit'
            }).format(generatedAt)
            : ''
        })
        .catch(error => {
          console.log(error)
          this.statsError = 'Network summary could not be refreshed.'
        })
        .finally(() => this.statsLoading = false)
    }
  },
  mounted () {
    this.getStats()
    this.startNearbyLocationPollingIfAllowed()
    this.getSavedItems()
    this.getSavedCommutes()
    this.savedJourneyStatusTimer = setInterval(() => {
      this.currentTime = Date.now()
      if (!document.hidden) {
        this.refreshCommutePlans()
        if (this.featuredCommute) this.refreshCommuteAlerts()
        else this.refreshFeaturedJourneyInfo()
      }
    }, 60000)

    if (this.stopPanelTab === 'saved') {
      this.getSavedItems()
    }

    this.refreshTimer = setInterval(this.getStats, 250000)
  },
  watch: {
    'auth0.isAuthenticated'() {
      this.getSavedItems()
      this.getSavedCommutes()
    },
    'featuredSavedJourney.identifier'(identifier) {
      this.featuredJourneyRequestVersion++
      this.featuredJourneyDetails = null
      this.featuredJourneyDetailsIdentifier = ''
      this.featuredJourneyRealtimeFetchedAt = 0
      this.featuredJourneyAlerts = []
      if (identifier && !this.featuredCommute) this.refreshFeaturedJourneyInfo(identifier)
    },
    'featuredCommute.key'(key) {
      this.commuteAlerts = []
      if (key) this.refreshCommuteAlerts(this.featuredCommute)
    }
  },
  beforeRouteLeave() {
    clearInterval(this.refreshTimer)
    clearInterval(this.savedJourneyStatusTimer)
    this.commuteListRequestVersion++
    this.commutePlanRequestVersion++
    this.commuteAlertRequestVersion++
    this.stopNearbyLocationPolling()
  },
  beforeUnmount() {
    clearInterval(this.refreshTimer)
    clearInterval(this.savedJourneyStatusTimer)
    this.commuteListRequestVersion++
    this.commutePlanRequestVersion++
    this.commuteAlertRequestVersion++
    this.stopNearbyLocationPolling()
  },
}
</script>
