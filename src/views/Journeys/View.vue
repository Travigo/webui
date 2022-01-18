<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <Card class="mt-4">
      <ol class="relative border-l border-gray-200">                  
        <li class="mb-5 ml-4 last:mb-0 relative" v-for="(point, index) in this.journey.Path" v-bind:key="index">
          <div class="absolute w-3 h-3 bg-gray-200 rounded-full -left-[1.4rem] top-1.5 border border-white"></div>

          <div class="flex">
            <div class="flex-auto my-auto">
              <div class="mb-1 font-normal text-gray-900">
                {{ point.OriginStop.PrimaryName }}
              </div>
              <div class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">
                {{ index }}
                <!-- subtext -->
              </div>
            </div>
            <div class="text-base font-normal">
              {{ this.pretty.time(point.OriginArivalTime) }}
            </div>
          </div>
        </li>
      </ol>
    </Card>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  data () {
    return {
      journey: null,
      loading: true,
      error: null,

      pretty: Pretty
    }
  },
  components: {
    PageTitle,
    Card
  },
  methods: {
    getJourney() {
      axios
      .get(`${API.URL}/journeys/${this.$route.params.id}`)
      .then(response => {
        this.journey = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getJourney()
  }
}
</script>