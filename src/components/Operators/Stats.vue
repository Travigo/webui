<template>
  <Card>
    <h1 class="text-lg font-semibold text-slate-900 dark:text-white">
      Journey Identification
    </h1>

    <div>
      <strong>Last Day Success: </strong> {{ (this.operatorStats?.LastDayRate * 100).toFixed(1) }}%
    </div>

    <div>
      <strong>Last Week Success: </strong> {{ (this.operatorStats?.LastWeekRate * 100).toFixed(1) }}%
    </div>

    <div>
      <strong>Last Month Success: </strong> {{ (this.operatorStats?.LastMonthRate * 100).toFixed(1) }}%
    </div>

    <div>
      <strong>Rating: </strong> {{ this.operatorStats?.Rating }}
    </div>

    <p>
      More stats coming soon
    </p>
  </Card>
</template>

<script>
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'

export default {
  data () {
    return {
      operatorStats: null,
    }
  },
  components: {
    Card,
  },
  props: {
    operator: {},
  },
  methods: {
    getOperatorStats() {
      axios
        .get(`${API.URL}/stats/identification_rate`, {
          params: {
            'operators': this.operator.PrimaryIdentifier
          }
        })
        .then(response => {
          // Return as map of operator IDs but we're only interested in the first (and hopefully only) result
          let firstValKey = Object.keys(response.data.Operators)[0]
          this.operatorStats = response.data.Operators[firstValKey]
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    }
  },
  mounted () {
    this.getOperatorStats()
  }
}
</script>
