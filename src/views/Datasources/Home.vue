<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Supported data"
      title="Datasources"
      subtitle="Transport providers, datasets, coverage, and object types currently available in Travigo."
      icon="database"
    />

    <LoadingState
      v-if="loading"
      title="Loading supported data"
      subtitle="Fetching providers, datasets, and coverage."
    />

    <ErrorState
      v-else-if="error"
      title="Supported data unavailable"
      :message="error"
      retry
      @retry="getData"
    />

    <template v-else>
      <section class="grid gap-3 sm:grid-cols-4">
        <div
          v-for="summary in summaryCards"
          v-bind:key="summary.label"
          class="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4"
        >
          <div class="flex items-center gap-2">
            <span :class="summary.iconClass" class="material-symbols-outlined text-[22px]">{{ summary.icon }}</span>
            <span class="text-lg font-bold text-slate-950 dark:text-slate-100">{{ summary.value }}</span>
          </div>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{{ summary.label }}</p>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
          <h2 class="text-sm font-bold text-slate-950 dark:text-slate-100">Available data</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Object types currently indexed by Travigo.</p>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-800">
          <article
            v-for="item in dataTypeRows"
            v-bind:key="item.key"
            class="flex items-center gap-3 px-4 py-3 sm:px-5"
          >
            <span :class="item.iconClass" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
              <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
            </span>
            <div class="min-w-0 flex-1">
              <h3 class="truncate text-sm font-bold text-slate-950 dark:text-slate-100 sm:text-base">{{ item.label }}</h3>
              <p class="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{{ item.description }}</p>
            </div>
            <span class="shrink-0 text-sm font-bold text-slate-950 dark:text-slate-100">{{ item.count }}</span>
            <router-link
              v-if="item.route"
              :to="item.route"
              class="hidden h-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 px-3 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/10 dark:bg-slate-800 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/10 sm:inline-flex"
            >
              Browse
            </router-link>
          </article>
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
            <div class="flex items-start gap-3">
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <span class="material-symbols-outlined text-[21px]">public</span>
              </span>
              <div class="min-w-0 flex-1">
                <h2 class="text-sm font-bold text-slate-950 dark:text-slate-100">Coverage and datasources</h2>
                <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Browse datasource records grouped by region. Select one to open the provider detail view.</p>
              </div>
            </div>
          </div>

          <div v-if="datasourceRegionGroups.length > 0" class="divide-y divide-slate-100 dark:divide-slate-800">
            <section
              v-for="group in datasourceRegionGroups"
              v-bind:key="group.region"
              class="px-4 py-3 sm:px-5"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <h3 class="min-w-0 truncate text-sm font-bold text-slate-950 dark:text-slate-100">{{ group.region }}</h3>
                <span class="shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400">
                  {{ group.datasources.length }} datasource{{ group.datasources.length === 1 ? '' : 's' }}
                </span>
              </div>

              <div class="grid gap-2 md:grid-cols-2">
                <router-link
                  v-for="datasource in group.datasources"
                  v-bind:key="datasource.key"
                  :to="datasource.route"
                  class="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm transition hover:bg-brand-blue/10 dark:bg-slate-950/70 dark:hover:bg-brand-blue/100/10"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light">
                    <span class="material-symbols-outlined text-[20px]">database</span>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate font-bold text-slate-700 dark:text-slate-200">{{ datasource.providerName }}</span>
                    <span class="mt-0.5 block truncate text-xs font-medium text-slate-500 dark:text-slate-400">{{ datasource.datasetName }}</span>
                  </span>
                  <span class="material-symbols-outlined shrink-0 text-[19px] text-slate-400">chevron_right</span>
                </router-link>
              </div>
            </section>
          </div>

          <div v-else class="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
            Datasource records are not available yet.
          </div>
        </section>

        <DataBreakdown
          title="Datasets"
          subtitle="Datasets contributing records to Travigo."
          icon="dataset"
          :items="datasetItems"
          empty-message="Dataset breakdown is not available yet."
        />
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <DataBreakdown
          title="Transport types"
          subtitle="Modes found across currently indexed services and stops."
          icon="commute"
          :items="transportTypeItems"
          empty-message="Transport type breakdown is not available yet."
        />
      </section>

      <section class="rounded-xl border border-brand-blue/20 bg-brand-blue/10 p-4 shadow-sm dark:border-brand-blue/20 dark:bg-brand-blue/100/10 sm:p-5">
        <div class="flex items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light">
            <span class="material-symbols-outlined text-[23px]">info</span>
          </span>
          <div>
            <h2 class="text-base font-bold text-slate-950 dark:text-slate-100 sm:text-lg">Provider detail pages</h2>
            <p class="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              Provider pages show dataset formats and supported object types. They are linked from data attribution sections on stops, journeys, services, and operators.
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import ErrorState from '@/components/ErrorState.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

const DataBreakdown = {
  name: 'DataBreakdown',
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      default: () => []
    },
    emptyMessage: {
      type: String,
      required: true
    }
  },
  template: `
    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-start gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span class="material-symbols-outlined text-[21px]">{{ icon }}</span>
        </span>
        <div class="min-w-0">
          <h2 class="text-sm font-bold text-slate-950 dark:text-slate-100">{{ title }}</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{{ subtitle }}</p>
        </div>
      </div>

      <div v-if="items.length > 0" class="divide-y divide-slate-100 dark:divide-slate-800">
        <div
          v-for="item in items"
          v-bind:key="item.name"
          class="flex items-center justify-between gap-3 px-4 py-2.5 text-sm sm:px-5"
        >
          <span class="min-w-0 truncate font-bold text-slate-700 dark:text-slate-200">{{ item.name }}</span>
          <span class="shrink-0 font-bold text-slate-950 dark:text-slate-100">{{ item.countLabel }}</span>
        </div>
      </div>

      <div v-else class="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
        {{ emptyMessage }}
      </div>
    </section>
  `
}

export default {
  name: 'DatasourcesHome',
  components: {
    ErrorState,
    LoadingState,
    PageHeader,
    DataBreakdown
  },
  data() {
      return {
        pretty: Pretty,
        stats: undefined,
        datasources: [],
        loading: true,
        error: ''
      }
  },
  computed: {
    statsByType() {
      return {
        realtimejourneys: this.stats?.realtimejourneys?.stats || {},
        stops: this.stats?.stops?.stats || {},
        services: this.stats?.services?.stats || {},
        servicealerts: this.stats?.servicealerts?.stats || {}
      }
    },
    summaryCards() {
      return [
        {
          label: 'Providers',
          value: this.formatNumber(this.providerCount, '0'),
          icon: 'business',
          iconClass: 'text-brand-blue'
        },
        {
          label: 'Datasets',
          value: this.formatNumber(this.datasetCount, '0'),
          icon: 'dataset',
          iconClass: 'text-purple-600'
        },
        {
          label: 'Countries',
          value: this.formatNumber(this.regionCount, '0'),
          icon: 'public',
          iconClass: 'text-green-600'
        },
        {
          label: 'Transport types',
          value: this.formatNumber(this.allTransportTypeItems.length, '0'),
          icon: 'commute',
          iconClass: 'text-amber-600'
        }
      ]
    },
    dataTypeRows() {
      return [
        {
          key: 'stops',
          label: 'Stops and stations',
          description: 'Known places where passengers can board or leave services.',
          count: this.formatNumber(this.statsByType.stops.total, '--'),
          icon: 'location_on',
          iconClass: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-200',
          route: { name: 'map' }
        },
        {
          key: 'services',
          label: 'Services and routes',
          description: 'Public transport services currently indexed.',
          count: this.formatNumber(this.statsByType.services.total, '--'),
          icon: 'route',
          iconClass: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-200',
          route: { name: 'operators/home' }
        },
        {
          key: 'realtimejourneys',
          label: 'Realtime journeys',
          description: 'Live journeys currently tracked by realtime feeds.',
          count: this.formatNumber(this.statsByType.realtimejourneys.current, '--'),
          icon: 'rss_feed',
          iconClass: 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'
        },
        {
          key: 'servicealerts',
          label: 'Service alerts',
          description: 'Current and stored disruption and information alerts.',
          count: this.formatNumber(this.statsByType.servicealerts.total, '--'),
          icon: 'warning',
          iconClass: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200'
        }
      ]
    },
    datasourceItems() {
      return this.normaliseDatasourceResponse(this.datasources)
    },
    datasourceRegionGroups() {
      const regionMap = {}

      this.datasourceItems.forEach(datasource => {
        const region = this.datasourceRegion(datasource)
        const regionLabel = this.pretty.countryLabel(region)
        const providerId = this.datasourceProviderId(datasource)
        const providerName = this.datasourceProviderName(datasource)
        const datasetId = this.datasourceDatasetId(datasource)
        const datasetName = this.datasourceDatasetName(datasource)
        const key = `${regionLabel}-${providerId}-${datasetId || datasetName}`

        if (regionMap[regionLabel] === undefined) {
          regionMap[regionLabel] = []
        }

        regionMap[regionLabel].push({
          key,
          providerId,
          providerName,
          datasetName,
          route: { name: 'datasources/provider', params: { id: providerId } }
        })
      })

      return Object.entries(regionMap).map(([region, datasources]) => ({
          region,
          datasources: datasources.sort((first, second) => {
            const providerSort = first.providerName.localeCompare(second.providerName)

            return providerSort !== 0 ? providerSort : first.datasetName.localeCompare(second.datasetName)
          })
        }))
        .sort((first, second) => first.region.localeCompare(second.region))
    },
    providerCount() {
      return new Set(this.datasourceItems.map(datasource => this.datasourceProviderId(datasource) || this.datasourceProviderName(datasource)).filter(Boolean)).size ||
        this.mergedBreakdown('providers').length
    },
    datasetCount() {
      return new Set(this.datasourceItems.map(datasource => this.datasourceDatasetId(datasource)).filter(Boolean)).size ||
        this.allDatasetItems.length
    },
    regionCount() {
      return new Set(this.datasourceItems.map(datasource => this.datasourceRegion(datasource)).filter(Boolean)).size ||
        this.allCountryItems.length
    },
    allDatasetItems() {
      const datasourceDatasetItems = this.datasourceBreakdown(this.datasourceItems, datasource => this.datasourceDatasetId(datasource))

      return datasourceDatasetItems.length > 0 ? datasourceDatasetItems : this.mergedBreakdown('datasets')
    },
    datasetItems() {
      return this.allDatasetItems.slice(0, 12)
    },
    allCountryItems() {
      return this.mergedBreakdown('countries')
    },
    allTransportTypeItems() {
      return this.mergedBreakdown('transporttypes')
    },
    transportTypeItems() {
      return this.allTransportTypeItems.slice(0, 12)
    }
  },
  methods: {
    formatNumber(value, fallback) {
      if (value === undefined || value === null) {
        return fallback
      }

      return value.toLocaleString('en', { useGrouping: true })
    },
    normaliseDatasourceResponse(responseData) {
      const resultSet = [
        responseData,
        responseData?.datasources,
        responseData?.Datasources,
        responseData?.data,
        responseData?.Data,
        responseData?.data?.datasources,
        responseData?.data?.Datasources,
        responseData?.Data?.datasources,
        responseData?.Data?.Datasources,
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    datasourceProviderId(datasource) {
      return datasource.Identifier || ''
    },
    datasourceProviderName(datasource) {
      return datasource.ProviderName ||
        datasource.Provider?.Name ||
        datasource.Provider?.PrimaryName ||
        datasource.Provider?.DisplayName ||
        this.datasourceProviderId(datasource) ||
        'Unknown provider'
    },
    datasourceRegion(datasource) {
      return datasource.Region ||
        datasource.Country ||
        datasource.CountryCode ||
        datasource.Provider?.Region ||
        datasource.Provider?.Country ||
        'Unknown region'
    },
    datasourceDatasetId(datasource) {
      return datasource.DatasetID ||
        datasource.DatasetId ||
        datasource.DatasetRef ||
        datasource.DatasetIdentifier ||
        datasource.Identifier ||
        datasource.Dataset?.Identifier ||
        datasource.Dataset?.ID ||
        datasource.Source ||
        ''
    },
    datasourceDatasetName(datasource) {
      return datasource.DatasetName ||
        datasource.Dataset?.Name ||
        datasource.Dataset?.PrimaryName ||
        this.datasourceDatasetId(datasource) ||
        datasource.Source ||
        'Dataset details'
    },
    datasourceBreakdown(items, keyGetter) {
      const counts = {}

      items.forEach(item => {
        const key = keyGetter(item)

        if (!key) {
          return
        }

        counts[key] = (counts[key] || 0) + 1
      })

      return Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          countLabel: this.formatNumber(count, count)
        }))
        .sort((first, second) => second.count - first.count)
    },
    mergedBreakdown(key) {
      const merged = {}

      Object.values(this.statsByType).forEach(stat => {
        Object.entries(stat?.[key] || {}).forEach(([name, count]) => {
          merged[name] = (merged[name] || 0) + count
        })
      })

      return Object.entries(merged)
        .map(([name, count]) => ({
          name,
          count,
          countLabel: this.formatNumber(count, count)
        }))
        .sort((first, second) => second.count - first.count)
    },
    getData() {
      this.loading = true
      this.error = ''

      Promise.allSettled([
        axios.get(`${API.URL}/stats/calculated`, { params: { view: 'web' } }),
        axios.get(`${API.URL}/core/datasources/`, { params: { view: 'web' } })
      ])
        .then(([statsResult, datasourcesResult]) => {
          if (statsResult.status === 'fulfilled') {
            this.stats = statsResult.value.data
          } else {
            console.log(statsResult.reason)
          }

          if (datasourcesResult.status === 'fulfilled') {
            this.datasources = datasourcesResult.value.data
          } else {
            console.log(datasourcesResult.reason)
          }

          if (statsResult.status === 'rejected' && datasourcesResult.status === 'rejected') {
            this.error = 'Supported data could not be loaded.'
          }
        }).finally(() => {
          this.loading = false
        })
    }
  },
  mounted() {
    this.getData()
  }
}
</script>
