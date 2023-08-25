<template>
  {{ this.pretty.time(departure.Time) }}
  <div 
    class="text-xs text-green-700" 
    v-if="departure.Type == 'RealtimeTracked'"
    :class="{ 'text-orange-400': (departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack') }"
  >
    <div 
      class="inline-flex items-center justify-center w-1 h-1 text-xs bg-green-700 rounded-full"
      :class="{ 'bg-orange-400': (departure.Journey.RealtimeJourney?.Reliability == 'LocationWithoutTrack') }"
    >&nbsp;</div>
    Realtime 
  </div>
  <div class="text-xs text-gray-600 dark:text-gray-400" v-else-if="departure.Type == 'Scheduled'">
    Scheduled
  </div>
    <div class="text-xs text-orange-500" v-else-if="departure.Type == 'Estimated'">
    <div class="inline-flex items-center justify-center w-1 h-1 text-xs bg-orange-500 rounded-full">&nbsp;</div>
    Estimated
  </div>

  <div class="text-xs text-gray-800" v-if="departure.Platform">
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
