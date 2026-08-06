<template>
  <router-link
    :to="{ name: 'journeys/view', params: { id: journeyIdentifier } }"
    class="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/70 sm:grid-cols-[5rem_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
  >
    <ServiceIcon
      v-if="journey?.Service"
      class="h-13 min-w-13 rounded-xl text-base shadow-sm sm:h-14 sm:min-w-14"
      style="line-height: 52px"
      :service="journey.Service"
      :short="journey.Service?.BrandDisplayMode === 'short'"
    />
    <span v-else class="flex h-13 w-13 items-center justify-center rounded-xl bg-brand-blue text-white shadow-sm sm:h-14 sm:w-14">
      <span class="material-symbols-outlined text-[25px]">route</span>
    </span>

    <span class="min-w-0">
      <span class="block truncate text-base font-bold leading-tight text-slate-950 dark:text-slate-100">
        {{ destination }}
      </span>
      <span v-if="origin" class="mt-0.5 block truncate text-xs leading-snug text-slate-500 sm:mt-1 sm:text-sm">
        From {{ origin }}
      </span>
      <ServiceIcon
        v-if="journey?.Service"
        class="mt-1 h-5 max-w-full rounded-md px-1.5 text-[11px] leading-5 sm:h-6 sm:px-2 sm:text-sm sm:leading-6"
        style="line-height: 20px"
        :service="journey.Service"
        :short="false"
      />
    </span>

    <span class="flex shrink-0 items-center gap-1 text-right">
      <span v-if="departureTime" class="text-sm font-bold text-slate-950 dark:text-slate-100 sm:text-base">{{ departureTime }}</span>
      <span class="material-symbols-outlined text-2xl text-slate-400 sm:text-3xl">chevron_right</span>
    </span>
  </router-link>
</template>

<script>
import Pretty from '@/pretty'
import ServiceIcon from '@/components/ServiceIcon.vue'

export default {
  name: 'SavedJourneyCard',
  components: {
    ServiceIcon
  },
  props: {
    journey: {
      type: Object,
      required: true
    },
    savedObjectIdentifier: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      pretty: Pretty
    }
  },
  computed: {
    journeyIdentifier() {
      return this.journey.PrimaryIdentifier || this.journey.Identifier || this.savedObjectIdentifier
    },
    origin() {
      return this.journey.OriginDisplay || this.journey.Path?.[0]?.OriginStop?.PrimaryName || ''
    },
    destination() {
      return this.journey.DestinationDisplay || this.journey.Path?.[this.journey.Path?.length - 1]?.DestinationStop?.PrimaryName || 'Saved journey'
    },
    departureTime() {
      const time = this.journey.DepartureTime || this.journey.Path?.[0]?.OriginDepartureTime
      return time ? this.pretty.time(time, this.journey.DepartureTimezone) : ''
    }
  }
}
</script>
