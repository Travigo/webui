<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <div class="flex flex-col-reverse md:flex-row h-full mt-4">
      <div class="basis-full md:basis-1/2 md:mr-2 mt-4 md:mt-0">  
        <Card>
          <ol class="relative border-l border-gray-200">                  
            <li class="mb-5 ml-4 last:mb-0 relative" v-for="(point, index) in this.journeyPoints" v-bind:key="index">
              <div class="absolute w-3 h-3 bg-gray-200 rounded-full -left-[1.4rem] top-1.5 border border-white"></div>

              <div class="flex">
                <div class="flex-auto my-auto min-h-[40px]">
                  <div class="mb-1 font-normal text-gray-900">
                    {{ point.stop.PrimaryName }}
                  </div>
                  <div class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                    <!-- <span v-for="activity in point.activity" v-bind:key="activity" class="text-xs p-1 rounded text-amber-600 bg-amber-200 mr-1 last:mr-0">
                      {{ activity }}
                    </span> -->
                  </div>
                </div>
                <div class="text-base font-normal text-right">
                  <p>
                    {{ this.pretty.time(point.arivalTime) }}
                  </p>
                  <p class="text-xs" v-if="point.arivalTime != point.departureTime && point.departureTime != null">
                    Departs {{ this.pretty.time(point.departureTime) }}
                  </p>
                </div>
              </div>
            </li>
          </ol>
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
          <div v-for="(point, index) in this.journeyPoints" v-bind:key="index">
            <l-marker :lat-lng="point.latLng">
              <l-popup>
                <div>
                  <p>
                    <strong>{{ point.stop.PrimaryName }}</strong>
                  </p>
                  {{ point.stop.OtherNames.Indicator }} {{ point.stop.OtherNames.Landmark }}
                </div>
              </l-popup>

              <l-polyline
                :lat-lngs="point.track"
                color="blue"
              />
            </l-marker>
          </div>
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
import Pretty from '@/pretty'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip, LPolyline } from '@vue-leaflet/vue-leaflet';

export default {
  data () {
    return {
      journey: null,
      journeyPoints: null,

      loading: true,
      error: null,

      pretty: Pretty,

      zoom: 12,
      center: latLng(52.2065, 0.1356),
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
    LTooltip,
    LPolyline
  },
  methods: {
    getJourney() {
      axios
      .get(`${API.URL}/journeys/${this.$route.params.id}`)
      .then(response => {
        let newJourney = response.data

        // newJourney.Path.forEach(stop => {
        //   stop.OriginStop.latLng = latLng(stop.OriginStop.Location.coordinates[1], stop.OriginStop.Location.coordinates[0])

        //   // stop.TrackLatLngs = stop.Track.map(x => latLng(x.coordinates[1], x.coordinates[0]))
        // })

        this.journeyPoints = this.extractJourneyPoints(newJourney.Path)

        this.journey = newJourney
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
    extractJourneyPoints(path) {
      let journeyPoints = []

      for (let index = 0; index < path.length; index++) {
        const element = path[index];
        
        journeyPoints.push({
          "stop": element.OriginStop,
          "latLng": latLng(element.OriginStop.Location.coordinates[1], element.OriginStop.Location.coordinates[0]),
          "arivalTime": element.OriginArivalTime,
          "departureTime": element.OriginDepartureTime,
          "activity": element.OriginActivity,
          "track": element.Track.map(x => latLng(x.coordinates[1], x.coordinates[0]))
        })

        // TODO: is it possible for the path to be broken? eg originstop != last departure stop

        // if last one in list then append the destination stop
        if (index == path.length-1) {
          journeyPoints.push({
            "stop": element.DestinationStop,
            "arivalTime": element.DestinationArivalTime,
            "latLng": latLng(element.DestinationStop.Location.coordinates[1], element.DestinationStop.Location.coordinates[0]),
            "departureTime": null,
            "activity": element.DestinationActivity,
            "track": []
          })
        }
      }


      console.log(journeyPoints)
      return journeyPoints
    }
  },
  mounted () {
    this.getJourney()
  }
}
</script>