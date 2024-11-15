<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle class="pb-0 md:pb-0 lg:pb-0">
      {{ this.operator.PrimaryName }}
    </PageTitle>

    <NavTabBar
      class="mb-2"
      :tabs="tabs"
      :currentTab="currentTab"
      :changeTab="changeTab"
    />

    <OperatorOverview :operator="this.operator" v-bind:class="{ hidden: this.currentTab != 'overview' }" />

    <OperatorServices :operator="this.operator" v-bind:class="{ hidden: this.currentTab != 'services' }" />

    <OperatorStats :operator="this.operator" v-bind:class="{ hidden: this.currentTab != 'stats' }" />

    <DatasourceAttributes v-if="!this.loading" :datasources="utils.getDatasources(this.operator)" />
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import Alert from '@/components/Alert.vue'
import NavTabBar from '@/components/NavTabBar.vue'
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
    PageTitle,
    Card,
    NavTabBar,
    OperatorOverview,
    OperatorServices,
    OperatorStats,
    Alert,
    DatasourceAttributes
  },
  methods: {
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