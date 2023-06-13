<template>
  <div>
    <PageTitle>
      Search Results
    </PageTitle>
    <Card>
      <div class="mb-4 last:mb-0 " v-for="(journeyPlan, index) in this.journeyPlans" v-bind:key="index">
        <div class="flex">
          <div class="flex-auto my-auto">
            <div>
              {{ this.pretty.time(journeyPlan.StartTime) }} -> {{ this.pretty.time(journeyPlan.ArrivalTime) }} ({{ journeyPlan.Duration }})
            </div>
            <div class="text-xs">
              <span v-if="journeyPlan.RouteItems.length==1">
                Direct
              </span>
              <span v-else>
                {{ journeyPlan.RouteItems.length-1 }} changes
              </span>
            </div>
          </div>
          <div class="my-auto text-right">
   
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

export default {
  name: 'JourneyPlannerSearch',
  components: {
    Card,
    PageTitle,
  },
  data () {
    return {
      pretty: Pretty,
      journeyPlans: [],
      loadingResult: true
    }
  },
  methods: {
    getJourneyPlan() {
      axios
        .get(`${API.URL}/core/planner/${this.$route.query.origin}/${this.$route.query.destination}`)
        .then(response => {
          this.journeyPlans = response.data
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loadingResults = false)
    },
  },
  mounted () {
    console.log(this.$route.query)
    this.getJourneyPlan()
  }
}
</script>