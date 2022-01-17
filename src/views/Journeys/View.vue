<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.journey.PrimaryName }}
    </PageTitle>
    <Card>
      <strong>Currently not implemented</strong>
    </Card>
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
  data () {
    return {
      journey: null,
      loading: true,
      error: null,
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