<template>
  <Alert type="error" class="mt-4" v-if="errorJourney !== undefined">{{ errorJourney }}</Alert>
  <div v-if="loadingJourney" class="px-1 py-6 text-sm font-semibold text-slate-500">
    Loading journey...
  </div>

  <div v-else class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <ServiceIcon
              v-if="journey.Service!==undefined"
              class="h-7 rounded-md px-2 text-sm font-bold shadow-sm"
              style="line-height: 28px"
              :service="journey.Service"
            />
            <span
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
              :class="journeyStatus.classes"
            >
              <DepartureTypeIcon :journey="journey"/>
              {{ journeyStatus.label }}
            </span>
          </div>
          <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {{ journeyTitle }}
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500">
            {{ journeySubtitle }}
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:opacity-70"
          :disabled="loadingRealtime"
          @click="getRealtimeJourney()"
          aria-label="Refresh realtime journey"
        >
          <span class="material-symbols-outlined text-[23px]" :class="{'animate-spin': loadingRealtime}">refresh</span>
        </button>
      </div>

      <p
        class="rounded-2xl bg-white/80 px-3 py-2 text-sm font-medium text-slate-600"
        v-if="journey.RealtimeJourney && journey.RealtimeJourney.ActivelyTracked && journey.RealtimeJourney.VehicleLocationDescription"
      >
        {{ journey.RealtimeJourney.VehicleLocationDescription }}
      </p>

      <div v-if="!journey?.RealtimeJourney?.Cancelled" class="rounded-2xl bg-white/75 p-3">
        <DetailedInformationRail :journey="journey"/>
      </div>
    </section>

    <section class="space-y-2.5" v-if="alertCards.length > 0">
      <article
        v-for="card in alertCards"
        v-bind:key="card.key"
        class="rounded-2xl border px-4 py-4 shadow-sm"
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
              <h2 class="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900 sm:text-base">
                {{ card.title }}
              </h2>
              <span class="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">
                {{ card.meta }}
              </span>
            </div>
            <p class="mt-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
              {{ card.body }}
            </p>
          </div>
        </div>
      </article>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800">
        <button
          type="button"
          v-for="tab in tabs"
          v-bind:key="tab.id"
          class="relative flex h-12 items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition sm:text-sm dark:text-slate-400"
          :class="{'text-blue-600 dark:text-blue-300': currentTab === tab.id}"
          @click="changeTab(tab.id)"
        >
          <span class="material-symbols-outlined text-[20px]">{{ tabIcon(tab.id) }}</span>
          <span>{{ tab.name }}</span>
          <span
            class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-300"
            v-if="currentTab === tab.id"
          />
        </button>
      </div>

      <div v-if="currentTab === 'timeline'" class="p-4 sm:p-5">
        <button
          v-if="!expandInactiveStops && hasHiddenStops"
          @click="showAllStops()"
          type="button"
          class="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
        >
          <span class="material-symbols-outlined text-[19px]">history</span>
          Show previous stops
        </button>

        <ol class="relative space-y-0">
          <li
            v-for="(point, index) in journeyPoints"
            v-bind:key="index"
          >
            <div
              v-if="showStop(index)"
              class="relative grid grid-cols-[1.5rem_1fr_auto] gap-3 py-3"
              :class="{'opacity-65': !point.active}"
            >
              <div class="relative flex justify-center">
                <span
                  class="absolute top-7 h-full w-px bg-slate-200"
                  v-if="index < journeyPoints.length - 1"
                ></span>
                <span
                  class="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm"
                  :class="point.active ? 'bg-blue-600' : 'bg-slate-300'"
                ></span>
              </div>

              <div class="min-w-0">
                <router-link
                  :to="{'name': 'stops/view', params: {'id': point.stop.PrimaryIdentifier}}"
                  class="block truncate text-[15px] font-extrabold leading-tight text-slate-950 sm:text-base"
                  :class="{'text-slate-600': !point.active}"
                >
                  {{ point.stop.PrimaryName }}
                </router-link>
                <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span
                    v-if="stopServiceAlerts[point.stop.PrimaryIdentifier]?.closed"
                    class="rounded-md bg-red-600 px-1.5 py-0.5 text-white"
                  >
                    Stop closed
                  </span>
                  <span v-if="point.platform">
                    Platform {{ point.platform }} <span v-if="point.platformType !== 'ACTUAL'">(Est.)</span>
                  </span>
                  <span v-if="point.activity?.length == 1">
                    {{ point.activity[0] }} only
                  </span>
                </div>
              </div>

              <div class="min-w-[4.75rem] text-right">
                <div
                  v-if="pointCancelled(point)"
                  class="inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
                >
                  Cancelled
                </div>
                <div v-else>
                  <div
                    v-if="pointSetdownOnly(point)"
                    class="text-[15px] font-bold leading-tight text-slate-400"
                  >
                    --:--
                  </div>
                  <div
                    v-else-if="pointRealtimeDepartureChanged(point)"
                    class="text-[15px] font-bold leading-tight"
                  >
                    <span class="mr-1 text-xs text-slate-400 line-through">
                      {{ pretty.time(point.departureTime, journey.DepartureTimezone) }}
                    </span>
                    <span class="text-red-500">
                      {{ pretty.time(point.realtime.DepartureTime, journey.DepartureTimezone) }}
                    </span>
                  </div>
                  <div
                    v-else
                    class="text-[15px] font-bold leading-tight"
                    :class="pointRealtimeDepartureSame(point) ? 'text-green-700' : 'text-slate-950'"
                  >
                    {{ pretty.time(point.departureTime, journey.DepartureTimezone) }}
                  </div>
                </div>

                <div class="mt-1 text-xs text-slate-500" v-if="pointArrivalSummary(point)">
                  {{ pointArrivalSummary(point) }}
                </div>
              </div>
            </div>
          </li>
        </ol>
      </div>

      <div v-else-if="currentTab === 'details'" class="space-y-4 p-4 sm:p-5">
        <section
          v-if="journey?.RealtimeJourney?.Occupancy?.OccupancyAvailable"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <h2 class="text-sm font-extrabold text-slate-950">Occupancy</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-white p-3">
              <p class="text-xs font-semibold text-slate-500">Overall</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ pretty.occupancyDescription(journey?.RealtimeJourney?.Occupancy.TotalPercentageOccupancy) }}</p>
            </div>
            <div class="rounded-2xl bg-white p-3" v-if="journey?.RealtimeJourney?.Occupancy.SeatedInformation">
              <p class="text-xs font-semibold text-slate-500">Seats</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ journey?.RealtimeJourney?.Occupancy.SeatedOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.SeatedCapacity }}</p>
            </div>
            <div class="rounded-2xl bg-white p-3" v-if="journey?.RealtimeJourney?.Occupancy.WheelchairInformation">
              <p class="text-xs font-semibold text-slate-500">Wheelchair</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ journey?.RealtimeJourney?.Occupancy.WheelchairOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.WheelchairCapacity }}</p>
            </div>
          </div>
        </section>

        <section
          v-if="journey?.DetailedRailInformation"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <h2 class="text-sm font-extrabold text-slate-950">Vehicle details</h2>
          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div class="rounded-xl bg-white p-3">
              <dt class="font-semibold text-slate-500">Vehicle</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.VehicleTypeName || journey.DetailedRailInformation.VehicleType }}</dd>
            </div>
            <div class="rounded-xl bg-white p-3">
              <dt class="font-semibold text-slate-500">Speed</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.SpeedKMH }} km/h</dd>
            </div>
            <div class="rounded-xl bg-white p-3">
              <dt class="font-semibold text-slate-500">Fuel</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.PowerType }}</dd>
            </div>
            <div class="rounded-xl bg-white p-3">
              <dt class="font-semibold text-slate-500">Seating</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.Seating }}</dd>
            </div>
            <div class="rounded-xl bg-white p-3" v-if="journey.DetailedRailInformation.CateringAvailable">
              <dt class="font-semibold text-slate-500">Catering</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.CateringDescription }}</dd>
            </div>
            <div class="rounded-xl bg-white p-3">
              <dt class="font-semibold text-slate-500">Bike reservation</dt>
              <dd class="mt-1 font-bold text-slate-950">{{ journey.DetailedRailInformation.ReservationBikeRequired ? 'Required' : 'Not required' }}</dd>
            </div>
          </dl>
        </section>

        <section v-if="!journey?.RealtimeJourney?.Occupancy?.OccupancyAvailable && !journey?.DetailedRailInformation" class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
          No extra journey details are available.
        </section>
      </div>

      <div v-else class="h-[420px] overflow-hidden sm:h-[520px]">
        <mapbox-map
          accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
          mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
          style="height: 100%"
          :zoom="zoom"
          :center="center"
          @loaded="mapLoaded"
        >
          <div v-for="(point, index) in journeyPoints" v-bind:key="index">
            <mapbox-marker :lngLat="point.location" v-if="point.location">
              <template v-slot:icon>
                <img src="/icons/bus-stop-station-svgrepo-com-16x16.png">
              </template>
            </mapbox-marker>

            <mapbox-geogeometry-raw :source="point.track" v-if="point.track">
              <mapbox-geogeometry-line :width="5" :color="point.active ? '#2563eb' : '#94a3b8'" />
            </mapbox-geogeometry-raw>
          </div>

          <mapbox-geogeometry-raw :source="convertTrackToFeatureCollection(journey.Track)">
            <mapbox-geogeometry-line :width="5" color="#2563eb" />
          </mapbox-geogeometry-raw>

          <mapbox-marker 
            :lngLat="journey.RealtimeJourney.VehicleLocation.coordinates"
            :rotation="journey.RealtimeJourney.VehicleBearing-90" 
            v-if="journey.RealtimeJourney && journey.RealtimeJourney.VehicleLocation?.coordinates?.length === 2"
          >
            <template v-slot:icon>
              <img src="/icons/bus-svgrepo-com-32x32.png">
            </template>
          </mapbox-marker>
        </mapbox-map>
      </div>
    </section>

    <DatasourceAttributes v-if="!loadingJourney" :datasources="utils.getDatasources(journey, journeyPoints)" />
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import Alert from "@/components/Alert.vue"
import DetailedInformationRail from '@/components/DetailedInformationRail.vue'
import DepartureTypeIcon from '@/components/DepartureTypeIcon.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import axios from "axios"
import API from "@/API"
import Pretty from "@/pretty"
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
  data() {
    return {
      utils: Utils,
      journey: null,
      journeyPoints: null,

      serviceAlerts: [],

      stopServiceAlerts: {},

      loadingJourney: true,
      errorJourney: undefined,

      loadingRealtime: false,
      errorRealtime: undefined,

      pretty: Pretty,

      zoom: 4,
      center: [-4, 55],

      mapboxObject: undefined,
      bounds: undefined,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,

      expandInactiveStops: false,
      hasHiddenStops: false,

      currentTab: "timeline",
      tabs: [
        {
          id: "timeline",
          name: "Timeline",
        },
        {
          id: "details",
          name: "Details",
        },
        {
          id: "map",
          name: "Map",
        },
      ]
    };
  },
  components: {
    Alert,
    ServiceIcon,
    DetailedInformationRail,
    DepartureTypeIcon,
    DatasourceAttributes
  },
  computed: {
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
    journeyTitle() {
      if (this.journey?.DestinationDisplay) {
        return this.journey.DestinationDisplay
      }

      return this.journeyPoints?.[this.journeyPoints.length - 1]?.stop?.PrimaryName || 'Journey'
    },
    journeySubtitle() {
      const origin = this.journeyPoints?.[0]?.stop?.PrimaryName
      const destination = this.journeyPoints?.[this.journeyPoints.length - 1]?.stop?.PrimaryName

      if (origin && destination) {
        return `${origin} to ${destination}`
      }

      return 'Live journey information'
    },
    journeyStatus() {
      if (this.journey?.RealtimeJourney?.Cancelled) {
        return {
          label: 'Cancelled',
          classes: 'bg-red-50 text-red-700'
        }
      }

      if (this.journey?.RealtimeJourney?.ActivelyTracked) {
        return {
          label: 'Live',
          classes: 'bg-green-50 text-green-700'
        }
      }

      return {
        label: 'Scheduled',
        classes: 'bg-slate-100 text-slate-600'
      }
    }
  },
  methods: {
    tabIcon(tab) {
      return {
        timeline: 'timeline',
        details: 'info',
        map: 'map'
      }[tab]
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
    pointCancelled(point) {
      return point.realtime && point.realtime.Cancelled
    },
    pointSetdownOnly(point) {
      return point.activity?.length == 1 && point.activity[0] == 'Setdown' && !point?.lastOne
    },
    pointRealtimeDepartureChanged(point) {
      return point.realtime &&
        this.pretty.time(point.departureTime, this.journey.DepartureTimezone) !== this.pretty.time(point.realtime.DepartureTime, this.journey.DepartureTimezone) &&
        point.realtime.DepartureTime !== '0001-01-01T00:00:00Z'
    },
    pointRealtimeDepartureSame(point) {
      return point.realtime &&
        this.pretty.time(point.departureTime, this.journey.DepartureTimezone) === this.pretty.time(point.realtime.DepartureTime, this.journey.DepartureTimezone)
    },
    pointArrivalSummary(point) {
      if (
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) === this.pretty.time(point.departureTime, this.journey.DepartureTimezone) ||
        point.arrivalTime == null ||
        this.pointCancelled(point)
      ) {
        return ''
      }

      if (
        point.realtime &&
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) !== this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone) &&
        point.realtime.ArrivalTime !== '0001-01-01T00:00:00Z'
      ) {
        return `Arrives ${this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone)}`
      }

      return `Arrives ${this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone)}`
    },
    mapLoaded(map) {
      this.mapboxObject = map

      map.resize()

      this.setBounds()
    },
    setBounds() {
      if (this.mapboxObject !== undefined && this.bounds === undefined && this.journey !== undefined) {
        let northeastern = [999999, 999999]
        let southwestern = [-999999, -999999]

        const boundingBoxPadding = 0.015

        for (let index = 0; index < this.journeyPoints.length; index++) {
          const element = this.journeyPoints[index]
          const cords = element.stop.Location.coordinates

          if (cords[0] < northeastern[0]) {
            northeastern[0] = cords[0] - boundingBoxPadding
          }
          if (cords[1] < northeastern[1]) {
            northeastern[1] = cords[1] - boundingBoxPadding
          }

          if (cords[0] > southwestern[0]) {
            southwestern[0] = cords[0] + boundingBoxPadding
          }
          if (cords[1] > southwestern[1]) {
            southwestern[1] = cords[1] + boundingBoxPadding
          }
        }
        this.bounds = [
          southwestern,
          northeastern
        ]
        
        this.mapboxObject.fitBounds(this.bounds)
      }
    },
    getData() {
      this.getJourney()
      this.getServiceAlerts()
    },
    getJourney() {
      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}`)
        .then((response) => {
          let newJourney = response.data

          this.journeyPoints = this.extractJourneyPoints(newJourney)

          this.journey = newJourney

          this.setBounds()

          this.getStopAlerts()
        })
        .catch((error) => {
          console.log(error)
          this.errorJourney = error
        })
        .finally(() => (this.loadingJourney = false))
    },
    getStopAlerts() {
      if (this.journey == null) {
        return
      }

      for (let i = 0; i < this.journeyPoints.length; i++) {
        const journeyPoint = this.journeyPoints[i]

        axios
          .get(`${API.URL}/core/service_alerts/matching/${journeyPoint.stop.PrimaryIdentifier}`)
          .then(response => {
            if (response.data !== null) {
              for (let index = 0; index < response.data.length; index++) {
                const serviceAlert = response.data[index];
                
                if (serviceAlert.AlertType == "StopClosed") {
                  this.stopServiceAlerts[journeyPoint.stop.PrimaryIdentifier] = {closed: true}
                }
              }
            }
          })
          .catch(error => {
            console.log(error)
          })
      }
    },
    getRealtimeJourney() {
      if (this.journey == null) {
        return
      }

      if (this.loadingRealtime) {
        return
      }

      this.loadingRealtime = true

      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}?realtime_only=true`)
        .then((response) => {
          let newRealtimeJourney = response.data

          this.journey.RealtimeJourney = newRealtimeJourney

          this.journeyPoints = this.extractJourneyPoints(this.journey)

          this.setBounds()
        })
        .catch((error) => {
          console.log(error)
          this.errorRealtime = error
        })
        .finally(() => (this.loadingRealtime = false))
    },
    convertTrackToFeatureCollection(track) {
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              stroke: "#545454",
              "stroke-width": 9.6,
              "stroke-opacity": 1,
            },
            geometry: {
              type: "LineString",
              coordinates: track.map((x) => x.coordinates),
            },
          },
        ],
      }
    },
    getRealtimeForStop(realtimeUpdates, stop) {
      if(realtimeUpdates === undefined || realtimeUpdates === null) {
        return undefined
      }
      
      for (const [key, value] of Object.entries(realtimeUpdates)) {
        if(stop.PrimaryIdentifier == key || stop.OtherIdentifiers.includes(key)) {
          return value
        }
      }

      return undefined
    },
    extractJourneyPoints(journey) {
      let journeyPoints = []

      for (let index = 0; index < journey.Path.length; index++) {
        const element = journey.Path[index]

        let track = this.convertTrackToFeatureCollection(element.Track)

        let platform = element.OriginPlatform
        let platformType = 'ESTIMATED'

        let realtimeStop = this.getRealtimeForStop(journey.RealtimeJourney?.Stops, element.OriginStop)

        if (realtimeStop?.Platform !== "" && realtimeStop?.Platform !== undefined) {
          platform = realtimeStop?.Platform
          platformType = 'ACTUAL'
        }

        if (element.OriginStop == null) {
          journeyPoints.push({
            stop: {
              "PrimaryIdentifier": element.OriginStopRef,
              "PrimaryName": "UNKNOWN STOP",
              "OtherIdentifiers": [],
            },
            datasource: null,
            location: null,
            arrivalTime: element.OriginArrivalTime,
            departureTime: element.OriginDepartureTime,
            activity: element.OriginActivity,
            track: null,
            realtime: null,
            platform: "",
            platformType: "",
          })

          continue
        }

        journeyPoints.push({
          stop: element.OriginStop,
          datasource: element.OriginStop.DataSource,
          location: element.OriginStop.Location.coordinates,
          arrivalTime: element.OriginArrivalTime,
          departureTime: element.OriginDepartureTime,
          activity: element.OriginActivity,
          track: track,
          realtime: realtimeStop,
          platform: platform,
          platformType: platformType,
        })

        // TODO: is it possible for the path to be broken? eg originstop != last departure stop

        // if last one in list then append the destination stop
        if (index === journey.Path.length - 1) {
          let platform = element.DestinationPlatform
          let platformType = 'ESTIMATED'

          let realtimeStop = this.getRealtimeForStop(journey.RealtimeJourney?.Stops, element.DestinationStop)

          if (realtimeStop?.Platform !== "") {
            platform = realtimeStop?.Platform
            platformType = 'ACTUAL'
          }
          // TODO this is a little hack?
          if (journey.RealtimeJourney !== undefined && journey.RealtimeJourney?.Stops !== null && journey.RealtimeJourney?.Stops !== undefined
              && journey.RealtimeJourney.Stops[element.DestinationStopRef] !== undefined) {
            journey.RealtimeJourney.Stops[element.DestinationStopRef].DepartureTime = journey.RealtimeJourney.Stops[element.DestinationStopRef].ArrivalTime
          }

          let destinationArrivalTime = element.DestinationArrivalTime
          if (destinationArrivalTime == "0001-01-01T00:00:00Z" && journey.RealtimeJourney?.Stops?.[element.DestinationStopRef] !== undefined) {
            destinationArrivalTime = journey.RealtimeJourney?.Stops?.[element.DestinationStopRef]?.DepartureTime
          }

          journeyPoints.push({
            stop: element.DestinationStop,
            datasource: element.DestinationStop.DataSource,
            arrivalTime: destinationArrivalTime,
            location: element.DestinationStop.Location.coordinates,
            departureTime: destinationArrivalTime,
            activity: element.DestinationActivity,
            track: null,
            realtime: realtimeStop,
            platform: platform,
            platformType: platformType,
            lastOne: true
          })
        }
      }

      let activeStop = journey.RealtimeJourney == undefined || journey.RealtimeJourney?.NextStopRef == ""

      if (!activeStop) {
        this.hasHiddenStops = true
      }

      for (let index = 0; index < journeyPoints.length; index++) {
        if (
          !activeStop &&
          journey.RealtimeJourney != undefined &&
          (
            journey.RealtimeJourney.NextStopRef === journeyPoints[index].stop.PrimaryIdentifier
            || journeyPoints[index].stop.OtherIdentifiers.includes(journey.RealtimeJourney.NextStopRef)
          )
        ) {
          activeStop = true
        }

        journeyPoints[index]["active"] = activeStop
      }

      return journeyPoints
    },
    getServiceAlerts() {
      // TODO get correct date - this might be wrong when looking at future journey or on journeys that span 2 days
      let yourDate = new Date()
      const offset = yourDate.getTimezoneOffset()
      yourDate = new Date(yourDate.getTime() - (offset*60*1000))
      let journeyRunDate = yourDate.toISOString().split('T')[0]

      let dayinstanceof = 'DAYINSTANCEOF:' + journeyRunDate + ':' + this.$route.params.id
      axios
        .get(`${API.URL}/core/service_alerts/matching/${this.$route.params.id},${dayinstanceof}`)
        .then(response => {
          this.serviceAlerts = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    changeTab(newTab) {
      this.currentTab = newTab
    },
    showStop(index) {
      return this.journeyPoints[index]["active"] || this.expandInactiveStops
    },
    showAllStops() {
      this.expandInactiveStops = true
    },
  },
  mounted() {
    this.getData();
    this.refreshTimer = setInterval(this.getRealtimeJourney, 10000)
    this.serviceAlertsRefreshTimer = setInterval(this.getServiceAlerts, 60000)
  },
  beforeRouteLeave() {
    clearInterval(this.refreshTimer)
    clearInterval(this.serviceAlertsRefreshTimer)
  },
};
</script>
