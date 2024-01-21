<script>
export default {
  name: 'StopIcon',
  props: {
    stop: {},
  },
  data() {
    return {}
  },
  methods: {
    getUniqueServiceIcons(services) {
      let transportIcons = {
        "Bus": "directions_bus",
        "Coach": "directions_bus",
        "Tram": "tram",
        "Taxi": "local_taxi",
        "Rail": "train",
        "Metro": "subway",
        "Ferry": "directions_boat",
        "Airport": "flight",
        "CableCar": "cell_tower",
        "UNKNOWN": "pin_drop"
      }
      let serviceIcons = []
      let serviceIconsFound = {}

      services?.forEach(service => {
        let serviceID = ""
        let serviceIcon = {}
        if (service.BrandIcon === "") {
          serviceID = service.TransportType

          serviceIcon = {
            "type": "TextIcon",
            "value": transportIcons[service.TransportType]
          }
        } else {
          serviceID = service.BrandIcon

          serviceIcon = {
            "type": "Image",
            "value": service.BrandIcon
          }
        }

        if (serviceIconsFound[serviceID] === undefined) {
          serviceIconsFound[serviceID] = true

          serviceIcons.push(serviceIcon)
        }
      });

      return serviceIcons
    },
  }
}
</script>

<template>
  <span v-for="icon in this.getUniqueServiceIcons(stop.Services)" class="w-6 h-6 text-center">
    <span
        v-if="icon['type'] == 'TextIcon'"
        class="text-[22px] material-symbols-outlined bg-blue-500 rounded-lg text-white font-light leading-[24px]"
    >
      {{ icon['value'] }}
    </span>
    <span v-else-if="icon['type'] == 'Image'">
      <img :src="icon['value']" class="w-6 h-6" />
    </span>
  </span>

  <span
  v-if="this.getUniqueServiceIcons(stop.Services).length == 0"
  class="text-[22px] material-symbols-outlined bg-gray-400 rounded-lg text-white font-light leading-[24px] w-6 h-6 text-center"
  >
    pin_drop
  </span>
</template>

<style scoped lang="scss">

</style>