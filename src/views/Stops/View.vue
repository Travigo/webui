<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loadingStop">Loading...</div>
  <div v-else class="h-full">
    <PageTitle paddingStyle="pb-0 py-2 md:py-4 lg:py-6">
      {{ this.stop.PrimaryName }}
      <span class="text-sm text-gray-700">
        {{ this.stop.OtherNames.Indicator }} {{ this.stop.OtherNames.Landmark }}
      </span>

      <div class="md:float-right inline overflow-x-scroll w-full">
          <div class="dx overflow-y-hidden w-full whitespace-nowrap text-right">
            <ServiceIcon
              class="ml-2"
              v-for="service in this.stop.Services" v-bind:key="service.PrimaryIdentifier" 
              :service="service" 
            />
          </div>
      </div>

      <div class="clear-both" />
    </PageTitle>

    <div class="mmin-h-screen flex flex-col">
      <div>
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
              <span v-else-if="this.departures.length == 0" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
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
                    :short="departure.Journey.Service.BrandDisplayMode=='short'"
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
                    <router-link 
                      :to="{'name': 'journeys/view', params: {'id': departure.Journey.PrimaryIdentifier}}" 
                      v-if="departure.Journey.PrimaryIdentifier !=''"
                    >
                      <DepartureTimeView :departure="departure" />
                    </router-link>
                    <DepartureTimeView :departure="departure" v-else />
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

      <!-- <div class="sticky bottom-0 z-50">
        <div class="bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-600 p-4 bottom-nav-bar">
          test2
        </div>
      </div> -->
    </div>
  </div>
</template>

<style scoped>
.bottom-nav-bar {
  margin-bottom: max(env(safe-area-inset-bottom), 8px)
}
</style>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import Alert from '@/components/Alert.vue'
import DepartureTimeView from '@/components/Stops/DepartureTimeView.vue'
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
    DepartureTimeView,
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
            'count': 25,
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
