<template>
  <span v-if="this.stop.Services.length == 0 && this.departures.length == 0" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 ml-1">
    No services run at this stop
  </span>
  <span v-else-if="this.departures.length == 0" class="text-xs font-semibold inline-block py-1 px-2 rounded text-amber-600 bg-amber-200 mr-1">
    No upcoming departures at this stop
  </span>
  <div v-else-if="variant === 'compact'" class="divide-y divide-slate-100">
    <div v-for="(departure, index) in this.departures" v-bind:key="departure.PrimaryIdentifier">
      <div class="px-3 pt-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400" v-if="this.departureDayChange(index)">
        {{ this.pretty.day(departure.Time) }}
      </div>

      <router-link
        class="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-3 py-3 transition hover:bg-slate-50 sm:grid-cols-[3.25rem_1fr_auto]"
        :class="{'opacity-70': isCancelled(departure)}"
        :to="{'name': 'journeys/view', params: {'id': departure.Journey.PrimaryIdentifier}, query: {'date': journeyRunDate(departure)}}"
        v-if="departure.Journey.PrimaryIdentifier !=''"
      >
        <ServiceIcon
          v-if="departure.Journey.Service!==undefined"
          class="h-12 min-w-12 rounded-xl text-base shadow-sm"
          style="line-height: 48px"
          :service="departure.Journey.Service"
          :short="departure.Journey.Service?.BrandDisplayMode=='short'"
        />
        <div
          v-else
          class="flex h-12 min-w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"
        >
          <span class="material-symbols-outlined text-[24px]">directions_bus</span>
        </div>

        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-1.5">
            <p class="truncate text-[15px] font-bold leading-tight text-slate-950 sm:text-base">
              {{ departure.DestinationDisplay }}
            </p>
            <DepartureTypeIcon :departure="departure" />
          </div>
          <div class="mt-1 flex min-w-0 items-center gap-2">
            <ServiceIcon
              v-if="departure.Journey.Service!==undefined"
              class="h-5 max-w-full rounded-md px-1.5 text-[11px] leading-5"
              style="line-height: 20px"
              :service="departure.Journey.Service"
              :short="false"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 text-right">
          <div>
            <div class="text-[15px] font-bold leading-tight text-slate-950" :class="{'line-through decoration-red-500 decoration-2': isCancelled(departure)}">
              {{ this.pretty.time(departure.Time, stop.Timezone) }}
            </div>
            <div class="mt-1 inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" v-if="isCancelled(departure)">
              Cancelled
            </div>
            <div class="mt-1 text-xs text-slate-500" v-else-if="departure.Platform">
              Platform {{ departure.Platform }} <span v-if="departure.PlatformType != 'ACTUAL'">(Est.)</span>
            </div>
          </div>
          <span class="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
        </div>
      </router-link>

      <div
        class="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-3 py-3 sm:grid-cols-[3.25rem_1fr_auto]"
        :class="{'opacity-70': isCancelled(departure)}"
        v-else
      >
        <ServiceIcon
          v-if="departure.Journey.Service!==undefined"
          class="h-12 min-w-12 rounded-xl text-base shadow-sm"
          style="line-height: 48px"
          :service="departure.Journey.Service"
          :short="departure.Journey.Service?.BrandDisplayMode=='short'"
        />
        <div
          v-else
          class="flex h-12 min-w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm"
        >
          <span class="material-symbols-outlined text-[24px]">directions_bus</span>
        </div>

        <div class="min-w-0">
          <div class="flex min-w-0 items-center gap-1.5">
            <p class="truncate text-[15px] font-bold leading-tight text-slate-950 sm:text-base">
              {{ departure.DestinationDisplay }}
            </p>
            <DepartureTypeIcon :departure="departure" />
          </div>
          <ServiceIcon
            v-if="departure.Journey.Service!==undefined"
            class="mt-1 h-5 max-w-full rounded-md px-1.5 text-[11px] leading-5"
            style="line-height: 20px"
            :service="departure.Journey.Service"
            :short="false"
          />
        </div>

        <div class="text-right">
          <div class="text-[15px] font-bold leading-tight text-slate-950" :class="{'line-through decoration-red-500 decoration-2': isCancelled(departure)}">
            {{ this.pretty.time(departure.Time, stop.Timezone) }}
          </div>
          <div class="mt-1 inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white" v-if="isCancelled(departure)">
            Cancelled
          </div>
          <div class="mt-1 text-xs text-slate-500" v-else-if="departure.Platform">
            Platform {{ departure.Platform }} <span v-if="departure.PlatformType != 'ACTUAL'">(Est.)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="mb-4 last:mb-0 " v-for="(departure, index) in this.departures" v-bind:key="departure.PrimaryIdentifier">
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
          <DepartureTimeView :departure="departure" :stop="stop" />
        </router-link>
        <DepartureTimeView :departure="departure" :stop="stop" v-else />
      </div>
    </div>
  </div>
</template>


<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import DepartureTimeView from '@/components/Stops/DepartureTimeView.vue'
import DepartureTypeIcon from '@/components/DepartureTypeIcon.vue'
import Pretty from '@/pretty'

export default {
  props: {
    stop: undefined,
    departures: undefined,
    variant: {
      type: String,
      default: 'default'
    }
  },
  components: {
    ServiceIcon,
    DepartureTimeView,
    DepartureTypeIcon
  },
  data () {
    return {
      pretty: Pretty,
    }
  },
  methods: {
    isCancelled(departure) {
      return departure.Type == 'Cancelled'
    },
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
