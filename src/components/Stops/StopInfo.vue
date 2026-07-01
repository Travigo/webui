<template>
  <router-link
    :to="stopRoute"
    class="grid grid-cols-[3.25rem_1fr] items-center gap-3 px-4 py-3 sm:grid-cols-[5rem_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
    :class="bordered ? 'border-b border-slate-200 last:border-b-0 dark:border-slate-800' : ''"
  >
    <div class="flex h-13 w-13 items-center justify-center rounded-xl bg-blue-50 sm:h-16 sm:w-16 sm:rounded-2xl">
      <StopIcon :stop="stop" size="10" />
    </div>

    <div class="min-w-0">
      <div class="flex items-start justify-between gap-2 sm:gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h3 class="truncate text-base font-bold leading-tight text-slate-950 sm:text-xl">{{ stop.PrimaryName }}</h3>
          </div>
          <div>
            <p class="mt-0.5 text-[0.7rem] leading-snug text-slate-500 sm:mt-1 sm:text-base">{{ descriptor }}</p>
          </div>
          <div class="mt-1 flex max-w-full flex-wrap gap-1">
            <ServiceIcon
              v-for="service in displayedServices"
              v-bind:key="service.PrimaryIdentifier || service.ServiceName || service.BrandIcon"
              :service="service"
              class="h-5 rounded-md px-1.5 text-[0.72rem] font-bold leading-5 shadow-sm sm:h-6 sm:px-2 sm:text-sm"
            />
            <span
              v-if="extraServiceCount > 0"
              class="inline-flex h-5 items-center rounded-md bg-slate-100 px-1.5 text-[0.72rem] font-bold text-slate-600 sm:h-6 sm:px-2 sm:text-sm"
            >
              +{{ extraServiceCount }}
            </span>
            <span
              v-if="displayedServices.length === 0"
              class="inline-flex h-5 items-center rounded-md bg-blue-600 px-1.5 text-[0.72rem] font-semibold text-white sm:h-6 sm:px-2 sm:text-sm"
            >
              Stop
            </span>
          </div>
          <p class="mt-1 flex items-center gap-1 text-[0.7rem] text-slate-500 sm:text-base">
            <span class="material-symbols-outlined text-base text-[0.7rem]">{{ metaIcon }}</span>
            {{ distanceLabel }}
          </p>
        </div>

        <div class="flex shrink-0 self-center items-center justify-end gap-1 text-right">
          <span class="material-symbols-outlined text-2xl text-slate-400 sm:text-3xl">chevron_right</span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import StopIcon from '@/components/StopIcon.vue'

export default {
  name: 'StopInfo',
  components: {
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
