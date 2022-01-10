<template>
  <PageTitle>Bus Map</PageTitle>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <l-map
      ref="map"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      style="height: 600px"
      @update:bounds="mapPositionUpdate"
      @ready="getStopsOnLoad()"
    >
      <l-tile-layer
        :url="url"
        :attribution="attribution"
      />
      <l-marker :lat-lng="stop.latLng" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier">
        <l-tooltip :options="{ permanent: false, interactive: true }">
          <div>
            <p>
              <strong>{{ stop.PrimaryName }}</strong>
            </p>
            {{ stop.OtherNames.Indicator }} {{ stop.OtherNames.Landmark }}
            <br />{{ stop.PrimaryIdentifier }}
          </div>
        </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'

import { latLngBounds, latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      stops: null,
      loading: false,
      error: null,

      zoom: 12,
      center: latLng(52.2065, 0.1356),
      // bounds: latLngBounds(latLng(52.14334052457373, -0.04969253204762936), latLng(52.26957702764506, 0.3173194918781519)),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 11.5,
      mapOptions: {
        zoomSnap: 0.5
      }
    }
  },
  components: {
    PageTitle,
    Card,

    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip
  },
  methods: {
    getStopsOnLoad() {
      // A cheat
      this.mapPositionUpdate(latLngBounds(latLng(52.14334052457373, -0.04969253204762936), latLng(52.26957702764506, 0.3173194918781519)))
    },
    mapPositionUpdate(bounds) {
      let bottomLeftLon = bounds._southWest.lng;
      let bottomLeftLat = bounds._southWest.lat;
      let topRightLon = bounds._northEast.lng;
      let topRightLat = bounds._northEast.lat;

      axios
        .get(`/api/stops/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
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
    },
  }
}
</script>