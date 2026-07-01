<template>
  <!-- <PageTitle>
    Bus Map
    <span v-if="this.currentZoom < this.dataLoadMinZoom" class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded text-amber-600 bg-amber-200 mr-1">
      Zoom in some more to load the stops
    </span>
  </PageTitle> -->
  <div v-if="loading" class="flex min-h-[60dvh] items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
    <span class="material-symbols-outlined mr-2 animate-spin text-[20px]">progress_activity</span>
    Loading map
  </div>
  <div v-else class="fullscreen-map bg-slate-100 dark:bg-slate-950" :class="{ 'map-dark': darkMode }">
    <mapbox-map
      ref="map"
      accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
      :mapStyle="mapStyle"
      height="100%"
      :center="initialCenter"
      :zoom="initialZoom"
      @loaded="mapLoaded"
      @update:center="mapPositionUpdate"
      @update:zoom="zoomUpdate"
    >
      <mapbox-navigation-control position="bottom-right" />
      <mapbox-geolocate-control position="bottom-right" />

      <mapbox-marker :lngLat="stop.Location.coordinates" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier" @click="openStopModal(stop)">
        <template v-slot:icon>
          <StopIcon :stop="stop"/>
        </template>
      </mapbox-marker>

      <mapbox-marker
        :lngLat="vehicle.VehicleLocation.coordinates"
        :rotation="(vehicle.VehicleBearing || 0) - 90"
        v-for="(vehicle, i) in visibleVehicles"
        v-bind:key="vehicle.Journey?.PrimaryIdentifier || i"
      >
        <template v-slot:icon>
          <img src="/icons/bus-svgrepo-com-24x24.png">
        </template>

        <mapbox-popup>
          <div>
            <strong>{{ vehicle.Journey?.DestinationDisplay || 'Live vehicle' }}</strong>
            <div>
              {{ vehicle.Journey?.Service?.ServiceName || 'Service unknown' }} / {{ vehicle.Journey?.Operator?.PrimaryName || 'Operator unknown' }}
            </div>

            <p v-if="vehicle.Journey?.PrimaryIdentifier">
              <router-link :to="{'name': 'journeys/view', params: {'id': vehicle.Journey.PrimaryIdentifier}}">View</router-link>
            </p>
          </div>
        </mapbox-popup>
      </mapbox-marker>
    </mapbox-map>

    <div class="map-status-panel">
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Map</p>
        <h1 class="text-lg font-extrabold text-slate-950 dark:text-slate-100">Nearby network</h1>
      </div>
      <div class="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
          <span class="material-symbols-outlined text-[15px]">pin_drop</span>
          {{ stops.length }}
        </span>
        <span class="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
          <span class="material-symbols-outlined text-[15px]">directions_bus</span>
          {{ visibleVehicles.length }}
        </span>
      </div>
    </div>

    <div v-if="currentZoom < dataLoadMinZoom && showStops" class="map-zoom-hint">
      <span class="material-symbols-outlined text-[18px]">zoom_in</span>
      Zoom in to load stops
    </div>

    <button
      type="button"
      class="map-filter-button"
      aria-label="Open map filters"
      :aria-expanded="mapFiltersOpen"
      @click="openMapFilters"
    >
      <span class="material-symbols-outlined text-[22px]">tune</span>
      <span v-if="activeMapLayerCount > 0" class="map-filter-count">{{ activeMapLayerCount }}</span>
    </button>
  </div>

  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="mapFiltersOpen"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="closeMapFilters"
      >
        <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
            <div>
              <h2 class="text-lg font-bold text-slate-950 dark:text-slate-100 sm:text-xl">Map filters</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose which live map layers are shown.</p>
            </div>
            <button
              @click="closeMapFilters"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              aria-label="Close map filters"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="p-4 sm:p-5">
            <section>
              <div class="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Map layers</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Stops load when zoomed in. Vehicles refresh automatically.</p>
                </div>
                <span class="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300" v-if="activeMapLayerCount > 0">
                  {{ activeMapLayerCount }} selected
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="layer in mapLayerFilters"
                  v-bind:key="layer.id"
                  type="button"
                  class="flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
                  :class="isMapLayerEnabled(layer.id)
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10'"
                  @click="toggleMapLayer(layer.id)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    :class="isMapLayerEnabled(layer.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
                  >
                    <span class="material-symbols-outlined text-[21px] leading-none">{{ layer.icon }}</span>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-extrabold">{{ layer.label }}</span>
                  </span>
                  <span
                    class="material-symbols-outlined text-[20px]"
                    :class="isMapLayerEnabled(layer.id) ? 'text-blue-600 dark:text-blue-300' : 'text-slate-300 dark:text-slate-600'"
                  >
                    {{ isMapLayerEnabled(layer.id) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </button>
              </div>
            </section>

            <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                class="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                @click="clearMapFilters"
              >
                Clear all
              </button>
              <button
                type="button"
                class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-600/20"
                @click="closeMapFilters"
              >
                Apply filters
              </button>
            </div>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>

  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="stopModalOpen"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="closeStopModal"
      >
      <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
          <div class="min-w-0">
            <h2 class="truncate text-lg font-bold text-slate-950 dark:text-slate-100 sm:text-xl">
              {{ currentViewedStop?.PrimaryName || 'Stop details' }}
            </h2>
            <p class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {{ currentViewedStop?.Descriptor || currentViewedStop?.OtherNames?.Descriptor || 'Departures and stop information' }}
            </p>
          </div>
          <button
            @click="closeStopModal"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            aria-label="Close stop departures"
          >
            <span class="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5">
          <div v-if="currentViewedStop !== undefined" class="space-y-4">
            <div class="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
              <StopStatus :currentViewedStop="currentViewedStop" />
            </div>

            <div>
              <div class="mb-3 flex items-center justify-between gap-3">
                <h3 class="text-base font-bold text-slate-950 dark:text-slate-100 sm:text-lg">Departures</h3>
                <router-link
                  @click="closeStopModal"
                  :to="{'name': 'stops/view', params: {'id': currentViewedStop.PrimaryIdentifier}}"
                  class="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
                >
                  View more
                  <span class="material-symbols-outlined text-base">chevron_right</span>
                </router-link>
              </div>

              <StopDeparturesTable
                :stop="currentViewedStop"
                :departures="currentViewedStopDepartures"
                :loading-departures="loadingDepartures"
                :show-tabs="false"
                :show-details="false"
              />
            </div>
          </div>

          <div v-else class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
            Select a stop on the map to view departures.
          </div>
        </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.fullscreen-map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.map-status-panel {
  position: absolute;
  left: 1rem;
  top: 5.75rem;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: calc(100% - 2rem);
  max-width: 32rem;
  border: 1px solid rgb(226 232 240 / 0.9);
  border-radius: 1.25rem;
  background: rgb(255 255 255 / 0.92);
  padding: 0.75rem 0.875rem;
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(14px);
}

.map-zoom-hint {
  position: absolute;
  left: 1rem;
  top: 10.5rem;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid rgb(251 191 36 / 0.35);
  border-radius: 999px;
  background: rgb(255 251 235 / 0.94);
  padding: 0.55rem 0.8rem;
  color: rgb(146 64 14);
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 14px 35px rgb(120 53 15 / 0.12);
  backdrop-filter: blur(14px);
}

.map-filter-button {
  position: absolute;
  bottom: 6.25rem;
  right: 1rem;
  z-index: 40;
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(226 232 240 / 0.9);
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.94);
  color: rgb(37 99 235);
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.16);
  backdrop-filter: blur(14px);
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.map-filter-button:hover {
  background: rgb(239 246 255);
  transform: translateY(-1px);
}

.map-filter-count {
  position: absolute;
  right: -0.25rem;
  top: -0.25rem;
  display: flex;
  min-width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  border-radius: 999px;
  background: rgb(37 99 235);
  color: white;
  font-size: 0.7rem;
  font-weight: 900;
}

:deep(.mapboxgl-ctrl-bottom-right) {
  bottom: 9.75rem;
  right: 0.7rem;
}

:deep(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border: 1px solid rgb(226 232 240 / 0.9);
  border-radius: 1rem;
  background: rgb(255 255 255 / 0.94);
  box-shadow: 0 14px 35px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(14px);
}

:deep(.mapboxgl-ctrl-group button) {
  width: 2.45rem;
  height: 2.45rem;
  background-color: transparent;
  transition: background-color 160ms ease;
}

:deep(.mapboxgl-ctrl-group button:hover) {
  background-color: rgb(239 246 255);
}

:deep(.mapboxgl-ctrl-group button + button) {
  border-top-color: rgb(226 232 240);
}

:deep(.mapboxgl-popup-content) {
  border: 1px solid rgb(226 232 240);
  border-radius: 1rem;
  padding: 0.75rem;
  color: rgb(15 23 42);
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.16);
}

:deep(.mapboxgl-popup-close-button) {
  right: 0.35rem;
  top: 0.2rem;
  color: rgb(100 116 139);
  font-size: 1.2rem;
}

.map-dark .map-status-panel,
.map-dark .map-filter-button,
.map-dark :deep(.mapboxgl-ctrl-group) {
  border-color: rgb(30 41 59 / 0.95);
  background: rgb(15 23 42 / 0.92);
  box-shadow: 0 18px 45px rgb(0 0 0 / 0.32);
}

.map-dark .map-filter-button {
  color: rgb(147 197 253);
}

.map-dark .map-filter-button:hover {
  background: rgb(37 99 235 / 0.12);
}

.map-dark .map-filter-count {
  border-color: rgb(15 23 42);
}

.map-dark :deep(.mapboxgl-ctrl-group button) {
  color: rgb(226 232 240);
}

.map-dark :deep(.mapboxgl-ctrl-group button:hover) {
  background-color: rgb(37 99 235 / 0.16);
}

.map-dark :deep(.mapboxgl-ctrl-group button + button) {
  border-top-color: rgb(30 41 59);
}

.map-dark :deep(.mapboxgl-ctrl-icon) {
  filter: invert(1) brightness(1.35);
}

.map-dark .map-zoom-hint {
  border-color: rgb(245 158 11 / 0.32);
  background: rgb(120 53 15 / 0.35);
  color: rgb(253 230 138);
}

.map-dark :deep(.mapboxgl-popup-content) {
  border-color: rgb(30 41 59);
  background: rgb(15 23 42);
  color: rgb(241 245 249);
}

@media (min-width: 640px) {
  .map-status-panel {
    left: 2rem;
    top: 7.5rem;
  }

  .map-zoom-hint {
    left: 2rem;
    top: 12.2rem;
  }

  .map-filter-button {
    bottom: 7.25rem;
    right: 2rem;
  }

  :deep(.mapboxgl-ctrl-bottom-right) {
    bottom: 11rem;
    right: 1.7rem;
  }
}
</style>


<script>
import StopStatus from '@/components/StopStatus.vue'
import StopIcon from '@/components/StopIcon.vue'
import StopDeparturesTable from '@/components/Stops/StopDeparturesTable.vue'
import axios from 'axios'
import API from '@/API'

import { MapboxMap } from "vue-mapbox-ts";

export default {
  name: 'StopsView',
  computed: {
    mapStyle() {
      return this.darkMode
        ? 'mapbox://styles/mapbox/dark-v11'
        : 'mapbox://styles/mapbox/light-v11'
    },
    activeMapLayerCount() {
      return [this.showStops, this.showVehicles].filter(Boolean).length
    },
    visibleVehicles() {
      return this.vehicles.filter(vehicle => {
        const coordinates = vehicle?.VehicleLocation?.coordinates

        return Array.isArray(coordinates) &&
          coordinates.length === 2 &&
          typeof coordinates[0] === 'number' &&
          typeof coordinates[1] === 'number'
      })
    }
  },
  data () {
    return {
      stops: [],
      vehicles: [],

      loading: false,
      error: null,

      currentZoom: 5,
      currentCenter: [0.1356, 52.2065],

      initialZoom: 5,
      initialCenter: [0.1356, 52.2065],

      dataLoadMinZoom: 9,

      refreshTimer: null,

      showStops: undefined,
      showVehicles: undefined,
      mapFiltersOpen: false,
      mapLayerFilters: [
        {
          id: 'stops',
          label: 'Stops',
          icon: 'pin_drop'
        },
        {
          id: 'vehicles',
          label: 'Vehicles',
          icon: 'directions_bus'
        }
      ],

      mapboxObject: undefined,
      darkMode: document.documentElement.classList.contains('dark'),
      appliedMapStyle: '',
      themeObserver: undefined,

      currentViewedStop: undefined,
      stopModalOpen: false,

      loadingDepartures: true,
      currentViewedStopDepartures: []
    }
  },
  components: {
    StopStatus,
    StopIcon,
    StopDeparturesTable,

    MapboxMap
  },
  methods: {
    mapLoaded(map) {
      this.mapboxObject = map
      this.applyMapStyle()

      map.resize()

      this.refreshData()
    },
    zoomUpdate(zoom) {
      this.currentZoom = zoom

      localStorage.map_last_zoom = this.currentZoom
    },
    refreshData(updateStops = true, updateVehicles = true) {
      if (this.$refs.map !== undefined) {
        this.getData(updateStops, updateVehicles)
      }
    },
    mapPositionUpdate(center) {
      this.currentCenter = center

      localStorage.map_last_center = JSON.stringify(this.currentCenter)

      this.getData(true, true)
    },
    getData(updateStops, updateVehicles) {
      const bounds = this.mapboxObject.getBounds()

      let bottomLeftLon = bounds._sw.lng
      let bottomLeftLat = bounds._sw.lat
      let topRightLon = bounds._ne.lng
      let topRightLat = bounds._ne.lat

      // TODO: For now just dont load anything if you're too zoomed out
      if (this.showStops && updateStops && (this.currentZoom >= this.dataLoadMinZoom)) {
        axios
          .get(`${API.URL}/core/stops/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newStops = response.data

            this.stops = newStops
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }

      if (this.showVehicles && updateVehicles) {
        axios
          .get(`${API.URL}/core/realtime_journeys/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newVehicles = Array.isArray(response.data) ? response.data : []

            this.vehicles = newVehicles
          })
          .catch(error => {
            console.log(error)
            this.error = error
          })
          .finally(() => this.loading = false)
      }
    },
    openStopModal(stop) {
      this.currentViewedStop = stop
      this.currentViewedStopDepartures = []
      this.loadingDepartures = true
      this.stopModalOpen = true

      this.getDepartures()
    },
    closeStopModal() {
      this.stopModalOpen = false
    },
    openMapFilters() {
      this.mapFiltersOpen = true
    },
    closeMapFilters() {
      this.mapFiltersOpen = false
    },
    isMapLayerEnabled(layerId) {
      if (layerId === 'stops') {
        return this.showStops
      }

      if (layerId === 'vehicles') {
        return this.showVehicles
      }

      return false
    },
    toggleMapLayer(layerId) {
      if (layerId === 'stops') {
        this.showStops = !this.showStops
      }

      if (layerId === 'vehicles') {
        this.showVehicles = !this.showVehicles
      }
    },
    clearMapFilters() {
      this.showStops = false
      this.showVehicles = false
    },
    applyMapStyle() {
      if (!this.mapboxObject || this.appliedMapStyle === this.mapStyle) {
        return
      }

      this.mapboxObject.setStyle(this.mapStyle)
      this.appliedMapStyle = this.mapStyle
    },
    getDepartures() {
      axios
        .get(`${API.URL}/core/stops/${this.currentViewedStop.PrimaryIdentifier}/departures`, {
          params: {
            'count': 10,
            // 'datetime': this.$route.query.datetime
          }
        })
        .then(response => {
          this.currentViewedStopDepartures = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
        .finally(() => this.loadingDepartures = false)
    }
  },
  created() {
    if (localStorage.map_last_center !== undefined && localStorage.map_last_zoom !== undefined) {
      this.initialCenter = JSON.parse(localStorage.map_last_center)
      this.initialZoom = parseInt(localStorage.map_last_zoom)

      this.currentCenter = this.initialCenter
      this.currentZoom = this.initialZoom
    }

    if (localStorage.map_showStops !== undefined) {
      this.showStops = (localStorage.map_showStops == "true")
    } else {
      this.showStops = true
    }
    if (localStorage.map_showVehicles !== undefined) {
      this.showVehicles = (localStorage.map_showVehicles == "true")
    } else {
      this.showVehicles = false
    }
  },
  mounted() {
    this.darkMode = document.documentElement.classList.contains('dark')
    this.themeObserver = new MutationObserver(() => {
      this.darkMode = document.documentElement.classList.contains('dark')
    })
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    this.refreshTimer = setInterval(this.refreshData.bind(null, false, true), 15000)
  },
  beforeRouteLeave() {  
    clearInterval(this.refreshTimer)
  }, 
  beforeUnmount() {
    clearInterval(this.refreshTimer)
    this.themeObserver?.disconnect()
  },
  watch: {
    showStops: {
      immediate: true,
      handler(to, from) {
        if (from === undefined) {
          return
        }

        if (to) {
          this.refreshData()
        } else {
          this.stops = []
        }

        localStorage.map_showStops = to
      }
    },
    showVehicles: {
      immediate: true,
      handler(to, from) {
        if (from === undefined) {
          return
        }

        if (to) {
          this.refreshData()
        } else {
          this.vehicles = []
        }

        localStorage.map_showVehicles = to
      }
    },
    darkMode() {
      this.applyMapStyle()
    }
  }
}
</script>
