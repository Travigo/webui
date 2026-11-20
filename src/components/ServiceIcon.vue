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
      >
        {{ service.ServiceName }}
      </span>
    </div>
  </div>
</template>

<script>
const defaultBackground = '#bfdbfe'
const darkText = '#1f2937'
const lightText = '#ffffff'

function hexColour(value) {
  const colour = String(value || '').trim().replace(/^#/, '')
  if (/^[a-f\d]{3}$/i.test(colour)) return colour.replace(/./g, channel => channel + channel)
  return /^[a-f\d]{6}$/i.test(colour) ? colour : ''
}

function luminance(hex) {
  const channels = hex.match(/../g).map(channel => {
    const srgb = parseInt(channel, 16) / 255
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}

function contrast(first, second) {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

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
      const background = hexColour(this.service.BrandColour)
      const secondary = hexColour(this.service.SecondaryBrandColour)
      if (!background && this.service.BrandColour && typeof CSS !== 'undefined' && CSS.supports('color', this.service.BrandColour)) {
        return { color: this.service.SecondaryBrandColour || darkText, background: this.service.BrandColour }
      }
      const backgroundLight = luminance(background || hexColour(defaultBackground))
      let text = contrast(backgroundLight, luminance(hexColour(darkText))) >= 4.5
        ? darkText
        : contrast(backgroundLight, 1) >= 4.5 ? lightText : '#000000'
      if (secondary && contrast(backgroundLight, luminance(secondary)) >= 4.5) text = `#${secondary}`

      return { color: text, background: background ? `#${background}` : defaultBackground }
    }
  },
  watch: {
    'service.BrandIcon'() {
      this.brandIconFailed = false
    }
  }
}
</script>
