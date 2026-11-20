<template>
  <span
    class="stop-map-marker"
    :class="{
      'stop-map-marker--selected': selected,
      'stop-map-marker--can-expand': canExpandRouteLabels,
      'stop-map-marker--route-labels-visible': showServiceLabels
    }"
    role="img"
    :aria-label="description"
    :title="description"
  >
    <span
      class="stop-map-marker__content"
      :class="{ 'stop-map-marker__content--left': labelSide === 'left' }"
      aria-hidden="true"
    >
      <span
        v-if="primaryVisual"
        class="stop-map-marker__brand"
        :class="{ 'stop-map-marker__brand--mode': !primaryVisual.brandIcon || failedBrandIcons[primaryVisual.brandIcon] }"
      >
        <img
          v-if="primaryVisual.brandIcon && !failedBrandIcons[primaryVisual.brandIcon]"
          :src="primaryVisual.brandIcon"
          alt=""
          @error="markBrandIconFailed(primaryVisual.brandIcon)"
        >
        <span v-else class="material-symbols-outlined">{{ primaryVisual.icon }}</span>
      </span>
      <span v-if="canExpandRouteLabels" class="stop-map-marker__routes">
        <span
          v-for="item in visibleServiceLabels"
          :key="item.key"
          class="stop-map-marker__route-label"
          :style="serviceLabelStyle(item.service)"
        >{{ item.label }}</span>
        <span
          v-if="hiddenServiceCount > 0"
          class="stop-map-marker__route-label stop-map-marker__route-label--more"
        >+{{ hiddenServiceCount }}</span>
      </span>
    </span>
    <span v-if="serviceCount > 1" class="stop-map-marker__count" aria-hidden="true">
      {{ serviceCount > 9 ? '9+' : serviceCount }}
    </span>
  </span>
</template>

<script>
const transportModes = {
  Rail: { icon: 'train', label: 'rail' },
  Train: { icon: 'train', label: 'rail' },
  Bus: { icon: 'directions_bus', label: 'bus' },
  Coach: { icon: 'airport_shuttle', label: 'coach' },
  Tram: { icon: 'tram', label: 'tram' },
  Metro: { icon: 'subway', label: 'metro' },
  Taxi: { icon: 'local_taxi', label: 'taxi' },
  TaxiBus: { icon: 'directions_bus', label: 'bus' },
  Ferry: { icon: 'directions_boat', label: 'ferry' },
  Airport: { icon: 'flight', label: 'airport' },
  Air: { icon: 'flight', label: 'airport' },
  CableCar: { icon: 'gondola_lift', label: 'cable car' },
  Funicular: { icon: 'funicular', label: 'funicular' }
}

const modePriority = {
  rail: 0,
  metro: 1,
  tram: 2,
  bus: 3,
  coach: 4,
  ferry: 5,
  airport: 6,
  taxi: 7,
  'cable car': 8,
  funicular: 9
}

export default {
  name: 'StopMapMarker',
  props: {
    stop: { type: Object, required: true },
    selected: { type: Boolean, default: false },
    compact: { type: Boolean, default: false },
    showRouteLabels: { type: Boolean, default: false },
    labelSide: { type: String, default: 'right' }
  },
  data() {
    return {
      failedBrandIcons: {}
    }
  },
  computed: {
    services() {
      return Array.isArray(this.stop?.Services) ? this.stop.Services : []
    },
    uniqueServices() {
      const unique = new Map()
      this.services.forEach((service, index) => {
        const key = service?.PrimaryIdentifier || `${service?.TransportType || 'unknown'}:${service?.ServiceName || service?.PrimaryName || index}`
        if (!unique.has(key)) unique.set(key, service)
      })
      return [...unique.values()]
    },
    serviceCount() {
      return this.uniqueServices.length
    },
    allServiceLabels() {
      return this.uniqueServices.map((service, index) => {
        const label = String(service?.ServiceName || service?.PrimaryName || '').trim()
        return label && label.length <= 6
          ? { key: service?.PrimaryIdentifier || `${label}-${index}`, label, service }
          : null
      }).filter(Boolean)
    },
    canExpandRouteLabels() {
      return !this.compact && this.serviceCount > 1 && this.allServiceLabels.length > 0
    },
    showServiceLabels() {
      return this.canExpandRouteLabels && this.showRouteLabels
    },
    visibleServiceLabels() {
      return this.canExpandRouteLabels ? this.allServiceLabels.slice(0, 2) : []
    },
    hiddenServiceCount() {
      return Math.max(0, this.serviceCount - this.visibleServiceLabels.length)
    },
    serviceVisuals() {
      const visuals = new Map()

      this.uniqueServices.forEach(service => {
        const mode = transportModes[service?.TransportType]
        const brandIcon = service?.BrandIcon || ''
        const visualKey = brandIcon ? `brand:${brandIcon}` : `mode:${mode?.label || 'stop'}`
        if (!visuals.has(visualKey)) {
          visuals.set(visualKey, {
            key: visualKey,
            brandIcon,
            icon: mode?.icon || 'pin_drop',
            label: mode?.label || 'stop',
            priority: modePriority[mode?.label] ?? 10
          })
        }
      })

      if (visuals.size === 0 && transportModes[this.stop?.TransportType]) {
        const mode = transportModes[this.stop.TransportType]
        visuals.set(`mode:${mode.label}`, {
          key: `mode:${mode.label}`,
          brandIcon: '',
          icon: mode.icon,
          label: mode.label,
          priority: modePriority[mode.label] ?? 10
        })
      }

      if (visuals.size === 0) {
        visuals.set('mode:stop', {
          key: 'mode:stop',
          brandIcon: '',
          icon: 'pin_drop',
          label: 'stop',
          priority: 10
        })
      }

      return [...visuals.values()].sort((a, b) => a.priority - b.priority)
    },
    primaryVisual() {
      return this.serviceVisuals[0]
    },
    description() {
      const modes = [...new Set(this.serviceVisuals.map(visual => visual.label))]
      const services = [...new Set(this.uniqueServices.map(service => service?.ServiceName || service?.PrimaryName).filter(Boolean))]
      const serviceText = `${this.serviceCount} service${this.serviceCount === 1 ? '' : 's'}`
      const serviceNames = services.length
        ? `including ${services.slice(0, 4).join(', ')}${services.length > 4 ? `, and ${services.length - 4} more` : ''}`
        : ''
      return [this.stop?.PrimaryName, serviceText, serviceNames, modes.length ? modes.join(' and ') : 'stop'].filter(Boolean).join(', ')
    }
  },
  methods: {
    serviceLabelStyle(service) {
      const rawBrandColour = String(service?.BrandColour || '').trim()
      const normalisedBrandColour = rawBrandColour.replace(/^#/, '')
      const expandedBrandColour = normalisedBrandColour.length === 3
        ? normalisedBrandColour.split('').map(character => character + character).join('')
        : normalisedBrandColour
      let defaultTextColour = 'var(--ui-page)'

      if (/^[0-9a-f]{6}$/i.test(expandedBrandColour)) {
        const red = parseInt(expandedBrandColour.slice(0, 2), 16)
        const green = parseInt(expandedBrandColour.slice(2, 4), 16)
        const blue = parseInt(expandedBrandColour.slice(4, 6), 16)
        defaultTextColour = ((red * 0.299) + (green * 0.587) + (blue * 0.114)) > 186
          ? '#1f2937'
          : '#ffffff'
      }

      return {
        backgroundColor: rawBrandColour
          ? (rawBrandColour.startsWith('#') || rawBrandColour.startsWith('rgb') ? rawBrandColour : `#${rawBrandColour}`)
          : 'var(--brand-blue)',
        color: service?.SecondaryBrandColour || defaultTextColour
      }
    },
    markBrandIconFailed(icon) {
      this.failedBrandIcons[icon] = true
    }
  }
}
</script>

<style scoped>
.stop-map-marker {
  position: relative;
  display: inline-flex;
  width: 2.25rem;
  min-width: 2.25rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--ui-panel);
  border-radius: 0.75rem;
  background: var(--ui-panel);
  color: var(--ui-text);
  box-shadow: 0 2px 8px rgb(23 25 35 / 0.35);
  padding: 0;
  transition: transform 140ms ease, background-color 140ms ease, color 140ms ease;
}

.stop-map-marker__content {
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
}

.stop-map-marker__routes {
  position: absolute;
  top: 50%;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  transform: translateY(-50%);
  white-space: nowrap;
}

.stop-map-marker--can-expand .stop-map-marker__routes {
  visibility: hidden;
  opacity: 0;
  transform: translateY(-50%) scale(0.96);
  transition: opacity 120ms ease, transform 120ms ease, visibility 120ms;
}

.stop-map-marker--route-labels-visible .stop-map-marker__routes {
  visibility: visible;
  opacity: 1;
  transform: translateY(-50%) scale(1);
}

.stop-map-marker--route-labels-visible .stop-map-marker__count {
  visibility: hidden;
  opacity: 0;
}

.stop-map-marker__content--left .stop-map-marker__routes {
  right: calc(100% + 0.35rem);
}

.stop-map-marker__content:not(.stop-map-marker__content--left) .stop-map-marker__routes {
  left: calc(100% + 0.35rem);
}

.stop-map-marker__route-label {
  display: inline-flex;
  min-width: 1.15rem;
  height: 1.3rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  padding-inline: 0.3rem;
  font-family: Inter, sans-serif;
  font-size: 0.68rem;
  font-weight: 850;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgb(23 25 35 / 0.25);
}

.stop-map-marker__route-label--more {
  background: var(--ui-subtle);
  color: var(--ui-text);
}

.stop-map-marker--selected .stop-map-marker__route-label {
  border: 1px solid var(--ui-panel);
}

.stop-map-marker__brand {
  position: relative;
  z-index: 3;
  display: inline-flex;
  width: 1.25rem;
  height: 1.25rem;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 0.35rem;
}

.stop-map-marker__brand img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.stop-map-marker__brand--mode {
  background: var(--brand-blue);
  color: var(--ui-page);
}

.stop-map-marker__brand--mode .material-symbols-outlined {
  font-size: 0.95rem;
  line-height: 1;
}

.stop-map-marker__count {
  position: absolute;
  top: -0.45rem;
  right: -0.55rem;
  display: inline-flex;
  min-width: 1.1rem;
  height: 1.1rem;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--ui-panel);
  border-radius: 999px;
  background: var(--brand-blue);
  color: var(--ui-page);
  font-family: Inter, sans-serif;
  font-size: 0.58rem;
  font-weight: 800;
  line-height: 1;
  padding-inline: 0.12rem;
  transition: opacity 120ms ease, visibility 120ms;
}

@media (hover: hover) and (pointer: fine) {
  .stop-map-marker--can-expand:hover .stop-map-marker__routes {
    visibility: visible;
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }

  .stop-map-marker--can-expand:hover .stop-map-marker__count {
    visibility: hidden;
    opacity: 0;
  }
}

.stop-map-marker--selected {
  background: var(--brand-blue);
  color: var(--ui-page);
  transform: translateY(-2px) scale(1.08);
}

.stop-map-marker--selected .stop-map-marker__count {
  background: var(--brand-pink);
}
</style>
