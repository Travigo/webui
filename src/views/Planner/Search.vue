<template>
  <div>
    <PageTitle>
      Search Results
    </PageTitle>
    <Card>
      <div class="mb-4 last:mb-0 " v-for="(journeyPlan, index) in this.journeyPlans" v-bind:key="index">
        <div class="flex">
          <div class="flex-auto my-auto">
            <div class="flex w-[30rem]">
              <div class="flex-auto my-auto">
                <div class="text-lg">{{ this.pretty.time(journeyPlan.StartTime) }}</div>
                <div class="text-sm">Scheduled</div>
              </div>

              <div class="flex-auto my-auto">
               ->  
              </div>

              <div class="flex-auto my-auto">
                <div class="text-lg">{{ this.pretty.time(journeyPlan.ArrivalTime) }}</div>
                <div class="text-sm">Scheduled</div>
              </div>
              
              <div class="flex-auto my-auto">
                ({{ this.pretty.duration(journeyPlan.Duration) }})
                <span 
                  v-if="index==earliestArrivalJourneyID"
                  class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1"
                >
                  Earliest
                </span>
              </div>
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
      loadingResult: true,
      earliestArrivalJourneyID: 0
    }
  },
  methods: {
    getJourneyPlan() {
      axios
        .get(`${API.URL}/core/planner/${this.$route.query.origin}/${this.$route.query.destination}`)
        .then(response => {
          this.journeyPlans = response.data

          let earliestTime = undefined
          for (let index = 0; index < this.journeyPlans.length; index++) {
            const element = this.journeyPlans[index]
            let datetime = new Date(element.ArrivalTime)
            
            if ((earliestTime === undefined) || (datetime < earliestTime)) {
              earliestTime = datetime
              this.earliestArrivalJourneyID = index
              continue
            }
          }
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