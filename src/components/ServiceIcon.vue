<template>
  <div
    class="text-sm text-center inline-block py-0 px-2 rounded text-white bg-blue-200 min-h-8 min-w-[1rem]"
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
  }
}
</script>
