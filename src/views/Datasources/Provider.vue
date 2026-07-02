<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>

  <LoadingState
    v-if="loading"
    title="Loading datasource"
    subtitle="Fetching provider details and datasets."
  />

  <div v-else-if="datasource" class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-200">
            <span class="material-symbols-outlined text-[23px]">database</span>
          </span>
          <div class="min-w-0">
            <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Datasource</p>
            <h1 class="mt-1 text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-3xl">
              {{ providerName }}
            </h1>
            <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              {{ datasource.Region || 'Region unavailable' }} · {{ datasetCount }} {{ datasetCount === 1 ? 'dataset' : 'datasets' }}
            </p>
          </div>
        </div>

        <a
          v-if="datasource.Provider?.Website"
          :href="datasource.Provider.Website"
          target="_blank"
          rel="noreferrer"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
          aria-label="Open provider website"
        >
          <span class="material-symbols-outlined text-[22px]">open_in_new</span>
        </a>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="grid divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div class="px-4 py-3 sm:px-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Region</p>
          <p class="mt-1 text-sm font-extrabold text-slate-950 dark:text-slate-100">
            {{ datasource.Region || 'Unknown' }}
          </p>
        </div>
        <div class="px-4 py-3 sm:px-5">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Website</p>
          <a
            v-if="datasource.Provider?.Website"
            class="mt-1 block truncate text-sm font-extrabold text-blue-600 transition hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
            :href="datasource.Provider.Website"
            target="_blank"
            rel="noreferrer"
          >
            {{ datasource.Provider.Website }}
          </a>
          <p v-else class="mt-1 text-sm font-extrabold text-slate-950 dark:text-slate-100">Not listed</p>
        </div>
      </div>
      <div class="border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Available data</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <span
            v-for="object in allSupportedObjects"
            v-bind:key="object"
            class="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
          >
            {{ object }}
          </span>
          <span
            v-if="allSupportedObjects.length === 0"
            class="text-sm font-medium text-slate-500 dark:text-slate-400"
          >
            No supported object types listed.
          </span>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Datasets</h2>
        <span class="text-xs font-bold text-slate-500 dark:text-slate-400">
          {{ datasetCount }}
        </span>
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
          <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100">
            {{ dataset.Identifier || 'Unnamed dataset' }}
          </h3>
          <p class="mt-1 truncate text-xs font-medium text-slate-500 dark:text-slate-400">
            {{ dataset.Source || 'Source unavailable' }}
          </p>
        </div>

        <span class="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {{ dataset.Format || 'Unknown format' }}
        </span>

        <div v-if="supportedObjects(dataset).length > 0" class="flex flex-wrap gap-1.5 sm:col-span-2">
          <span
            v-for="object in supportedObjects(dataset)"
            v-bind:key="object"
            class="inline-flex items-center rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800/70 dark:text-slate-300"
          >
            {{ object }}
          </span>
        </div>
      </article>
    </section>
  </div>
</template>

<script>
import Alert from '@/components/Alert.vue'
import LoadingState from '@/components/LoadingState.vue'
import axios from 'axios'
import API from '@/API'

export default {
  name: 'DatasourcesProvider',
  components: {
    Alert,
    LoadingState
  },
  data () {
    return {
      datasource: null,
      loading: true,
      error: undefined,
    }
  },
  computed: {
    providerName() {
      return this.datasource?.Provider?.Name || 'Datasource provider'
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
    getDatasource() {
      this.loading = true

      axios
        .get(`${API.URL}/core/datasources/provider/${this.$route.params.id}`)
        .then(response => {
          this.datasource = response.data
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getDatasource()
  },
}
</script>
