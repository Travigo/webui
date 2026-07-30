<template>
  <div class="space-y-4 px-4 py-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px] text-brand-blue">train</span>
          <h2 class="text-sm font-extrabold text-slate-950">Station map</h2>
          <span class="rounded-full bg-brand-pink/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-pink">Experimental</span>
        </div>
        <p class="mt-1 text-sm text-slate-600">
          Platforms, entrances and amenities from OpenStreetMap.
        </p>
      </div>
    </div>

    <LoadingState
      v-if="loading"
      title="Loading station map"
      subtitle="Fetching the mapped station layout and amenities."
      compact
      bare
      :rows="4"
      :show-tabs="false"
    />

    <div v-else-if="error" class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-[19px]">warning</span>
        <div>
          <p class="font-extrabold">Station map unavailable</p>
          <p class="mt-1">The OSM station data could not be loaded right now.</p>
        </div>
      </div>
      <button
        type="button"
        class="mt-3 inline-flex min-h-9 items-center rounded-xl bg-amber-100 px-3 text-xs font-extrabold text-amber-900 transition hover:bg-amber-200"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </div>

    <div v-else-if="!hasMappedFeatures" class="rounded-2xl bg-slate-50 px-3 py-4 text-sm text-slate-600">
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-[19px] text-slate-400">map</span>
        <div>
          <p class="font-extrabold text-slate-800">No mapped station features yet</p>
          <p class="mt-1">OpenStreetMap does not currently have a usable platform, entrance, or amenity layout for this station.</p>
        </div>
      </div>
    </div>

    <template v-else>
      <div
        ref="mapContainer"
        class="station-map relative h-[430px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:h-[560px]"
        :class="{ 'is-fullscreen': isFullscreen }"
      >
        <mapbox-map
          accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
          mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
          style="height: 100%"
          :zoom="zoom"
          :center="mapCenter"
          @loaded="mapLoaded"
        >
          <mapbox-navigation-control position="bottom-right" />

          <mapbox-geogeometry-raw
            v-if="stationAreaGeoJson.features.length > 0"
            id="station-area"
            :source="stationAreaGeoJson"
          >
            <mapbox-geogeometry-fill color="#2563eb" :opacity="0.08" />
            <mapbox-geogeometry-line color="#2563eb" :opacity="0.65" :width="2" />
          </mapbox-geogeometry-raw>

          <mapbox-geogeometry-raw
            v-if="trackGeoJson.features.length > 0"
            id="station-tracks"
            :source="trackGeoJson"
          >
            <mapbox-geogeometry-line color="#475569" :opacity="0.72" :width="3" />
          </mapbox-geogeometry-raw>

          <mapbox-geogeometry-raw
            v-if="accessGeoJson.features.length > 0"
            id="station-access"
            :source="accessGeoJson"
          >
            <mapbox-geogeometry-line color="#94a3b8" :opacity="0.72" :width="2" :dasharray="[1.5, 1.5]" />
          </mapbox-geogeometry-raw>

          <mapbox-geogeometry-raw
            v-if="platformGeoJson.features.length > 0"
            id="station-platforms"
            :source="platformGeoJson"
          >
            <mapbox-geogeometry-fill color="#f59e0b" :opacity="0.48" />
            <mapbox-geogeometry-line color="#d97706" :opacity="0.95" :width="3" />
          </mapbox-geogeometry-raw>

          <mapbox-marker
            v-for="platform in platformMarkers"
            :key="platform.key"
            :lngLat="platform.coordinates"
            anchor="center"
          >
            <template #icon>
              <span class="platform-marker">{{ platform.label }}</span>
            </template>
            <mapbox-popup>
              <div class="station-popup">
                <p class="font-extrabold">{{ platform.title }}</p>
                <p v-if="platform.ref" class="mt-0.5 text-xs text-slate-500">{{ platform.ref }}</p>
              </div>
            </mapbox-popup>
          </mapbox-marker>

          <mapbox-marker
            v-for="entrance in entranceMarkers"
            :key="entrance.key"
            :lngLat="entrance.coordinates"
            anchor="center"
          >
            <template #icon>
              <span class="station-feature-marker station-entrance-marker">
                <span class="material-symbols-outlined text-[17px]">login</span>
              </span>
            </template>
            <mapbox-popup>
              <div class="station-popup">
                <p class="font-extrabold">{{ entrance.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500">Station entrance</p>
              </div>
            </mapbox-popup>
          </mapbox-marker>

          <mapbox-marker
            v-for="amenity in amenityMarkers"
            :key="amenity.key"
            :lngLat="amenity.coordinates"
            anchor="center"
          >
            <template #icon>
              <span class="station-feature-marker" :class="amenity.nearby ? 'station-amenity-nearby' : 'station-amenity-marker'">
                <span v-if="amenity.count > 1" class="amenity-count">{{ amenity.count > 9 ? '9+' : amenity.count }}</span>
                <span v-else class="material-symbols-outlined text-[16px]">{{ amenity.icon }}</span>
              </span>
            </template>
            <mapbox-popup>
              <div class="station-popup">
                <p class="font-extrabold">{{ amenity.title }}</p>
                <p class="mt-0.5 text-xs text-slate-500">{{ amenity.typeLabel }}{{ amenity.nearby ? ' · Nearby' : '' }}</p>
                <p v-if="amenity.summary" class="mt-1 text-xs text-slate-500">{{ amenity.summary }}</p>
              </div>
            </mapbox-popup>
          </mapbox-marker>
        </mapbox-map>

        <div class="pointer-events-auto absolute right-3 top-3 z-10 flex items-center gap-2 sm:right-4 sm:top-4">
          <button
            type="button"
            class="station-map-action"
            :aria-label="isFullscreen ? 'Exit full screen' : 'Open full screen'"
            :aria-pressed="isFullscreen"
            @click="toggleFullscreen"
          >
            <span class="material-symbols-outlined text-[21px]">{{ isFullscreen ? 'fullscreen_exit' : 'fullscreen' }}</span>
          </button>
          <button
            type="button"
            class="station-map-action relative"
            aria-label="Filter station map"
            :aria-expanded="filtersOpen"
            @click="openFilters"
          >
            <span class="material-symbols-outlined text-[21px]">tune</span>
            <span v-if="hiddenFilterCount > 0" class="station-filter-badge">{{ hiddenFilterCount }}</span>
          </button>
        </div>

        <div class="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-7.5rem)] rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg shadow-slate-900/10 backdrop-blur sm:left-4 sm:top-4">
          <p class="text-xs font-extrabold text-slate-900">{{ stop?.PrimaryName || 'Train station' }}</p>
          <p class="mt-0.5 text-[11px] font-semibold text-slate-500">{{ platformCount }} platforms · {{ entranceCount }} entrances · {{ amenityCount }} amenities</p>
        </div>

      </div>

      <p class="text-xs leading-relaxed text-slate-500">
        Layout data is sourced from OpenStreetMap through Travigo and may be incomplete or out of date.
      </p>

      <Modal
        v-model:open="filtersOpen"
        title="Map filters"
        subtitle="Choose what appears on the station map."
        icon="tune"
        close-label="Close map filters"
        size="sm"
        body-class="max-h-[calc(88dvh-9rem)] overflow-y-auto p-4 sm:p-5"
      >
        <section>
          <div class="mb-2 flex items-end justify-between gap-3">
            <div>
              <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Station features</h3>
              <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Choose which mapped features are shown.</p>
            </div>
            <span v-if="hiddenFilterCount > 0" class="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300">
              {{ filterOptions.length - hiddenFilterCount }} selected
            </span>
          </div>

          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="option in filterOptions"
              :key="option.id"
              type="button"
              class="flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 text-left text-slate-700 transition dark:text-slate-300"
              :class="mapFilters[option.id]
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                : 'border-slate-200 bg-white hover:border-blue-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10'"
              :aria-pressed="mapFilters[option.id]"
              @click="toggleFilter(option.id)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                :class="mapFilters[option.id] ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
              >
                <span class="material-symbols-outlined text-[21px]">{{ option.icon }}</span>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-extrabold">{{ option.label }}</span>
                <span class="mt-0.5 block truncate text-[11px] font-semibold text-slate-500 dark:text-slate-400">{{ option.count }} mapped</span>
              </span>
              <span
                class="material-symbols-outlined shrink-0 text-[20px]"
                :class="mapFilters[option.id] ? 'text-blue-600 dark:text-blue-300' : 'text-slate-300 dark:text-slate-600'"
              >
                {{ mapFilters[option.id] ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
            </button>
          </div>
        </section>

        <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            class="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            @click="setAllFilters(false)"
          >
            Clear all
          </button>
          <button
            type="button"
            class="rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
            @click="filtersOpen = false"
          >
            Apply filters
          </button>
        </div>
      </Modal>
    </template>
  </div>
</template>

<script>
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'

const AMENITY_TYPES = [
  'Shop',
  'Cafe',
  'Restaurant',
  'FastFood',
  'Pub',
  'Bar',
  'Toilets',
  'ATM',
  'CarPark',
  'BicyclePark',
  'MotorcyclePark',
  'Amenity'
]

const AMENITY_ICONS = {
  Shop: 'storefront',
  Cafe: 'local_cafe',
  Restaurant: 'restaurant',
  FastFood: 'fastfood',
  Pub: 'local_bar',
  Bar: 'local_bar',
  Toilets: 'wc',
  ATM: 'local_atm',
  CarPark: 'local_parking',
  BicyclePark: 'pedal_bike',
  MotorcyclePark: 'two_wheeler',
  Amenity: 'info'
}

const AMENITY_MARKER_GRID = 0.0006

export default {
  name: 'StationMap',
  components: {
    LoadingState,
    Modal
  },
  props: {
    stop: {
      type: Object,
      default: null
    },
    osmStop: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    }
  },
  emits: ['retry'],
  data() {
    return {
      mapboxObject: null,
      zoom: 16,
      isFullscreen: false,
      nativeFullscreen: false,
      fullscreenBodyOverflow: null,
      filtersOpen: false,
      mapFilters: {
        tracks: true,
        platforms: true,
        entrances: true,
        carParks: true,
        cycleParks: true,
        shops: true,
        foodDrink: true,
        otherAmenities: true
      }
    }
  },
  computed: {
    features() {
      const features = this.osmStop?.Features || this.osmStop?.features || []
      return Array.isArray(features) ? features : []
    },
    stationFeatures() {
      return this.features.filter(feature => ['Station', 'StopArea'].includes(this.featureType(feature)))
    },
    platformFeatures() {
      return this.features.filter(feature => ['Platform', 'PlatformEdge'].includes(this.featureType(feature)))
    },
    visiblePlatformFeatures() {
      return this.mapFilters.platforms ? this.platformFeatures : []
    },
    platformMarkerFeatures() {
      return this.preferredPlatformFeatures(this.visiblePlatformFeatures)
    },
    entranceFeatures() {
      return this.features.filter(feature => this.featureType(feature) === 'Entrance')
    },
    visibleEntranceFeatures() {
      return this.mapFilters.entrances ? this.entranceFeatures : []
    },
    amenityFeatures() {
      return this.features.filter(feature => AMENITY_TYPES.includes(this.featureType(feature)))
    },
    visibleAmenityFeatures() {
      return this.amenityFeatures.filter(feature => this.mapFilters[this.amenityFilterId(feature)])
    },
    trackFeatures() {
      return this.features.filter(feature => this.featureType(feature) === 'Track')
    },
    visibleTrackFeatures() {
      return this.mapFilters.tracks ? this.trackFeatures : []
    },
    accessFeatures() {
      return this.features.filter(feature => this.featureType(feature) === 'Access')
    },
    stationAreaGeoJson() {
      return this.featureCollection(this.stationFeatures)
    },
    platformGeoJson() {
      return this.featureCollection(this.visiblePlatformFeatures)
    },
    trackGeoJson() {
      return this.featureCollection(this.visibleTrackFeatures)
    },
    accessGeoJson() {
      return this.featureCollection(this.mapFilters.entrances ? this.accessFeatures : [])
    },
    stopLocation() {
      return this.locationCoordinates(this.stop?.Location || this.stop?.location)
    },
    mapCenter() {
      return this.stopLocation || this.featureCoordinates(this.stationFeatures[0]) || [0.1356, 52.2065]
    },
    platformMarkers() {
      return this.platformMarkerFeatures
        .map((feature, index) => {
          const coordinates = this.featureCoordinates(feature)
          if (!coordinates) {
            return null
          }

          const label = this.platformLabel(feature, index)
          return {
            key: this.featureKey(feature, `platform-${index}`),
            coordinates,
            label,
            title: String(label).toLowerCase().startsWith('platform') ? label : `Platform ${label}`,
            ref: this.featureReference(feature)
          }
        })
        .filter(Boolean)
    },
    entranceMarkers() {
      return this.visibleEntranceFeatures
        .map((feature, index) => {
          const coordinates = this.featureCoordinates(feature)
          if (!coordinates) {
            return null
          }

          return {
            key: this.featureKey(feature, `entrance-${index}`),
            coordinates,
            title: this.featureName(feature) || `Entrance ${index + 1}`
          }
        })
        .filter(Boolean)
    },
    amenityMarkers() {
      const groups = new Map()

      this.visibleAmenityFeatures.forEach((feature, index) => {
        const coordinates = this.featureCoordinates(feature)
        if (!coordinates) {
          return
        }

        const type = this.featureType(feature)
        const nearby = String(this.featureValue(feature, 'Association') || '').toLowerCase() === 'nearby'
        const gridLongitude = Math.round(coordinates[0] / AMENITY_MARKER_GRID)
        const gridLatitude = Math.round(coordinates[1] / AMENITY_MARKER_GRID)
        const key = `${nearby ? 'nearby' : 'inside'}-${gridLongitude}-${gridLatitude}`
        const name = this.featureName(feature)
        const group = groups.get(key)

        if (group) {
          group.count += 1
          group.types.add(type)
          if (name) {
            group.names.push(name)
          }
          return
        }

        groups.set(key, {
          key: this.featureKey(feature, `amenity-${index}`),
          coordinates,
          count: 1,
          names: name ? [name] : [],
          types: new Set([type]),
          nearby
        })
      })

      return [...groups.values()].map(group => {
        const types = [...group.types]
        const typeLabel = types.length === 1 ? this.humanise(types[0]) : 'Mixed amenities'
        const summary = group.names.slice(0, 2).join(', ')

        return {
          ...group,
          icon: types.length === 1 ? AMENITY_ICONS[types[0]] || 'info' : 'category',
          title: group.count > 1 ? `${group.count} mapped amenities` : group.names[0] || typeLabel,
          typeLabel,
          summary: group.count > 1 ? summary : ''
        }
      })
    },
    platformCount() {
      return this.platformMarkerFeatures.length
    },
    entranceCount() {
      return this.visibleEntranceFeatures.length
    },
    amenityCount() {
      return this.visibleAmenityFeatures.length
    },
    hasMappedFeatures() {
      return this.features.length > 0 && (
        this.platformFeatures.length > 0 ||
        this.entranceFeatures.length > 0 ||
        this.amenityFeatures.length > 0 ||
        this.stationAreaGeoJson.features.length > 0
      )
    },
    filterOptions() {
      return [
        {
          id: 'platforms',
          label: 'Platforms',
          icon: 'train',
          count: this.filterOptionCount('platforms')
        },
        {
          id: 'entrances',
          label: 'Entrances',
          icon: 'login',
          count: this.filterOptionCount('entrances')
        },
        {
          id: 'tracks',
          label: 'Tracks',
          icon: 'railway_alert',
          count: this.filterOptionCount('tracks')
        },
        {
          id: 'carParks',
          label: 'Car parks',
          icon: 'local_parking',
          count: this.filterOptionCount('carParks')
        },
        {
          id: 'cycleParks',
          label: 'Cycle parks',
          icon: 'pedal_bike',
          count: this.filterOptionCount('cycleParks')
        },
        {
          id: 'shops',
          label: 'Shops',
          icon: 'storefront',
          count: this.filterOptionCount('shops')
        },
        {
          id: 'foodDrink',
          label: 'Food & drink',
          icon: 'restaurant',
          count: this.filterOptionCount('foodDrink')
        },
        {
          id: 'otherAmenities',
          label: 'Other amenities',
          icon: 'category',
          count: this.filterOptionCount('otherAmenities')
        }
      ]
    },
    hiddenFilterCount() {
      return this.filterOptions.filter(option => !this.mapFilters[option.id]).length
    },
    mapCoordinates() {
      const coordinates = []

      for (const collection of [
        this.stationAreaGeoJson,
        this.platformGeoJson,
        this.trackGeoJson,
        this.accessGeoJson
      ]) {
        for (const feature of collection.features) {
          this.collectGeometryCoordinates(feature.geometry, coordinates)
        }
      }

      coordinates.push(...this.platformMarkers.map(marker => marker.coordinates))
      coordinates.push(...this.entranceMarkers.map(marker => marker.coordinates))
      coordinates.push(...this.amenityMarkers.map(marker => marker.coordinates))

      if (this.stopLocation) {
        coordinates.push(this.stopLocation)
      }

      return coordinates.filter(this.validCoordinates)
    }
  },
  watch: {
    osmStop() {
      this.$nextTick(() => this.fitMap())
    },
    mapFilters: {
      deep: true,
      handler() {
        this.$nextTick(() => this.fitMap())
      }
    }
  },
  mounted() {
    document.addEventListener('fullscreenchange', this.syncFullscreenState)
    document.addEventListener('webkitfullscreenchange', this.syncFullscreenState)
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.syncFullscreenState)
    document.removeEventListener('webkitfullscreenchange', this.syncFullscreenState)
    this.restoreFallbackFullscreen()
  },
  methods: {
    featureType(feature) {
      return this.featureValue(feature, 'Type') || ''
    },
    featureValue(feature, key) {
      if (!feature) {
        return ''
      }

      return feature[key] ?? feature[key.charAt(0).toLowerCase() + key.slice(1)]
    },
    featureTags(feature) {
      return this.featureValue(feature, 'Tags') || {}
    },
    featureName(feature) {
      return this.featureValue(feature, 'PrimaryName') || this.featureTags(feature).name || ''
    },
    featureReference(feature) {
      return this.featureValue(feature, 'LocalRef') || this.featureValue(feature, 'Ref') || this.featureTags(feature).local_ref || this.featureTags(feature).ref || ''
    },
    featureKey(feature, fallback) {
      const element = this.featureValue(feature, 'Element') || {}
      const elementType = element.Type || element.type || 'feature'
      const elementId = element.ID || element.id || fallback
      return `${elementType}-${elementId}`
    },
    preferredPlatformFeatures(features) {
      const platforms = features.filter(feature => this.featureType(feature) === 'Platform')
      return platforms.length > 0 ? platforms : features
    },
    amenityFilterId(feature) {
      const type = this.featureType(feature)

      if (type === 'CarPark') {
        return 'carParks'
      }

      if (type === 'BicyclePark') {
        return 'cycleParks'
      }

      if (type === 'Shop') {
        return 'shops'
      }

      if (['Cafe', 'Restaurant', 'FastFood', 'Pub', 'Bar'].includes(type)) {
        return 'foodDrink'
      }

      return 'otherAmenities'
    },
    filterOptionCount(id) {
      if (id === 'platforms') {
        return this.preferredPlatformFeatures(this.platformFeatures).length
      }

      if (id === 'entrances') {
        return this.entranceFeatures.length
      }

      if (id === 'tracks') {
        return this.trackFeatures.length
      }

      return this.amenityFeatures.filter(feature => this.amenityFilterId(feature) === id).length
    },
    toggleFilter(id) {
      this.mapFilters[id] = !this.mapFilters[id]
    },
    setAllFilters(value) {
      Object.keys(this.mapFilters).forEach(id => {
        this.mapFilters[id] = value
      })
    },
    platformLabel(feature, index) {
      return this.featureReference(feature) || this.featureName(feature) || (this.platformFeatures.length === 1 ? 'Platform' : `P${index + 1}`)
    },
    locationCoordinates(location) {
      const coordinates = location?.coordinates || location?.Coordinates
      return this.validCoordinates(coordinates) ? coordinates : null
    },
    geometryCoordinates(feature) {
      const geometry = this.featureValue(feature, 'Geometry') || []
      if (!Array.isArray(geometry)) {
        return []
      }

      return geometry
        .map(location => this.locationCoordinates(location))
        .filter(Boolean)
    },
    featureCoordinates(feature) {
      if (!feature) {
        return null
      }

      const locationCoordinates = this.locationCoordinates(this.featureValue(feature, 'Location'))
      if (locationCoordinates) {
        return locationCoordinates
      }

      const geometryCoordinates = this.geometryCoordinates(feature)
      if (geometryCoordinates.length === 0) {
        return null
      }

      const total = geometryCoordinates.reduce((result, coordinates) => [
        result[0] + coordinates[0],
        result[1] + coordinates[1]
      ], [0, 0])

      return [total[0] / geometryCoordinates.length, total[1] / geometryCoordinates.length]
    },
    featureGeometry(feature) {
      const coordinates = this.geometryCoordinates(feature)
      if (coordinates.length === 0) {
        const point = this.featureCoordinates(feature)
        return point ? { type: 'Point', coordinates: point } : null
      }

      const isClosed = coordinates.length >= 4 &&
        coordinates[0][0] === coordinates[coordinates.length - 1][0] &&
        coordinates[0][1] === coordinates[coordinates.length - 1][1]

      return isClosed
        ? { type: 'Polygon', coordinates: [coordinates] }
        : { type: 'LineString', coordinates }
    },
    featureCollection(features) {
      return {
        type: 'FeatureCollection',
        features: features
          .map((feature, index) => {
            const geometry = this.featureGeometry(feature)
            if (!geometry) {
              return null
            }

            return {
              type: 'Feature',
              properties: {
                name: this.featureName(feature),
                reference: this.featureReference(feature),
                index
              },
              geometry
            }
          })
          .filter(Boolean)
      }
    },
    collectGeometryCoordinates(geometry, coordinates) {
      if (!geometry) {
        return
      }

      if (geometry.type === 'Point') {
        coordinates.push(geometry.coordinates)
        return
      }

      if (Array.isArray(geometry.coordinates)) {
        for (const value of geometry.coordinates) {
          if (Array.isArray(value) && typeof value[0] === 'number') {
            coordinates.push(value)
          } else {
            this.collectGeometryCoordinates({ coordinates: value }, coordinates)
          }
        }
      }
    },
    validCoordinates(coordinates) {
      return Array.isArray(coordinates) &&
        coordinates.length === 2 &&
        coordinates.every(value => typeof value === 'number' && Number.isFinite(value))
    },
    humanise(value) {
      return String(value || '')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, character => character.toUpperCase())
    },
    mapLoaded(map) {
      this.mapboxObject = map
      map.resize()
      this.fitMap()
    },
    async openFilters() {
      if (this.isFullscreen) {
        await this.toggleFullscreen()
        this.syncFullscreenState()
      }

      this.filtersOpen = true
    },
    getFullscreenElement() {
      return document.fullscreenElement || document.webkitFullscreenElement
    },
    resizeMap() {
      this.$nextTick(() => {
        this.mapboxObject?.resize()
        if (this.isFullscreen) {
          this.fitMap()
        }
      })
    },
    enterFallbackFullscreen() {
      if (this.fullscreenBodyOverflow === null) {
        this.fullscreenBodyOverflow = document.body.style.overflow
      }

      document.body.style.overflow = 'hidden'
      this.nativeFullscreen = false
      this.isFullscreen = true
      this.resizeMap()
    },
    restoreFallbackFullscreen() {
      if (this.fullscreenBodyOverflow !== null) {
        document.body.style.overflow = this.fullscreenBodyOverflow
        this.fullscreenBodyOverflow = null
      }

      if (!this.nativeFullscreen) {
        this.isFullscreen = false
      }
    },
    async toggleFullscreen() {
      const element = this.$refs.mapContainer
      if (!element) {
        return
      }

      if (this.isFullscreen) {
        const fullscreenElement = this.getFullscreenElement()
        const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen

        if (this.nativeFullscreen && fullscreenElement === element && exitFullscreen) {
          try {
            await exitFullscreen.call(document)
            return
          } catch (error) {
            console.warn('Unable to exit station map full-screen state', error)
          }
        }

        this.nativeFullscreen = false
        this.restoreFallbackFullscreen()
        this.resizeMap()
        return
      }

      const requestFullscreen = element.requestFullscreen || element.webkitRequestFullscreen
      if (!requestFullscreen) {
        this.enterFallbackFullscreen()
        return
      }

      try {
        await requestFullscreen.call(element)
        if (this.getFullscreenElement() === element) {
          this.nativeFullscreen = true
          this.isFullscreen = true
          this.resizeMap()
          return
        }
      } catch (error) {
        console.warn('Native full-screen is unavailable for the station map', error)
      }

      this.enterFallbackFullscreen()
    },
    syncFullscreenState() {
      const fullscreenElement = this.getFullscreenElement()
      const isNativeFullscreen = fullscreenElement === this.$refs.mapContainer

      if (isNativeFullscreen) {
        this.nativeFullscreen = true
        this.isFullscreen = true
      } else if (this.nativeFullscreen) {
        this.nativeFullscreen = false
        this.isFullscreen = false
      }

      this.resizeMap()
    },
    fitMap() {
      if (!this.mapboxObject || this.mapCoordinates.length === 0) {
        return
      }

      const longitudes = this.mapCoordinates.map(coordinates => coordinates[0])
      const latitudes = this.mapCoordinates.map(coordinates => coordinates[1])
      const southwest = [Math.min(...longitudes), Math.min(...latitudes)]
      const northeast = [Math.max(...longitudes), Math.max(...latitudes)]

      if (southwest[0] === northeast[0] && southwest[1] === northeast[1]) {
        this.mapboxObject.setCenter(southwest)
        this.mapboxObject.setZoom(17)
        return
      }

      this.mapboxObject.fitBounds([southwest, northeast], {
        padding: 48,
        maxZoom: 18,
        duration: 0
      })
    }
  }
}
</script>

<style scoped lang="scss">
.station-map:fullscreen,
.station-map.is-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  width: 100vw;
  height: 100vh;
  height: 100dvh !important;
  max-height: none !important;
  border-width: 0;
  border-radius: 0;
}

.station-map:-webkit-full-screen {
  width: 100vw;
  height: 100vh;
  height: 100dvh !important;
  max-height: none !important;
  border-width: 0;
  border-radius: 0;
}

.station-map-action {
  display: inline-flex;
  width: 2.75rem;
  height: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(255 255 255 / 0.8);
  border-radius: 0.9rem;
  background: rgb(255 255 255 / 0.92);
  color: #334155;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.15);
  backdrop-filter: blur(12px);
  transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
}

.station-map-action:hover {
  background: white;
  color: #1d4ed8;
  transform: translateY(-1px);
}

.station-map-action:focus-visible {
  outline: 3px solid rgb(37 99 235 / 0.35);
  outline-offset: 2px;
}

.station-filter-badge {
  position: absolute;
  top: -0.3rem;
  right: -0.3rem;
  display: inline-flex;
  min-width: 1.1rem;
  height: 1.1rem;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  border-radius: 999px;
  background: #db2777;
  color: white;
  font-size: 0.65rem;
  font-weight: 900;
  line-height: 1;
}

.station-map :deep(.mapboxgl-ctrl-group) {
  border: 0;
  border-radius: 0.9rem;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.15);
  overflow: hidden;
}

.station-map :deep(.mapboxgl-ctrl-group button) {
  width: 2.4rem;
  height: 2.4rem;
}

.station-feature-marker {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  border-radius: 999px;
  box-shadow: 0 4px 12px rgb(15 23 42 / 0.3);
}

.station-feature-marker {
  width: 1.8rem;
  height: 1.8rem;
  color: white;
}

.station-entrance-marker {
  background: #16a34a;
}

.station-amenity-marker {
  background: #7c3aed;
}

.station-amenity-nearby {
  background: #64748b;
  opacity: 0.82;
}

.amenity-count {
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1;
}

.platform-marker {
  display: inline-flex;
  min-width: 1.8rem;
  height: 1.8rem;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  border-radius: 999px;
  background: #f59e0b;
  padding: 0 0.3rem;
  color: #451a03;
  font-size: 0.68rem;
  font-weight: 900;
  line-height: 1;
  box-shadow: 0 4px 12px rgb(15 23 42 / 0.28);
}

.station-popup {
  min-width: 7rem;
  color: #0f172a;
  font-size: 0.8rem;
}
</style>
