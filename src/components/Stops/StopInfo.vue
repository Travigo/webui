<template>
  <router-link
    :to="stopRoute"
    class="grid grid-cols-[3.25rem_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:grid-cols-[5rem_minmax(0,1fr)] sm:gap-4 sm:px-5 sm:py-4"
    :class="{
      'border-b border-slate-200 last:border-b-0 dark:border-slate-800': bordered,
      'min-h-11 max-sm:grid-cols-[2.75rem_minmax(0,1fr)] max-sm:gap-2.5 max-sm:px-3 max-sm:py-2': compact
    }"
  >
    <div class="flex h-13 w-13 items-center justify-center rounded-xl bg-brand-blue/10 sm:h-14 sm:w-14 dark:bg-brand-blue/100/10" :class="{'max-sm:h-11 max-sm:w-11 max-sm:rounded-lg max-sm:[&>span:not(:first-child)]:hidden': compact}" aria-hidden="true">
      <StopIcon :stop="stop" size="10" />
    </div>

    <div class="min-w-0">
      <div class="flex items-start justify-between gap-2 sm:gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <h3 class="line-clamp-2 wrap-anywhere text-base font-bold leading-tight text-slate-950 dark:text-slate-100">{{ stop.PrimaryName }}</h3>
          </div>
          <div class="flex flex-wrap items-baseline gap-x-2">
            <p v-if="descriptor" class="mt-0.5 min-w-0 wrap-anywhere text-xs leading-snug text-slate-600 dark:text-slate-300 sm:mt-1 sm:text-sm">{{ descriptor }}</p>
            <p v-if="compact && distanceLabel" class="mt-0.5 whitespace-nowrap text-xs leading-snug text-slate-600 sm:hidden dark:text-slate-300">{{ distanceLabel }}</p>
          </div>
          <CompactServiceList v-if="compactServices && services.length" :services="services" class="mt-1" />
          <div v-else class="mt-1 flex max-w-full flex-wrap gap-1" :class="{'max-sm:hidden': compact && displayedServices.length === 0}">
            <ServiceIcon
              v-for="service in displayedServices"
              v-bind:key="service.PrimaryIdentifier || service.ServiceName || service.BrandIcon"
              :service="service"
              class="h-5 max-w-full rounded-md px-1.5 text-[0.72rem] font-bold leading-5 sm:h-6 sm:px-2 sm:text-sm [&_span.w-full]:truncate"
            />
            <span
              v-if="extraServiceCount > 0"
              class="inline-flex h-5 items-center rounded-md bg-slate-100 px-1.5 text-[0.72rem] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-6 sm:px-2 sm:text-sm"
              :aria-label="`${extraServiceCount} more services`"
            >
              +{{ extraServiceCount }}
            </span>
            <span
              v-if="displayedServices.length === 0"
              class="inline-flex h-5 items-center rounded-md bg-brand-blue px-1.5 text-[0.72rem] font-semibold text-white sm:h-6 sm:px-2 sm:text-sm"
            >
              Stop
            </span>
          </div>
          <p v-if="metaIcon || distanceLabel" class="mt-1 flex items-center gap-1 text-xs text-slate-500 sm:text-sm" :class="{'max-sm:hidden': compact}">
            <span v-if="metaIcon" class="material-symbols-outlined text-base text-[0.7rem]">{{ metaIcon }}</span>
            {{ distanceLabel }}
          </p>
        </div>

        <div class="flex shrink-0 self-center items-center justify-end gap-1 text-right">
          <span class="material-symbols-outlined text-2xl text-slate-400 sm:text-3xl" :class="{'max-sm:text-xl': compact}" aria-hidden="true">chevron_right</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import StopIcon from '@/components/StopIcon.vue'
import CompactServiceList from '@/components/Stops/CompactServiceList.vue'

export default {
  name: 'StopInfo',
  components: {
    CompactServiceList,
    ServiceIcon,
    StopIcon
  },
  props: {
    stop: {
      type: Object,
      required: true
    },
    currentPosition: {
      type: Object,
      default: undefined
    },
    metaIcon: {
      type: String,
      default: 'directions_walk'
    },
    distanceLabelFallback: {
      type: String,
      default: 'Nearby'
    },
    bordered: {
      type: Boolean,
      default: true
    },
    compact: Boolean,
    compactServices: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    stopRoute() {
      return {
        name: 'stops/view',
        params: {
          id: this.stop.PrimaryIdentifier
        }
      }
    },
    services() {
      return (this.stop.Services || []).filter(service => service?.ServiceName || service?.BrandIcon)
    },
    displayedServices() {
      return this.services.slice(0, 2)
    },
    extraServiceCount() {
      return Math.max(this.services.length - this.displayedServices.length, 0)
    },
    descriptor() {
      return this.stop.Descriptor || this.stop.OtherNames?.Descriptor || this.stop.LocalityName || ''
    },
    distanceLabel() {
      const metres = this.stop.DistanceMeters ?? this.stop.Distance ?? this.stop.distanceMeters ?? this.stop.distance

      if (typeof metres === 'number') {
        return this.formatDistance(metres)
      }

      if (this.currentPosition !== undefined && this.stop.Location?.coordinates?.length === 2) {
        return this.formatDistance(this.distanceBetween(
          this.currentPosition.latitude,
          this.currentPosition.longitude,
          this.stop.Location.coordinates[1],
          this.stop.Location.coordinates[0]
        ))
      }

      return this.distanceLabelFallback
    }
  },
  methods: {
    formatDistance(metres) {
      if (metres < 1000) {
        return `${Math.max(Math.round(metres / 10) * 10, 10)} m away`
      }

      return `${(metres / 1000).toFixed(1)} km away`
    },
    distanceBetween(latitudeA, longitudeA, latitudeB, longitudeB) {
      const earthRadiusMetres = 6371000
      const toRadians = degrees => degrees * Math.PI / 180
      const latitudeDelta = toRadians(latitudeB - latitudeA)
      const longitudeDelta = toRadians(longitudeB - longitudeA)
      const a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(toRadians(latitudeA)) * Math.cos(toRadians(latitudeB)) *
        Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      return earthRadiusMetres * c
    }
  }
}
</script>
