<template>
  <section
    class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
      <DeparturesList v-else :stop="stop" :departures="departures || []" variant="compact"/>
    </div>

    <div v-else-if="activeTab === 'arrivals'" class="px-4 py-6 text-sm leading-relaxed text-slate-600">
      Arrivals are not available yet.
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
    }
  },
  emits: ['update:modelValue', 'tab-change'],
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
