<template>
  <div
    class="text-sm text-center inline-block py-0 px-2 rounded bg-blue-200 min-h-8 min-w-[1rem]"
    :class="{'text-gray-800': darkText, 'text-white': !darkText}"
    :style="[service.BrandColour ? {'background': service.BrandColour} : {}]"
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
    darkText() {
      // var color = Math.round(((parseInt(rgbValue[0]) * 299) +
      //       (parseInt(rgbValue[1]) * 587) +
      //       (parseInt(rgbValue[2]) * 114)) / 1000);

      var color = (this.service.BrandColour.charAt(0) === '#') ? this.service.BrandColour.substring(1, 7) : this.service.BrandColour
      var r = parseInt(color.substring(0, 2), 16)
      var g = parseInt(color.substring(2, 4), 16)
      var b = parseInt(color.substring(4, 6), 16)
      return ((r * 0.299) + (g * 0.587) + (b * 0.114)) > 186
    }
  }
}
</script>
