<template>
  <div v-if="journey?.Service?.TransportType == 'Rail'">
    <div v-if="journey.DetailedRailInformation?.ReplacementBus">
      <Alert type="info">
        This is a rail replacement bus
      </Alert>
    </div>

    <div class="text-gray-900 dark:text-gray-200 text-base">
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.AirConditioning"
      >
        ac_unit
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.WiFi"
      >
        wifi
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.PowerPlugs"
      >
        power
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.USBPlugs"
      >
        usb
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.BicycleSpaces"
      >
        pedal_bike
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.DisabledAccess"
      >
        accessible
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.Toilets"
      >
        wc
      </span>
      <span 
        class="material-symbols-outlined text-base" 
        v-if="journey.DetailedRailInformation?.CateringAvailable"
      >
        restaurant
      </span>
    </div>
  </div>

  <div v-if="this.carriages.length > 0" class="dx overflow-y-hidden w-full whitespace-nowrap">
    <div class="carriage text-center" v-for="(carriage, index) in this.carriages">
      <div
        class="carriage-icon"
        v-bind:class="{ 'carriage-icon-front': isFrontTrain(carriage, index), 'carriage-icon-rear': isRearTrain(carriage, index) }"
      >
        {{ pretty.occupancyDescription(carriage.Occupancy) }}
        <div v-for="toilet in carriage.Toilets">
          <span class="material-symbols-outlined text-base">wc</span>
          <span class="material-symbols-outlined text-base" v-if="toilet.Type=='Accessible'">accessible</span>
        </div>
      </div>
      <div class="text-gray-900 dark:text-gray-200">{{ carriage.ID }}</div>
    </div>
  </div>
</template>

<script>
import Pretty from "@/pretty"
import Alert from "@/components/Alert.vue"

export default {
  name: 'DetailedInformationRail',
  props: {
    journey: {},
  },
  computed: {
    carriages() {
      if (this.journey?.RealtimeJourney?.DetailedRailInformation?.Carriages.length > 0) {
        return this.journey?.RealtimeJourney?.DetailedRailInformation?.Carriages
      }
      
      if (this.journey?.DetailedRailInformation?.Carriages.length > 0) {
        return this.journey?.DetailedRailInformation?.Carriages
      }

      return []
    }
  },
  components: {
    Alert,
  },
  data() {
    return {
      pretty: Pretty,
    }
  },
  methods: {
    isNumericChar(c) { return /\d/.test(c); },
    isFrontTrain(carriage, index) {
      if (index===0) {
        return true
      }

      let previousCarriage = this.carriages[index-1]
      let currentCarriageFirstChar = carriage.ID[0]
      let previousCarriageFirstChar = previousCarriage.ID[0]

      if (!this.isNumericChar(currentCarriageFirstChar) && !this.isNumericChar(previousCarriageFirstChar) && 
          currentCarriageFirstChar !== previousCarriageFirstChar) {
        return true
      }
    },
    isRearTrain(carriage, index) {
      if (index===this.carriages.length-1) {
        return true
      }

      let nextCarriage = this.carriages[index+1]
      let currentCarriageFirstChar = carriage.ID[0]
      let nextCarriageFirstChar = nextCarriage.ID[0]

      if (!this.isNumericChar(currentCarriageFirstChar) && !this.isNumericChar(nextCarriageFirstChar) && 
          currentCarriageFirstChar !== nextCarriageFirstChar) {
        return true
      }
    }
  }
}
</script>

<style scoped lang="scss">
.carriage {
  width: 100px;
  display: inline-block;

  .carriage-icon {
    background: white;
    border: 1px solid gray;
    height: 50px;
  }
  .carriage-icon-front {
    border-top-left-radius: 20px;
  }
  .carriage-icon-rear {
    border-top-right-radius: 20px;
  }
}
</style>