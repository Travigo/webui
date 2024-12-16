<template>
  <div>
    <PageTitle>
      Search Results
    </PageTitle>
    <div class="text-gray-900 dark:text-gray-200">
      <span class="font-black">{{ this.results.OriginStop?.PrimaryName }}</span>
       -> 
      <span class="font-black">{{ this.results.DestinationStop?.PrimaryName }}</span>
    </div>

    <RefreshLoadingButton 
      :loading="this.loadingResults"
      @click="this.getJourneyPlan()"
    ></RefreshLoadingButton>

    <Card>
      <span 
        v-if="this.loadingResults"
        class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1"
      >
        Loading Results
      </span>
      <div class="mb-4 last:mb-0 " v-for="(journeyPlan, index) in this.results.JourneyPlans" v-bind:key="index">
        <div class="block text-center text-xs mb-4 text-gray-400" v-if="this.departureDayChange(index)">
          {{ this.pretty.day(journeyPlan.StartTime) }}
        </div>
        <div class="flex">
          <router-link
            :to="{'name': 'journeys/view', params: {'id': journeyPlan.RouteItems[0].Journey.PrimaryIdentifier}}"
          >
            <div class="flex-auto my-auto">
              <div class="flex">
                <div>
                  <div class="inline-block w-[4rem] text-center">
                    <div class="text-xl font-black">
                      {{ this.pretty.time(journeyPlan.StartTime) }}
                    </div>
                    <div class="text-xs font-light">{{ journeyPlan.RouteItems[0].JourneyType }}</div>
                  </div>

                  <div class="inline-block text-center w-[9rem]">
                  ->  
                  </div>

                  <div class="inline-block w-[4rem] text-center">
                    <div class="text-xl font-black">
                      {{ this.pretty.time(journeyPlan.ArrivalTime) }}
                    </div>
                    <div class="text-xs font-ligh">{{ journeyPlan.RouteItems[0].JourneyType }}</div>
                  </div>
                  
                  <div class="inline-block">
                    <span 
                      v-if="index==earliestArrivalJourneyID"
                      class="text-xs font-semibold inline-block py-1 px-2 rounded text-blue-600 bg-blue-200 mr-1"
                    >
                      Earliest
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-xs mt-2">
                {{ journeyPlan.RouteItems[0].Journey.Service.TransportType }} to {{ journeyPlan.RouteItems[0].Journey.DestinationDisplay }}
              </div>
              <div class="text-xs">
                <span v-if="journeyPlan.RouteItems.length==1">Direct</span>
                <span v-else>{{ journeyPlan.RouteItems.length-1 }} changes</span>, {{ this.pretty.duration(journeyPlan.Duration) }}
              </div>
            </div>
            <div class="my-auto text-right">
    
            </div>
          </router-link>
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
import RefreshLoadingButton from "@/components/RefreshLoadingButton.vue"

export default {
  name: 'JourneyPlannerSearch',
  components: {
    Card,
    PageTitle,
    RefreshLoadingButton
  },
  data () {
    return {
      pretty: Pretty,
      results: [],
      loadingResults: true,
      earliestArrivalJourneyID: 0
    }
  },
  methods: {
    getJourneyPlan() {
      axios
        .get(`${API.URL}/core/planner/${this.$route.query.origin}/${this.$route.query.destination}`)
        .then(response => {
          this.results = response.data

          let earliestTime = undefined
          for (let index = 0; index < this.results.JourneyPlans.length; index++) {
            const element = this.results.JourneyPlans[index]
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
    departureDayChange(index) {
      let comparisonDateTime;
      // If we're at the start then comparison datetime is current date else its the last items
      // TODO when able to look in future handle that
      if (index == 0) {
        comparisonDateTime = new Date(Date.now())
      } else {
        comparisonDateTime = new Date(Date.parse(this.results.JourneyPlans[index-1].StartTime))
      }

      let currentDateTime = new Date(Date.parse(this.results.JourneyPlans[index].StartTime))

      return comparisonDateTime.getDate() != currentDateTime.getDate()
    }
  },
  mounted () {
    console.log(this.$route.query)
    this.getJourneyPlan()
  }
}
</script>
