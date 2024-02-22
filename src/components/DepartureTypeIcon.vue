<template>
  <span class="text-xs text-orange-500 material-symbols-outlined" v-if="this.journeyDepartureType == 'RealtimeTrackedUnreliable'">
    rss_feed
  </span>
  <span class="text-xs text-green-700 material-symbols-outlined" v-else-if="this.journeyDepartureType == 'RealtimeTracked'">
    rss_feed
  </span>
  <span class="text-xs text-gray-600 dark:text-gray-400 material-symbols-outlined" v-else-if="this.journeyDepartureType == 'Scheduled'">
    schedule
  </span>
  <span class="text-xs text-orange-500 material-symbols-outlined" v-else-if="this.journeyDepartureType == 'Estimated'">
    schedule
  </span>
  <span class="text-xs text-red-500 material-symbols-outlined" v-else-if="this.journeyDepartureType == 'Cancelled'">
    warning
  </span>
</template>

<script>
export default {
  props: {
    journey: {},
    departure: {}
  },

  computed: {
    journeyDepartureType() {
      if (this.journey !== undefined) {
        if (this.journey.RealtimeJourney !== undefined && this.journey.RealtimeJourney !== null 
             && this.journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack'
             && this.journey.RealtimeJourney.ActivelyTracked) {
          return 'RealtimeTrackedUnreliable'
        } else if (this.journey.RealtimeJourney !== undefined && this.journey.RealtimeJourney !== null && this.journey.RealtimeJourney.Cancelled) {
          return 'Cancelled'
        } else if (this.journey.RealtimeJourney !== undefined && this.journey.RealtimeJourney !== null && this.journey.RealtimeJourney.ActivelyTracked) {
          return 'RealtimeTracked'
        } else {
          return 'Scheduled'
        }
      } else if (this.departure !== undefined) {
        if (this.departure.Type == 'RealtimeTracked' && this.departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack') {
          return 'RealtimeTrackedUnreliable'
        } else if (this.departure.Type == 'RealtimeTracked') {
          return 'RealtimeTracked'
        } else if (this.departure.Type == 'Scheduled') {
          return 'Scheduled'
        } else if (this.departure.Type == 'Estimated') {
          return 'Estimated'
        } else if (this.departure.Type == 'Cancelled') {
          return 'Cancelled'
        }
      } else {
        return 'Scheduled'
      }
    }
  }
}
</script>
