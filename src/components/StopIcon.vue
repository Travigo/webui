<script>
export default {
  name: 'StopIcon',
  props: {
    stop: {},
    size: {
      default: 6
    }
  },
  computed: {
    width() {
      return "w-" + this.size
    },
    height() {
      return "h-" + this.size
    },
    textStyle() {
      return { 'font-size': Math.round(this.size*3.6)+ 'px', 'line-height': (Math.round(this.size*3.6)+2)+ 'px' }
    }
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
        let serviceID
        let serviceIcon
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
  <span v-for="icon in this.getUniqueServiceIcons(stop.Services)" class="text-center" :class="[width, height]">
    <span
      v-if="icon['type'] === 'TextIcon'"
      class="material-symbols-outlined bg-blue-500 rounded-lg text-white font-light"
      :class="[width, height]"
      :style="textStyle"
    >
      {{ icon['value'] }}
    </span>
    <span v-else-if="icon['type'] === 'Image'">
      <img :src="icon['value']" :alt="icon['value']" :class="[width, height]" />
    </span>
  </span>

  <span
    v-if="this.getUniqueServiceIcons(stop.Services).length === 0"
    class="material-symbols-outlined bg-gray-400 rounded-lg text-white font-light text-center"
    :class="[width, height]"
    :style="textStyle"
  >
    pin_drop
  </span>
</template>

<style scoped lang="scss">

</style>