<template>
  <Card class="m-4">
    <h1 class="text-3xl font-bold leading-tight text-gray-900 mb-4">
      Welcome
    </h1>

    <p>
      BritBus is an app that provides realtime &amp; up to date information on bus transport within Great Britain.
    </p>

    <p class="pt-4">
      It is currently in a beta state with only limited functionality.
    </p>

    <div class="pt-4">
      <h1 class="text-xl font-bold">
        Current Features
      </h1>

      <ul class="list-disc pl-5">
        <li>You can explore the <b>Map</b> using the navigation menu above, select a bus stop and view upcoming scheduled buses &amp; realtime tracked buses with accurate estimated arrivals</li>
        <li>Visit <b>Operators</b> for a list of all bus operators in your region.</li>
      </ul>
    </div>
  </Card>

  <div class="sm:grid sm:h-32 sm:grid-flow-row sm:gap-4 sm:grid-cols-4">
    <Stat-Card title="Operators" :value="this.stats?.operators.toLocaleString('en', {useGrouping:true})" />
    <Stat-Card title="Services" :value="this.stats?.services.toLocaleString('en', {useGrouping:true})" />
    <Stat-Card title="Buses Currently Tracked" :value="this.stats?.active_realtime_journeys.toLocaleString('en', {useGrouping:true})" />
    <Stat-Card title="Historical Journeys" :value="this.stats?.historical_realtime_journeys.toLocaleString('en', {useGrouping:true})" />
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import StatCard from '@/components/StatCard.vue'

import axios from 'axios'
import API from '@/API'

export default {
  name: 'Home',
  components: {
    Card,
    StatCard,
  },
  data () {
    return {
      stats: undefined
    }
  },
  methods: {
    getStats() {
      axios
        .get(`${API.URL}/stats`)
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
  }
}
</script>