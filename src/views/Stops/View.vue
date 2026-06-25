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

      <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <span
          v-for="chip in amenityChips"
          v-bind:key="chip.icon"
          class="inline-flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm"
          :title="chip.label"
        >
          <span class="material-symbols-outlined text-[20px]">{{ chip.icon }}</span>
        </span>
      </div>
    </section>

    <section class="space-y-2.5">
      <article
        v-for="card in visibleAlertCards"
        v-bind:key="card.key"
        class="overflow-hidden rounded-2xl border shadow-sm"
        :class="card.classes"
      >
        <div class="flex items-start gap-3 px-4 py-4">
          <span
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
            :class="card.iconClasses"
          >
            <span class="material-symbols-outlined text-[21px] leading-none">{{ card.icon }}</span>
          </span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3">
              <h2 class="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900 sm:text-base">
                {{ card.title }}
              </h2>
              <span class="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">{{ card.meta }}</span>
              <button
                type="button"
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/70"
                :aria-label="isAlertExpanded(card) ? 'Collapse service update' : 'Expand service update'"
                @click="toggleAlertCard(card)"
              >
                <span class="material-symbols-outlined text-lg leading-none">
                  {{ isAlertExpanded(card) ? 'expand_less' : 'expand_more' }}
                </span>
              </button>
            </div>
            <p
              class="mt-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
              :class="{'stop-alert-body--collapsed': !isAlertExpanded(card)}"
            >
              {{ card.body }}
            </p>
          </div>
        </div>

        <button
          v-if="hiddenAlertCards.length > 0"
          type="button"
          class="flex w-full items-center gap-3 border-t border-slate-900/5 bg-white/50 px-4 py-3 text-left transition hover:bg-white/80"
          @click="openAlertsModal"
        >
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm">
            <span class="material-symbols-outlined text-[21px] leading-none">campaign</span>
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-extrabold text-slate-950">
              View {{ hiddenAlertCards.length }} more service update{{ hiddenAlertCards.length === 1 ? '' : 's' }}
            </span>
          </span>
          <span class="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
        </button>
      </article>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-3 divide-x divide-slate-100">
        <button
          type="button"
          v-for="tab in tabs"
          v-bind:key="tab.id"
          class="relative flex h-12 items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition sm:text-sm"
          :class="{'text-blue-600': currentTab === tab.id}"
          @click="changeTab(tab.id)"
        >
          <span class="material-symbols-outlined text-[20px]">{{ tabIcon(tab.id) }}</span>
          <span>{{ tab.name }}</span>
          <span
            class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600"
            v-if="currentTab === tab.id"
          />
        </button>
      </div>

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
    <div
      v-if="alertsModalOpen"
      class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      @click.self="closeAlertsModal"
    >
      <section class="max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
          <div>
            <h2 class="text-lg font-bold text-slate-950 sm:text-xl">Service updates</h2>
            <p class="mt-1 text-sm text-slate-500">Additional alerts for {{ stop?.PrimaryName }}.</p>
          </div>
          <button
            @click="closeAlertsModal"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close service updates"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="max-h-[calc(88dvh-5rem)] space-y-3 overflow-y-auto p-4 sm:p-5">
          <article
            v-for="card in hiddenAlertCards"
            v-bind:key="`modal-${card.key}`"
            class="rounded-2xl border px-4 py-4"
            :class="card.classes"
          >
            <div class="flex items-start gap-3">
              <span
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                :class="card.iconClasses"
              >
                <span class="material-symbols-outlined text-[21px] leading-none">{{ card.icon }}</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-3">
                  <h3 class="min-w-0 flex-1 text-sm font-extrabold text-slate-900 sm:text-base">
                    {{ card.title }}
                  </h3>
                  <span class="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">{{ card.meta }}</span>
                </div>
                <p class="mt-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  {{ card.body }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.stop-alert-body--collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import Alert from '@/components/Alert.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'
import Utils from '@/utils'

const ALERT_FALLBACKS = {
  Information: { title: 'Service update', tone: 'info' },
  Warning: { title: 'Service warning', tone: 'warning' },
  StopClosed: { title: 'Stop closed', tone: 'error' },
  ServiceSuspended: { title: 'Service suspended', tone: 'error' },
  ServicePartSuspended: { title: 'Service suspended', tone: 'error' },
  SevereDelays: { title: 'Severe delays', tone: 'error' },
  Delays: { title: 'Service delays', tone: 'warning' },
  MinorDelays: { title: 'Minor delays', tone: 'warning' },
  Planned: { title: 'Planned notice', tone: 'info' },
  JourneyDelayed: { title: 'Journey delayed', tone: 'warning' },
  JourneyPartiallyCancelled: { title: 'Journey partially cancelled', tone: 'error' },
  JourneyCancelled: { title: 'Journey cancelled', tone: 'error' },
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

      error: undefined,

      zoom: 13,
      center: [0.1356, 52.2065],
      currentZoom: 11.5,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,
      lastUpdatedAt: null,
      alertsModalOpen: false,
      expandedAlertCards: {},

      currentTab: "departures",
      tabs: [
        {
          id: "departures",
          name: "Departures",
        },
        {
          id: "arrivals",
          name: "Arrivals",
        },
        {
          id: "details",
          name: "Details",
        }
      ],
    }
  },
  components: {
    ServiceIcon,
    Alert,
    DeparturesList,
    DatasourceAttributes
  },
  computed: {
    visibleServices() {
      return this.stop?.Services || []
    },
    amenityChips() {
      return [
        { icon: 'wifi', label: 'Realtime information' },
        { icon: 'stairs', label: 'Step access' },
        { icon: 'accessible', label: 'Accessible access' },
        { icon: 'local_parking', label: 'Parking' },
        { icon: 'directions_bike', label: 'Cycle parking' },
        { icon: 'local_cafe', label: 'Refreshments' },
      ]
    },
    sortedServiceAlerts() {
      if (this.serviceAlerts === null || this.serviceAlerts.length === 0) {
        return []
      }
      return [...this.serviceAlerts].sort((first, second) => {
        const severityDiff = this.alertSeverity(second) - this.alertSeverity(first)

        if (severityDiff !== 0) {
          return severityDiff
        }

        return new Date(second.CreationDateTime || 0) - new Date(first.CreationDateTime || 0)
      })
    },
    alertCards() {
      return this.sortedServiceAlerts.map((alert, index) => this.alertToCard(alert, index))
    },
    visibleAlertCards() {
      return this.alertCards.length > 1 ? this.alertCards.slice(0, 1) : this.alertCards
    },
    hiddenAlertCards() {
      return this.alertCards.length > 1 ? this.alertCards.slice(1) : []
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
    alertToCard(alert, index) {
      const fallback = ALERT_FALLBACKS[alert.AlertType] || ALERT_FALLBACKS.Information
      const tone = fallback.tone

      return {
        key: alert.PrimaryIdentifier || alert.ID || `alert-${index}`,
        title: alert.Title || fallback.title,
        meta: alert.CreationDateTime ? `${this.pretty.date(alert.CreationDateTime)}` : 'Live',
        body: this.cleanAlertText(alert.Text) || 'Check before you travel.',
        icon: this.statusIcon(tone),
        classes: this.statusClasses(tone),
        iconClasses: this.statusIconClasses(tone),
        severity: this.alertSeverity(alert)
      }
    },
    alertSeverity(alert) {
      const tone = (ALERT_FALLBACKS[alert.AlertType] || ALERT_FALLBACKS.Information).tone

      return {
        error: 3,
        warning: 2,
        info: 1,
        success: 0
      }[tone]
    },
    openAlertsModal() {
      this.alertsModalOpen = true
    },
    closeAlertsModal() {
      this.alertsModalOpen = false
    },
    isAlertExpanded(card) {
      return this.expandedAlertCards[card.key] === true
    },
    toggleAlertCard(card) {
      this.expandedAlertCards = {
        ...this.expandedAlertCards,
        [card.key]: !this.isAlertExpanded(card)
      }
    },
    tabIcon(tab) {
      return {
        departures: 'directions_bus',
        arrivals: 'download',
        details: 'info'
      }[tab]
    },
    statusIcon(tone) {
      return {
        info: 'info',
        warning: 'warning',
        error: 'error',
        success: 'verified_user'
      }[tone]
    },
    statusClasses(tone) {
      return {
        info: 'border-blue-100 bg-blue-50',
        warning: 'border-amber-100 bg-amber-50',
        error: 'border-red-100 bg-red-50',
        success: 'border-emerald-100 bg-emerald-50'
      }[tone]
    },
    statusIconClasses(tone) {
      return {
        info: 'bg-blue-600 text-white',
        warning: 'bg-orange-500 text-white',
        error: 'bg-red-600 text-white',
        success: 'bg-emerald-600 text-white'
      }[tone]
    },
    cleanAlertText(text) {
      if (!text) {
        return ''
      }

      return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
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
