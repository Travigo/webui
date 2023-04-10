<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loadingStop">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.stop.PrimaryName }}
      <span class="text-sm text-gray-700">
        {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
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

    <div v-for="(stat, operator) in this.operatorStats" v-bind:key="operator">
      <Alert type="warning" v-if="stat.Rating == 'POOR'">
        <strong>Notice</strong><br/>
        Realtime tracking is not available for all <strong>{{ operator }}</strong> services
      </Alert>

      <Alert type="error" v-if="stat.Rating == 'TEMPORARY-ISSUES'">
        <strong>Notice</strong><br/>
        Realtime tracking of <strong>{{ operator }}</strong> services is currently experiencing issues
      </Alert>
    </div>

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

          <span v-if="!this.stop.Services && !this.departures" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 ml-1">
            No services run at this stop
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
                  <div 
                    class="text-xs text-green-700" 
                    v-if="departure.Type == 'RealtimeTracked'"
                    :class="{ 'text-orange-400': (departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack') }"
                  >
                    <div 
                      class="inline-flex items-center justify-center w-1 h-1 text-xs bg-green-700 rounded-full"
                      :class="{ 'bg-orange-400': (departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack') }"
                    >&nbsp;</div>
                    Realtime 
                  </div>
                  <div class="text-xs text-gray-600 dark:text-gray-400" v-else-if="departure.Type == 'Scheduled'">
                    Scheduled
                  </div>
                   <div class="text-xs text-orange-500" v-else-if="departure.Type == 'Estimated'">
                    <div class="inline-flex items-center justify-center w-1 h-1 text-xs bg-orange-500 rounded-full">&nbsp;</div>
                    Estimated
                  </div>
                </router-link>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div class="hidden md:block basis-full md:basis-1/2 md:ml-2 h-[150px] md:h-[400px]">
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
                <p>
                  <strong>{{ this.stop.PrimaryName }}</strong>
                </p>
                {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
              </div>
            </mapbox-popup>
          </mapbox-marker>
        </mapbox-map>
      </div>
    </div>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import Alert from '@/components/Alert.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

export default {
  name: 'StopsView',
  data () {
    return {
      pretty: Pretty,
      stop: null,
      loadingStop: true,

      departures: null,
      loadingDepartures: true,

      operatorStats: undefined,

      error: undefined,

      zoom: 13,
      center: [0.1356, 52.2065],
      currentZoom: 11.5,

      refreshTimer: null
    }
  },
  components: {
    PageTitle,
    Card,
    ServiceIcon,
    Alert,
  },
  methods: {
    getStop() {
      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}`)
        .then(response => {
          this.stop = response.data

          this.center = this.stop.Location.coordinates

          this.getOperatorStats()
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loadingStop = false)
    },
    getDepartures() {
      axios
        .get(`${API.URL}/core/stops/${this.$route.params.id}/departures`, {
          params: {
            'count': 15,
            'datetime': this.$route.query.datetime
          }
        })
        .then(response => {
          this.departures = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
        .finally(() => this.loadingDepartures = false)
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
    console.log(this.$route.query.datetime)
    this.getData()
    this.refreshTimer = setInterval(this.getDepartures, 30000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
  }, 
}
</script>