<script setup>
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import API from '@/API'
import Alert from '@/components/Alert.vue'
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'
import Pretty from '@/pretty'

const datasources = ref([])
const loadingDatasources = ref(true)
const datasourcesError = ref('')

const sourceGroups = computed(() => datasources.value
  .map(datasource => {
    const capabilities = [...new Set((datasource.Datasets || []).flatMap(dataset => Object.entries(dataset.SupportedObjects || {})
      .filter(([, supported]) => supported)
      .map(([object]) => capabilityLabel(object))))]

    return {
      identifier: datasource.Identifier,
      name: datasource.Provider?.Name || datasource.Identifier || 'Unknown provider',
      region: Pretty.countryLabel(datasource.Region),
      website: datasource.Provider?.Website,
      datasetCount: datasource.Datasets?.length || 0,
      capabilities
    }
  })
  .sort((first, second) => first.region.localeCompare(second.region) || first.name.localeCompare(second.name)))

function capabilityLabel(object) {
  const labels = {
    Operators: 'Operators',
    OperatorGroups: 'Operator Groups',
    Stops: 'Stops',
    StopGroups: 'Stop Groups',
    StopsDetailed: 'Detailed Stops',
    Services: 'Services',
    Journeys: 'Journeys',
    JourneyTracks: 'Journey Tracks',
    RealtimeJourneys: 'Realtime Journeys',
    ServiceAlerts: 'Service Alerts'
  }

  return labels[object] || object
}

async function loadDatasources() {
  loadingDatasources.value = true
  datasourcesError.value = ''

  try {
    const response = await axios.get(`${API.URL}/core/datasources/`, { params: { view: 'web' } })
    datasources.value = Array.isArray(response.data) ? response.data : []
  } catch (error) {
    console.log(error)
    datasources.value = []
    datasourcesError.value = 'Datasource details could not be loaded.'
  } finally {
    loadingDatasources.value = false
  }
}

onMounted(loadDatasources)
</script>

<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      title="About Travigo"
      subtitle="A clearer view of scheduled and live public transport."
      icon="info"
    />

    <Panel title="What Travigo does" icon="route" padded>
      <div class="max-w-3xl space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
        <p>
          Travigo brings together open public transport datasets so you can find stops, check departure boards, follow journeys and understand the facilities available along the way.
        </p>
        <p>
          Coverage and realtime detail vary by region and operator. Each stop, journey and service page shows its datasource attribution so you can see where the information came from.
        </p>
      </div>

      <div class="mt-5 flex flex-wrap gap-2">
        <router-link :to="{ name: 'datasources/home' }" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-lg shadow-brand-blue/20">
          Explore data coverage
          <span class="material-symbols-outlined text-[19px]">chevron_right</span>
        </router-link>
        <router-link :to="{ name: 'contact' }" class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          Send feedback
        </router-link>
      </div>
    </Panel>

    <Panel
      title="Where the data comes from"
      subtitle="Current providers and coverage from Travigo's datasource registry."
      icon="database"
      padded
    >
      <div v-if="loadingDatasources" class="grid gap-3 sm:grid-cols-2">
        <div v-for="index in 4" :key="index" class="h-36 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800"></div>
      </div>

      <div v-else-if="datasourcesError" class="space-y-3">
        <Alert type="error">{{ datasourcesError }}</Alert>
        <button type="button" class="inline-flex min-h-11 items-center rounded-xl bg-brand-blue px-4 text-sm font-bold text-white" @click="loadDatasources">
          Try again
        </button>
      </div>

      <div v-else-if="sourceGroups.length > 0" class="grid gap-3 sm:grid-cols-2">
        <article v-for="source in sourceGroups" :key="source.identifier" class="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
              <span class="material-symbols-outlined text-[22px]">database</span>
            </span>
            <div class="min-w-0">
              <h3 class="font-bold text-slate-950 dark:text-slate-100">{{ source.name }}</h3>
              <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {{ source.region }} · {{ source.datasetCount }} dataset{{ source.datasetCount === 1 ? '' : 's' }}
              </p>
            </div>
          </div>

          <div v-if="source.capabilities.length > 0" class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="capability in source.capabilities"
              :key="capability"
              class="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-bold text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light"
            >
              {{ capability }}
            </span>
          </div>

          <div class="mt-3 flex flex-wrap gap-2">
            <router-link
              :to="{ name: 'datasources/provider', params: { id: source.identifier } }"
              class="inline-flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 text-sm font-bold text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light"
            >
              View datasets
              <span class="material-symbols-outlined text-[17px]">chevron_right</span>
            </router-link>
            <a
              v-if="source.website"
              :href="source.website"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex min-h-11 items-center gap-1 rounded-xl bg-white px-3 text-sm font-bold text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light"
            >
              Provider website
              <span class="material-symbols-outlined text-[17px]">open_in_new</span>
            </a>
          </div>
        </article>
      </div>

      <p v-else class="text-sm font-medium text-slate-500 dark:text-slate-400">Datasource records are not available yet.</p>
    </Panel>
  </div>
</template>
