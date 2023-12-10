<template>
  <span class="text-xs text-orange-500 material-symbols-outlined" v-if="departure.Type == 'RealtimeTracked' && departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack'">
    rss_feed
  </span>
  <span class="text-xs text-green-700 material-symbols-outlined" v-else-if="departure.Type == 'RealtimeTracked'">
    rss_feed
  </span>
  <span class="text-xs text-gray-600 dark:text-gray-400 material-symbols-outlined" v-else-if="departure.Type == 'Scheduled'">
    schedule
  </span>
  <span class="text-xs text-orange-500 material-symbols-outlined" v-else-if="departure.Type == 'Estimated'">
    schedule
  </span>
  <span class="text-xs text-red-500 material-symbols-outlined" v-else-if="departure.Type == 'Cancelled'">
    warning
  </span><span class="ml-[4px]">{{ this.pretty.time(departure.Time) }}</span>

  <div class="text-xs px-2 rounded text-red-200 bg-red-600" v-if="departure.Type == 'Cancelled'">
    CANCELLED
  </div>
  <div class="text-xs text-gray-700 dark:text-gray-300" v-else-if="departure.Platform">
    Platform {{ departure.Platform }} <span v-if="departure.PlatformType != 'ACTUAL'">(Est.)</span>
  </div>
</template>

<script>
import Pretty from '@/pretty'
export default {
  data () {
    return {
      pretty: Pretty,
    }
  },
  props: {
    departure: {},
  },
}
</script>
