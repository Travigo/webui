<template>
  <Card>
    <div class="mb-4 last:mb-0 " v-for="service in this.services" v-bind:key="service.PrimaryIdentifier">
      <div class="flex">
        <router-link
          :to="{'name': 'services/view', params: {'id': service.PrimaryIdentifier}}"
        >
          <ServiceIcon 
            class="text-xl inline-block py-0 px-2 mr-2 h-11 min-w-[2.5rem]"
            style="line-height: 44px"
            :service="service"
          />
        </router-link>
      </div>
    </div>
  </Card>
</template>

<script>
import Card from '@/components/Card.vue'
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
    Card,
    ServiceIcon
  },
  props: {
    operator: {},
  },
  methods: {
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
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getServices()
  }
}
</script>
