<template>
  <div
    class="text-base text-center font-semibold inline-block py-0 px-2 uppercase rounded text-white bg-blue-200 min-h-8 min-w-[1rem]"
    :style="[service.BrandColour ? {'background': service.BrandColour} : {}]"
    v-if="service.ServiceName != ''"
  >
    {{ service.ServiceName }}
  </div>
</template>

<script>
export default {
  props: {
    service: {},
  }
}
</script>
