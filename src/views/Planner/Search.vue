<template>
  <div class="space-y-4 pb-16 pt-2 sm:pb-20">
    <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>

    <PageHeader
      title="Journey results"
      :subtitle="`${originName} to ${destinationName}`"
      icon="route"
    >
      <template #meta>
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
            Direct journeys
          </span>
        </div>
      </template>

      <template #actions>
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:opacity-70 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-blue-500/10"
          :disabled="loadingResults"
          @click="getJourneyPlan()"
          aria-label="Refresh journey results"
        >
          <span class="material-symbols-outlined text-[23px]" :class="{'animate-spin': loadingResults}">refresh</span>
        </button>
      </template>
    </PageHeader>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
        <div>
          <h2 class="text-sm font-extrabold text-slate-950">Available journeys</h2>
          <p class="mt-1 text-sm text-slate-500">{{ journeyPlans.length }} result{{ journeyPlans.length === 1 ? '' : 's' }}</p>
        </div>
        <router-link
          :to="{ name: 'journeyplanner/home' }"
          class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
        >
          Edit
          <span class="material-symbols-outlined text-[17px]">edit</span>
        </router-link>
      </div>

      <LoadingState
        v-if="loadingResults"
        title="Loading journeys"
        subtitle="Finding available direct journeys."
        compact
        :rows="3"
        :show-tabs="false"
      />

      <div v-else-if="journeyPlans.length === 0" class="px-4 py-6">
        <div class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
          No direct journeys were found.
        </div>
      </div>

      <div v-else class="divide-y divide-slate-100">
        <template
          v-for="(journeyPlan, index) in journeyPlans"
          v-bind:key="index"
        >
          <div class="px-4 pt-4 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400" v-if="departureDayChange(index)">
            {{ pretty.day(journeyPlan.StartTime) }}
          </div>

          <router-link
            :to="journeyRoute(journeyPlan)"
            class="block px-4 py-4 transition hover:bg-slate-50 sm:px-5"
          >
            <div class="grid grid-cols-[1fr_auto] gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-3">
                  <div class="text-center">
                    <div class="text-xl font-extrabold leading-tight text-slate-950">
                      {{ pretty.time(journeyPlan.StartTime) }}
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-500">Depart</div>
                  </div>

                  <div class="flex min-w-0 flex-1 items-center gap-2">
                    <span class="h-px min-w-4 flex-1 bg-slate-200"></span>
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <span class="material-symbols-outlined text-[19px]">{{ transportIcon(primaryJourney(journeyPlan)?.Service?.TransportType) }}</span>
                    </span>
                    <span class="h-px min-w-4 flex-1 bg-slate-200"></span>
                  </div>

                  <div class="text-center">
                    <div class="text-xl font-extrabold leading-tight text-slate-950">
                      {{ pretty.time(journeyPlan.ArrivalTime) }}
                    </div>
                    <div class="mt-1 text-xs font-semibold text-slate-500">Arrive</div>
                  </div>
                </div>

                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                  <span class="rounded-full bg-slate-100 px-2.5 py-1">
                    {{ primaryJourney(journeyPlan)?.Service?.TransportType || primaryRouteItem(journeyPlan)?.JourneyType || 'Journey' }}
                  </span>
                  <span class="rounded-full bg-slate-100 px-2.5 py-1">
                    {{ changesLabel(journeyPlan) }}
                  </span>
                  <span class="rounded-full bg-slate-100 px-2.5 py-1">
                    {{ pretty.duration(journeyPlan.Duration) }}
                  </span>
                  <span
                    v-if="index==earliestArrivalJourneyID"
                    class="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700"
                  >
                    Earliest
                  </span>
                </div>

                <p class="mt-2 truncate text-sm font-semibold text-slate-500">
                  {{ primaryJourney(journeyPlan)?.DestinationDisplay || destinationName }}
                </p>
              </div>

              <span class="material-symbols-outlined self-center text-lg text-slate-400">chevron_right</span>
            </div>
          </router-link>
        </template>
      </div>
    </section>
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

export default {
  name: 'JourneyPlannerSearch',
  components: {
    Alert,
    LoadingState,
    PageHeader
  },
  data () {
    return {
      pretty: Pretty,
      results: {},
      loadingResults: true,
      earliestArrivalJourneyID: 0,
      error: undefined
    }
  },
  computed: {
    journeyPlans() {
      return this.results?.JourneyPlans || []
    },
    originName() {
      return this.results?.OriginStop?.PrimaryName || 'Origin'
    },
    destinationName() {
      return this.results?.DestinationStop?.PrimaryName || 'Destination'
    }
  },
  methods: {
    primaryRouteItem(journeyPlan) {
      return journeyPlan.RouteItems?.[0]
    },
    primaryJourney(journeyPlan) {
      return this.primaryRouteItem(journeyPlan)?.Journey
    },
    journeyRoute(journeyPlan) {
      return {
        name: 'journeys/view',
        params: {
          id: this.primaryJourney(journeyPlan)?.PrimaryIdentifier
        }
      }
    },
    changesLabel(journeyPlan) {
      if (journeyPlan.RouteItems?.length === 1) {
        return 'Direct'
      }

      return `${Math.max((journeyPlan.RouteItems?.length || 1) - 1, 0)} changes`
    },
    transportIcon(type) {
      return {
        Rail: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Air: 'flight'
      }[type] || 'route'
    },
    getJourneyPlan() {
      this.loadingResults = true
      this.error = undefined

      axios
        .get(`${API.URL}/core/planner/${this.$route.query.origin}/${this.$route.query.destination}`)
        .then(response => {
          this.results = response.data || {}

          let earliestTime = undefined
          this.earliestArrivalJourneyID = 0
          for (let index = 0; index < this.journeyPlans.length; index++) {
            const element = this.journeyPlans[index]
            let datetime = new Date(element.ArrivalTime)
            
            if ((earliestTime === undefined) || (datetime < earliestTime)) {
              earliestTime = datetime
              this.earliestArrivalJourneyID = index
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
      let comparisonDateTime

      if (index == 0) {
        comparisonDateTime = new Date(Date.now())
      } else {
        comparisonDateTime = new Date(Date.parse(this.journeyPlans[index-1].StartTime))
      }

      let currentDateTime = new Date(Date.parse(this.journeyPlans[index].StartTime))

      return comparisonDateTime.getDate() != currentDateTime.getDate()
    }
  },
  mounted () {
    this.getJourneyPlan()
  }
}
</script>
