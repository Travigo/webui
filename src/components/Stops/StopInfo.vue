<template>
  <router-link
    :to="stopRoute"
    class="grid grid-cols-[3.25rem_1fr] items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
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
          <span class="mt-1 inline-flex rounded bg-blue-600 px-1.5 py-0.5 text-xs font-semibold text-white sm:rounded-md sm:px-2 sm:text-sm">
            {{ serviceLabel }}
          </span>
          <p class="mt-1 flex items-center gap-1 text-xs text-slate-500 sm:text-base">
            <span class="material-symbols-outlined text-base sm:text-lg">directions_walk</span>
            {{ distanceLabel }}
          </p>
        </div>

        <div class="flex shrink-0 items-center justify-end gap-1 text-right">
          <div>
            <div class="text-sm font-semibold text-blue-600 sm:text-base">{{ actionLabel }}</div>
            <p class="mt-0.5 text-xs leading-snug text-slate-500 sm:mt-1 sm:text-base">{{ descriptor }}</p>
          </div>
          <span class="material-symbols-outlined text-2xl text-slate-400 sm:text-3xl">chevron_right</span>
        </div>
      </div>
    </div>

    <div
      v-if="statusLabel"
      class="hidden rounded-2xl bg-green-50 px-3 py-1 text-base font-medium text-green-700 sm:inline-flex"
    >
      <span class="mr-2 mt-2 h-2 w-2 rounded-full bg-green-600"></span>
      {{ statusLabel }}
    </div>
  </router-link>
</template>

<script>
import StopIcon from '@/components/StopIcon.vue'

export default {
  name: 'StopInfo',
  components: {
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
    actionLabel: {
      type: String,
      default: 'View'
    },
    statusLabel: {
      type: String,
      default: 'Nearby'
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
    serviceLabel() {
      const service = this.stop.Services?.[0]

      if (service?.ServiceName) {
        return service.ServiceName
      }

      if (service?.TransportType) {
        return service.TransportType
      }

      return 'Stop'
    },
    descriptor() {
      return this.stop.Descriptor || this.stop.OtherNames?.Descriptor || this.stop.LocalityName || 'Departures'
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

      return 'Nearby'
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
