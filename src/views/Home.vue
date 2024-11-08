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
      title="Realtime Trips Currently Tracked" :value="this.stats?.realtimejourneys.stats.current.toLocaleString('en', {useGrouping:true})"
      @click="openDetailedStatsSheet('realtimejourneys')"
    />
    <Stat-Card 
      class="mt-2 sm:mt-0" title="Stops" :value="this.stats?.stops.stats.total.toLocaleString('en', {useGrouping:true})"
      @click="openDetailedStatsSheet('stops')"
    />
    <Stat-Card 
      class="mt-2 sm:mt-0" title="Services" :value="this.stats?.services.stats.total.toLocaleString('en', {useGrouping:true})"
      @click="openDetailedStatsSheet('services')"
    />
  </div>

  <vue-bottom-sheet ref="detailedStatsSheet" maxHeight="380" class="relative">
    <div v-if="true" class="px-4" style="min-height: 380px">
      <PageTitle paddingStyle="pb-1">Transport Types</PageTitle>
      <div v-for="(count, mode) in this.stats?.[this.detailedStatsSheetContent].stats.transporttypes">
        {{ mode }} - {{ count }}
      </div>

      <PageTitle paddingStyle="py-1">Countries</PageTitle>
      <div v-for="(count, country) in this.stats?.[this.detailedStatsSheetContent].stats.countries">
        {{ country }} - {{ count }}
      </div>

      <PageTitle paddingStyle="py-1">Datasources</PageTitle>
      <div v-for="(count, datasource) in this.stats?.[this.detailedStatsSheetContent].stats.datasources">
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
      detailedStatsSheetContent: 'realtimejourneys',

      refreshTimer: undefined
    }
  },
  methods: {
    openDetailedStatsSheet(viewName) {
      this.detailedStatsSheetContent = viewName
      this.$refs.detailedStatsSheet.open()
    },
    getStats() {
      axios
        .get(`${API.URL}/stats/calculated`)
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