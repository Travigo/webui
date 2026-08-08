<template>
  <Alert v-if="error" type="error" class="mt-4">{{ error }}</Alert>

  <LoadingState v-if="loading" title="Loading datasource" subtitle="Fetching provider details and datasets." />

  <div v-else-if="datasource" class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Datasource"
      :title="providerName"
      :subtitle="`${regionLabel} · ${datasetCount} ${datasetCount === 1 ? 'dataset' : 'datasets'}`"
      icon="database"
    >
      <template #actions>
        <a
          v-if="datasource.Provider?.Website"
          :href="datasource.Provider.Website"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm transition hover:bg-brand-blue/10 hover:text-brand-blue dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
          aria-label="Open provider website"
        >
          <span class="material-symbols-outlined text-[22px]">open_in_new</span>
        </a>
      </template>
    </PageHeader>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="grid divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div class="px-4 py-3 sm:px-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Region</p>
          <p class="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">{{ regionLabel }}</p>
        </div>
        <div class="px-4 py-3 sm:px-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Website</p>
          <a
            v-if="datasource.Provider?.Website"
            class="mt-1 block truncate text-sm font-bold text-brand-blue transition hover:text-brand-blue dark:text-brand-blue-light dark:hover:text-brand-blue-light"
            :href="datasource.Provider.Website"
            target="_blank"
            rel="noreferrer"
          >
            {{ datasource.Provider.Website }}
          </a>
          <p v-else class="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">Not listed</p>
        </div>
      </div>
      <div class="border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Supports</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="object in allSupportedObjects"
            v-bind:key="object"
            class="inline-flex items-center rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light"
          >
            {{ capabilityLabel(object) }}
          </span>
          <span v-if="allSupportedObjects.length === 0" class="text-sm font-medium text-slate-500 dark:text-slate-400">
            No supported object types listed.
          </span>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 class="text-sm font-bold text-slate-950 dark:text-slate-100">Datasets</h2>
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ datasetCount }}</span>
      </div>

      <div v-if="datasets.length === 0" class="px-4 py-6 text-sm font-medium text-slate-500 dark:text-slate-400 sm:px-5">
        No datasets are listed for this provider.
      </div>

      <article
        v-for="(dataset, index) in datasets"
        v-bind:key="dataset.Identifier || `${dataset.Source}-${index}`"
        class="grid gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:px-5"
      >
        <div class="min-w-0">
          <h3 class="break-words text-sm font-bold text-slate-950 dark:text-slate-100">{{ dataset.Identifier || 'Unnamed dataset' }}</h3>
          <a
            v-if="isHttpUrl(dataset.Source)"
            class="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-brand-blue transition hover:text-brand-blue dark:text-brand-blue-light dark:hover:text-brand-blue-light"
            :href="dataset.Source"
            target="_blank"
            rel="noreferrer"
            :title="dataset.Source"
          >
            <span class="truncate">{{ sourceLabel(dataset.Source) }}</span>
            <span class="material-symbols-outlined shrink-0 text-[14px]">open_in_new</span>
          </a>
          <p v-else class="mt-1 break-all text-xs font-medium text-slate-500 dark:text-slate-400">{{ dataset.Source || 'Source unavailable' }}</p>
        </div>
        <span class="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {{ formatLabel(dataset.Format) }}
        </span>

        <div class="flex flex-wrap items-center gap-x-2 gap-y-1.5 sm:col-span-2">
          <span class="text-xs font-bold text-slate-500 dark:text-slate-400">Supports</span>
          <template v-if="supportedObjects(dataset).length > 0">
            <span
              v-for="object in supportedObjects(dataset)"
              v-bind:key="object"
              class="inline-flex items-center rounded-full bg-brand-blue/10 px-2 py-1 text-xs font-bold text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light"
            >
              {{ capabilityLabel(object) }}
            </span>
          </template>
          <span v-else class="text-xs font-medium text-slate-500 dark:text-slate-400">Not listed</span>
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:col-span-2">
          <span class="font-bold text-slate-700 dark:text-slate-200">Latest report</span>
          <span v-if="isReportLoading(dataset)">Loading…</span>
          <template v-else-if="latestReport(dataset)">
            <span>{{ formatReportDate(latestReport(dataset).CreationDateTime) }}</span>
            <span v-if="formatReportRuntime(latestReport(dataset).RunTime)">{{ formatReportRuntime(latestReport(dataset).RunTime) }}</span>
            <span>{{ reportSummary(latestReport(dataset)) }}</span>
          </template>
          <span v-else>No completed import report</span>
        </div>
      </article>
    </section>
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'
import axios from 'axios'
import API from '@/API'
import Pretty from '@/pretty'

export default {
  name: 'DatasourcesProvider',
  components: {
    Alert,
    LoadingState,
    PageHeader
  },
  data () {
    return {
      pretty: Pretty,
      datasource: null,
      importReports: {},
      reportLoading: {},
      loading: true,
      error: undefined,
      datasourceRequestId: 0,
    }
  },
  computed: {
    providerName() {
      return this.datasource?.Provider?.Name || 'Datasource provider'
    },
    regionLabel() {
      return this.pretty.countryLabel(this.datasource?.Region)
    },
    datasets() {
      return this.datasource?.Datasets || []
    },
    datasetCount() {
      return this.datasets.length
    },
    allSupportedObjects() {
      return [...new Set(this.datasets.flatMap(dataset => this.supportedObjects(dataset)))].sort()
    }
  },
  methods: {
    supportedObjects(dataset) {
      return Object.entries(dataset.SupportedObjects || {})
        .filter(([, supported]) => supported)
        .map(([object]) => object)
    },
    capabilityLabel(object) {
      const labels = {
        Operators: 'Operators',
        OperatorGroups: 'Operator Groups',
        Stops: 'Stops',
        StopGroups: 'Stop Groups',
        StopsDetailed: 'Detailed Stops',
        Services: 'Services',
        Journeys: 'Journeys',
        RealtimeJourneys: 'Realtime Journeys',
        ServiceAlerts: 'Service Alerts'
      }

      return labels[object] || object
    },
    formatLabel(format) {
      if (!format) {
        return 'Unknown format'
      }

      const labels = {
        'gtfs-schedule': 'GTFS Schedule',
        'gtfs-realtime': 'GTFS Realtime',
        'gb-cif': 'CIF',
        'gb-naptan': 'NaPTAN',
        'gb-transxchange': 'TransXChange',
        'gb-travelinenoc': 'Traveline NOC',
        'gb-nationalrailtoc': 'National Rail TOC',
        'gb-networkrailcorpus': 'Network Rail CORPUS',
        'eu-siri-vm': 'SIRI VM',
        'eu-siri-sx': 'SIRI SX'
      }

      return labels[format] || format
        .split('-')
        .filter(Boolean)
        .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(' ')
    },
    isHttpUrl(value) {
      return typeof value === 'string' && /^https?:\/\//i.test(value)
    },
    sourceLabel(source) {
      try {
        const url = new URL(source)
        return `${url.host}${url.pathname === '/' ? '' : url.pathname}`
      } catch (_) {
        return source
      }
    },
    fullDatasetIdentifier(dataset) {
      const datasetIdentifier = dataset?.Identifier || ''
      const datasourceIdentifier = this.datasource?.Identifier || ''

      if (!datasetIdentifier || !datasourceIdentifier || datasetIdentifier.startsWith(`${datasourceIdentifier}-`)) {
        return datasetIdentifier
      }

      return `${datasourceIdentifier}-${datasetIdentifier}`
    },
    latestReport(dataset) {
      return this.importReports[this.fullDatasetIdentifier(dataset)]
    },
    isReportLoading(dataset) {
      return this.reportLoading[this.fullDatasetIdentifier(dataset)] === true
    },
    formatReportDate(value) {
      if (!value) {
        return 'unknown date'
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return 'unknown date'
      }

      return date.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
    },
    formatReportRuntime(value) {
      if (typeof value !== 'number' || value <= 0) {
        return ''
      }

      const seconds = value / 1000000000
      if (seconds < 1) {
        return `Completed in ${Math.max(1, Math.round(value / 1000000))} ms`
      }
      if (seconds < 60) {
        return `Completed in ${seconds.toFixed(1)} s`
      }

      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = Math.round(seconds % 60)
      return `Completed in ${minutes}m ${remainingSeconds}s`
    },
    reportSummary(report) {
      const counts = [
        ['stops', report.ImportedStops],
        ['stop groups', report.ImportedStopGroups],
        ['services', report.ImportedServices],
        ['journeys', report.ImportedJourneys],
        ['operators', report.ImportedOperators],
        ['operation groups', report.ImportedOperationGroups]
      ].filter(([, count]) => typeof count === 'number' && count > 0)

      return counts.length > 0
        ? counts.map(([label, count]) => `${count.toLocaleString()} ${label}`).join(' · ')
        : 'No records imported'
    },
    getImportReports(datasource, requestId) {
      const datasets = datasource?.Datasets || []
      const reportRequests = datasets
        .filter(dataset => dataset.Identifier)
        .map(dataset => {
          const datasetIdentifier = this.fullDatasetIdentifier(dataset)
          this.reportLoading[datasetIdentifier] = true

          return axios
            .get(`${API.URL}/core/datasources/dataset/${encodeURIComponent(datasetIdentifier)}/import_report`, { params: { view: 'web' } })
            .then(response => {
              if (requestId === this.datasourceRequestId) {
                this.importReports[datasetIdentifier] = response.data
              }
            })
            .catch(error => {
              if (requestId === this.datasourceRequestId && error.response?.status !== 404) {
                console.log(error)
              }
            })
            .finally(() => {
              if (requestId === this.datasourceRequestId) {
                this.reportLoading[datasetIdentifier] = false
              }
            })
        })

      return Promise.allSettled(reportRequests)
    },
    getDatasource() {
      this.loading = true
      const requestId = ++this.datasourceRequestId
      this.datasource = null
      this.importReports = {}
      this.reportLoading = {}
      this.error = undefined

      axios
        .get(`${API.URL}/core/datasources/provider/${this.$route.params.id}`, { params: { view: 'web' } })
        .then(response => {
          if (requestId !== this.datasourceRequestId) {
            return
          }

          this.datasource = response.data
          this.getImportReports(response.data, requestId)
        })
        .catch(error => {
          console.log(error)
          this.error = error.response?.data?.error || 'Unable to load this datasource.'
        })
        .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getDatasource()
  },
  watch: {
    '$route.params.id'() {
      this.getDatasource()
    }
  }
}
</script>
