<template>
  <span v-if="this.stop.Services.length == 0 && this.departures.length == 0" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 ml-1">
    No services run at this stop
  </span>
  <span v-else-if="this.departures.length == 0" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
    No upcoming departures at this stop
  </span>
  <div class="mb-4 last:mb-0 " v-for="(departure, index) in this.departures" v-bind:key="departure.PrimaryIdentifier">
    <div class="block text-center text-xs mb-4 text-gray-400" v-if="this.departureDayChange(index)">
      {{ this.pretty.day(departure.Time) }}
    </div>
    <div class="flex">
      <router-link
          :to="{'name': 'services/view', params: {'id': departure.Journey.Service.PrimaryIdentifier}}"
          v-if="departure.Journey.Service!==undefined"
      >
        <ServiceIcon
          class="text-xl inline-block py-0 px-2 mr-2 h-11 min-w-[2.5rem]"
          style="line-height: 44px"
          :service="departure.Journey.Service"
          :short="departure.Journey.Service.BrandDisplayMode=='short'"
        />
      </router-link>
      <div class="flex-auto my-auto">
        <div>
          {{ departure.DestinationDisplay }}
        </div>
        <div class="text-xs">
          <router-link :to="{'name': 'operators/view', params: {'id': departure.Journey.Operator.PrimaryIdentifier}}" v-if="departure.Journey.Operator !== undefined">
            {{ departure.Journey.Operator.PrimaryName }}
          </router-link>
        </div>
      </div>
      <div class="my-auto text-right flex-shrink-0">
        <router-link 
          :to="{'name': 'journeys/view', params: {'id': departure.Journey.PrimaryIdentifier}, query: {'date': journeyRunDate(departure)}}" 
          v-if="departure.Journey.PrimaryIdentifier !=''"
        >
          <DepartureTimeView :departure="departure" />
        </router-link>
        <DepartureTimeView :departure="departure" v-else />
      </div>
    </div>
  </div>
</template>


<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import DepartureTimeView from '@/components/Stops/DepartureTimeView.vue'
import Pretty from '@/pretty'

export default {
  props: {
    stop: undefined,
    departures: undefined
  },
  components: {
    ServiceIcon,
    DepartureTimeView
  },
  data () {
    return {
      pretty: Pretty,
    }
  },
  methods: {
    departureDayChange(index) {
      let comparisonDateTime;
      // If we're at the start then comparison datetime is current date else its the last items
      // TODO when able to look in future handle that
      if (index == 0) {
        comparisonDateTime = new Date(Date.now())
      } else {
        comparisonDateTime = new Date(Date.parse(this.departures[index-1].Time))
      }

      let currentDateTime = new Date(Date.parse(this.departures[index].Time))

      return comparisonDateTime.getDate() != currentDateTime.getDate()
    },
    journeyRunDate(departure) {
      let date = new Date(Date.parse(departure.Time))
      return `${date.getFullYear()}-${Pretty.padToTwo(date.getMonth())}-${Pretty.padToTwo(date.getDate())}`
    }
  }
}
</script>
