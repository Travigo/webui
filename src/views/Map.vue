<template>
  <!-- <PageTitle>
    Bus Map
    <span v-if="this.currentZoom < this.dataLoadMinZoom" class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-amber-600 bg-amber-200 mr-1">
      Zoom in some more to load the stops
    </span>
  </PageTitle> -->
  <div v-if="loading">Loading...</div>
  <div v-else class="fullscreen-map">
    <mapbox-map
      ref="map"
      accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
      mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
      height="100%"
      :center="initialCenter"
      :zoom="initialZoom"
      @loaded="mapLoaded"
      @update:center="mapPositionUpdate"
      @update:zoom="zoomUpdate"
    >
      <mapbox-navigation-control position="bottom-left" />
      <mapbox-geolocate-control position="bottom-left" />

      <mapbox-marker :lngLat="stop.Location.coordinates" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier" @click="openStopModal(stop)">
        <template v-slot:icon>
          <StopIcon :stop="stop"/>
        </template>
      </mapbox-marker>

      <mapbox-marker
        :lngLat="vehicle.VehicleLocation.coordinates"
        :rotation="vehicle.VehicleBearing-90"
        v-for="(vehicle, i) in this.vehicles"
        v-bind:key="i"
      >
        <template v-slot:icon>
          <img src="/icons/bus-svgrepo-com-24x24.png">
        </template>

        <mapbox-popup>
          <div>
            <strong>{{ vehicle.Journey.DestinationDisplay }}</strong>
            <div>
              {{ vehicle.Journey.Service.ServiceName }} / {{ vehicle.Journey.Operator.PrimaryName }}
            </div>

            <p>
              <router-link :to="{'name': 'journeys/view', params: {'id': vehicle.Journey.PrimaryIdentifier}}">View</router-link>
            </p>
          </div>
        </mapbox-popup>
      </mapbox-marker>
    </mapbox-map>

    <div class="map-control-buttons">
      <input type="checkbox" id="showStops" v-model="this.showStops">
      <label for="showStops">Show Stops</label>

      <input type="checkbox" id="showVehicles" v-model="this.showVehicles">
      <label for="showVehicles">Show Vehicles</label>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="stopModalOpen"
      class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      @click.self="closeStopModal"
    >
      <section class="max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-slate-950 sm:text-xl">
              {{ currentViewedStop?.PrimaryName || 'Stop details' }}
            </h2>
            <p class="mt-1 truncate text-sm text-slate-500">
              {{ currentViewedStop?.Descriptor || currentViewedStop?.OtherNames?.Descriptor || 'Departures and stop information' }}
            </p>
          </div>
          <button
            @click="closeStopModal"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
            aria-label="Close stop departures"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5">
          <div v-if="currentViewedStop !== undefined" class="space-y-4">
            <div class="rounded-2xl bg-blue-50 p-4">
              <StopStatus :currentViewedStop="currentViewedStop" />
            </div>

            <div>
              <div class="mb-3 flex items-center justify-between gap-3">
                <h3 class="text-base font-bold text-slate-950 sm:text-lg">Departures</h3>
                <router-link
                  @click="closeStopModal"
                  :to="{'name': 'stops/view', params: {'id': currentViewedStop.PrimaryIdentifier}}"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                >
                  View more
                  <span class="material-symbols-outlined text-base">chevron_right</span>
                </router-link>
              </div>

              <div v-if="this.loadingDepartures" class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
                Loading departures...
              </div>
              <div v-else class="overflow-hidden rounded-2xl border border-slate-100 bg-white">
                <DeparturesList :stop="currentViewedStop" :departures="currentViewedStopDepartures"/>
              </div>
            </div>
          </div>

          <div v-else class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
            Select a stop on the map to view departures.
          </div>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.fullscreen-map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-control-buttons {
  position: absolute;
  bottom: 92px;
  right: 6px;
  z-index: 40;
}

:deep(.mapboxgl-ctrl-bottom-left) {
  bottom: 84px;
}
</style>


<script>
import StopStatus from '@/components/StopStatus.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import StopIcon from '@/components/StopIcon.vue'
import axios from 'axios'
import API from '@/API'

import { MapboxMap } from "vue-mapbox-ts";

export default {
  name: 'StopsView',
  data () {
    return {
      stops: [],
      vehicles: [],

      loading: false,
      error: null,

      currentZoom: 5,
      currentCenter: [0.1356, 52.2065],

      initialZoom: 5,
      initialCenter: [0.1356, 52.2065],

      dataLoadMinZoom: 9,

      refreshTimer: null,

      showStops: undefined,
      showVehicles: undefined,

      mapboxObject: undefined,

      currentViewedStop: undefined,
      stopModalOpen: false,

      loadingDepartures: true,
      currentViewedStopDepartures: []
    }
  },
  components: {
    StopStatus,
    DeparturesList,
    StopIcon,

    MapboxMap
  },
  methods: {
    mapLoaded(map) {
      this.mapboxObject = map

      map.resize()

      this.refreshData()
    },
    zoomUpdate(zoom) {
      this.currentZoom = zoom

      localStorage.map_last_zoom = this.currentZoom
    },
    refreshData(updateStops = true, updateVehicles = true) {
      if (this.$refs.map !== undefined) {
        this.getData(updateStops, updateVehicles)
      }
    },
    mapPositionUpdate(center) {
      this.currentCenter = center

      localStorage.map_last_center = JSON.stringify(this.currentCenter)

      this.getData(true, true)
    },
    getData(updateStops, updateVehicles) {
      const bounds = this.mapboxObject.getBounds()

      let bottomLeftLon = bounds._sw.lng
      let bottomLeftLat = bounds._sw.lat
      let topRightLon = bounds._ne.lng
      let topRightLat = bounds._ne.lat

      // TODO: For now just dont load anything if you're too zoomed out
      if (this.showStops && updateStops && (this.currentZoom >= this.dataLoadMinZoom)) {
        axios
          .get(`${API.URL}/core/stops/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newStops = response.data

            this.stops = newStops
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }

      if (this.showVehicles && updateVehicles) {
        axios
          .get(`${API.URL}/core/realtime_journeys/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newVehicles = response.data

            this.vehicles = newVehicles
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }
    },
    openStopModal(stop) {
      this.currentViewedStop = stop
      this.currentViewedStopDepartures = []
      this.loadingDepartures = true
      this.stopModalOpen = true

      this.getDepartures()
    },
    closeStopModal() {
      this.stopModalOpen = false
    },
    getDepartures() {
      axios
        .get(`${API.URL}/core/stops/${this.currentViewedStop.PrimaryIdentifier}/departures`, {
          params: {
            'count': 10,
            // 'datetime': this.$route.query.datetime
          }
        })
        .then(response => {
          this.currentViewedStopDepartures = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
        .finally(() => this.loadingDepartures = false)
    }
  },
  created() {
    if (localStorage.map_last_center !== undefined && localStorage.map_last_zoom !== undefined) {
      this.initialCenter = JSON.parse(localStorage.map_last_center)
      this.initialZoom = parseInt(localStorage.map_last_zoom)

      this.currentCenter = this.initialCenter
      this.currentZoom = this.initialZoom
    }

    if (localStorage.map_showStops !== undefined) {
      this.showStops = (localStorage.map_showStops == "true")
    } else {
      this.showStops = true
    }
    if (localStorage.map_showVehicles !== undefined) {
      this.showVehicles = (localStorage.map_showVehicles == "true")
    } else {
      this.showVehicles = false
    }
  },
  mounted() {
    this.refreshTimer = setInterval(this.refreshData.bind(null, false, true), 15000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
  }, 
  watch: {
    showStops: {
      immediate: true,
      handler(to, from) {
        if (from === undefined) {
          return
        }

        if (to) {
          this.refreshData()
        } else {
          this.stops = []
        }

        localStorage.map_showStops = to
      }
    },
    showVehicles: {
      immediate: true,
      handler(to, from) {
        if (from === undefined) {
          return
        }

        if (to) {
          this.refreshData()
        } else {
          this.vehicles = []
        }

        localStorage.map_showVehicles = to
      }
    }
  }
}
</script>
