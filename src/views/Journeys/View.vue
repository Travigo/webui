<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <Page-Title>
      <ServiceIcon
        class="ml-2"
        v-if="journey.Service!==undefined"
        :service="journey.Service" 
      /> {{ journey.DestinationDisplay }}

      <p
        class="text-sm font-medium text-gray-500"
        v-if="journey.RealtimeJourney && journey.RealtimeJourney.ActivelyTracked"
      >
        <span
          v-if="journey.RealtimeJourney"
          class="
            text-base text-center
            inline-block
            px-2
            rounded
            text-blue-600
            bg-blue-200
            h-6
            min-w-[1rem]
          "
        >
          Realtime
        </span>
        <span
          v-if="journey.RealtimeJourney?.Reliability === 'LocationWithoutTrack'"
          class="
            text-base text-center
            inline-block
            px-2
            rounded
            text-orange-600
            bg-orange-200
            ml-2
            h-6
            min-w-[1rem]
          "
        >
          Low Accuracy
        </span>
        Last location update at {{ this.pretty.time(journey.RealtimeJourney.ModificationDateTime) }}
        <span v-if="journey.RealtimeJourney.VehicleLocationDescription">
          &#x2022; {{ journey.RealtimeJourney.VehicleLocationDescription }}
        </span>
      </p>
    </Page-Title>

    <DetailedInformationRail :journey="journey"/>

    <div class="service-alerts">
      <ServiceAlert :alert="serviceAlert" v-for="(serviceAlert, id) in this.serviceAlerts" v-bind:key="id" />
    </div>

    <div class="md:hidden">
      <NavTabBar :tabs="tabs" :currentTab="currentTab" :changeTab="changeTab" />
    </div>
    <div class="flex flex-col-reverse md:flex-row h-full">
      <div
        class="basis-full md:basis-1/2 md:mr-2 mt-4 md:mt-0 md:block"
        v-bind:class="{ hidden: this.currentTab !== 'timeline' }"
      >
        <Card>
          <a
            v-if="!this.expandInactiveStops && this.hasHiddenStops"
            @click="showAllStops()"
            href="#"
            class="
              text-center
              block
              bg-gray-100
              text-gray-600 text-sm
              p-1
              rounded-lg
              dark:bg-gray-700 dark:border-gray-400 dark:text-gray-300
            "
          >
            Show previous stops
          </a>
          <ol class="relative border-l border-gray-300">
            <li
              class="mb-5 ml-4 last:mb-0 relative"
              v-for="(point, index) in this.journeyPoints"
              v-bind:key="index"
            >
              <span v-if="this.showStop(index)">
                <div
                  class="
                    absolute
                    w-3
                    h-3
                    bg-gray-300
                    rounded-full
                    -left-[1.4rem]
                    top-1.5
                    border border-white
                  "
                  v-bind:class="{ 'bg-gray-600': point.active }"
                ></div>

                <div
                  class="flex text-gray-600"
                  v-bind:class="{ 'text-gray-900 dark:text-gray-100': point.active }"
                >
                  <div class="flex-auto my-auto min-h-[40px]">
                    <div class="mb-1 font-normal">
                      <router-link
                          :to="{'name': 'stops/view', params: {'id': point.stop.PrimaryIdentifier}}"
                      >
                        {{ point.stop.PrimaryName }}
                      </router-link>
                    </div>
                    <div
                      class="
                        mb-1
                        text-sm
                        font-normal
                        leading-none
                        text-gray-400
                      "
                    >
                      <div class="text-xs text-gray-500">
                        <span v-if="point.platform">
                          Platform {{ point.platform }} <span v-if="point.platformType !== 'ACTUAL'">(Estimated)</span>
                        </span>
                        <span v-if="point.activity?.length == 1 && point.platform"> &#8226; </span>
                        <span>
                          <span v-if="point.activity?.length == 1">
                            {{ point.activity[0] }} only
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="text-base font-normal text-right">
                    <p
                      v-if="
                        point.realtime &&
                        point.realtime.Cancelled
                      "
                    >
                      <div class="text-xs px-2 rounded text-red-200 bg-red-600">
                        CANCELLED
                      </div>
                    </p>
                    <p v-else-if="
                      point.activity?.length == 1 &&
                      point.activity[0] == 'Setdown' &&
                      !point?.lastOne
                    ">
                      --:--
                    </p>
                    <p
                      v-else-if="
                        point.realtime &&
                        this.pretty.time(point.departureTime) !== this.pretty.time(point.realtime.DepartureTime) &&
                        point.realtime.DepartureTime !== '0001-01-01T00:00:00Z'
                      "
                    >
                      <span class="text-xs line-through">
                        {{ this.pretty.time(point.departureTime) }}
                      </span>
                      <span class="text-red-500">
                        {{ this.pretty.time(point.realtime.DepartureTime) }}
                      </span>
                    </p>
                    <p
                      v-else-if="
                        point.realtime &&
                        this.pretty.time(point.departureTime) === this.pretty.time(point.realtime.DepartureTime)
                      "
                    >
                      <span class="text-green-700">
                        {{ this.pretty.time(point.departureTime) }}
                      </span>
                    </p>
                    <p v-else>
                      {{ this.pretty.time(point.departureTime) }}
                    </p>
                    <!-- SWAPPY SWAPPY -->
                    <p
                      class="text-xs"
                      v-if="
                        this.pretty.time(point.arrivalTime) !== this.pretty.time(point.departureTime) &&
                        point.arrivalTime != null && !(point.realtime && point.realtime?.Cancelled)
                      "
                    >
                      <span
                        v-if="
                          point.realtime &&
                          this.pretty.time(point.arrivalTime) !== this.pretty.time(point.realtime.ArrivalTime) &&
                          point.realtime.ArrivalTime !== '0001-01-01T00:00:00Z'
                        "
                      >
                        Arrives
                        <span class="text-xs line-through">
                          {{ this.pretty.time(point.arrivalTime) }}
                        </span>
                        <span class="text-red-500">
                          {{ this.pretty.time(point.realtime.ArrivalTime) }}
                        </span>
                      </span>
                      <span
                        v-else-if="
                          point.realtime &&
                          this.pretty.time(point.arrivalTime) === this.pretty.time(point.realtime.ArrivalTime)
                        "
                      >
                        <span class="text-green-700">
                          Arrives {{ this.pretty.time(point.arrivalTime) }}
                        </span>
                      </span>
                      <span v-else>
                        Arrives {{ this.pretty.time(point.arrivalTime) }}
                      </span>
                    </p>
                  </div>
                </div>
              </span>
            </li>
          </ol>
        </Card>
      </div>
      <div
        class="basis-full md:basis-1/2 md:ml-2 h-[450px] md:h-[400px] md:block"
        v-bind:class="{ hidden: this.currentTab !== 'map' }"
      >
        <div v-if="journey?.RealtimeJourney?.Occupancy.OccupancyAvailable">
          <Card class="mb-4">
            <div><strong>Occupancy: </strong> {{ pretty.occupancyDescription(journey?.RealtimeJourney?.Occupancy.TotalPercentageOccupancy) }}</div>
            <div v-if="journey?.RealtimeJourney?.Occupancy.ActualValues">
              <div v-if="journey?.RealtimeJourney?.Occupancy.SeatedInformation">
                <strong>Seats: </strong>
                {{ journey?.RealtimeJourney?.Occupancy.SeatedOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.SeatedCapacity }}
              </div>
              <div v-if="journey?.RealtimeJourney?.Occupancy.WheelchairInformation">
                <strong>Wheelchair Spaces: </strong>
                {{ journey?.RealtimeJourney?.Occupancy.WheelchairOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.WheelchairCapacity }}
              </div>
            </div>
          </Card>
        </div>

        <div v-if="journey?.DetailedRailInformation">
          <Card class="mb-4">
            <strong>{{ journey.DetailedRailInformation.VehicleType }} ({{ journey.DetailedRailInformation.VehicleTypeName }})</strong>
            <div>
              <strong>Speed: </strong> {{ journey.DetailedRailInformation.SpeedKMH }} km/h
            </div>

            <div>
              <strong>Seating: </strong> {{ journey.DetailedRailInformation.Seating }}
            </div>

            <div>
              <strong>WiFi: </strong> {{ journey.DetailedRailInformation.WiFi }}
            </div>
            <div>
              <strong>Toilets: </strong> {{ journey.DetailedRailInformation.Toilets }}
            </div>
            <div>
              <strong>Power Plugs: </strong> {{ journey.DetailedRailInformation.PowerPlugs }}
            </div>
            <div>
              <strong>USB Plugs: </strong> {{ journey.DetailedRailInformation.USBPlugs }}
            </div>
            <div>
              <strong>Disabled Access: </strong> {{ journey.DetailedRailInformation.DisabledAccess }}
            </div>
            <div>
              <strong>Bicycle Spaces: </strong> {{ journey.DetailedRailInformation.BicycleSpaces }}
            </div>

            <div>
              <strong>Sleepers: </strong> {{ journey.DetailedRailInformation.SleeperAvailable }}
            </div>
            <div v-if="journey.DetailedRailInformation.SleeperAvailable">
              <strong>Sleeper for: </strong> {{ journey.DetailedRailInformation.Sleepers }}
            </div>

            <div>
              <strong>Air Conditioning: </strong> {{ journey.DetailedRailInformation.AirConditioning }}
            </div>

            <div>
              <strong>Catering: </strong> {{ journey.DetailedRailInformation.CateringAvailable }}
            </div>
            <div v-if="journey.DetailedRailInformation.CateringAvailable">
              <strong>Catering Description: </strong> {{ journey.DetailedRailInformation.CateringDescription }}
            </div>

            <div>
              <strong>Driver only: </strong> {{ journey.DetailedRailInformation.DriverOnly }}
            </div>
            <div>
              <strong>Guard required: </strong> {{ journey.DetailedRailInformation.GuardRequired }}
            </div>

            <div>
              <strong>Reservation Required: </strong> {{ journey.DetailedRailInformation.ReservationRequired }}
            </div>
            <div>
              <strong>Reservation Required for bike: </strong> {{ journey.DetailedRailInformation.ReservationBikeRequired }}
            </div>
            <div>
              <strong>Reservation Recommended: </strong> {{ journey.DetailedRailInformation.ReservationRecommended }}
            </div>
          </Card>
        </div>

        <mapbox-map
          accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
          mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
          style="height: 100%"
          :zoom="zoom"
          :center="center"
          @loaded="mapLoaded"
        >
          <div v-for="(point, index) in this.journeyPoints" v-bind:key="index">
            <mapbox-marker :lngLat="point.location">
              <template v-slot:icon>
                <img src="/icons/bus-stop-station-svgrepo-com-16x16.png">
              </template>
            </mapbox-marker>

            <mapbox-geogeometry-raw :source="point.track" v-if="point.track">
              <mapbox-geogeometry-line :width="5" :color="point.active ? 'green' : 'gray'" />
            </mapbox-geogeometry-raw>
          </div>

          <mapbox-marker 
            :lngLat="this.journey.RealtimeJourney.VehicleLocation.coordinates"
            :rotation="this.journey.RealtimeJourney.VehicleBearing-90" 
            v-if="this.journey.RealtimeJourney && this.journey.RealtimeJourney.VehicleLocation.coordinates.length === 2"
          >
            <template v-slot:icon>
              <img src="/icons/bus-svgrepo-com-32x32.png">
            </template>
          </mapbox-marker>
        </mapbox-map>
      </div>
    </div>
  </div>
</template>

<script>
import PageTitle from "@/components/PageTitle.vue"
import Card from "@/components/Card.vue"
import NavTabBar from "@/components/NavTabBar.vue"
import ServiceIcon from '@/components/ServiceIcon.vue'
import Alert from "@/components/Alert.vue"
import ServiceAlert from '@/components/ServiceAlert.vue'
import DetailedInformationRail from '@/components/DetailedInformationRail.vue'
import axios from "axios"
import API from "@/API"
import Pretty from "@/pretty"

export default {
  data() {
    return {
      journey: null,
      journeyPoints: null,

      serviceAlerts: [],

      loading: true,
      error: undefined,

      pretty: Pretty,

      zoom: 4,
      center: [-4, 55],

      mapboxObject: undefined,
      bounds: undefined,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,

      expandInactiveStops: false,
      hasHiddenStops: false,

      currentTab: "timeline",
      tabs: [
        {
          id: "timeline",
          name: "Timeline",
        },
        {
          id: "map",
          name: "Map",
        },
      ]
    };
  },
  components: {
    PageTitle,
    Card,
    NavTabBar,
    Alert,
    ServiceIcon,
    ServiceAlert,
    DetailedInformationRail
  },
  methods: {
    mapLoaded(map) {
      this.mapboxObject = map

      map.resize()

      this.setBounds()
    },
    setBounds() {
      if (this.mapboxObject !== undefined && this.bounds === undefined && this.journey !== undefined) {
        let northeastern = [999999, 999999]
        let southwestern = [-999999, -999999]

        const boundingBoxPadding = 0.015

        for (let index = 0; index < this.journeyPoints.length; index++) {
          const element = this.journeyPoints[index]
          const cords = element.stop.Location.coordinates

          if (cords[0] < northeastern[0]) {
            northeastern[0] = cords[0] - boundingBoxPadding
          }
          if (cords[1] < northeastern[1]) {
            northeastern[1] = cords[1] - boundingBoxPadding
          }

          if (cords[0] > southwestern[0]) {
            southwestern[0] = cords[0] + boundingBoxPadding
          }
          if (cords[1] > southwestern[1]) {
            southwestern[1] = cords[1] + boundingBoxPadding
          }
        }
        this.bounds = [
          southwestern,
          northeastern
        ]
        
        this.mapboxObject.fitBounds(this.bounds)
      }
    },
    getData() {
      this.getJourney()
      this.getServiceAlerts()
    },
    getJourney() {
      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}`)
        .then((response) => {
          let newJourney = response.data

          this.journeyPoints = this.extractJourneyPoints(newJourney)

          this.journey = newJourney

          this.setBounds()
        })
        .catch((error) => {
          console.log(error)
          this.error = error
        })
        .finally(() => (this.loading = false))
    },
    getRealtimeJourney() {
      if (this.journey == null) {
        return
      }

      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}?realtime_only=true`)
        .then((response) => {
          let newRealtimeJourney = response.data

          this.journey.RealtimeJourney = newRealtimeJourney

          this.journeyPoints = this.extractJourneyPoints(this.journey)

          this.setBounds()
        })
        .catch((error) => {
          console.log(error)
          this.error = error
        })
        .finally(() => (this.loading = false))
    },
    extractJourneyPoints(journey) {
      let journeyPoints = []

      for (let index = 0; index < journey.Path.length; index++) {
        const element = journey.Path[index]

        let track = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {
                stroke: "#545454",
                "stroke-width": 9.6,
                "stroke-opacity": 1,
              },
              geometry: {
                type: "LineString",
                coordinates: element.Track.map((x) => x.coordinates),
              },
            },
          ],
        }

        let platform = element.OriginPlatform
        let platformType = 'ESTIMATED'

        if (journey.RealtimeJourney?.Stops?.[element.OriginStopRef]?.Platform !== "" 
            && journey.RealtimeJourney?.Stops?.[element.OriginStopRef]?.Platform !== undefined) {
          platform = journey.RealtimeJourney?.Stops?.[element.OriginStopRef]?.Platform
          platformType = 'ACTUAL'
        }

        journeyPoints.push({
          stop: element.OriginStop,
          location: element.OriginStop.Location.coordinates,
          arrivalTime: element.OriginArrivalTime,
          departureTime: element.OriginDepartureTime,
          activity: element.OriginActivity,
          track: track,
          realtime: journey.RealtimeJourney?.Stops?.[element.OriginStopRef],
          platform: platform,
          platformType: platformType,
        })

        // TODO: is it possible for the path to be broken? eg originstop != last departure stop

        // if last one in list then append the destination stop
        if (index === journey.Path.length - 1) {
          let platform = element.DestinationPlatform
          let platformType = 'ESTIMATED'

          if (journey.RealtimeJourney?.Stops?.[element.DestinationStopRef]?.Platform !== "") {
            platform = journey.RealtimeJourney?.Stops?.[element.DestinationStopRef]?.Platform
            platformType = 'ACTUAL'
          }
          // TODO this is a little hack?
          if (journey.RealtimeJourney !== undefined && journey.RealtimeJourney?.Stops !== null && journey.RealtimeJourney?.Stops !== undefined
              && journey.RealtimeJourney.Stops[element.DestinationStopRef] !== undefined) {
            journey.RealtimeJourney.Stops[element.DestinationStopRef].DepartureTime = element.DestinationArrivalTime
          }

          journeyPoints.push({
            stop: element.DestinationStop,
            arrivalTime: element.DestinationArrivalTime,
            location: element.DestinationStop.Location.coordinates,
            departureTime: element.DestinationArrivalTime,
            activity: element.DestinationActivity,
            track: null,
            realtime: journey.RealtimeJourney?.Stops?.[element.DestinationStopRef],
            platform: platform,
            platformType: platformType,
            lastOne: true
          })
        }
      }

      let activeStop = journey.RealtimeJourney == undefined || journey.RealtimeJourney?.NextStopRef == ""

      if (!activeStop) {
        this.hasHiddenStops = true
      }

      for (let index = 0; index < journeyPoints.length; index++) {
        if (
          !activeStop &&
          journey.RealtimeJourney != undefined &&
          journey.RealtimeJourney.NextStopRef ===
            journeyPoints[index].stop.PrimaryIdentifier
        ) {
          activeStop = true
        }

        journeyPoints[index]["active"] = activeStop
      }

      return journeyPoints
    },
    getServiceAlerts() {
      // TODO get correct date - this might be wrong when looking at future journey or on journeys that span 2 days
      let yourDate = new Date()
      const offset = yourDate.getTimezoneOffset()
      yourDate = new Date(yourDate.getTime() - (offset*60*1000))
      let journeyRunDate = yourDate.toISOString().split('T')[0]

      let dayinstanceof = 'DAYINSTANCEOF:' + journeyRunDate + ':' + this.$route.params.id
      axios
        .get(`${API.URL}/core/service_alerts/matching/${this.$route.params.id},${dayinstanceof}`)
        .then(response => {
          this.serviceAlerts = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    changeTab(newTab) {
      this.currentTab = newTab
    },
    showStop(index) {
      return this.journeyPoints[index]["active"] || this.expandInactiveStops
    },
    showAllStops() {
      this.expandInactiveStops = true
    },
  },
  mounted() {
    this.getData();
    this.refreshTimer = setInterval(this.getRealtimeJourney, 10000)
    this.serviceAlertsRefreshTimer = setInterval(this.getServiceAlerts, 60000)
  },
  beforeRouteLeave() {
    clearInterval(this.refreshTimer)
    clearInterval(this.serviceAlertsRefreshTimer)
  },
};
</script>