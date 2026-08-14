<template>
  <LoadingState
    v-if="loading"
    title="Loading operator"
    subtitle="Fetching operator details, services, and statistics."
    :show-tabs="false"
  />

  <div v-else-if="error || !operator" class="ui-page ui-page-stack">
    <ErrorState
      :title="operatorNotFound ? 'Operator not found' : 'Operator unavailable'"
      :message="operatorNotFound ? 'This operator does not exist, or is no longer available.' : 'Operator details could not be loaded.'"
      retry
      :action-to="{ name: 'operators/home' }"
      action-label="Browse operators"
      @retry="getOperator"
    />
  </div>

  <div v-else class="ui-page ui-page-stack">
    <PageHeader
      :title="operator.PrimaryName"
      :subtitle="operatorSubtitle"
      icon="business"
    >
      <template #meta>
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
            Operator
          </span>
        </div>
      </template>
    </PageHeader>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <TabBar :tabs="tabs" :model-value="currentTab" @update:model-value="changeTab" />

      <OperatorOverview :operator="operator" v-if="currentTab == 'overview'" />

      <OperatorServices :operator="operator" v-else-if="currentTab == 'services'" />

      <OperatorStats :operator="operator" v-else />
    </section>

    <DatasourceAttributes v-if="!loading" :datasources="utils.getDatasources(operator)" />
  </div>
</template>

<script>
import ErrorState from '@/components/ErrorState.vue'
import OperatorOverview from '@/components/Operators/Overview.vue'
import OperatorServices from '@/components/Operators/Services.vue'
import OperatorStats from '@/components/Operators/Stats.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'
import TabBar from '@/components/TabBar.vue'
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
      operatorNotFound: false,

      defaultTab: 'overview',
      currentTab: null,
      tabs: [
        {
          id: "overview",
          name: "Overview",
          icon: 'info'
        },
        {
          id: "services",
          name: "Services",
          icon: 'route'
        },
        {
          id: "stats",
          name: "Statistics",
          icon: 'monitoring'
        }
      ]
    }
  },
  components: {
    OperatorOverview,
    OperatorServices,
    OperatorStats,
    ErrorState,
    DatasourceAttributes,
    LoadingState,
    PageHeader,
    TabBar
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
    changeTab(newTab) {
      this.$router.push({ name: this.$route.name, params: {id:this.$route.params.id}, query: {tab: newTab} })
    },
    getOperator() {
      this.loading = true
      this.error = undefined
      this.operatorNotFound = false
      axios
      .get(`${API.URL}/core/operators/${this.$route.params.id}`, { params: { view: 'web' } })
      .then(response => {
        this.operator = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
        this.operatorNotFound = error.response?.status === 404
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
