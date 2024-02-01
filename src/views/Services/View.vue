<template>
  <div>
    <PageTitle>
       <ServiceIcon v-if="service !== undefined" :service="service" /> Service View
    </PageTitle>
    <Card>
      {{ service }}
    </Card>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import Alert from "@/components/Alert.vue"
import ServiceIcon from "@/components/ServiceIcon.vue"
import axios from "axios";
import API from "@/API";

export default {
  name: 'ServicesView',
  components: {
    Card,
    PageTitle,
    Alert,
    ServiceIcon
  },
  data(){
    return {
      service: undefined,
      loadingService: true,
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