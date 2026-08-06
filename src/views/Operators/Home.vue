<template>
  <div class="ui-page ui-page-stack">
    <Alert type="error" v-if="error">{{ error }}</Alert>

    <PageHeader
      title="Operators"
      subtitle="Browse public transport operators by mode and region."
      icon="business"
      variant="panel"
    />

    <Panel>
      <TabBar :tabs="tabs" :model-value="currentTab" @update:model-value="changeTab" />
    </Panel>

    <LoadingState
      v-if="loading"
      title="Loading operators"
      subtitle="Fetching operators and regions."
      :show-tabs="false"
    />

    <Panel
      v-else
      title="Operators by region"
      subtitle="Select an operator to view services, contact details, and statistics."
      padded
    >
      <Notice v-if="operatorRegionCount === 0" type="neutral" icon="">
        No operators are available yet.
      </Notice>

      <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <section
          v-for="(region, id) in operatorRegions"
          v-bind:key="id"
          class="py-4 first:pt-0 last:pb-0"
        >
          <div class="mb-2 flex items-center justify-between gap-3">
            <h3 class="min-w-0 truncate text-sm font-bold text-slate-950 dark:text-slate-100 sm:text-base">
              {{ region.Name }}
            </h3>
            <span class="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
              {{ region.Operators?.length || 0 }} operator{{ region.Operators?.length === 1 ? '' : 's' }}
            </span>
          </div>

          <div class="grid overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 md:grid-cols-2">
            <router-link
              v-for="operator in region.Operators"
              v-bind:key="operator.PrimaryIdentifier"
              :to="{'name': 'operators/view', params: {'id': operator.PrimaryIdentifier}}"
              class="flex min-w-0 items-center gap-3 border-b border-slate-100 bg-white px-3 py-2.5 text-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60 md:odd:border-r"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
                <span class="material-symbols-outlined text-[20px]">business</span>
              </span>
              <span class="min-w-0 flex-1 truncate font-bold text-slate-700 dark:text-slate-200">
                {{ operator.PrimaryName }}
              </span>
              <span class="material-symbols-outlined shrink-0 text-[19px] text-slate-400">chevron_right</span>
            </router-link>
          </div>
        </section>
      </div>
    </Panel>
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import LoadingState from '@/components/LoadingState.vue'
import Notice from '@/components/Notice.vue'
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'
import TabBar from "@/components/TabBar.vue"
import axios from 'axios'
import API from '@/API'

export default {
  name: 'OperatorHome',
  data () {
    return {
      operatorRegions: null,
      loading: true,
      error: null,

      currentTab: "bus",
      tabs: [
        {
          id: "bus",
          name: "Bus",
          icon: 'directions_bus'
        },
        {
          id: "rail",
          name: "Rail",
          icon: 'train'
        },
      ]
    }
  },
  components: {
    Alert,
    LoadingState,
    Notice,
    PageHeader,
    Panel,
    TabBar
  },
  computed: {
    operatorRegionCount() {
      if (Array.isArray(this.operatorRegions)) {
        return this.operatorRegions.length
      }

      return Object.keys(this.operatorRegions || {}).length
    }
  },
  methods: {
    changeTab(newTab) {
      this.currentTab = newTab
    },
    getOperators() {
      axios
      .get(`${API.URL}/core/operators`)
      .then(response => {
        this.operatorRegions = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperators()
  }
}
</script>
