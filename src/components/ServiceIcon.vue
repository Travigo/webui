<template>
  <div
    class="text-sm text-center inline-block py-0 px-2 rounded bg-blue-200 min-w-[1rem] border-solid border border-gray-300 dark:border-gray-600"
    :style="serviceIconStyle"
    v-if="service.ServiceName != '' || service.BrandIcon != ''"
  >
    <div class="flex h-full items-center" :class="{ 'justify-center': short || !service.ServiceName }">
      <img
        v-if="showBrandIcon"
        :src="service.BrandIcon"
        :alt="`${service.PrimaryName || service.ServiceName || 'Service'} logo`"
        :class="{'mr-1': !short, 'h-5': !short, 'w-5': !short, 'h-7': short, 'w-7': short}"
        @error="brandIconFailed = true"
      />
      <span
        v-else-if="service.BrandIcon"
        class="material-symbols-outlined"
        :class="{'mr-1 text-[20px]': !short, 'text-[27px]': short}"
      >
        {{ transportIcon }}
      </span>
      <span
        class="w-full"
        v-if="(service.ServiceName != '' && !short) || (service.BrandIcon == '' && short)"
        :style="serviceTextStyle"
      >
        {{ service.ServiceName }}
      </span>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      brandIconFailed: false
    }
  },
  props: {
    service: {},
    short: {
      default: false
    }
  },
  computed: {
    showBrandIcon() {
      return Boolean(this.service.BrandIcon) && !this.brandIconFailed
    },
    transportIcon() {
      return {
        Rail: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Taxi: 'local_taxi',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Airport: 'flight',
        Air: 'flight',
        CableCar: 'gondola_lift',
        Funicular: 'funicular',
        TaxiBus: 'directions_bus'
      }[this.service.TransportType] || 'route'
    },
    serviceIconStyle() {
      const styles = {
        color: this.defaultTextColour
      }

      if (this.service.BrandColour) {
        styles.background = this.service.BrandColour
      }

      return styles
    },
    serviceTextStyle() {
      if (!this.service.SecondaryBrandColour) {
        return {}
      }

      return {
        color: this.service.SecondaryBrandColour
      }
    },
    defaultTextColour() {
      return this.darkText ? '#1f2937' : '#ffffff'
    },
    darkText() {
      const color = this.normalisedBrandColour

      if (color === '') {
        return true
      }

      const r = parseInt(color.substring(0, 2), 16)
      const g = parseInt(color.substring(2, 4), 16)
      const b = parseInt(color.substring(4, 6), 16)

      if ([r, g, b].some(value => Number.isNaN(value))) {
        return true
      }

      return ((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186
    },
    normalisedBrandColour() {
      const brandColour = this.service.BrandColour || 'bfdbfe'
      const color = brandColour.charAt(0) === '#' ? brandColour.substring(1) : brandColour

      if (color.length === 3) {
        return color
          .split('')
          .map(character => character + character)
          .join('')
      }

      return color.substring(0, 6)
    }
  },
  watch: {
    'service.BrandIcon'() {
      this.brandIconFailed = false
    }
  }
}
</script>
