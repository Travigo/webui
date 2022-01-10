<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.stop.PrimaryName }}
      <span class="text-sm text-gray-700">
        {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
      </span>
    </PageTitle>
    <div class="flex flex-row h-full">
      <div class="basis-1/2 mr-2">
        <Card>
          {{ this.stop.OtherNames }}
        </Card>
        <PageTitle>
          Services
        </PageTitle>
        <Card>
          <div class="mb-4 last:mb-0" v-for="service in this.stop.Services" v-bind:key="service.PrimaryIdentifier">
            <span class="text-3xl text-center font-semibold inline-block py-1 px-2 uppercase rounded text-pink-600 bg-pink-200 mr-1 h-12 min-w-[3rem]">
              {{ service.ServiceName }}
            </span>
            <span>
              {{ service.OutboundDescription.Destination }}
            </span>
            <span v-if="service.OutboundDescription.Destination===''">
              {{ service.OutboundDescription.Description }}
            </span>
          </div>
        </Card>
      </div>
      <div class="basis-1/2 ml-2">
        <l-map
          :zoom="zoom"
          :center="center"
          :options="mapOptions"
          style="height: 400px"
        >
          <l-tile-layer
            :url="url"
            :attribution="attribution"
          />
            <l-marker :lat-lng="center">
              <l-tooltip :options="{ permanent: true, interactive: true }">
                <div>
                  <p>
                    <strong>{{ this.stop.PrimaryName }}</strong>
                  </p>
                  {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
                </div>
              </l-tooltip>
            </l-marker>
        </l-map>
      </div>
    </div>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      stop: null,
      loading: true,
      error: null,

      zoom: 16,
      center: latLng(47.41322, -1.219482),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      // withPopup: latLng(47.41322, -1.219482),
      // withTooltip: latLng(47.41422, -1.250482),
      currentZoom: 11.5,
      // currentCenter: latLng(47.41322, -1.219482),
      // showParagraph: false,
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
  mounted () {
    axios
      .get(`/api/stops/${this.$route.params.id}`)
      .then(response => {
        this.stop = response.data

        this.center = latLng(this.stop.Location.coordinates[1], this.stop.Location.coordinates[0])
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
  }
}
</script>