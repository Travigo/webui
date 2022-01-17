<template>
  <div v-if="loadingStop">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.stop.PrimaryName }}
      <span class="text-sm text-gray-700">
        {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
      </span>
      <span v-if="!this.stop.Services" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 ml-1">
        No services run at this stop
      </span>

      <div class="md:float-right inline">
        <span
          v-for="service in this.stop.Services" v-bind:key="service.PrimaryIdentifier"
          class="text-base text-center font-semibold inline-block py-1 px-2 uppercase rounded text-blue-600 bg-blue-200 ml-2 h-8 min-w-[1rem]"
        >
          {{ service.ServiceName }}
        </span>
      </div>
    </PageTitle>
    <div class="flex flex-col-reverse md:flex-row h-full">
      <div class="basis-full md:basis-1/2 md:mr-2 mt-4 md:mt-0">  
        <Card>
          <template #title>
            Departures
          </template>
          <span v-if="this.loadingDepartures" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
            Loading...
          </span>
          <span v-else-if="!this.departures" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
            No upcoming departures at this stop
          </span>

          <div class="mb-4 last:mb-0 " v-for="(departure, index) in this.departures" v-bind:key="departure.PrimaryIdentifier">
            <div class="block text-center text-xs mb-4 text-gray-400" v-if="this.departureDayChange(index)">
              {{ this.prettyDay(departure.Time) }}
            </div>
            <div class="flex">
              <div class="text-xl text-center font-semibold inline-block py-2 px-2 uppercase rounded text-blue-600 bg-blue-200 mr-2 h-11 min-w-[2.5rem]">
                {{ departure.Journey.Service.ServiceName }}
              </div>
              <div class="flex-auto my-auto">
                <div>
                  {{ departure.DestinationDisplay }}
                </div>
                <div class="text-xs">
                  <router-link :to="{'name': 'operators/view', params: {'id': departure.Journey.Operator.PrimaryIdentifier}}">
                    {{ departure.Journey.Operator.PrimaryName }}
                  </router-link>
                </div>
              </div>
              <div class="my-auto">
                <router-link :to="{'name': 'journeys/view', params: {'id': departure.Journey.PrimaryIdentifier}}">
                  {{ this.prettyTime(departure.Time) }}
                </router-link>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div class="basis-full md:basis-1/2 md:ml-2 h-[150px] md:h-[400px]">
        <l-map
          :zoom="zoom"
          :center="center"
          :options="mapOptions"
          style="height: 100%"
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
import API from '@/API'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      stop: null,
      loadingStop: true,

      departures: null,
      loadingDepartures: true,

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
  methods: {
    getStop() {
      axios
      .get(`${API.URL}/stops/${this.$route.params.id}`)
      .then(response => {
        this.stop = response.data

        this.center = latLng(this.stop.Location.coordinates[1], this.stop.Location.coordinates[0])
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loadingStop = false)
    },
    getDepartures() {
      axios
      .get(`${API.URL}/stops/${this.$route.params.id}/departures?count=15`)
      .then(response => {
        this.departures = response.data
      })
      .catch(error => {
        console.log(error)
        // this.error = error
      })
      .finally(() => this.loadingDepartures = false)
    },
    prettyTime(datetimeString) {
      let datetime = new Date(Date.parse(datetimeString))

      let hour = datetime.getHours()
      let minute = datetime.getMinutes()
      let minuteFormatted = minute < 10 ? "0" + minute : minute

      return `${hour}:${minuteFormatted}`
    },
    prettyDay(datetimeString) {
      let datetime = new Date(Date.parse(datetimeString))
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

      return days[datetime.getDay()]
    },
    departureDayChange(index) {
      let comparisonDateTime;
      // If we're at the start then comparison datetime is current date else its the last items
      // TODO when able to look in future handle that
      if (index == 0) {
        comparisonDateTime = new Date(Date.now())
      } else {
        comparisonDateTime = new Date(Date.parse(this.departures[index-1].Time))
      }

      let currentDateTime = new Date(Date.parse(this.departures[index].Time))

      return comparisonDateTime.getDate() != currentDateTime.getDate()
    }
  },
  mounted () {
    this.getStop()
    this.getDepartures()
  }
}
</script>