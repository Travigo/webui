<template>
  <div
    class="text-base text-center font-semibold inline-block py-1 px-2 uppercase rounded text-white bg-blue-200 h-8 min-w-[1rem]"
    :style="[service.BrandColour ? {'background': service.BrandColour} : {}]"
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
