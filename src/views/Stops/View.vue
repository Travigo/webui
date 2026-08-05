<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>

  <LoadingState
    v-if="loadingStop"
    title="Loading stop"
    subtitle="Fetching stop details, services, amenities, and departures."
  />

  <div v-else-if="stop" class="space-y-4 pb-16 pt-2 sm:pb-20">
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
      v-if="currentBoardFromCache"
      class="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <span class="material-symbols-outlined text-[17px]">schedule</span>
      Showing a saved board · {{ lastUpdatedLabel }}
    </div>

    <StopDeparturesTable
      :stop="stop"
      :departures="departures"
      :loading-departures="loadingDepartures && departures === null"
      :arrivals="arrivals"
      :loading-arrivals="loadingArrivals && arrivals === null"
      :show-details="false"
      show-map
      v-model="currentTab"
      @tab-change="refreshView"
    >
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
          :to="{ name: 'journeyplanner/home' }"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3 text-sm font-extrabold text-blue-700 sm:min-h-11 sm:rounded-2xl"
        >
          <span class="material-symbols-outlined text-[21px]">route</span>
          <span>Plan a journey</span>
        </router-link>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand-blue px-3 text-sm font-extrabold text-white shadow-lg shadow-brand-blue/20 disabled:opacity-75 sm:min-h-11 sm:rounded-2xl"
          :disabled="boardLoading"
          @click="refreshView()"
        >
          <span class="material-symbols-outlined text-[24px]" :class="{'animate-spin': boardLoading}">refresh</span>
          <span class="leading-tight">
            Refresh now
            <span class="block text-[10px] font-semibold text-blue-100">{{ lastUpdatedLabel }}</span>
          </span>
        </button>
      </div>
    </Teleport>
  </div>

  <Alert v-else-if="!error" type="warning" class="mt-4">
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
                class="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-slate-500">
                  <img
                    v-if="amenityLogo(item)"
                    :src="amenityLogo(item)"
                    :alt="`${item.PrimaryName} logo`"
                    class="h-full w-full object-cover"
                  >
                  <span v-else class="text-sm font-extrabold text-slate-500">{{ amenityInitials(item.PrimaryName) }}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <h3 class="truncate text-sm font-extrabold text-slate-950 sm:text-base">{{ item.PrimaryName }}</h3>
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
                      class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100"
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
                class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <span class="material-symbols-outlined text-[22px]">{{ selectedAmenity.icon }}</span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <h3 class="text-sm font-extrabold text-slate-950 sm:text-base">
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
                      <div class="rounded-2xl bg-slate-50 px-3 py-2">
                        <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Capacity</p>
                        <p class="mt-0.5 text-sm font-extrabold text-slate-950">{{ formatCapacity(item.Capacity) }}</p>
                      </div>
                      <div class="rounded-2xl bg-slate-50 px-3 py-2">
                        <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Distance</p>
                        <p class="mt-0.5 text-sm font-extrabold text-slate-950">{{ formatAmenityDistance(item.DistanceMetres) || 'At stop' }}</p>
                      </div>
                      <div class="rounded-2xl bg-slate-50 px-3 py-2">
                        <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Cost</p>
                        <p class="mt-0.5 text-sm font-extrabold text-slate-950">{{ item.Cost ? 'Paid' : 'Free' }}</p>
                      </div>
                      <div class="rounded-2xl bg-slate-50 px-3 py-2">
                        <p class="text-[11px] font-bold uppercase tracking-wide text-slate-400">Cover</p>
                        <p class="mt-0.5 text-sm font-extrabold text-slate-950">{{ item.Covered ? 'Covered' : 'Uncovered' }}</p>
                      </div>
                    </div>

                    <div class="mt-3 flex flex-wrap gap-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="item.Accessible ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'">
                        {{ item.Accessible ? 'Accessible' : 'Not marked accessible' }}
                      </span>
                      <span v-if="item.OperatorName" class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
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
                class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <span class="material-symbols-outlined text-[22px]">wc</span>
                  </span>
                  <div class="min-w-0 flex-1">
                    <h3 class="text-sm font-extrabold text-slate-950 sm:text-base">Toilet {{ index + 1 }}</h3>
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
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Male ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'">
                        {{ toilet.Male ? 'Male toilets' : 'No male toilets listed' }}
                      </span>
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Female ? 'bg-brand-pink/10 text-brand-pink' : 'bg-slate-100 text-slate-500'">
                        {{ toilet.Female ? 'Female toilets' : 'No female toilets listed' }}
                      </span>
                    </div>
                    <div
                      v-if="toilet.OpenHoursDescription"
                      class="mt-3 flex gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-600"
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
                class="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-700 shadow-sm"
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
import IconPillRow from '@/components/IconPillRow.vue'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'
import StopDeparturesTable from '@/components/Stops/StopDeparturesTable.vue'
import StationMap from '@/components/Stops/StationMap.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'
import Utils from '@/utils'
import { isConnected } from '@/offline/connectivity'
import { cacheAgeLabel, CACHE_MAX_AGE, CACHE_REVALIDATE_AFTER, cacheKeys, loadCachedResource } from '@/offline/resourceCache'

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

      arrivals: null,
      loadingArrivals: true,

      operatorStats: undefined,

      serviceAlerts: [],
      stopDetails: {},
      loadingStopDetails: false,
      stopDetailsError: false,

      osmStop: null,
      loadingOSMStop: false,
      osmStopError: false,

      error: undefined,

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
    }
  },
  components: {
    ServiceIcon,
    Alert,
    DatasourceAttributes,
    EntityActionButtons,
    IconPillRow,
    LoadingState,
    Modal,
    PageHeader,
    ServiceAlertList,
    StopDeparturesTable,
    StationMap
  },
  computed: {
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
    lastUpdatedAt() {
      return this.boardUpdatedAt[this.currentTab] || null
    },
    lastUpdatedLabel() {
      if (this.lastUpdatedAt === null) {
        return 'Not updated yet'
      }

      const prefix = this.currentBoardFromCache ? 'Cached' : 'Updated'
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
        : 'bg-blue-50 text-blue-700'
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
    applyBoard(boardType, data, savedAt, source) {
      const items = source === 'cache' ? this.filterElapsedBoardItems(data) : data

      this[boardType] = items
      this.boardUpdatedAt[boardType] = new Date(savedAt)
      this.boardFromCache[boardType] = source === 'cache'
    },
    filterElapsedBoardItems(items) {
      if (!Array.isArray(items) || this.$route.query.datetime) {
        return items
      }

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

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stop(this.$route.params.id),
          maxAgeMs: CACHE_MAX_AGE.entity,
          revalidateAfterMs: CACHE_REVALIDATE_AFTER.stop,
          request: () => axios.get(`${API.URL}/core/stops/${this.$route.params.id}`),
          onCached: record => {
            cachedApplied = true
            this.stop = record.data
            this.loadingStop = false
          }
        })

        if (result.source === 'network' || !cachedApplied) {
          this.stop = result.data
        }
        this.error = undefined
      } catch (error) {
        console.log(error)
        if (!this.stop) {
          this.error = 'Stop details could not be loaded.'
        }
      } finally {
        this.loadingStop = false
      }
    },
    async getDepartures() {
      if (this.loadingDepartures && this.departures !== null) {
        return
      }
      
      this.loadingDepartures = true
      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.departures(this.$route.params.id, this.$route.query.datetime || 'now'),
          maxAgeMs: CACHE_MAX_AGE.board,
          request: () => axios.get(`${API.URL}/core/stops/${this.$route.params.id}/departures`, {
            params: {
              'count': 25,
              'datetime': this.$route.query.datetime
            }
          }),
          onCached: record => {
            cachedApplied = true
            this.applyBoard('departures', record.data, record.savedAt, 'cache')
          }
        })

        if (result.source === 'network' || !cachedApplied) {
          this.applyBoard('departures', result.data, result.savedAt, result.source)
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loadingDepartures = false
      }
    },
    async getArrivals() {
      if (this.loadingArrivals && this.arrivals !== null) {
        return
      }

      this.loadingArrivals = true
      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.arrivals(this.$route.params.id, this.$route.query.datetime || 'now'),
          maxAgeMs: CACHE_MAX_AGE.board,
          request: () => axios.get(`${API.URL}/core/stops/${this.$route.params.id}/arrivals`, {
            params: {
              'count': 25,
              'datetime': this.$route.query.datetime
            }
          }),
          onCached: record => {
            cachedApplied = true
            this.applyBoard('arrivals', record.data, record.savedAt, 'cache')
          }
        })

        if (result.source === 'network' || !cachedApplied) {
          this.applyBoard('arrivals', result.data, result.savedAt, result.source)
        }
      } catch (error) {
        console.log(error)
      } finally {
        this.loadingArrivals = false
      }
    },
    getServiceAlerts() {
      if (!isConnected()) {
        return
      }

      axios
        .get(`${API.URL}/core/service_alerts/stop/${this.$route.params.id}`)
        .then(response => {
          this.serviceAlerts = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    async getStopDetails() {
      this.loadingStopDetails = true
      this.stopDetailsError = false

      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stopDetails(this.$route.params.id),
          maxAgeMs: CACHE_MAX_AGE.entity,
          request: () => axios.get(`${API.URL}/core/stops/${this.$route.params.id}/detailed`),
          onCached: record => {
            cachedApplied = true
            this.stopDetails = this.normaliseStopDetails(record.data)
            this.loadingStopDetails = false
          }
        })

        if (result.source === 'network' || !cachedApplied) {
          this.stopDetails = this.normaliseStopDetails(result.data)
        }
      } catch (error) {
        console.log(error)
        if (!cachedApplied) {
          this.stopDetails = {}
          this.stopDetailsError = true
        }
      } finally {
        this.loadingStopDetails = false
      }
    },
    async getOSMStop(forceRefresh = false) {
      if (!this.isTrainStation || this.loadingOSMStop || (this.osmStop !== null && !forceRefresh)) {
        return
      }

      this.loadingOSMStop = true
      this.osmStopError = false

      let cachedApplied = false

      try {
        const result = await loadCachedResource({
          key: cacheKeys.stopOSM(this.$route.params.id),
          maxAgeMs: CACHE_MAX_AGE.entity,
          request: () => axios.get(`${API.URL}/core/stops/${encodeURIComponent(this.$route.params.id)}/osm`, {
            params: forceRefresh ? { force_refresh: true } : undefined
          }),
          onCached: record => {
            cachedApplied = true
            this.osmStop = record.data
          }
        })

        if (result.source === 'network' || !cachedApplied) {
          this.osmStop = result.data
        }
      } catch (error) {
        console.log(error)
        if (!cachedApplied) {
          this.osmStop = null
          this.osmStopError = true
        }
      } finally {
        this.loadingOSMStop = false
      }
    },
    getOperatorStats() {
      console.log("Get operator stats")

      let operators = []

      if (this.stop.Services === null) {
        return
      }

      for (let index = 0; index < this.stop.Services.length; index++) {
        const service = this.stop.Services[index]
        let operatorID = service.OperatorRef

        if (!operators.includes(operatorID)) {
          operators.push(operatorID)
        }
      }

      axios
        .get(`${API.URL}/stats/identification_rate`, {
          params: {
            'operators': operators.join(',')
          }
        })
        .then(response => {
          this.operatorStats = response.data.Operators
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    getData() {
      this.getStop()
      this.refreshView()
      this.getServiceAlerts()
      this.getStopDetails()
    },
    pollView() {
      this.currentTime = Date.now()

      if (this.currentBoardFromCache) {
        this[this.currentTab] = this.filterElapsedBoardItems(this[this.currentTab])
      }

      if (!document.hidden && isConnected()) {
        this.refreshView()
      }
    },
    pollServiceAlerts() {
      if (!document.hidden && isConnected()) {
        this.getServiceAlerts()
      }
    },
    handleReconnect() {
      this.getData()
    },
    handleVisibilityChange() {
      if (!document.hidden) {
        this.getData()
      }
    },
    stopPolling() {
      clearInterval(this.refreshTimer)
      clearInterval(this.serviceAlertsRefreshTimer)
      window.removeEventListener('online', this.handleReconnect)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
  },
  mounted () {
    this.getData()
    this.refreshTimer = setInterval(this.pollView, 30000)
    this.serviceAlertsRefreshTimer = setInterval(this.pollServiceAlerts, 60000)
    window.addEventListener('online', this.handleReconnect)
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
