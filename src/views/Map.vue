<template>
  <div v-if="loading" class="flex min-h-[60dvh] items-center justify-center text-sm font-bold text-slate-500 dark:text-slate-400">
    <span class="material-symbols-outlined mr-2 animate-spin text-[20px]">progress_activity</span>
    Loading map
  </div>
  <div v-else class="fullscreen-map bg-slate-100 dark:bg-slate-950" :class="{ 'map-dark': darkMode, 'map-stop-selected': !!currentViewedStop }">
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

      <mapbox-marker :lngLat="stop.Location.coordinates" v-for="stop in this.stops" v-bind:key="stop.PrimaryIdentifier" @click="openStopSheet(stop)">
        <template v-slot:icon>
          <StopMapMarker
            :stop="stop"
            :selected="currentViewedStop?.PrimaryIdentifier === stop.PrimaryIdentifier"
            :show-route-labels="currentZoom >= stopLabelsZoom"
            :label-side="stopMarkerSides[stop.PrimaryIdentifier] || 'right'"
          />
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
        <p class="text-xs font-bold uppercase tracking-wide text-brand-blue dark:text-brand-blue-light">Map</p>
        <h1 class="text-lg font-bold text-slate-950 dark:text-slate-100">Nearby network</h1>
      </div>
      <div class="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
        <span class="map-count-chip" :aria-label="showStops ? `${stops.length} stops shown` : 'Stops layer off'">
          <span class="material-symbols-outlined text-[15px]">pin_drop</span>
          <span>{{ showStops ? `${stops.length} stops` : 'Stops off' }}</span>
        </span>
        <span class="map-count-chip map-count-chip--live" :aria-label="showVehicles ? `${visibleVehicles.length} live vehicles shown` : 'Live vehicles layer off'">
          <span class="material-symbols-outlined text-[15px]">directions_bus</span>
          <span>{{ showVehicles ? `${visibleVehicles.length} live` : 'Live off' }}</span>
        </span>
      </div>
    </div>

    <div v-if="currentZoom < dataLoadMinZoom && showStops" class="map-zoom-hint">
      <span class="material-symbols-outlined text-[18px]">zoom_in</span>
      Zoom in to load stops
    </div>

    <div v-if="mapDataError" class="map-error-panel" role="alert">
      <span class="material-symbols-outlined text-[19px]">cloud_off</span>
      <span class="min-w-0 flex-1">Map data could not be refreshed.</span>
      <button type="button" class="shrink-0 rounded-lg bg-amber-100 px-3 py-2 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="refreshData()">Retry</button>
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

    <section
      v-if="currentViewedStop"
      class="map-stop-sheet"
      aria-label="Selected stop details"
    >
      <header class="map-stop-sheet__header">
        <div class="map-stop-sheet__top">
          <div class="map-stop-sheet__identity">
            <StopMapMarker :stop="currentViewedStop" selected compact />
            <div class="min-w-0">
              <h2 class="map-stop-sheet__title">{{ currentViewedStop.PrimaryName }}</h2>
              <p v-if="currentViewedStop.Descriptor || currentViewedStop.OtherNames?.Descriptor" class="map-stop-sheet__subtitle">
                {{ currentViewedStop.Descriptor || currentViewedStop.OtherNames?.Descriptor }}
              </p>
            </div>
          </div>
          <div class="map-stop-sheet__actions">
            <router-link
              :to="{ name: 'stops/view', params: { id: currentViewedStop.PrimaryIdentifier } }"
              class="map-stop-sheet__open"
              @click="closeStopSheet"
            >Open stop</router-link>
            <button type="button" class="map-stop-sheet__close" aria-label="Close stop details" @click="closeStopSheet">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        <div
          v-if="currentStopAllServices.length"
          class="map-stop-sheet__services"
          role="group"
          :aria-label="`${currentStopAllServices.length} services at this stop`"
          tabindex="0"
        >
          <ServiceIcon
            v-for="(service, index) in currentStopAllServices"
            :key="service.PrimaryIdentifier || `${service.TransportType || 'service'}:${service.ServiceName || service.PrimaryName || index}`"
            :service="service"
            class="map-stop-sheet__service-chip h-8 max-w-48 shrink-0 whitespace-nowrap rounded-md px-2 text-[11px] font-bold"
          />
        </div>
      </header>

      <div class="map-stop-sheet__board">
        <div class="map-stop-sheet__board-heading">
          <h3>Next departures</h3>
          <span v-if="!loadingDepartures && !departuresError && currentViewedStopDepartures.length">
            {{ Math.min(currentViewedStopDepartures.length, 3) }} shown
          </span>
        </div>
        <div v-if="loadingDepartures" class="map-stop-sheet__message" role="status">Loading departures…</div>
        <div v-else-if="departuresError" class="map-stop-sheet__error" role="alert">
          <span>Departures could not be loaded.</span>
          <button type="button" @click="getDepartures()">Retry</button>
        </div>
        <DeparturesList
          v-else
          :stop="currentViewedStop"
          :departures="nextDepartures"
          variant="compact"
        />
      </div>
    </section>
  </div>

  <Modal
    v-model:open="mapFiltersOpen"
    title="Map filters"
    subtitle="Choose which live map layers are shown."
    icon="tune"
    close-label="Close map filters"
    body-class="p-4 sm:p-5"
  >
            <section>
              <div class="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">Map layers</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Stops load when zoomed in. Vehicles refresh automatically.</p>
                </div>
                <span class="shrink-0 text-xs font-bold text-brand-blue dark:text-brand-blue-light" v-if="activeMapLayerCount > 0">
                  {{ activeMapLayerCount }} selected
                </span>
              </div>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  v-for="layer in mapLayerFilters"
                  v-bind:key="layer.id"
                  type="button"
                  class="flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-left transition"
                  :class="isMapLayerEnabled(layer.id)
                    ? 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue shadow-sm dark:border-brand-blue/40 dark:bg-brand-blue/100/10 dark:text-brand-blue-light'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-blue/20 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-blue/40 dark:hover:bg-brand-blue/100/10'"
                  @click="toggleMapLayer(layer.id)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    :class="isMapLayerEnabled(layer.id) ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
                  >
                    <span class="material-symbols-outlined text-[21px] leading-none">{{ layer.icon }}</span>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-bold leading-tight">{{ layer.label }}</span>
                  </span>
                  <span
                    class="material-symbols-outlined text-[20px]"
                    :class="isMapLayerEnabled(layer.id) ? 'text-brand-blue dark:text-brand-blue-light' : 'text-slate-300 dark:text-slate-600'"
                  >
                    {{ isMapLayerEnabled(layer.id) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </button>
              </div>
            </section>

            <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button
                type="button"
                class="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                @click="clearMapFilters"
              >
                Clear all
              </button>
              <button
                type="button"
                class="min-h-11 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
                @click="closeMapFilters"
              >
                Apply filters
              </button>
            </div>
  </Modal>

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
  border: 1px solid color-mix(in srgb, var(--ui-border) 85%, transparent);
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--ui-panel) 94%, transparent);
  color: var(--ui-text);
  padding: 0.75rem 0.875rem;
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(14px);
}

.map-count-chip {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  gap: 0.3rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--brand-blue) 12%, var(--ui-panel));
  color: var(--brand-blue);
  padding: 0.25rem 0.6rem;
  white-space: nowrap;
}

.map-count-chip--live {
  background: color-mix(in srgb, var(--brand-pink) 13%, var(--ui-panel));
  color: var(--brand-pink);
}

.map-error-panel {
  position: absolute;
  left: 1rem;
  right: 1rem;
  bottom: 5.5rem;
  z-index: 40;
  display: flex;
  min-height: 2.75rem;
  align-items: center;
  gap: 0.5rem;
  border-radius: 1rem;
  background: rgb(255 251 235 / 0.96);
  padding: 0.5rem 0.75rem;
  color: #78350f;
  font-size: 0.875rem;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(12px);
}

:global(.dark) .map-error-panel {
  background: rgb(120 53 15 / 0.9);
  color: #fef3c7;
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
  bottom: calc(6.25rem + env(safe-area-inset-bottom));
  right: 1rem;
  z-index: 40;
  display: inline-flex;
  width: 3rem;
  height: 3rem;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--ui-border) 85%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ui-panel) 96%, transparent);
  color: var(--brand-blue);
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.16);
  backdrop-filter: blur(14px);
  transition: background-color 160ms ease, color 160ms ease, transform 160ms ease;
}

.map-filter-button:hover {
  background: var(--ui-subtle);
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
  border: 2px solid var(--ui-panel);
  border-radius: 999px;
  background: var(--brand-blue);
  color: var(--ui-page);
  font-size: 0.7rem;
  font-weight: 900;
}

.map-stop-sheet {
  position: absolute;
  z-index: 45;
  left: 0.75rem;
  right: 0.75rem;
  bottom: calc(6.5rem + env(safe-area-inset-bottom));
  display: flex;
  max-height: min(52dvh, 27rem);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-panel-radius);
  background: var(--ui-panel);
  color: var(--ui-text);
  box-shadow: 0 18px 48px rgb(15 23 42 / 0.28);
}

.map-stop-sheet__header {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.6rem;
  border-bottom: 1px solid var(--ui-divider);
  padding: 0.875rem 1rem;
}

.map-stop-sheet__top,
.map-stop-sheet__identity {
  display: flex;
  min-width: 0;
  align-items: flex-start;
}

.map-stop-sheet__top {
  justify-content: space-between;
  gap: 0.75rem;
}

.map-stop-sheet__identity {
  flex: 1 1 auto;
  gap: 0.75rem;
}

.map-stop-sheet__title {
  display: -webkit-box;
  overflow: hidden;
  color: var(--ui-text);
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  text-overflow: ellipsis;
}

.map-stop-sheet__subtitle {
  margin-top: 0.15rem;
  color: var(--ui-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.map-stop-sheet__services {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.45rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.1rem 0.1rem 0.3rem;
  overscroll-behavior-x: contain;
  scrollbar-color: var(--ui-border) transparent;
  scrollbar-width: thin;
}

.map-stop-sheet__service-chip :deep(span.w-full) {
  display: block;
  max-width: 8.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.map-stop-sheet__services::-webkit-scrollbar {
  height: 0.25rem;
}

.map-stop-sheet__services::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--ui-border);
}

.map-stop-sheet__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.35rem;
}

.map-stop-sheet__open,
.map-stop-sheet__close {
  display: inline-flex;
  min-height: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0 0.75rem;
  font-size: 0.75rem;
  font-weight: 800;
  white-space: nowrap;
}

.map-stop-sheet__open {
  background: var(--brand-blue);
  color: var(--ui-page);
}

.map-stop-sheet__close {
  width: 2.5rem;
  padding: 0;
  background: var(--ui-subtle);
  color: var(--ui-muted);
}

.map-stop-sheet__board {
  min-height: 0;
  overflow-y: auto;
}

.map-stop-sheet__board-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 1rem 0.25rem;
}

.map-stop-sheet__board-heading h3 {
  color: var(--ui-text);
  font-size: 0.8rem;
  font-weight: 800;
}

.map-stop-sheet__board-heading span,
.map-stop-sheet__message {
  color: var(--ui-muted);
  font-size: 0.7rem;
  font-weight: 600;
}

.map-stop-sheet__message {
  padding: 0.75rem 1rem 1rem;
}

.map-stop-sheet__error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  color: #a03c50;
  padding: 0.75rem 1rem 1rem;
  font-size: 0.8rem;
  font-weight: 650;
}

.map-stop-sheet__error button {
  min-height: 2.5rem;
  border-radius: 0.7rem;
  background: var(--ui-subtle);
  color: var(--ui-text);
  padding: 0 0.75rem;
  font-weight: 800;
}

:deep(.mapboxgl-ctrl-bottom-right) {
  bottom: calc(9.75rem + env(safe-area-inset-bottom));
  right: 0.7rem;
}

.map-stop-selected :deep(.mapboxgl-ctrl-bottom-right) {
  bottom: auto;
  top: 13.25rem;
}

.map-stop-selected .map-filter-button {
  bottom: auto;
  top: 9rem;
}

:deep(.mapboxgl-ctrl-group) {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--ui-border) 85%, transparent);
  border-radius: 1rem;
  background: color-mix(in srgb, var(--ui-panel) 96%, transparent);
  box-shadow: 0 14px 35px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(14px);
}

:deep(.mapboxgl-ctrl-group button) {
  width: 2.75rem;
  height: 2.75rem;
  background-color: transparent;
  transition: background-color 160ms ease;
}

:deep(.mapboxgl-ctrl-group button:hover) {
  background-color: var(--ui-subtle);
}

:deep(.mapboxgl-ctrl-group button + button) {
  border-top-color: var(--ui-divider);
}

:deep(.mapboxgl-popup-content) {
  border: 1px solid var(--ui-border);
  border-radius: 1rem;
  padding: 0.75rem;
  background: var(--ui-panel);
  color: var(--ui-text);
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
  border-color: color-mix(in srgb, var(--ui-border) 85%, transparent);
  background: color-mix(in srgb, var(--ui-panel) 94%, transparent);
  box-shadow: 0 18px 45px rgb(0 0 0 / 0.32);
}

.map-dark .map-filter-button {
  color: var(--brand-blue);
}

.map-dark .map-filter-button:hover {
  background: var(--ui-subtle);
}

.map-dark .map-filter-count {
  border-color: var(--ui-panel);
}

.map-dark :deep(.mapboxgl-ctrl-group button) {
  color: var(--ui-text);
}

.map-dark :deep(.mapboxgl-ctrl-group button:hover) {
  background-color: var(--ui-subtle);
}

.map-dark :deep(.mapboxgl-ctrl-group button + button) {
  border-top-color: var(--ui-divider);
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
  border-color: var(--ui-border);
  background: var(--ui-panel);
  color: var(--ui-text);
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
    bottom: calc(7.25rem + env(safe-area-inset-bottom));
    right: 2rem;
  }

  .map-stop-sheet {
    position: fixed;
    left: auto;
    right: 1.5rem;
    bottom: calc(6.5rem + env(safe-area-inset-bottom));
    width: min(28rem, calc(100vw - 3rem));
    min-width: min(24rem, calc(100vw - 3rem));
    max-height: min(70dvh, 34rem);
  }

  .map-stop-selected .map-filter-button {
    right: 1.5rem;
    top: 7.5rem;
  }

  :deep(.mapboxgl-ctrl-bottom-right) {
    bottom: calc(11rem + env(safe-area-inset-bottom));
    right: 1.7rem;
  }

  .map-stop-selected :deep(.mapboxgl-ctrl-bottom-right) {
    bottom: auto;
    right: 1.2rem;
    top: 12.5rem;
  }
}

@media (min-width: 1280px) {
  .map-stop-sheet {
    bottom: 1.5rem;
  }
}
</style>


<script>
import StopMapMarker from '@/components/StopMapMarker.vue'
import Modal from '@/components/Modal.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
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
    mapDataError() {
      return this.stopsError || this.vehiclesError
    },
    visibleVehicles() {
      return this.vehicles.filter(vehicle => {
        const coordinates = vehicle?.VehicleLocation?.coordinates

        return Array.isArray(coordinates) &&
          coordinates.length === 2 &&
          typeof coordinates[0] === 'number' &&
          typeof coordinates[1] === 'number'
      })
    },
    currentStopAllServices() {
      const unique = new Map()
      ;(this.currentViewedStop?.Services || []).forEach((service, index) => {
        const key = service?.PrimaryIdentifier || `${service?.TransportType || 'unknown'}:${service?.ServiceName || service?.PrimaryName || index}`
        if (!unique.has(key)) unique.set(key, service)
      })
      return [...unique.values()].map(service => ({
        ...service,
        ServiceName: service?.ServiceName || service?.PrimaryName || ''
      }))
    },
    nextDepartures() {
      return this.currentViewedStopDepartures.slice(0, 3)
    },
    stopMarkerSides() {
      const map = this.mapboxObject
      if (!map || this.currentZoom < this.stopLabelsZoom) return {}

      const viewportCenter = map.project(this.currentCenter)
      const points = this.stops.map((stop, index) => {
        const coordinates = stop?.Location?.coordinates
        if (!Array.isArray(coordinates) || coordinates.length !== 2) return null

        const point = map.project(coordinates)
        return {
          id: stop.PrimaryIdentifier,
          index,
          x: point.x,
          y: point.y
        }
      }).filter(Boolean)

      const sides = {}
      points.forEach(point => {
        let leftPressure = 0
        let rightPressure = 0
        let nearbyX = 0
        let nearbyWeight = 0

        points.forEach(other => {
          if (other.id === point.id) return

          const dx = other.x - point.x
          const dy = Math.abs(other.y - point.y)
          const horizontalDistance = Math.abs(dx)
          if (horizontalDistance >= 150 || dy >= 46) return

          const weight = (1 - horizontalDistance / 150) * (1 - dy / 46)
          if (dx < 0) leftPressure += weight
          else rightPressure += weight
          nearbyX += other.x * weight
          nearbyWeight += weight
        })

        if (Math.abs(leftPressure - rightPressure) > 0.04) {
          sides[point.id] = leftPressure < rightPressure ? 'left' : 'right'
        } else if (nearbyWeight > 0 && Math.abs((nearbyX / nearbyWeight) - point.x) > 4) {
          sides[point.id] = point.x < (nearbyX / nearbyWeight) ? 'left' : 'right'
        } else {
          sides[point.id] = point.x < viewportCenter.x ? 'left' : 'right'
          if (Math.abs(point.x - viewportCenter.x) <= 4) {
            sides[point.id] = point.index % 2 === 0 ? 'left' : 'right'
          }
        }
      })

      return sides
    }
  },
  data () {
    return {
      stops: [],
      vehicles: [],

      loading: false,
      stopsError: false,
      vehiclesError: false,

      currentZoom: 5,
      currentCenter: [0.1356, 52.2065],
      stopLabelsZoom: 17,

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

      loadingDepartures: true,
      currentViewedStopDepartures: [],
      departuresError: false
    }
  },
  components: {
    Modal,
    StopMapMarker,
    DeparturesList,
    ServiceIcon,

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
        this.stopsError = false
        axios
          .get(`${API.URL}/core/stops/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}&view=map`)
          .then(response => {
            let newStops = response.data

            this.stops = newStops
          })
          .catch(error => {
            console.log(error)
            this.stopsError = true
          })
          .finally(() => this.loading = false)
      }

      if (this.showVehicles && updateVehicles) {
        this.vehiclesError = false
        axios
          .get(`${API.URL}/core/realtime_journeys/?bounds=${bottomLeftLon},${bottomLeftLat},${topRightLon},${topRightLat}`)
          .then(response => {
            let newVehicles = Array.isArray(response.data) ? response.data : []

            this.vehicles = newVehicles
          })
          .catch(error => {
            console.log(error)
            this.vehiclesError = true
          })
          .finally(() => this.loading = false)
      }
    },
    openStopSheet(stop) {
      this.currentViewedStop = stop
      this.currentViewedStopDepartures = []
      this.loadingDepartures = true
      this.departuresError = false

      this.getDepartures(stop)
    },
    closeStopSheet() {
      this.currentViewedStop = undefined
      this.currentViewedStopDepartures = []
      this.loadingDepartures = false
      this.departuresError = false
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
    getDepartures(stop = this.currentViewedStop) {
      if (!stop) {
        return
      }

      const stopIdentifier = stop.PrimaryIdentifier
      this.loadingDepartures = true
      this.departuresError = false
      axios
        .get(`${API.URL}/core/stops/${stopIdentifier}/departures`, {
          params: {
            'count': 10,
            view: 'compact',
            // 'datetime': this.$route.query.datetime
          }
        })
        .then(response => {
          if (this.currentViewedStop?.PrimaryIdentifier !== stopIdentifier) return
          this.currentViewedStopDepartures = response.data
        })
        .catch(error => {
          console.log(error)
          if (this.currentViewedStop?.PrimaryIdentifier === stopIdentifier) {
            this.departuresError = true
          }
        })
        .finally(() => {
          if (this.currentViewedStop?.PrimaryIdentifier === stopIdentifier) {
            this.loadingDepartures = false
          }
        })
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
