<template>
  <LoadingState
    v-if="loadingStop"
    title="Loading stop"
    subtitle="Fetching stop details, services, amenities, and departures."
  />

  <div v-else-if="stop" class="ui-page ui-page-stack min-w-0">
    <PageHeader
      :title="stop.PrimaryName"
      :subtitle="stop.OtherNames?.Descriptor || ''"
      icon="location_on"
    >
      <template #actions>
        <EntityActionButtons
          entity-type="Stop"
          :entity-name="stop.PrimaryName"
          :entity-identifier="stop.PrimaryIdentifier"
          shape="square"
        />
      </template>

      <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" v-if="visibleServices.length > 0">
        <router-link
          :to="{'name': 'services/view', params: {'id': service.PrimaryIdentifier}}"
          v-for="service in visibleServices"
          v-bind:key="service.PrimaryIdentifier"
          class="shrink-0"
        >
          <ServiceIcon
            class="h-6 rounded-md px-2 text-[0.72rem] font-bold shadow-sm"
            style="line-height: 32px"
            :service="service"
          />
        </router-link>
      </div>

      <IconPillRow
        :chips="amenityChips"
        :loading="loadingStopDetails"
        :error="stopDetailsError"
        loading-label="Loading amenities"
        error-label="Amenities unavailable"
        empty-label="No amenities listed"
        @select="openAmenityModal"
      />
    </PageHeader>

    <ServiceAlertList
      :alerts="serviceAlerts"
      :max-visible="1"
      :context-name="stop?.PrimaryName"
      compact
    />

    <div
      v-if="showingCachedBoard"
      class="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <span class="material-symbols-outlined text-[17px]">schedule</span>
      Showing a saved board · {{ lastUpdatedLabel }}
    </div>

    <StopDeparturesTable
      :stop="stop"
      :departures="departures"
      :loading-departures="loadingDepartures && departures === null"
      :departures-error="departuresError"
      :arrivals="arrivals"
      :loading-arrivals="loadingArrivals && arrivals === null"
      :arrivals-error="arrivalsError"
      :board-reference-time="displayedBoardReference"
      :board-unknown="currentBoardPage?.Continuation === 'unknown' && !currentBoardPage?.Unsupported"
      :show-details="false"
      show-map
      v-model="currentTab"
      @tab-change="handleTabChange"
      @retry-departures="getDepartures"
      @retry-arrivals="getArrivals"
    >
      <template #controls>
        <BoardTimeControls ref="boardControls" :timezone="stop.Timezone" :reference="displayedBoardReference" :live="!displayedSelection?.datetime && !displayedSelection?.cursor" :can-change-time="!currentBoardPage?.Unsupported && !boardBrowsingUnavailable" :can-reset="!!($route.query.datetime || $route.query.cursor || displayedSelection?.datetime)" :board-type="currentTab" @time="selectBoardTime" @now="backToNow" />
      </template>
      <template #footer>
        <BoardTimeControls footer :timezone="stop.Timezone" :board-type="currentTab" :page="currentBoardPage" :loading="boardLoading || nextPagePending" :can-back="boardHistory.length > 0" :next-available="nextAvailable" :refreshed="boardRefreshed" :restart-required="boardRestartRequired" :error-message="boardNavigationError" :announcement="boardAnnouncement" @next="nextBoardPage" @back="backBoardPage" @retry="retryBoard" @restart="restartBoard" />
      </template>
      <template #map>
        <StationMap
          :stop="stop"
          :osm-stop="osmStop"
          :loading="loadingOSMStop"
          :error="osmStopError"
          @retry="getOSMStop(true)"
        />
      </template>
    </StopDeparturesTable>

    <DatasourceAttributes :datasources="utils.getDatasources(stop, stop.Services, serviceAlerts, stopDetails)" />

    <Teleport to="#bottom-nav-extra" defer>
      <div class="grid grid-cols-2 gap-2">
        <router-link
          :to="{
            name: 'journeyplanner/home',
            query: {
              destination: stop.PrimaryIdentifier,
              destinationName: stop.PrimaryName,
              destinationTimezone: stop.Timezone
            }
          }"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-bold text-brand-blue sm:rounded-xl"
        >
          <span class="material-symbols-outlined text-[21px]">route</span>
          <span>Plan a journey</span>
        </router-link>

        <button
          type="button"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 disabled:opacity-75 sm:rounded-xl"
          :disabled="boardLoading"
          @click="refreshBoard()"
        >
          <span class="material-symbols-outlined text-[24px]" :class="{'animate-spin': boardLoading}">refresh</span>
          <span class="leading-tight">
            {{ displayedSelection?.datetime ? 'Refresh board' : 'Refresh now' }}
            <span class="block text-[11px] font-semibold text-brand-blue-light">{{ lastUpdatedLabel }}</span>
          </span>
        </button>
      </div>
    </Teleport>
  </div>

  <div v-else-if="error" class="ui-page ui-page-stack">
    <ErrorState
      :icon="stopNotFound ? 'location_off' : 'error_outline'"
      :title="stopNotFound ? 'Stop not found' : 'Stop unavailable'"
      :message="error"
      retry
      :action-to="{ name: 'home' }"
      action-label="Search for another stop"
      @retry="retryStop"
    />
  </div>

  <Alert v-else type="warning" class="mt-4">
    This stop is not available offline yet. Open it once while connected to save it on this device.
  </Alert>

  <Modal
    v-model:open="amenityModalOpen"
    :title="selectedAmenity?.label || ''"
    :subtitle="selectedAmenity ? `${selectedAmenity.count} item${selectedAmenity.count === 1 ? '' : 's'} at or near this stop.` : ''"
    :icon="selectedAmenity?.icon || 'info'"
    size="lg"
    close-label="Close amenity details"
    body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
  >
            <div v-if="selectedAmenity?.type === 'place-list'" class="space-y-2">
              <article
                v-for="item in selectedAmenity.items"
                v-bind:key="amenityItemKey(item)"
                class="flex gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-500">
                  <img
                    v-if="amenityLogo(item)"
                    :src="amenityLogo(item)"
                    :alt="`${item.PrimaryName} logo`"
                    class="h-full w-full object-cover"
                  >
                  <span v-else class="text-sm font-bold text-slate-500">{{ amenityInitials(item.PrimaryName) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-bold text-slate-950 sm:text-base">{{ item.PrimaryName }}</h3>
                      <p class="mt-0.5 text-xs font-semibold text-slate-500">{{ formatAmenityType(item.Type) }}</p>
                    </div>
                    <span
                      v-if="item.Association"
                      class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                      :class="associationClass(item.Association)"
                    >
                      {{ formatAssociation(item.Association) }}
                    </span>
                    <a
                      v-if="item.Website"
                      :href="item.Website"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue transition hover:bg-brand-blue/20"
                      :aria-label="`Open ${item.PrimaryName} website`"
                    >
                      <span class="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  </div>
                  <p class="mt-2 text-sm text-slate-600" v-if="item.LocationDescription">
                    {{ item.LocationDescription }}
                  </p>
                  
                </div>
              </article>
            </div>

            <div v-else-if="selectedAmenity?.type === 'parking-list'" class="space-y-2">
              <article
                v-for="(item, index) in selectedAmenity.items"
                v-bind:key="amenityItemKey(item, index)"
                class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <span class="material-symbols-outlined text-[22px]">{{ selectedAmenity.icon }}</span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3 class="text-sm font-bold text-slate-950 sm:text-base">
                          {{ item.PrimaryName || `${selectedAmenity.itemLabel} ${index + 1}` }}
                        </h3>
                        <p class="mt-0.5 text-xs font-semibold text-slate-500">{{ formatAmenityType(item.Type) }}</p>
                      </div>
                      <span
                        v-if="item.Association"
                        class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                        :class="associationClass(item.Association)"
                      >
                        {{ formatAssociation(item.Association) }}
                      </span>
                    </div>

                    <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div class="rounded-xl bg-slate-50 px-3 py-2">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Capacity</p>
                        <p class="mt-0.5 text-sm font-bold text-slate-950">{{ formatCapacity(item.Capacity) }}</p>
                      </div>
                      <div class="rounded-xl bg-slate-50 px-3 py-2">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Distance</p>
                        <p class="mt-0.5 text-sm font-bold text-slate-950">{{ formatAmenityDistance(item.DistanceMetres) || 'At stop' }}</p>
                      </div>
                      <div class="rounded-xl bg-slate-50 px-3 py-2">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Cost</p>
                        <p class="mt-0.5 text-sm font-bold text-slate-950">{{ item.Cost ? 'Paid' : 'Free' }}</p>
                      </div>
                      <div class="rounded-xl bg-slate-50 px-3 py-2">
                        <p class="text-xs font-bold uppercase tracking-wide text-slate-400">Cover</p>
                        <p class="mt-0.5 text-sm font-bold text-slate-950">{{ item.Covered ? 'Covered' : 'Uncovered' }}</p>
                      </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="item.Accessible ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'">
                        {{ item.Accessible ? 'Accessible' : 'Not marked accessible' }}
                      </span>
                      <span v-if="item.OperatorName" class="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue">
                        {{ item.OperatorName }}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div v-else-if="selectedAmenity?.key === 'Toilets'" class="space-y-2">
              <article
                v-for="(toilet, index) in selectedAmenity.items"
                v-bind:key="amenityItemKey(toilet, index)"
                class="rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <span class="material-symbols-outlined text-[22px]">wc</span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-bold text-slate-950 sm:text-base">Toilet {{ index + 1 }}</h3>
                    <p class="mt-1 text-sm text-slate-600" v-if="toilet.LocationDescription">{{ toilet.LocationDescription }}</p>
                    <div class="mt-3 flex flex-wrap gap-2" v-if="toilet.Association || formatAmenityDistance(toilet.DistanceMetres)">
                      <span
                        v-if="toilet.Association"
                        class="rounded-full px-2.5 py-1 text-xs font-bold"
                        :class="associationClass(toilet.Association)"
                      >
                        {{ formatAssociation(toilet.Association) }}
                      </span>
                      <span v-if="formatAmenityDistance(toilet.DistanceMetres)" class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {{ formatAmenityDistance(toilet.DistanceMetres) }}
                      </span>
                    </div>
                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Accessible ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'">
                        {{ toilet.Accessible ? 'Accessible' : 'Not marked accessible' }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Cost ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'">
                        {{ toilet.Cost ? 'Paid' : 'Free' }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.CustomerOnly ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'">
                        {{ toilet.CustomerOnly ? 'Customers only' : 'Public access' }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Male ? 'bg-brand-blue/10 text-brand-blue' : 'bg-slate-100 text-slate-500'">
                        {{ toilet.Male ? 'Male toilets' : 'No male toilets listed' }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Female ? 'bg-brand-pink/10 text-brand-pink' : 'bg-slate-100 text-slate-500'">
                        {{ toilet.Female ? 'Female toilets' : 'No female toilets listed' }}
                      </span>
                    </div>
                    <div
                      v-if="toilet.OpenHoursDescription"
                      class="mt-3 flex gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
                    >
                      <span class="material-symbols-outlined mt-0.5 text-[18px] text-slate-400">schedule</span>
                      <span>{{ toilet.OpenHoursDescription }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="space-y-2">
              <article
                v-for="(item, index) in selectedAmenity?.items || []"
                v-bind:key="amenityItemKey(item, index)"
                class="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm"
              >
                {{ item.PrimaryName || item.Type || item.LocationDescription || `Item ${index + 1}` }}
              </article>
            </div>
  </Modal>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import Alert from '@/components/Alert.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import EntityActionButtons from '@/components/EntityActionButtons.vue'
import ErrorState from '@/components/ErrorState.vue'
import IconPillRow from '@/components/IconPillRow.vue'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'
import StopDeparturesTable from '@/components/Stops/StopDeparturesTable.vue'
import BoardTimeControls from '@/components/Stops/BoardTimeControls.vue'
import StationMap from '@/components/Stops/StationMap.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'
import Utils from '@/utils'
import { isConnected } from '@/offline/connectivity'
import { cacheAgeLabel, CACHE_MAX_AGE, CACHE_REVALIDATE_AFTER, cacheKeys, getCachedResource, putCachedResource, loadCachedResource } from '@/offline/resourceCache'

const AMENITY_SECTIONS = {
  FoodDrink: {
    label: 'Food & drink',
    icon: 'restaurant',
    type: 'place-list'
  },
  Shops: {
    label: 'Shops',
    icon: 'storefront',
    type: 'place-list'
  },
  BicyclePark: {
    label: 'Cycle parking',
    icon: 'pedal_bike',
    type: 'parking-list',
    itemLabel: 'Cycle parking'
  },
  CarPark: {
    label: 'Car parking',
    icon: 'local_parking',
    type: 'parking-list',
    itemLabel: 'Car park'
  },
  Toilets: {
    label: 'Toilets',
    icon: 'wc',
    type: 'toilets'
  }
}

export default {
  name: 'StopsView',
  data () {
    return {
      pretty: Pretty,
      utils: Utils,
      stop: null,
      loadingStop: true,

      departures: null,
      loadingDepartures: true,
      departuresError: false,

      arrivals: null,
      loadingArrivals: true,
      arrivalsError: false,


      serviceAlerts: [],
      stopDetails: {},
      loadingStopDetails: false,
      stopDetailsError: false,

      osmStop: null,
      loadingOSMStop: false,
      osmStopError: false,

      error: undefined,
      stopNotFound: false,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,
      boardFromCache: {
        arrivals: false,
        departures: false
      },
      boardUpdatedAt: {
        arrivals: null,
        departures: null
      },
      currentTime: Date.now(),
      amenityModalOpen: false,
      selectedAmenityKey: null,

      currentTab: "departures",
      boardPages: { departures: null, arrivals: null },
      displayedSelections: { departures: null, arrivals: null },
      boardHistory: [],
      boardNavigationError: '',
      boardAnnouncement: '',
      boardRequestId: 0,
      boardAbort: null,
      restoreScroll: null,
      nextAvailable: true,
      nextPagePending: false,
      boardRefreshed: false,
      pendingRefresh: false,
      boardRestartRequired: false,
      boardBrowsingUnavailable: false,
      ownBoardNavigation: false,
    }
  },
  components: {
    ServiceIcon,
    Alert,
    DatasourceAttributes,
    EntityActionButtons,
    ErrorState,
    IconPillRow,
    LoadingState,
    Modal,
    PageHeader,
    ServiceAlertList,
    StopDeparturesTable,
    BoardTimeControls,
    StationMap
  },
  computed: {
    displayedSelection() { return this.displayedSelections[this.currentTab] || null },
    displayedBoardReference() { return this.displayedSelection?.datetime || this.displayedSelection?.reference || this.currentTime },
    currentBoardPage() { return this.boardPages[this.currentTab] || null },
    visibleServices() {
      return this.stop?.Services || []
    },
    amenityChips() {
      return this.amenitySections.map(section => ({
        key: section.key,
        label: section.label,
        icon: section.icon,
        count: section.count
      }))
    },
    amenitySections() {
      if (this.stopDetails === null || this.stopDetails === undefined) {
        return []
      }

      const configuredSections = Object.entries(AMENITY_SECTIONS)
        .map(([key, config]) => this.amenitySectionFromDetails(key, config))
        .filter(section => section.count > 0)

      const configuredKeys = Object.keys(AMENITY_SECTIONS)
      const extraSections = Object.entries(this.stopDetails)
        .filter(([key, value]) => !configuredKeys.includes(key) && Array.isArray(value) && value.length > 0)
        .map(([key]) => this.amenitySectionFromDetails(key, {
          label: this.formatAmenitySectionLabel(key),
          icon: 'info',
          type: 'generic'
        }))

      return [...configuredSections, ...extraSections]
    },
    selectedAmenity() {
      if (this.selectedAmenityKey === null) {
        return null
      }

      return this.amenitySections.find(section => section.key === this.selectedAmenityKey) || null
    },
    currentBoardFromCache() {
      return this.boardFromCache[this.currentTab] || false
    },
    showingCachedBoard() {
      return this.currentBoardFromCache && !this.boardLoading
    },
    lastUpdatedAt() {
      return this.boardUpdatedAt[this.currentTab] || null
    },
    lastUpdatedLabel() {
      if (this.lastUpdatedAt === null) {
        return 'Not updated yet'
      }

      const prefix = this.showingCachedBoard ? 'Cached' : 'Updated'
      return `${prefix} ${cacheAgeLabel(this.lastUpdatedAt, this.currentTime)}`
    },
    boardLoading() {
      if (this.currentTab === 'arrivals') {
        return this.loadingArrivals
      }

      if (this.currentTab === 'departures') {
        return this.loadingDepartures
      }

      return false
    },
    isTrainStation() {
      return (this.stop?.TransportTypes || []).some(transportType => String(transportType).toLowerCase() === 'rail')
    }
  },
  watch: {
    '$route.params.id'(id, previous) {
      if (id === previous) return
      this.boardAbort?.abort(); this.boardRequestId++
      this.stop = null; this.loadingStop = true; this.departures = null; this.arrivals = null
      this.osmStop = null; this.loadingOSMStop = false; this.osmStopError = false; this.stopDetails = {}; this.serviceAlerts = []
      this.boardFromCache = { departures: false, arrivals: false }; this.boardUpdatedAt = { departures: null, arrivals: null }
      this.boardNavigationError = ''; this.boardAnnouncement = ''; this.restoreScroll = null
      this.boardPages = { departures: null, arrivals: null }; this.displayedSelections = { departures: null, arrivals: null }; this.boardHistory = []
      this.getData()
    },
    '$route.query'(next, previous) {
      const tuple = q => [q.board || 'departures', q.datetime || '', q.cursor || ''].join('|')
      if (tuple(next) === tuple(previous)) return
      if (this.ownBoardNavigation) this.ownBoardNavigation = false
      else this.boardHistory = []
      const board = next.board === 'arrivals' ? 'arrivals' : 'departures'
      if (this.currentTab !== 'map') this.currentTab = board
      this.loadBoard(board)
    }
  },
  methods: {
    amenitySectionFromDetails(key, config) {
      const items = this.sortAmenityItems(this.stopDetails?.[key] || [])

      return {
        key,
        label: config.label,
        icon: config.icon,
        type: config.type,
        itemLabel: config.itemLabel,
        items,
        count: items.length
      }
    },
    sortAmenityItems(items) {
      return [...items].sort((a, b) => {
        const associationDifference = this.associationSortValue(a.Association) - this.associationSortValue(b.Association)

        if (associationDifference !== 0) {
          return associationDifference
        }

        return this.distanceSortValue(a.DistanceMetres) - this.distanceSortValue(b.DistanceMetres)
      })
    },
    associationSortValue(association) {
      const normalisedAssociation = String(association || '').toLowerCase()

      if (normalisedAssociation === 'inside') {
        return 0
      }

      if (normalisedAssociation === 'nearby') {
        return 1
      }

      return 2
    },
    distanceSortValue(distance) {
      return typeof distance === 'number' ? distance : Number.POSITIVE_INFINITY
    },
    formatAmenitySectionLabel(key) {
      return key
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
    },
    formatAmenityType(type) {
      if (!type) {
        return 'Details unavailable'
      }

      return type
        .replace(/_/g, ' ')
        .replace(/\b\w/g, character => character.toUpperCase())
    },
    formatAssociation(association) {
      if (!association) {
        return ''
      }

      return String(association)
        .replace(/_/g, ' ')
        .replace(/\b\w/g, character => character.toUpperCase())
    },
    associationClass(association) {
      return String(association || '').toLowerCase() === 'inside'
        ? 'bg-green-50 text-green-700'
        : 'bg-brand-blue/10 text-brand-blue'
    },
    formatAmenityDistance(distance) {
      if (typeof distance !== 'number') {
        return ''
      }

      if (distance < 1) {
        return 'At stop'
      }

      return ''
      // if (distance < 1000) {
      //   return `${Math.max(Math.round(distance), 1)} m away`
      // }

      // return `${(distance / 1000).toFixed(1)} km away`
    },
    formatCapacity(capacity) {
      if (typeof capacity !== 'number' || capacity <= 0) {
        return 'Unknown'
      }

      return capacity.toLocaleString()
    },
    amenityLogo(item) {
      return item.Logo || item.LogoURL || item.ImageURL || ''
    },
    amenityInitials(name) {
      if (!name) {
        return '?'
      }

      return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('')
    },
    amenityItemKey(item, index = 0) {
      return `${item.PrimaryName || item.Type || 'amenity'}-${item.WikiDataID || item.Website || item.Location?.coordinates?.join(',') || index}`
    },
    openAmenityModal(key) {
      this.selectedAmenityKey = key
      this.amenityModalOpen = true
    },
    closeAmenityModal() {
      this.amenityModalOpen = false
    },
    normaliseStopDetails(details) {
      if (details === null || details === undefined) {
        return {}
      }

      return details.Details || details.StopDetails || details
    },
    filterElapsedBoardItems(items, selection) {
      if (!Array.isArray(items) || selection?.datetime || selection?.cursor) return items

      const cutoff = this.currentTime - 60000
      return items.filter(item => {
        const time = Date.parse(item?.Time)
        return Number.isNaN(time) || time >= cutoff
      })
    },
    refreshView(tab = this.currentTab) {
      if (tab === 'departures') {
        this.getDepartures()
      } else if (tab === 'arrivals') {
        this.getArrivals()
      } else if (tab === 'map') {
        this.getOSMStop()
      }
    },
    async getStop() {
      let cachedApplied = false
      const stopID = this.$route.params.id

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stop(stopID),
          maxAgeMs: CACHE_MAX_AGE.entity,
          revalidateAfterMs: CACHE_REVALIDATE_AFTER.stop,
          request: () => axios.get(`${API.URL}/core/stops/${stopID}`, { params: { view: 'detail' } }),
          onCached: record => {
            if (stopID !== this.$route.params.id) return
            cachedApplied = true
            this.stop = record.data
            this.loadingStop = false
          }
        })

        if (stopID !== this.$route.params.id) return
        if (result.source === 'network' || !cachedApplied) {
          this.stop = result.data
        }
        this.error = undefined
        this.stopNotFound = false
      } catch (error) {
        if (stopID !== this.$route.params.id) return
        console.log(error)
        if (!this.stop) {
          this.stopNotFound = error.response?.status === 404
          this.error = this.stopNotFound ? 'This stop does not exist, or is no longer available.' : 'Stop details could not be loaded.'
        }
      } finally {
        if (stopID === this.$route.params.id) this.loadingStop = false
      }
    },
    retryStop() {
      this.loadingStop = true
      this.error = undefined
      this.stopNotFound = false
      this.getStop()
    },
    getDepartures() { return this.loadBoard('departures') },
    getArrivals() { return this.loadBoard('arrivals') },
    async loadBoard(boardType) {
      if (!this.stop) return
      const id = this.$route.params.id
      const selection = { datetime: this.$route.query.datetime || '', cursor: this.$route.query.cursor || '' }
      const generation = ++this.boardRequestId
      this.boardAbort?.abort()
      const controller = new AbortController()
      this.boardAbort = controller
      const loadingKey = boardType === 'arrivals' ? 'loadingArrivals' : 'loadingDepartures'
      const errorKey = boardType === 'arrivals' ? 'arrivalsError' : 'departuresError'
      this.loadingDepartures = false; this.loadingArrivals = false
      this[loadingKey] = true
      this[errorKey] = false
      this.boardNavigationError = ''
      this.boardRestartRequired = false
      this.boardBrowsingUnavailable = false
      this.boardRefreshed = false
      const apply = (data, savedAt, source) => {
        if (generation !== this.boardRequestId || !Array.isArray(data?.Items) || !data.Page) return false
        this[boardType] = this.filterElapsedBoardItems(data.Items, selection)
        this.boardPages[boardType] = data.Page
        this.displayedSelections[boardType] = { ...selection, reference: data.Page.ReferenceDateTime }
        this.boardUpdatedAt[boardType] = new Date(savedAt)
        this.boardFromCache[boardType] = source === 'cache'
        this.updateNextAvailable(boardType, data.Page, selection)
        const first = data.Items[0]?.Time
        const last = data.Items[data.Items.length - 1]?.Time
        this.boardAnnouncement = first ? `${data.Items.length} journeys loaded, from ${this.pretty.time(first, this.stop?.Timezone)} to ${this.pretty.time(last, this.stop?.Timezone)}` : 'No journeys found in this page'
        return true
      }
      try {
        const result = await loadCachedResource({
          key: cacheKeys.boardPage(this.stop?.PrimaryIdentifier || id, boardType, selection.datetime, selection.cursor),
          maxAgeMs: CACHE_MAX_AGE.board,
          request: async () => {
            const url = `${API.URL}/core/stops/${encodeURIComponent(id)}/${boardType}`
            const params = { count: 25, view: 'compact' }
            if (selection.datetime) params.datetime = selection.datetime
            const cursorParams = { ...params, pagination: 'cursor' }
            if (selection.cursor) cursorParams.cursor = selection.cursor

            let response
            try {
              response = await axios.get(url, { signal: controller.signal, params: cursorParams })
            } catch (error) {
              const code = error.response?.data?.code
              const live = !selection.datetime && !selection.cursor
              if (!live || !['board_cursor_unsupported', 'board_cursor_unavailable'].includes(code)) throw error
              response = await axios.get(url, { signal: controller.signal, params })
            }
            if (!Array.isArray(response.data) || selection.datetime || selection.cursor) return response

            return {
              ...response,
              data: {
                Items: response.data,
                Page: {
                  ReferenceDateTime: new Date().toISOString(),
                  Continuation: 'unknown',
                  Unsupported: true
                }
              }
            }
          },
          onCached: record => { apply(record.data, record.savedAt, 'cache') }
        })
        if (generation !== this.boardRequestId) return
        if (!apply(result.data, result.savedAt, result.source)) throw new Error('Invalid board response')
        if (this.pendingRefresh && !result.error) this.boardRefreshed = true
        this.pendingRefresh = false
        if (!selection.datetime && !selection.cursor && result.source === 'network' && result.data.Page.ReferenceDateTime) {
          putCachedResource(cacheKeys.boardPage(this.stop.PrimaryIdentifier, boardType, result.data.Page.ReferenceDateTime, ''), result.data)
        }
        if (result.error && isConnected()) {
          this.boardRestartRequired = result.error.response?.data?.code === 'board_cursor_expired'
          this.boardNavigationError = this.boardRestartRequired ? 'This page has expired; restart the search.' : 'The latest board could not be loaded; showing the saved page.'
        }
        if (selection.cursor || this.restoreScroll !== null) this.$nextTick(() => { if (this.restoreScroll !== null) { window.scrollTo(0, this.restoreScroll); this.restoreScroll = null }; this.$refs.boardControls?.focusSummary() })
      } catch (error) {
        if (generation !== this.boardRequestId || axios.isCancel(error)) return
        this[errorKey] = true
        this.pendingRefresh = false
        const code = error.response?.data?.code
        this.boardRestartRequired = code === 'board_cursor_expired'
        this.boardBrowsingUnavailable = code === 'board_cursor_unsupported' || code === 'board_cursor_unavailable'
        if (!isConnected()) {
          this.boardNavigationError = 'Connect to load this page.'
        } else if (this.boardRestartRequired) {
          this.boardNavigationError = 'This page has expired; restart the search.'
        } else if (this.boardBrowsingUnavailable) {
          this.boardNavigationError = 'Browsing later journeys is not available for this stop.'
        } else {
          this.boardNavigationError = 'This board could not be loaded.'
        }
      } finally {
        if (generation === this.boardRequestId) this[loadingKey] = false
      }
    },
    handleTabChange(tab) {
      this.pendingRefresh = false
      if (tab === 'map') { this.getOSMStop(); return }
      const selectedBoard = this.$route.query.board === 'arrivals' ? 'arrivals' : 'departures'
      if (selectedBoard === tab) {
        if (this[tab] === null) this.loadBoard(tab)
        return
      }
      const query = { ...this.$route.query, board: tab }; delete query.cursor
      this.boardHistory = []
      this.$router.push({ query })
    },
    selectBoardTime(datetime) {
      this.pendingRefresh = false
      this.boardHistory = []
      const query = { ...this.$route.query, board: this.currentTab, datetime }; delete query.cursor
      this.$router.push({ query })
    },
    backToNow() {
      this.pendingRefresh = false
      this.boardHistory = []
      const query = { ...this.$route.query, board: this.currentTab }; delete query.datetime; delete query.cursor
      this.$router.push({ query })
    },
    async nextBoardPage() {
      const cursor = this.currentBoardPage?.NextCursor
      if (!cursor || this.boardLoading || this.nextPagePending || !this.stop) return

      const route = this.$route
      const stopID = this.stop.PrimaryIdentifier
      const board = this.currentTab
      const page = this.currentBoardPage
      const current = this.displayedSelection || {}
      const datetime = current.datetime || page.ReferenceDateTime
      this.pendingRefresh = false
      this.nextPagePending = true

      try {
        if (!isConnected()) {
          const cached = await getCachedResource(cacheKeys.boardPage(stopID, board, datetime, cursor), { maxAgeMs: CACHE_MAX_AGE.board })
          if (this.$route !== route || this.currentTab !== board || this.currentBoardPage !== page) return
          if (!cached) {
            this.boardNavigationError = 'Connect to load later journeys.'
            return
          }
        }

        if (route.query.cursor === cursor && route.query.datetime === datetime) {
          await this.loadBoard(board)
          return
        }

        this.boardHistory.push({ datetime, cursor: current.cursor || '', scroll: window.scrollY })
        this.ownBoardNavigation = true
        const failure = await this.$router.push({ query: { ...route.query, board, datetime, cursor } })
        if (failure && this.$route === route) {
          this.boardHistory.pop()
          this.ownBoardNavigation = false
        }
      } finally {
        this.nextPagePending = false
      }
    },
    async updateNextAvailable(boardType = this.currentTab, page = this.currentBoardPage, selection = this.displayedSelection) {
      if (!page?.NextCursor || isConnected()) { this.nextAvailable = true; return }
      this.nextAvailable = false
      const cached = await getCachedResource(cacheKeys.boardPage(this.stop.PrimaryIdentifier, boardType, selection?.datetime || page.ReferenceDateTime, page.NextCursor), { maxAgeMs: CACHE_MAX_AGE.board })
      if (boardType === this.currentTab && page.NextCursor === this.currentBoardPage?.NextCursor) this.nextAvailable = !!cached
    },
    backBoardPage() {
      this.pendingRefresh = false
      const previous = this.boardHistory.pop()
      if (!previous) return
      this.restoreScroll = previous.scroll
      const query = { ...this.$route.query, board: this.currentTab, datetime: previous.datetime }
      if (previous.cursor) query.cursor = previous.cursor; else delete query.cursor
      this.ownBoardNavigation = true
      this.$router.push({ query })
    },
    retryBoard() { this.loadBoard(this.$route.query.board === 'arrivals' ? 'arrivals' : 'departures') },
    restartBoard() {
      this.boardHistory = []
      const query = { ...this.$route.query }; delete query.cursor
      this.$router.push({ query })
    },
    refreshBoard() {
      this.pendingRefresh = true
      if (this.currentTab === 'map') { this.getOSMStop(true); return }
      if (!this.displayedSelection?.datetime && !this.displayedSelection?.cursor) { this.loadBoard(this.currentTab); return }
      this.boardHistory = []
      const query = { ...this.$route.query, board: this.currentTab, datetime: this.displayedSelection.reference || this.displayedSelection.datetime }
      delete query.cursor
      if (!this.$route.query.cursor && this.$route.query.datetime === query.datetime) this.loadBoard(this.currentTab)
      else this.$router.push({ query })
    },
    getServiceAlerts() {
      if (!isConnected()) {
        return
      }

      const stopID = this.$route.params.id
      axios
        .get(`${API.URL}/core/service_alerts/stop/${stopID}`, { params: { view: 'web' } })
        .then(response => {
          if (stopID !== this.$route.params.id) return
          this.serviceAlerts = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    async getStopDetails() {
      const stopID = this.$route.params.id
      this.loadingStopDetails = true
      this.stopDetailsError = false

      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stopDetails(stopID),
          maxAgeMs: CACHE_MAX_AGE.entity,
          request: () => axios.get(`${API.URL}/core/stops/${stopID}/detailed`, { params: { view: 'web' } }),
          onCached: record => {
            if (stopID !== this.$route.params.id) return
            cachedApplied = true
            this.stopDetails = this.normaliseStopDetails(record.data)
            this.loadingStopDetails = false
          }
        })

        if (stopID !== this.$route.params.id) return
        if (result.source === 'network' || !cachedApplied) {
          this.stopDetails = this.normaliseStopDetails(result.data)
        }
      } catch (error) {
        if (stopID !== this.$route.params.id) return
        console.log(error)
        if (!cachedApplied) {
          this.stopDetails = {}
          this.stopDetailsError = true
        }
      } finally {
        if (stopID === this.$route.params.id) this.loadingStopDetails = false
      }
    },
    async getOSMStop(forceRefresh = false) {
      if (!this.isTrainStation || this.loadingOSMStop || (this.osmStop !== null && !forceRefresh)) {
        return
      }

      this.loadingOSMStop = true
      const stopID = this.$route.params.id
      this.osmStopError = false

      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stopOSM(stopID),
          maxAgeMs: CACHE_MAX_AGE.entity,
          request: () => axios.get(`${API.URL}/core/stops/${encodeURIComponent(stopID)}/osm`, {
            params: { view: 'map', ...(forceRefresh ? { force_refresh: true } : {}) }
          }),
          onCached: record => {
            if (stopID !== this.$route.params.id) return
            cachedApplied = true
            this.osmStop = record.data
          }
        })

        if (stopID !== this.$route.params.id) return
        if (result.source === 'network' || !cachedApplied) {
          this.osmStop = result.data
        }
      } catch (error) {
        if (stopID !== this.$route.params.id) return
        console.log(error)
        if (!cachedApplied) {
          this.osmStop = null
          this.osmStopError = true
        }
      } finally {
        if (stopID === this.$route.params.id) this.loadingOSMStop = false
      }
    },
    async getData() {
      const stopID = this.$route.params.id
      await this.getStop()
      if (stopID !== this.$route.params.id || !this.stop) return
      this.refreshView()
      this.getServiceAlerts()
      this.getStopDetails()
    },
    pollView() {
      this.currentTime = Date.now()

      if (this.currentBoardFromCache) {
        this[this.currentTab] = this.filterElapsedBoardItems(this[this.currentTab], this.displayedSelection)
      }

      if (!document.hidden && isConnected() && !this.$route.query.datetime && !this.$route.query.cursor) {
        this.refreshView()
      }
    },
    pollServiceAlerts() {
      if (!document.hidden && isConnected()) {
        this.getServiceAlerts()
      }
    },
    handleReconnect() { this.updateNextAvailable(); this.retryBoard(); this.getServiceAlerts() },
    handleOffline() { this.updateNextAvailable() },
    handleVisibilityChange() {
      if (!document.hidden && !this.$route.query.datetime && !this.$route.query.cursor) this.refreshView()
    },
    stopPolling() {
      this.boardRequestId++; this.boardAbort?.abort()
      clearInterval(this.refreshTimer)
      clearInterval(this.serviceAlertsRefreshTimer)
      window.removeEventListener('online', this.handleReconnect)
      window.removeEventListener('offline', this.handleOffline)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  },
  mounted () {
    this.currentTab = this.$route.query.board === 'arrivals' ? 'arrivals' : 'departures'
    this.getData()
    this.refreshTimer = setInterval(this.pollView, 30000)
    this.serviceAlertsRefreshTimer = setInterval(this.pollServiceAlerts, 60000)
    window.addEventListener('online', this.handleReconnect)
    window.addEventListener('offline', this.handleOffline)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
  },
  beforeRouteLeave() {  
    this.stopPolling()
  },
  beforeUnmount() {
    this.stopPolling()
  }
}
</script>
