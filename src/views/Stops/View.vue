<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>

  <div v-if="loadingStop" class="px-1 py-6 text-sm font-semibold text-slate-500">
    Loading stop...
  </div>

  <div v-else class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4">
      <div>
        <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-3xl">
          {{ stop.PrimaryName }}
        </h1>
        <p class="mt-1 text-sm font-medium text-slate-500" v-if="stop.OtherNames?.Descriptor">
          {{ stop.OtherNames.Descriptor }}
        </p>
      </div>

      <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" v-if="visibleServices.length > 0">
        <router-link
          :to="{'name': 'services/view', params: {'id': service.PrimaryIdentifier}}"
          v-for="service in visibleServices"
          v-bind:key="service.PrimaryIdentifier"
          class="shrink-0"
        >
          <ServiceIcon
            class="h-6 rounded-md px-2 text-[0.8rem] font-bold shadow-sm"
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
    </section>

    <ServiceAlertList
      :alerts="serviceAlerts"
      :max-visible="1"
      :context-name="stop?.PrimaryName"
      collapsible
    />

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <TabBar :tabs="tabs" :model-value="currentTab" @update:model-value="changeTab" />

      <div v-if="currentTab === 'departures'">
        <div v-if="loadingDepartures && departures === null" class="px-4 py-6 text-sm font-semibold text-amber-700">
          Loading departures...
        </div>
        <DeparturesList v-else :stop="stop" :departures="departures" variant="compact"/>
      </div>

      <div v-else-if="currentTab === 'arrivals'" class="px-4 py-6 text-sm leading-relaxed text-slate-600">
        Arrivals are not available yet.
      </div>

      <div v-else class="space-y-4 px-4 py-4">
        <div>
          <h2 class="text-sm font-extrabold text-slate-950">Stop details</h2>
          <p class="mt-1 text-sm text-slate-600">
            {{ stop.OtherNames?.Descriptor || 'Live stop information and mapped location.' }}
          </p>
        </div>

        <div class="h-56 overflow-hidden rounded-2xl border border-slate-200">
          <mapbox-map
            accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
            mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
            style="height: 100%"
            :zoom="zoom"
            :center="center"
          >
            <mapbox-marker :lngLat="center">
              <mapbox-popup>
                <div>
                  <p><strong>{{ stop.PrimaryName }}</strong></p>
                  {{ stop.OtherNames?.Descriptor }}
                </div>
              </mapbox-popup>
            </mapbox-marker>
          </mapbox-map>
        </div>

        <DatasourceAttributes :datasources="utils.getDatasources(stop, stop.Services, serviceAlerts)" />
      </div>
    </section>

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
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 disabled:opacity-75 sm:min-h-11 sm:rounded-2xl"
          :disabled="loadingDepartures"
          @click="refreshView()"
        >
          <span class="material-symbols-outlined text-[24px]" :class="{'animate-spin': loadingDepartures}">refresh</span>
          <span class="leading-tight">
            Refresh now
            <span class="block text-[10px] font-semibold text-blue-100">{{ lastUpdatedLabel }}</span>
          </span>
        </button>
      </div>
    </Teleport>
  </div>

  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="amenityModalOpen"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="closeAmenityModal"
      >
        <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <span class="material-symbols-outlined text-[24px] leading-none">{{ selectedAmenity?.icon }}</span>
              </span>
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-slate-950 sm:text-xl">{{ selectedAmenity?.label }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ selectedAmenity?.count }} item{{ selectedAmenity?.count === 1 ? '' : 's' }} at this stop.</p>
              </div>
            </div>
            <button
              @click="closeAmenityModal"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Close amenity details"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5">
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
                      <span class="rounded-full px-2.5 py-1 text-xs font-bold" :class="toilet.Female ? 'bg-pink-50 text-pink-700' : 'bg-slate-100 text-slate-500'">
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
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import Alert from '@/components/Alert.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import TabBar from '@/components/TabBar.vue'
import IconPillRow from '@/components/IconPillRow.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'
import Utils from '@/utils'

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

      error: undefined,

      zoom: 13,
      center: [0.1356, 52.2065],
      currentZoom: 11.5,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,
      lastUpdatedAt: null,
      amenityModalOpen: false,
      selectedAmenityKey: null,

      currentTab: "departures",
      tabs: [
        {
          id: "departures",
          name: "Departures",
          icon: 'directions_bus'
        },
        {
          id: "arrivals",
          name: "Arrivals",
          icon: 'download'
        },
        {
          id: "details",
          name: "Details",
          icon: 'info'
        }
      ],
    }
  },
  components: {
    ServiceIcon,
    Alert,
    DeparturesList,
    DatasourceAttributes,
    TabBar,
    IconPillRow,
    ServiceAlertList
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
    lastUpdatedLabel() {
      if (this.lastUpdatedAt === null) {
        return 'Not updated yet'
      }

      const secondsAgo = Math.max(Math.round((Date.now() - this.lastUpdatedAt.getTime()) / 1000), 0)

      if (secondsAgo < 60) {
        return 'Updated just now'
      }

      const minutesAgo = Math.round(secondsAgo / 60)
      return `Updated ${minutesAgo} min ago`
    }
  },
  methods: {
    amenitySectionFromDetails(key, config) {
      const items = this.stopDetails?.[key] || []

      return {
        key,
        label: config.label,
        icon: config.icon,
        type: config.type,
        items,
        count: items.length
      }
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
    changeTab(newTab) {
      this.currentTab = newTab

      this.refreshView()
    },
    refreshView() {
      if (this.currentTab == "departures") {
        this.getDepartures()
      } else if (this.currentTab == "arrivals") {
        this.getArrivals()
      }
    },
    getStop() {
      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}`)
        .then(response => {
          this.stop = response.data

          this.center = this.stop.Location.coordinates

          // this.getOperatorStats()
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loadingStop = false)
    },
    getDepartures() {
      if (this.loadingDepartures && this.departures !== null) {
        return
      }
      
      this.loadingDepartures = true
      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}/departures`, {
          params: {
            'count': 25,
            'datetime': this.$route.query.datetime
          }
        })
        .then(response => {
          this.departures = response.data
          this.lastUpdatedAt = new Date()
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
        .finally(() => this.loadingDepartures = false)
    },
    getArrivals() {
      console.log("TODO implement get arrivals")
    },
    getServiceAlerts() {
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
    getStopDetails() {
      this.loadingStopDetails = true
      this.stopDetailsError = false

      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}/detailed`)
        .then(response => {
          this.stopDetails = this.normaliseStopDetails(response.data)
        })
        .catch(error => {
          console.log(error)
          this.stopDetails = {}
          this.stopDetailsError = true
        })
        .finally(() => this.loadingStopDetails = false)
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
      this.getDepartures()
      this.getServiceAlerts()
      this.getStopDetails()
    }
  },
  mounted () {
    this.getData()
    this.refreshTimer = setInterval(this.getDepartures, 30000)
    this.serviceAlertsRefreshTimer = setInterval(this.getServiceAlerts, 60000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
    clearInterval(this.serviceAlertsRefreshTimer)
  }, 
}
</script>
