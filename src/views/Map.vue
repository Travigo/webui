<template>
  <PageTitle>
    Bus Map
    <span v-if="this.currentZoom < this.dataLoadMinZoom" class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-amber-600 bg-amber-200 mr-1">
      Zoom in some more to load the stops
    </span>
  </PageTitle>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <l-map
      ref="map"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      style="height: 600px"
      @update:bounds="mapPositionUpdate"
      @update:zoom="zoomUpdate"
      @ready="getDataOnLoad()"
    >
      <l-tile-layer
        :url="url"
        :attribution="attribution"
      />

      <l-marker :lat-lng="stop.latLng" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier">
        <l-popup>
          <div>
            <strong>{{ stop.PrimaryName }}</strong>
            <div>
              {{ stop.OtherNames.Indicator }} {{ stop.OtherNames.Landmark }}
            </div>

            <p>
              <router-link :to="{'name': 'stops/view', params: {'id': stop.PrimaryIdentifier}}">View</router-link>
            </p>
          </div>
        </l-popup>
      </l-marker>

      <l-marker :lat-lng="vehicle.latLng" v-for="vehicle in this.vehicles" v-bind:key="vehicle.PrimaryIdentifier">
        <l-popup>
          <div>
            <strong>{{ vehicle.Journey.DestinationDisplay }}</strong>
            <div>
              {{ vehicle.Journey.Service.ServiceName }} / {{ vehicle.Journey.Operator.PrimaryName }}
            </div>

            <p>
              <router-link :to="{'name': 'journeys/view', params: {'id': vehicle.JourneyRef}}">View</router-link>
            </p>
          </div>
        </l-popup>
      </l-marker>
    </l-map>

    <input type="checkbox" id="showStops" v-model="this.showStops">
    <label for="showStops">Show Stops</label>

    <input type="checkbox" id="showVehicles" v-model="this.showVehicles">
    <label for="showVehicles">Show Vehicles</label>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Modal from '@/components/Modal.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'

import { latLngBounds, latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      stops: [],
      vehicles: [],

      loading: false,
      error: null,

      zoom: 13,
      center: latLng(52.2065, 0.1356),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 12,
      mapOptions: {
        zoomSnap: 0.5,
      },

      dataLoadMinZoom: 12,

      showStops: undefined,
      showVehicles: undefined
    }
  },
  components: {
    PageTitle,
    Card,
    Modal,

    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    getDataOnLoad() {
      if (this.$refs.map !== undefined) {
        this.mapPositionUpdate(this.$refs.map.leafletObject.getBounds())
      }
    },
    mapPositionUpdate(bounds) {
      // TODO: For now just dont load anything if you're too zoomed out
      if (this.$refs.map.leafletObject.getZoom() < this.dataLoadMinZoom) {
        return
      }

      let bottomLeftLon = bounds._southWest.lng;
      let bottomLeftLat = bounds._southWest.lat;
      let topRightLon = bounds._northEast.lng;
      let topRightLat = bounds._northEast.lat;

      if (this.showStops) {
        axios
          .get(`${API.URL}/stops/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newStops = response.data

            newStops.forEach(stop => {
              stop.latLng = latLng(stop.Location.coordinates[1], stop.Location.coordinates[0])
            });

            this.stops = newStops
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }

      if (this.showVehicles) {
        axios
          .get(`${API.URL}/realtime_journeys/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newVehicles = response.data

            newVehicles.forEach(vehicle => {
              vehicle.latLng = latLng(vehicle.VehicleLocation.coordinates[1], vehicle.VehicleLocation.coordinates[0])
            });

            this.vehicles = newVehicles
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }
    },
  },
  created() {
    if (localStorage.map_last_center !== undefined && localStorage.map_last_zoom !== undefined) {
      this.center = JSON.parse(localStorage.map_last_center)
      this.zoom = parseInt(localStorage.map_last_zoom)
    }

    if (localStorage.map_showStops !== undefined) {
      this.showStops = (localStorage.map_showStops == "true")
    }
    if (localStorage.map_showVehicles !== undefined) {
      this.showVehicles = (localStorage.map_showVehicles == "true")
    }
  },
  watch: {
    showStops: {
      immediate: true,
      handler(to, from) {
        if (from === undefined) {
          return
        }

        if (to) {
          this.getDataOnLoad()
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
          this.getDataOnLoad()
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
          localStorage.map_last_center = JSON.stringify(this.$refs.map.leafletObject.getCenter())
          localStorage.map_last_zoom = this.$refs.map.leafletObject.getZoom()
        }
      }
    },
  }
}
</script>