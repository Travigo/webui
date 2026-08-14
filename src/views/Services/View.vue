<template>
  <LoadingState
    v-if="loadingService"
    title="Loading service"
    subtitle="Fetching route and operator details."
    :show-tabs="false"
  />

  <div v-else-if="error && !service" class="ui-page ui-page-stack">
    <ErrorState
      :icon="serviceNotFound ? 'route' : 'error_outline'"
      :title="serviceNotFound ? 'Service not found' : 'Service unavailable'"
      :message="serviceNotFound ? 'This service does not exist, or is no longer available.' : 'Service details could not be loaded.'"
      retry
      :action-to="{ name: 'home' }"
      action-label="Search for another service"
      @retry="getService"
    />
  </div>

  <div v-else-if="service" class="ui-page ui-page-stack">
    <PageHeader :title="serviceTitle" :subtitle="serviceDescription">
      <template #meta>
        <div class="mb-2 flex flex-wrap items-center gap-2">
          <ServiceIcon
            class="h-9 rounded-lg px-3 text-base font-bold shadow-sm"
            style="line-height: 36px"
            :service="service"
            :short="false"
          />
          <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
            <span class="material-symbols-outlined text-[17px]">{{ transportIcon }}</span>
            {{ serviceKindLabel }}
          </span>
        </div>
      </template>
    </PageHeader>

    <section class="ui-panel">
      <div class="ui-panel-header ui-panel-header--stacked">
        <h2 class="ui-section-title">At a glance</h2>
        <p class="ui-body mt-1">The useful details for identifying this service.</p>
      </div>

      <dl class="grid divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div class="p-4 sm:p-5">
          <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span class="material-symbols-outlined text-[18px]">business</span>
            Operator
          </dt>
          <dd class="mt-2">
            <router-link v-if="operatorRoute" :to="operatorRoute" class="inline-flex min-h-11 items-center gap-1 text-base font-bold text-brand-blue hover:text-brand-blue-dark dark:text-brand-blue-light">
              {{ operatorName }}
              <span class="material-symbols-outlined text-[19px]">chevron_right</span>
            </router-link>
            <span v-else class="text-base font-bold text-slate-950 dark:text-slate-100">{{ operatorName }}</span>
          </dd>
        </div>

        <div class="p-4 sm:p-5">
          <dt class="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <span class="material-symbols-outlined text-[18px]">{{ transportIcon }}</span>
            Mode
          </dt>
          <dd class="mt-2 text-base font-bold text-slate-950 dark:text-slate-100">{{ serviceKindLabel }}</dd>
        </div>

        <div v-if="publicName" class="border-t border-slate-100 p-4 dark:border-slate-800 sm:col-span-2 sm:p-5">
          <dt class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Route name</dt>
          <dd class="mt-2 text-base font-bold text-slate-950 dark:text-slate-100">{{ publicName }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="hasBranding" class="ui-panel">
      <div class="ui-panel-header ui-panel-header--stacked">
        <h2 class="ui-section-title">How to recognise it</h2>
        <p class="ui-body mt-1">Colours and route badge used across Travigo.</p>
      </div>
      <div class="flex items-center gap-4 p-4 sm:p-5">
        <ServiceIcon class="h-14 min-w-16 rounded-xl px-3 text-xl font-bold shadow-sm" style="line-height: 56px" :service="service" :short="false" />
        <div class="min-w-0 flex-1">
          <p class="font-bold text-slate-950 dark:text-slate-100">{{ serviceTitle }}</p>
          <div class="mt-2 flex gap-2">
            <span v-if="service.BrandColour" class="h-5 w-12 rounded-full border border-black/10" :style="{ backgroundColor: service.BrandColour }" title="Primary service colour"></span>
            <span v-if="service.SecondaryBrandColour" class="h-5 w-12 rounded-full border border-black/10" :style="{ backgroundColor: service.SecondaryBrandColour }" title="Secondary service colour"></span>
          </div>
        </div>
      </div>
    </section>

    <details class="ui-panel">
      <summary class="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 sm:px-5">
        Technical details
        <span class="material-symbols-outlined text-[20px] text-slate-400">expand_more</span>
      </summary>
      <dl class="grid gap-3 border-t border-slate-100 p-4 text-sm dark:border-slate-800 sm:grid-cols-2 sm:p-5">
        <div>
          <dt class="font-semibold text-slate-500 dark:text-slate-400">Service identifier</dt>
          <dd class="mt-1 break-all font-bold text-slate-950 dark:text-slate-100">{{ service.PrimaryIdentifier || $route.params.id }}</dd>
        </div>
        <div v-if="service.BrandDisplayMode">
          <dt class="font-semibold text-slate-500 dark:text-slate-400">Badge display</dt>
          <dd class="mt-1 font-bold capitalize text-slate-950 dark:text-slate-100">{{ service.BrandDisplayMode }}</dd>
        </div>
      </dl>
    </details>

    <DatasourceAttributes :datasources="utils.getDatasources(service)" />
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import DatasourceAttributes from '@/components/DatasourceAttributes.vue'
import LoadingState from '@/components/LoadingState.vue'
import ErrorState from '@/components/ErrorState.vue'
import PageHeader from '@/components/PageHeader.vue'
import axios from 'axios'
import API from '@/API'
import Utils from '@/utils'

export default {
  name: 'ServicesView',
  components: {
    ServiceIcon,
    DatasourceAttributes,
    LoadingState,
    ErrorState,
    PageHeader
  },
  data() {
    return {
      utils: Utils,
      service: undefined,
      operator: undefined,
      loadingService: true,
      error: undefined,
      serviceNotFound: false
    }
  },
  computed: {
    serviceTitle() {
      return this.service?.ServiceName || this.service?.PrimaryName || 'Service'
    },
    publicName() {
      const name = this.service?.PrimaryName
      return name && name !== this.serviceTitle ? name : ''
    },
    serviceDescription() {
      return `${this.operatorName} · ${this.serviceKindLabel}`
    },
    serviceKindLabel() {
      const type = this.service?.TransportType
      return type ? `${type} service` : 'Public transport service'
    },
    operatorId() {
      return this.service?.Operator?.PrimaryIdentifier || this.service?.OperatorRef || ''
    },
    operatorName() {
      return this.service?.Operator?.PrimaryName ||
        this.operator?.PrimaryName ||
        this.service?.OperatorName ||
        'Operator details unavailable'
    },
    operatorRoute() {
      return this.operatorId ? { name: 'operators/view', params: { id: this.operatorId } } : null
    },
    transportIcon() {
      return {
        Rail: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Air: 'flight'
      }[this.service?.TransportType] || 'route'
    },
    hasBranding() {
      return Boolean(this.service?.BrandColour || this.service?.SecondaryBrandColour || this.service?.ServiceName)
    }
  },
  methods: {
    async getService() {
      this.loadingService = true
      this.error = undefined
      this.serviceNotFound = false

      try {
        const response = await axios.get(`${API.URL}/core/services/${this.$route.params.id}`, { params: { view: 'web' } })
        this.service = response.data
        await this.getOperator()
      } catch (error) {
        console.log(error)
        this.error = error
        this.serviceNotFound = error.response?.status === 404
      } finally {
        this.loadingService = false
      }
    },
    async getOperator() {
      if (!this.operatorId || this.service?.Operator?.PrimaryName) {
        return
      }

      try {
        const response = await axios.get(`${API.URL}/core/operators/${this.operatorId}`, { params: { view: 'web' } })
        this.operator = response.data
      } catch (error) {
        console.log(error)
      }
    }
  },
  mounted() {
    this.getService()
  }
}
</script>
