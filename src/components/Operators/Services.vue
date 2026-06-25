<template>
  <div class="p-4 sm:p-5">
    <div v-if="services === null" class="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
      Loading services...
    </div>

    <div v-else-if="services.length === 0" class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
      No services are listed for this operator.
    </div>

    <div v-else class="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
      <router-link
        v-for="service in services"
        v-bind:key="service.PrimaryIdentifier"
        :to="{'name': 'services/view', params: {'id': service.PrimaryIdentifier}}"
        class="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-3 py-3 transition hover:bg-slate-50"
      >
        <ServiceIcon
          class="h-11 min-w-11 rounded-xl text-sm shadow-sm"
          style="line-height: 44px"
          :service="service"
          :short="service.BrandDisplayMode=='short'"
        />
        <div class="min-w-0">
          <h3 class="truncate text-[15px] font-extrabold leading-tight text-slate-950 sm:text-base">
            {{ service.PrimaryName || service.ServiceName || 'Unnamed service' }}
          </h3>
          <p class="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
            <span class="material-symbols-outlined text-[16px]">{{ transportIcon(service.TransportType) }}</span>
            {{ service.TransportType || 'Service' }}
          </p>
        </div>
        <span class="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
      </router-link>
    </div>
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import axios from 'axios'
import API from '@/API'

export default {
  data () {
    return {
      services: null,
    }
  },
  components: {
    ServiceIcon
  },
  props: {
    operator: {},
  },
  methods: {
    transportIcon(type) {
      return {
        Rail: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Air: 'flight'
      }[type] || 'route'
    },
    getServices() {
      axios
      .get(`${API.URL}/core/operators/${this.operator.PrimaryIdentifier}/services`)
      .then(response => {
        this.services = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
    },
  },
  mounted () {
    this.getServices()
  }
}
</script>
