<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading" class="px-1 py-6 text-sm font-semibold text-slate-500">
    Loading operator...
  </div>

  <div v-else class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <span class="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
              <span class="material-symbols-outlined text-[22px]">business</span>
            </span>
            <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">
              Operator
            </span>
          </div>
          <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {{ operator.PrimaryName }}
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500">
            {{ operatorSubtitle }}
          </p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid grid-cols-3 divide-x divide-slate-100">
        <button
          type="button"
          v-for="tab in tabs"
          v-bind:key="tab.id"
          class="relative flex h-12 items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition sm:text-sm"
          :class="{'text-blue-600': currentTab === tab.id}"
          @click="changeTab(tab.id)"
        >
          <span class="material-symbols-outlined text-[20px]">{{ tabIcon(tab.id) }}</span>
          <span>{{ tab.name }}</span>
          <span
            class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600"
            v-if="currentTab === tab.id"
          />
        </button>
      </div>

      <OperatorOverview :operator="operator" v-if="currentTab == 'overview'" />

      <OperatorServices :operator="operator" v-else-if="currentTab == 'services'" />

      <OperatorStats :operator="operator" v-else />
    </section>

    <DatasourceAttributes v-if="!loading" :datasources="utils.getDatasources(operator)" />
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import OperatorOverview from '@/components/Operators/Overview.vue'
import OperatorServices from '@/components/Operators/Services.vue'
import OperatorStats from '@/components/Operators/Stats.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import axios from 'axios'
import API from '@/API'
import Utils from '@/utils'

export default {
  name: 'OperatorsView',
  data () {
    return {
      utils: Utils,
      operator: null,
      loading: true,
      error: undefined,

      defaultTab: 'overview',
      currentTab: null,
      tabs: [
        {
          id: "overview",
          name: "Overview"
        },
        {
          id: "services",
          name: "Services"
        },
        {
          id: "stats",
          name: "Statistics"
        }
      ]
    }
  },
  components: {
    OperatorOverview,
    OperatorServices,
    OperatorStats,
    Alert,
    DatasourceAttributes
  },
  computed: {
    operatorSubtitle() {
      if (this.operator.OperatorGroup?.Name) {
        return `Part of ${this.operator.OperatorGroup.Name}`
      }

      if (this.operator.OtherNames?.length > 0) {
        return `Also known as ${this.operator.OtherNames[0]}`
      }

      return 'Public transport operator'
    }
  },
  methods: {
    tabIcon(tab) {
      return {
        overview: 'info',
        services: 'route',
        stats: 'monitoring'
      }[tab]
    },
    changeTab(newTab) {
      this.$router.push({ name: this.$route.name, params: {id:this.$route.params.id}, query: {tab: newTab} })
    },
    getOperator() {
      axios
      .get(`${API.URL}/core/operators/${this.$route.params.id}`)
      .then(response => {
        this.operator = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperator()
    
    if (this.$route.query.tab !== undefined) {
      this.currentTab = this.$route.query.tab
    } else {
      this.currentTab = this.defaultTab
    }
  },
  created() {
    this.$watch(
      () => this.$route.query,
      (toQuery, previousQuery) => {
        if (toQuery.tab == previousQuery.tab) {
          return
        }

        if (toQuery.tab !== undefined) {
          this.currentTab = toQuery.tab
        } else {
          this.currentTab = this.defaultTab
        }
      }
    )
  },
}
</script>
