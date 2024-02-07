<script>
export default {
  name: 'DetailedInformationRail',
  props: {
    info: {},
  },
  computed: {

  },
  data() {
    return {}
  },
  methods: {
    occupancyDescription(occupancy) {
      if (occupancy < 20) {
        return 'Empty'
      } else if (occupancy < 40) {
        return 'Space'
      } if (occupancy < 70) {
        return 'Busy'
      } if (occupancy < 90) {
        return 'Very Busy'
      } else {
        return 'Full'
      }
    },
    isNumericChar(c) { return /\d/.test(c); },
    isFrontTrain(carriage, index) {
      if (index===0) {
        return true
      }

      let previousCarriage = this.info.Carriages[index-1]
      let currentCarriageFirstChar = carriage.ID[0]
      let previousCarriageFirstChar = previousCarriage.ID[0]

      if (!this.isNumericChar(currentCarriageFirstChar) && !this.isNumericChar(previousCarriageFirstChar) && 
          currentCarriageFirstChar !== previousCarriageFirstChar) {
        return true
      }
    },
    isRearTrain(carriage, index) {
      if (index===this.info.Carriages.length-1) {
        return true
      }

      let nextCarriage = this.info.Carriages[index+1]
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

<template>
  <div v-if="info !== undefined">
    <div class="carriage text-center" v-for="(carriage, index) in info.Carriages">
      <div
        class="carriage-icon"
        v-bind:class="{ 'carriage-icon-front': isFrontTrain(carriage, index), 'carriage-icon-rear': isRearTrain(carriage, index) }"
      >
        {{ occupancyDescription(carriage.Occupancy) }}
      </div>
      <div class="text-gray-900 dark:text-gray-200">{{ carriage.ID }}</div>
    </div>
  </div>>
</template>

<style scoped lang="scss">
.carriage {
  width: 100px;
  display: inline-block;

  .carriage-icon {
    background: white;
    border: 1px solid gray;
  }
  .carriage-icon-front {
    border-top-left-radius: 20px;
  }
  .carriage-icon-rear {
    border-top-right-radius: 20px;
  }
}
</style>