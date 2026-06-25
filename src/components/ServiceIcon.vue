<template>
  <div
    class="text-sm text-center inline-block py-0 px-2 rounded bg-blue-200 min-w-[1rem] border-solid border border-gray-300 dark:border-gray-600"
    :style="serviceIconStyle"
    v-if="service.ServiceName != '' || service.BrandIcon != ''"
  >
    <div class="flex items-center h-full">
      <img 
        v-if="service.BrandIcon != ''" 
        :src="service.BrandIcon"
        :class="{'mr-1': !short, 'h-5': !short, 'w-5': !short, 'h-7': short, 'w-7': short}"
      />
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
  props: {
    service: {},
    short: {
      default: false
    }
  },
  computed: {
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
  }
}
</script>
