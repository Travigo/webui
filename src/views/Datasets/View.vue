<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle class="pb-0 md:pb-0 lg:pb-0">
      {{ this.dataset.Identifier }}
    </PageTitle>

    {{ this.dataset }}
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import axios from 'axios'
import API from '@/API'

export default {
  name: 'DatasetHome',
  components: {
    Card,
    PageTitle,
  },
  data () {
    return {
      dataset: null,
      loading: true,
      error: undefined,
    }
  },
  methods: {
    getdataset() {
      axios
      .get(`${API.URL}/core/dataset/${this.$route.params.id}`)
      .then(response => {
        this.dataset = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getdataset()
  },
}
</script>