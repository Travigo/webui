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

      <mapbox-marker :lngLat="stop.Location.coordinates" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier">
        <template v-slot:icon>
          <span v-for="icon in this.getUniqueServiceIcons(stop.Services)" class="w-6 h-6 text-center">
            <span 
              v-if="icon['type'] == 'TextIcon'"
              class="text-[22px] material-symbols-outlined bg-blue-500 rounded-lg text-white font-light leading-[24px]"
            >
              {{ icon['value'] }}
            </span>
            <span v-else-if="icon['type'] == 'Image'">
              <img :src="icon['value']" class="w-6 h-6" />
            </span>
          </span>
          
          <span 
            v-if="this.getUniqueServiceIcons(stop.Services).length == 0"
            class="text-[22px] material-symbols-outlined bg-gray-400 rounded-lg text-white font-light leading-[24px] w-6 h-6 text-center"
          >
            pin_drop
          </span>
        </template>
        <mapbox-popup>
          <div>
            <p>
              <strong>{{ stop.PrimaryName }}</strong>
            </p>
            {{ stop.OtherNames.Indicator }} {{ stop.OtherNames.Landmark }}<br/>

            <p>
              <router-link :to="{'name': 'stops/view', params: {'id': stop.PrimaryIdentifier}}">View</router-link>
            </p>
          </div>
        </mapbox-popup>
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
import Modal from '@/components/Modal.vue'
import Card from '@/components/Card.vue'
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

      mapboxObject: undefined
    }
  },
  components: {
    PageTitle,
    Card,
    Modal,

    MapboxMap
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
    getUniqueServiceIcons(services) {
      let transportIcons = {
        "Bus": "directions_bus",
        "Coach": "directions_bus",
        "Tram": "tram",
        "Taxi": "local_taxi",
        "Rail": "train",
	      "Metro": "subway",
        "Ferry": "directions_boat",
        "Airport": "flight",
        "CableCar": "cell_tower",
        "UNKNOWN": "pin_drop"
      }
      let serviceIcons = []
      let serviceIconsFound = {}

      services.forEach(service => {
        let serviceID = ""
        let serviceIcon = {}
        if (service.BrandIcon == "") {
          serviceID = service.TransportType

          serviceIcon = {
            "type": "TextIcon",
            "value": transportIcons[service.TransportType]
          }
        } else {
          serviceID = service.BrandIcon

          serviceIcon = {
            "type": "Image",
            "value": service.BrandIcon 
          }
        }

        if (serviceIconsFound[serviceID] === undefined) {
          serviceIconsFound[serviceID] = true

          serviceIcons.push(serviceIcon)
        }
      });

      return serviceIcons
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