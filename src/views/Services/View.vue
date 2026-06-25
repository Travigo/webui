<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>

  <div v-if="loadingService" class="px-1 py-6 text-sm font-semibold text-slate-500">
    Loading service...
  </div>

  <div v-else class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="mb-2 flex flex-wrap items-center gap-2">
            <ServiceIcon
              v-if="service !== undefined"
              class="h-8 rounded-md px-2 text-sm font-bold shadow-sm"
              style="line-height: 32px"
              :service="service"
            />
            <span class="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-bold text-slate-600">
              <span class="material-symbols-outlined text-[17px]">{{ transportIcon }}</span>
              {{ service.TransportType || 'Service' }}
            </span>
          </div>

          <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            {{ serviceTitle }}
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500">
            {{ serviceDescription }}
          </p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 class="text-sm font-extrabold text-slate-950">Service information</h2>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Operator</p>
          <router-link
            v-if="operatorRoute"
            :to="operatorRoute"
            class="mt-1 inline-flex items-center gap-1 text-base font-extrabold text-blue-600 transition hover:text-blue-700"
          >
            {{ operatorName }}
            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
          </router-link>
          <p v-else class="mt-1 text-base font-extrabold text-slate-950">
            {{ operatorName }}
          </p>
        </div>

        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Transport type</p>
          <p class="mt-1 flex items-center gap-2 text-base font-extrabold text-slate-950">
            <span class="material-symbols-outlined text-[20px] text-slate-500">{{ transportIcon }}</span>
            {{ service.TransportType || 'Unknown' }}
          </p>
        </div>

        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Service name</p>
          <p class="mt-1 text-base font-extrabold text-slate-950">{{ service.ServiceName || service.PrimaryName || 'Unnamed service' }}</p>
        </div>

        <div class="rounded-2xl bg-slate-50 p-3">
          <p class="text-xs font-semibold text-slate-500">Identifier</p>
          <p class="mt-1 break-all text-sm font-bold text-slate-950">{{ service.PrimaryIdentifier || this.$route.params.id }}</p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" v-if="brandDetails.length > 0">
      <div class="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 class="text-sm font-extrabold text-slate-950">Branding</h2>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <div
          v-for="detail in brandDetails"
          v-bind:key="detail.label"
          class="rounded-2xl bg-slate-50 p-3"
        >
          <p class="text-xs font-semibold text-slate-500">{{ detail.label }}</p>
          <div class="mt-2 flex items-center gap-2">
            <span
              v-if="detail.colour"
              class="h-6 w-6 rounded-full border border-slate-200"
              :style="{ background: detail.value }"
            ></span>
            <span class="break-all text-sm font-bold text-slate-950">{{ detail.value }}</span>
          </div>
        </div>
      </div>
    </section>

    <DatasourceAttributes :datasources="utils.getDatasources(service)" />
  </div>
</template>

<script>
import Alert from "@/components/Alert.vue"
import ServiceIcon from "@/components/ServiceIcon.vue"
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import axios from "axios"
import API from "@/API"
import Utils from "@/utils"

export default {
  name: 'ServicesView',
  components: {
    Alert,
    ServiceIcon,
    DatasourceAttributes
  },
  data(){
    return {
      utils: Utils,
      service: undefined,
      loadingService: true,
      error: undefined,
    }
  },
  computed: {
    serviceTitle() {
      return this.service?.PrimaryName || this.service?.ServiceName || 'Service'
    },
    serviceDescription() {
      if (this.operatorName !== 'Unknown operator') {
        return `${this.operatorName} ${this.service?.TransportType || 'service'}`
      }

      return `${this.service?.TransportType || 'Public transport'} service`
    },
    operatorName() {
      return this.service?.Operator?.PrimaryName ||
        this.service?.OperatorName ||
        this.service?.OperatorRef ||
        'Unknown operator'
    },
    operatorRoute() {
      const operatorId = this.service?.Operator?.PrimaryIdentifier || this.service?.OperatorRef

      if (!operatorId) {
        return null
      }

      return {
        name: 'operators/view',
        params: {
          id: operatorId
        }
      }
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
    brandDetails() {
      return [
        {
          label: 'Brand colour',
          value: this.service?.BrandColour,
          colour: true
        },
        {
          label: 'Secondary colour',
          value: this.service?.SecondaryBrandColour,
          colour: true
        },
        {
          label: 'Brand display',
          value: this.service?.BrandDisplayMode
        }
      ].filter(detail => detail.value)
    }
  },
  methods: {
    getService() {
      axios
        .get(`${API.URL}/core/services/${this.$route.params.id}`)
        .then(response => {
          this.service = response.data
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
        .finally(() => this.loadingService = false)
    },
  },
  mounted () {
    this.getService()
  }
}
</script>
