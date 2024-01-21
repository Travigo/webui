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

      <mapbox-marker :lngLat="stop.Location.coordinates" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier" @click="openStopSheet(stop)">
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

  <vue-bottom-sheet ref="stopInfoSheet" maxHeight="380" class="relative">
    <div v-if="currentViewedStop !== undefined" class="px-4" style="min-height: 200px">
      <StopStatus :currentViewedStop="currentViewedStop" />
      <PageTitle paddingStyle="pb-2">Departures</PageTitle>
      <span v-if="this.loadingDepartures" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
        Loading...
      </span>
      <DeparturesList v-else :stop="currentViewedStop" :departures="currentViewedStopDepartures"/>
      <div class="absolute bottom-5 right-3">
        <router-link
          @click="this.$refs.stopInfoSheet.close()"
          :to="{'name': 'stops/view', params: {'id': currentViewedStop.PrimaryIdentifier}}"
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          View More
        </router-link>
      </div>
    </div>
    <div style="height: 380px" v-else></div>
  </vue-bottom-sheet>
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
  bottom: 24px;
  right: 6px;
}
</style>


<script>
import PageTitle from '@/components/PageTitle.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import StopStatus from '@/components/StopStatus.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import StopIcon from '@/components/StopIcon.vue'
import Modal from '@/components/Modal.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'

import { MapboxMap } from "vue-mapbox-ts";


import VueBottomSheet from "@webzlodimir/vue-bottom-sheet";
import  "@webzlodimir/vue-bottom-sheet/dist/style.css";


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

      loadingDepartures: true,
      currentViewedStopDepartures: []
    }
  },
  components: {
    PageTitle,
    Card,
    Modal,
    ServiceIcon,
    StopStatus,
    DeparturesList,
    StopIcon,

    MapboxMap,

    VueBottomSheet
  },
  methods: {
    mapLoaded(map) {
      this.mapboxObject = map

      map.resize()

      this.refreshData()
    },
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    refreshData(updateStops = true, updateVehicles = true) {
      if (this.$refs.map !== undefined) {
        this.getData(updateStops, updateVehicles)
      }
    },
    mapPositionUpdate(center) {
      this.currentCenter = center

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
    openStopSheet(stop) {
      this.currentViewedStop = stop
      this.currentViewedStopDepartures = []
      this.loadingDepartures = true

      this.getDepartures()

      this.$refs.stopInfoSheet.open()
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
    },
    $route: {
      immediate: true,
      handler(to, from) {
        if (this.$refs.map !== undefined) {
          localStorage.map_last_center = JSON.stringify(this.currentCenter)
          localStorage.map_last_zoom = this.currentZoom
        }
      }
    },
  }
}
</script>