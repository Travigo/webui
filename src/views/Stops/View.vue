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
        <ServiceIcon
          class="ml-2"
          v-for="service in this.stop.Services" v-bind:key="service.PrimaryIdentifier" 
          :service="service" 
        />
      </div>

      <div class="clear-both" />
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
              {{ this.pretty.day(departure.Time) }}
            </div>
            <div class="flex">
              <ServiceIcon 
                class="text-xl inline-block py-0 px-2 mr-2 h-11 min-w-[2.5rem]"
                style="line-height: 44px"
                :service="departure.Journey.Service"
              />
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
              <div class="my-auto text-right">
                <router-link :to="{'name': 'journeys/view', params: {'id': departure.Journey.PrimaryIdentifier}}">
                  {{ this.pretty.time(departure.Time) }}
                  <div class="text-xs text-green-700" v-if="departure.Type == 'RealtimeTracked'">
                    Realtime 
                    <span class="text-orange-700" v-if="departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack'">
                      &middot; Low Accuracy
                    </span>
                  </div>
                  <div class="text-xs text-gray-600" v-else-if="departure.Type == 'Scheduled'">
                    Scheduled
                  </div>
                   <div class="text-xs text-orange-600" v-else-if="departure.Type == 'Estimated'">
                    Estimated
                  </div>
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
import ServiceIcon from '@/components/ServiceIcon.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      pretty: Pretty,
      stop: null,
      loadingStop: true,

      departures: null,
      loadingDepartures: true,

      error: null,

      zoom: 13,
      center: latLng(52.2065, 0.1356),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 11.5,
      mapOptions: {
        zoomSnap: 0.5
      },

      refreshTimer: null
    }
  },
  components: {
    PageTitle,
    Card,
    ServiceIcon,

    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip
  },
  methods: {
    getStop() {
      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}`)
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
        .get(`${API.URL}/core/stops/${this.$route.params.id}/departures?count=15`)
        .then(response => {
          this.departures = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
        .finally(() => this.loadingDepartures = false)
    },
    getData() {
      this.getStop()
      this.getDepartures()
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
    this.getData()
    this.refreshTimer = setInterval(this.getData, 30000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
  }, 
}
</script>