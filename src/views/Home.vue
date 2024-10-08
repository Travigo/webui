<template>
  <SearchBar />
  <Card class="m-4">
    <h1 class="text-3xl font-bold leading-tight text-gray-900 mb-4 dark:text-gray-200">
      Welcome
    </h1>

    <p>
      Travigo is an app that provides realtime &amp; up to date information on public transport within Great Britain.
    </p>

    <p class="pt-4">
      It is currently in a beta state with only limited functionality.
    </p>

    <div class="pt-4">
      <h1 class="text-xl font-bold">
        Current Features
      </h1>

      <ul class="list-disc pl-5">
        <li>You can explore the <b>Map</b> using the navigation menu above, select a transport stop and view upcoming scheduled journeys &amp; realtime tracked journeys with accurate estimated arrivals</li>
        <li>Visit <b>Operators</b> for a list of all transport operators in your region.</li>
      </ul>
    </div>
  </Card>

  <div class="sm:grid sm:h-32 sm:grid-flow-row sm:gap-3 sm:grid-cols-3 mt-2">
    <Stat-Card
      title="Vehicles Currently Tracked" :value="this.stats?.ActiveRealtimeJourneys.Current.toLocaleString('en', {useGrouping:true})"
      @click="openVehicleTrackInfoSheet()"
    />
    <Stat-Card class="mt-2 sm:mt-0" title="Stops" :value="this.stats?.Stops.toLocaleString('en', {useGrouping:true})" />
    <Stat-Card class="mt-2 sm:mt-0" title="Services" :value="this.stats?.Services.toLocaleString('en', {useGrouping:true})" />
  </div>

  <vue-bottom-sheet ref="vehiclesTrackedInfoSheet" maxHeight="380" class="relative">
    <div v-if="true" class="px-4" style="min-height: 380px">
      <PageTitle paddingStyle="pb-1">Transport Types</PageTitle>
      <div v-for="(count, mode) in this.stats?.ActiveRealtimeJourneys?.TransportTypes">
        {{ mode }} - {{ count }}
      </div>

      <PageTitle paddingStyle="py-1">Datasources</PageTitle>
      <div v-for="(count, datasource) in this.stats?.ActiveRealtimeJourneys?.Datasources">
        {{ datasource }} - {{ count }}
      </div>
    </div>
    <div style="height: 380px" v-else></div>
  </vue-bottom-sheet>
</template>

<script>
import Card from '@/components/Card.vue'
import StatCard from '@/components/StatCard.vue'
import SearchBar from '@/components/SearchBar.vue'
import PageTitle from '@/components/PageTitle.vue'
import VueBottomSheet from "@webzlodimir/vue-bottom-sheet"

import axios from 'axios'
import API from '@/API'

import  "@webzlodimir/vue-bottom-sheet/dist/style.css";

export default {
  name: 'Home',
  components: {
    Card,
    StatCard,
    SearchBar,
    PageTitle,
    VueBottomSheet
  },
  data () {
    return {
      stats: undefined,

      refreshTimer: undefined
    }
  },
  methods: {
    openVehicleTrackInfoSheet() {
      console.log("CUM")
      this.$refs.vehiclesTrackedInfoSheet.open()
    },
    getStats() {
      axios
        .get(`${API.URL}/core/stats`)
        .then(response => {
          this.stats = response.data
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
    }
  },
  mounted () {
    this.getStats()
    this.refreshTimer = setInterval(this.getStats, 250000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
  }, 
}
</script>