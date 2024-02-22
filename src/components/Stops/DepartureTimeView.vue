<template>
  <DepartureTypeIcon :departure="departure"/><span class="ml-[4px]">{{ this.pretty.time(departure.Time) }}</span>

  <div class="text-xs px-2 rounded text-red-200 bg-red-600" v-if="departure.Type == 'Cancelled'">
    CANCELLED
  </div>
  <div class="text-xs text-gray-700 dark:text-gray-300" v-else-if="departure.Platform">
    Platform {{ departure.Platform }} <span v-if="departure.PlatformType != 'ACTUAL'">(Est.)</span>
  </div>
</template>

<script>
import Pretty from '@/pretty'
import DepartureTypeIcon from '@/components/DepartureTypeIcon.vue'

export default {
  data () {
    return {
      pretty: Pretty,
    }
  },
  props: {
    departure: {},
  },
  components: {
    DepartureTypeIcon
  }
}
</script>
