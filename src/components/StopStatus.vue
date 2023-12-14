<template>
  <h1 class="text-lg font-bold">
    {{ currentViewedStop?.PrimaryName }}
    <span class="text-sm text-gray-700">
      {{ currentViewedStop?.OtherNames.Indicator }} {{ currentViewedStop?.OtherNames.Landmark }}
    </span>
  </h1>
  <div class="inline-block overflow-x-scroll w-full">
    <div class="dx overflow-y-hidden w-full whitespace-nowrap">
      <ServiceIcon
        class="mr-2"
        v-for="service in currentViewedStop?.Services" v-bind:key="service.PrimaryIdentifier" 
        :service="service" 
      />
    </div>
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
export default {
  props: {
    currentViewedStop: undefined
  },
  components: {
    ServiceIcon
  }
}
</script>
