<script>
import Pretty from "@/pretty"

export default {
  name: 'DetailedInformationRail',
  props: {
    info: {},
  },
  computed: {

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
  <div v-if="info !== undefined" class="dx overflow-y-hidden w-full whitespace-nowrap">
    <div class="carriage text-center" v-for="(carriage, index) in info.Carriages">
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