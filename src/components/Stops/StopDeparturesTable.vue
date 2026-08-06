<template>
  <section
    class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
  >
    <TabBar
      v-if="showTabs"
      :tabs="tabs"
      :model-value="activeTab"
      @update:model-value="changeTab"
    />

    <div v-if="activeTab === 'departures'">
      <LoadingState
        v-if="loadingDepartures"
        title="Loading departures"
        subtitle="Fetching the latest departure board."
        compact
        bare
        :rows="4"
        :show-tabs="false"
      />
      <div v-else-if="departuresError && (!departures || departures.length === 0)" class="p-4">
        <div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          <p class="font-bold">Departures unavailable</p>
          <p class="mt-1">The latest departure board could not be loaded.</p>
          <button type="button" class="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-100 px-3 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="$emit('retry-departures')">
            Try again
          </button>
        </div>
      </div>
      <DeparturesList v-else :stop="stop" :departures="departures || []" :board-reference-time="boardReferenceTime" variant="compact"/>
    </div>

    <div v-else-if="activeTab === 'arrivals'">
      <LoadingState
        v-if="loadingArrivals"
        title="Loading arrivals"
        subtitle="Fetching the latest arrival board."
        compact
        bare
        :rows="4"
        :show-tabs="false"
      />
      <div v-else-if="arrivalsError && (!arrivals || arrivals.length === 0)" class="p-4">
        <div class="rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100">
          <p class="font-bold">Arrivals unavailable</p>
          <p class="mt-1">The latest arrival board could not be loaded.</p>
          <button type="button" class="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-100 px-3 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="$emit('retry-arrivals')">
            Try again
          </button>
        </div>
      </div>
      <DeparturesList v-else :stop="stop" :departures="arrivals || []" :board-reference-time="boardReferenceTime" board-type="arrivals" variant="compact" />
    </div>

    <div v-else-if="activeTab === 'map'">
      <slot name="map"></slot>
    </div>

    <div v-else>
      <slot name="details"></slot>
    </div>
  </section>
</template>

<script>
import DeparturesList from '@/components/DeparturesList.vue'
import LoadingState from '@/components/LoadingState.vue'
import TabBar from '@/components/TabBar.vue'

export default {
  name: 'StopDeparturesTable',
  components: {
    DeparturesList,
    LoadingState,
    TabBar
  },
  props: {
    stop: {},
    departures: {
      default: null
    },
    loadingDepartures: {
      type: Boolean,
      default: false
    },
    departuresError: {
      type: Boolean,
      default: false
    },
    arrivals: {
      default: null
    },
    loadingArrivals: {
      type: Boolean,
      default: false
    },
    arrivalsError: {
      type: Boolean,
      default: false
    },
    boardReferenceTime: {
      type: [String, Number, Date],
      default: () => new Date()
    },
    modelValue: {
      type: String,
      default: 'departures'
    },
    showTabs: {
      type: Boolean,
      default: true
    },
    showDetails: {
      type: Boolean,
      default: true
    },
    showMap: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'tab-change', 'retry-departures', 'retry-arrivals'],
  computed: {
    activeTab() {
      return this.showTabs ? this.modelValue : 'departures'
    },
    tabs() {
      const tabs = [
        {
          id: 'departures',
          name: 'Departures',
          icon: 'directions_bus'
        },
        {
          id: 'arrivals',
          name: 'Arrivals',
          icon: 'download'
        }
      ]

      if (this.showDetails) {
        tabs.push({
          id: 'details',
          name: 'Details',
          icon: 'info'
        })
      }

      if (this.showMap) {
        tabs.push({
          id: 'map',
          name: 'Map',
          icon: 'map'
        })
      }

      return tabs
    }
  },
  methods: {
    changeTab(tab) {
      this.$emit('update:modelValue', tab)
      this.$emit('tab-change', tab)
    }
  }
}
</script>
