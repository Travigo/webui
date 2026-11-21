<template>
  <div class="fullscreen-map bg-slate-100 dark:bg-slate-950" :class="{ 'map-dark': darkMode, 'map-stop-selected': !!currentViewedStop }">
    <mapbox-map
      :access-token="mapboxToken"
      :mapStyle="initialMapStyle"
      height="100%"
      :center="initialCenter"
      :zoom="initialZoom"
      @loaded="mapLoaded"
      @moveend="mapPositionUpdate"
    >
      <mapbox-navigation-control position="bottom-right" />
      <mapbox-geolocate-control position="bottom-right" />

      <mapbox-marker v-for="stop in detailedStops" :key="stop.PrimaryIdentifier" :lngLat="stop.Location.coordinates">
        <template v-slot:icon>
          <button type="button" class="map-stop-marker-button" :aria-label="`Open ${stop.PrimaryName}`" @click.stop="openStopSheet(stop)">
            <StopMapMarker
              :stop="stop"
              :selected="currentViewedStop?.PrimaryIdentifier === stop.PrimaryIdentifier"
              :show-route-labels="currentZoom >= stopLabelsZoom"
              :label-side="stopMarkerSides[stop.PrimaryIdentifier] || 'right'"
            />
          </button>
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

    <div class="map-status-overlay">
      <div class="map-status-panel">
        <h1 class="text-lg font-bold text-slate-950 dark:text-slate-100">Nearby network</h1>
        <div class="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <span class="map-count-chip">
            <span class="material-symbols-outlined text-[15px]" aria-hidden="true">pin_drop</span>
            <span>{{ stopCountLabel }}</span>
          </span>
          <span class="map-count-chip map-count-chip--live">
            <span class="material-symbols-outlined text-[15px]" aria-hidden="true">directions_bus</span>
            <span>{{ showVehicles ? `${visibleVehicles.length} live` : 'Live off' }}</span>
          </span>
        </div>
      </div>

      <div v-if="currentZoom < dataLoadMinZoom && showStops" class="map-zoom-hint">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">zoom_in</span>
        Zoom in to load stops
      </div>
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

    <Transition name="map-stop-panel" @before-leave="element => element.inert = true">
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
        <HorizontalScrollFade
          v-if="currentStopAllServices.length"
          :key="currentViewedStop.PrimaryIdentifier"
          class="map-stop-sheet__services"
          track-class="items-center gap-[0.45rem]"
          :label="`${currentStopAllServices.length} services at this stop`"
          focusable
        >
          <ServiceIcon
            v-for="(service, index) in currentStopAllServices"
            :key="service.PrimaryIdentifier || `${service.TransportType || 'service'}:${service.ServiceName || service.PrimaryName || index}`"
            :service="service"
            class="map-stop-sheet__service-chip h-7 max-w-48 shrink-0 whitespace-nowrap rounded-md px-2 text-[11px] font-bold"
          />
        </HorizontalScrollFade>
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
    </Transition>
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

.map-status-overlay {
  position: absolute;
  left: 1rem;
  top: 5.25rem;
  z-index: 40;
  display: grid;
  justify-items: start;
  gap: 0.45rem;
  width: calc(100% - 2rem);
  max-width: 32rem;
  pointer-events: none;
}

.map-status-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
  border: 1px solid color-mix(in srgb, var(--ui-border) 85%, transparent);
  border-radius: 1.25rem;
  background: color-mix(in srgb, var(--ui-panel) 94%, transparent);
  color: var(--ui-text);
  padding: 0.75rem 0.875rem;
  box-shadow: 0 18px 45px rgb(15 23 42 / 0.14);
  backdrop-filter: blur(14px);
}

.map-stop-marker-button {
  display: flex;
  min-width: 44px;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 0.75rem;
}

.map-stop-marker-button :deep(.stop-map-marker) {
  width: 1.85rem;
  min-width: 1.85rem;
  height: 1.7rem;
  box-shadow: 0 1px 3px rgb(23 25 35 / 0.25);
}

.map-stop-marker-button:focus-visible {
  outline: 3px solid var(--brand-blue);
  outline-offset: 2px;
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

.map-stop-panel-enter-active,
.map-stop-panel-leave-active {
  transition: opacity var(--motion-sheet) var(--motion-ease-out);
}

.map-stop-panel-enter-from,
.map-stop-panel-leave-to {
  opacity: 0;
}

.map-stop-panel-leave-active {
  pointer-events: none;
}

@media (width < 640px) and (prefers-reduced-motion: no-preference) {
  .map-stop-panel-enter-active,
  .map-stop-panel-leave-active {
    transition: opacity var(--motion-sheet) var(--motion-ease-out), transform var(--motion-sheet) var(--motion-ease-out);
  }

  .map-stop-panel-enter-from,
  .map-stop-panel-leave-to {
    transform: translateY(1rem);
  }
}

.map-stop-sheet__header {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.375rem;
  border-bottom: 1px solid var(--ui-divider);
  padding: 0.625rem 1rem 0.5rem;
}

.map-stop-sheet__top,
.map-stop-sheet__identity {
  display: flex;
  min-width: 0;
  align-items: center;
}

.map-stop-sheet__top {
  justify-content: space-between;
  gap: 0.5rem;
}

.map-stop-sheet__identity {
  flex: 1 1 auto;
  gap: 0.625rem;
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
  margin-top: 0.125rem;
  color: var(--ui-muted);
  font-size: 0.75rem;
  line-height: 1.35;
}

.map-stop-sheet__services :deep(.horizontal-scroll-viewport) {
  overflow-y: hidden;
  padding: 0.1rem;
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

.map-stop-sheet__services :deep(.horizontal-scroll-viewport::-webkit-scrollbar) {
  height: 0.25rem;
}

.map-stop-sheet__services :deep(.horizontal-scroll-viewport::-webkit-scrollbar-thumb) {
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
  padding: 0 0.625rem;
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
  .map-status-overlay {
    left: 2rem;
    top: 7.5rem;
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
  .map-status-overlay {
    left: 7.5rem;
  }

  .map-stop-sheet {
    bottom: 1.5rem;
  }
}
</style>


<script>
import StopMapMarker from '@/components/StopMapMarker.vue'
import Modal from '@/components/Modal.vue'
import DeparturesList from '@/components/DeparturesList.vue'
import HorizontalScrollFade from '@/components/HorizontalScrollFade.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'
import axios from 'axios'
import API from '@/API'
import { markRaw } from 'vue'

import { MapboxMap } from 'vue-mapbox-ts'

const stopSource = 'travigo-stops'
const stopClusterLayer = 'travigo-stop-clusters'
const stopCountLayer = 'travigo-stop-cluster-count'
const stopPointLayer = 'travigo-stop-points'
const lightMapStyle = 'mapbox://styles/mapbox/light-v11'
const darkMapStyle = 'mapbox://styles/mapbox/dark-v11'
const mapboxToken = 'pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg'

export default {
  name: 'StopsView',
  computed: {
    mapStyle() {
      return this.darkMode
        ? darkMapStyle
        : lightMapStyle
    },
    activeMapLayerCount() {
      return [this.showStops, this.showVehicles].filter(Boolean).length
    },
    stopCountLabel() {
      if (!this.showStops) return 'Stops off'
      if (this.currentZoom < this.dataLoadMinZoom) return 'Stops hidden'
      if (this.stopsLoading && !this.stops.length) return 'Loading stops…'
      return `${this.stops.length.toLocaleString()} stops`
    },
    detailedStops() {
      return this.currentZoom >= this.detailedStopsZoom ? this.stops : []
    },
    stopsById() {
      return new Map(this.stops.map(stop => [stop.PrimaryIdentifier, stop]))
    },
    stopFeatures() {
      return {
        type: 'FeatureCollection',
        features: this.stops.map(stop => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: stop.Location.coordinates },
          properties: { stopId: stop.PrimaryIdentifier }
        }))
      }
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

      stopsLoading: false,
      stopsError: false,
      vehiclesError: false,

      currentZoom: 5,
      currentCenter: [0.1356, 52.2065],
      stopLabelsZoom: 17,
      detailedStopsZoom: 16,

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
      mapboxToken,
      darkMode: document.documentElement.classList.contains('dark'),
      initialMapStyle: document.documentElement.classList.contains('dark') ? darkMapStyle : lightMapStyle,
      appliedMapStyle: null,
      mapStyleRequest: null,
      themeObserver: undefined,
      stopsRequestVersion: 0,
      vehiclesRequestVersion: 0,

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
    HorizontalScrollFade,
    ServiceIcon,

    MapboxMap
  },
  methods: {
    mapLoaded(map) {
      this.mapboxObject = markRaw(map)
      this.appliedMapStyle = this.initialMapStyle
      map.on('style.load', this.installStopLayers)
      map.on('idle', this.installStopLayers)
      map.on('click', stopClusterLayer, this.expandStopCluster)
      map.on('click', stopPointLayer, this.openMapStop)
      for (const layer of [stopClusterLayer, stopPointLayer]) {
        map.on('mouseenter', layer, this.showStopPointer)
        map.on('mouseleave', layer, this.clearStopPointer)
      }
      if (map.isStyleLoaded()) this.installStopLayers()
      this.applyMapStyle(this.mapStyle)

      map.resize()

      this.refreshData()
    },
    installStopLayers() {
      const map = this.mapboxObject
      if (!map || map.getSource(stopSource)) return

      const darkStyle = this.appliedMapStyle === darkMapStyle
      if (darkStyle) {
        for (const layer of map.getStyle().layers || []) {
          if (layer.type === 'symbol' && /^(country|state|settlement|settlement-subdivision)-label$/.test(layer.id)) {
            const majorLabel = layer.id === 'country-label' || layer.id === 'settlement-label'
            map.setPaintProperty(layer.id, 'text-color', majorLabel ? '#e2e5eb' : '#b9bfcb')
          }
        }
      }

      const accent = darkStyle ? '#a0a2e6' : '#696aad'
      const panel = darkStyle ? '#242637' : '#ffffff'
      map.addSource(stopSource, {
        type: 'geojson',
        data: this.stopFeatures,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: this.detailedStopsZoom - 1
      })
      const options = { source: stopSource, maxzoom: this.detailedStopsZoom }
      const clustered = ['has', 'point_count']
      map.addLayer({
        ...options,
        id: stopClusterLayer,
        type: 'circle',
        filter: clustered,
        paint: {
          'circle-color': accent,
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 19, 100, 22],
          'circle-stroke-color': panel,
          'circle-stroke-width': 2
        }
      })
      map.addLayer({
        ...options,
        id: stopCountLayer,
        type: 'symbol',
        filter: clustered,
        layout: {
          'text-field': ['to-string', ['get', 'point_count_abbreviated']],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
          'text-allow-overlap': true
        },
        paint: { 'text-color': darkStyle ? '#171923' : '#ffffff' }
      })
      map.addLayer({
        ...options,
        id: stopPointLayer,
        type: 'circle',
        filter: ['!', clustered],
        paint: {
          'circle-color': accent,
          'circle-radius': ['interpolate', ['linear'], ['zoom'], this.dataLoadMinZoom, 5, this.detailedStopsZoom, 9],
          'circle-stroke-color': panel,
          'circle-stroke-width': 2
        }
      })
    },
    async applyMapStyle(style) {
      this.mapStyleRequest?.abort()
      const map = this.mapboxObject
      if (!map || style === this.appliedMapStyle) return

      const request = new AbortController()
      this.mapStyleRequest = request
      const url = new URL(style.replace('mapbox://styles/', 'https://api.mapbox.com/styles/v1/'))
      url.searchParams.set('access_token', mapboxToken)

      try {
        // Keep the rendered map while the replacement style downloads.
        const response = await fetch(url, { signal: request.signal })
        if (!response.ok) return
        const replacement = await response.json()
        if (request.signal.aborted || this.mapboxObject !== map) return
        this.appliedMapStyle = style
        map.setStyle(replacement)
      } catch (error) {
        if (!request.signal.aborted) console.warn('Could not switch map appearance.', error)
      }
    },
    expandStopCluster(event) {
      const map = this.mapboxObject
      const feature = event.features?.[0]
      if (!feature) return

      const [longitude, latitude] = feature.geometry.coordinates
      const coordinates = [longitude + 360 * Math.round((event.lngLat.lng - longitude) / 360), latitude]
      map.getSource(stopSource)?.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
        if (error || !this.mapboxObject || !this.showStops) return
        const camera = { center: coordinates, zoom }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) map.jumpTo(camera)
        else map.easeTo({ ...camera, duration: 260 })
      })
    },
    openMapStop(event) {
      const stop = this.stopsById.get(event.features?.[0]?.properties.stopId)
      if (stop) this.openStopSheet(stop)
    },
    showStopPointer() {
      this.mapboxObject.getCanvas().style.cursor = 'pointer'
    },
    clearStopPointer() {
      this.mapboxObject.getCanvas().style.cursor = ''
    },
    refreshData(updateStops = true, updateVehicles = true) {
      if (this.mapboxObject) {
        this.getData(updateStops, updateVehicles)
      }
    },
    mapPositionUpdate() {
      const map = this.mapboxObject
      if (!map) return

      this.currentCenter = map.getCenter().toArray()
      this.currentZoom = map.getZoom()
      localStorage.map_last_center = JSON.stringify(this.currentCenter)
      localStorage.map_last_zoom = this.currentZoom

      this.refreshData()
    },
    requestBounds() {
      const bounds = this.mapboxObject.getBounds()
      if (!bounds) return []

      const south = bounds.getSouth()
      const north = bounds.getNorth()
      const span = bounds.getEast() - bounds.getWest()
      if (span >= 360) return [[-180, south, 180, north]]

      const west = ((bounds.getWest() + 180) % 360 + 360) % 360 - 180
      const east = west + span
      return east <= 180
        ? [[west, south, east, north]]
        : [[west, south, 180, north], [-180, south, east - 360, north]]
    },
    async loadBounds(path, boxes, params = {}) {
      const responses = await Promise.all(boxes.map(bounds =>
        axios.get(`${API.URL}/core/${path}/`, { params: { ...params, bounds: bounds.join(',') } })
      ))
      return responses.flatMap(({ data }) => Array.isArray(data) ? data : [])
    },
    getData(updateStops, updateVehicles) {
      const boxes = this.requestBounds()
      if (!boxes.length) return

      if (updateStops) {
        const version = ++this.stopsRequestVersion
        this.stopsError = false
        if (this.showStops && this.currentZoom >= this.dataLoadMinZoom) {
          this.stopsLoading = true
          this.loadBounds('stops', boxes, { view: 'map' })
            .then(stops => {
              if (version !== this.stopsRequestVersion) return
              this.stops = stops.filter(stop => stop?.PrimaryIdentifier &&
                Array.isArray(stop.Location?.coordinates) &&
                stop.Location.coordinates.length === 2 &&
                stop.Location.coordinates.every(Number.isFinite))
            })
            .catch(error => {
              if (version !== this.stopsRequestVersion) return
              console.log(error)
              this.stopsError = true
            })
            .finally(() => {
              if (version === this.stopsRequestVersion) this.stopsLoading = false
            })
        } else {
          this.stops = []
          this.stopsLoading = false
        }
      }

      if (this.showVehicles && updateVehicles) {
        const version = ++this.vehiclesRequestVersion
        this.vehiclesError = false
        this.loadBounds('realtime_journeys', boxes)
          .then(vehicles => {
            if (version === this.vehiclesRequestVersion) this.vehicles = vehicles
          })
          .catch(error => {
            if (version !== this.vehiclesRequestVersion) return
            console.log(error)
            this.vehiclesError = true
          })
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
      this.initialZoom = Number(localStorage.map_last_zoom)

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
    this.mapStyleRequest?.abort()
    this.stopsRequestVersion += 1
    this.vehiclesRequestVersion += 1
    this.mapboxObject = undefined
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
          this.stopsRequestVersion += 1
          this.stops = []
          this.stopsError = false
          this.stopsLoading = false
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
          this.vehiclesRequestVersion += 1
          this.vehicles = []
          this.vehiclesError = false
        }

        localStorage.map_showVehicles = to
      }
    },
    stopFeatures(data) {
      this.mapboxObject?.getSource(stopSource)?.setData(data)
    },
    mapStyle(style) {
      this.applyMapStyle(style)
    }
  }
}
</script>
