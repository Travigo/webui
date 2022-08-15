<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.group.Name }}
    </PageTitle>
    <Card v-for="operator in this.group.Operators" v-bind:key="operator.PrimaryIdentifier" class="mb-4">
      <router-link :to="{'name': 'operators/view', params: {'id': operator.PrimaryIdentifier}}" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
        {{ operator.PrimaryName }}
      </router-link>
    </Card>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import Alert from '@/components/Alert.vue'
import axios from 'axios'
import API from '@/API'

export default {
  data () {
    return {
      group: undefined,
      loading: true,
      error: undefined,
    }
  },
  components: {
    PageTitle,
    Card,
    Alert
  },
  methods: {
    getOperatorGroup() {
      axios
      .get(`${API.URL}/core/operator_groups/${this.$route.params.id}`)
      .then(response => {
        this.group = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperatorGroup()
  }
}
</script>