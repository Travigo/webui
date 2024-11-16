<template>
  <Alert type="error" class="mt-4" v-if="error !== undefined">{{ error }}</Alert>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ datasource.Provider.Name }}
    </PageTitle>

    <Card>
      <p>
        <span class="font-bold">Website: </span>
        <a 
          class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150"
          :href="datasource.Provider.Website"
        >
          {{ datasource.Provider.Website }}
        </a>
      </p>
      <p>
        <span class="font-bold">Region: </span> {{ datasource.Region }}
      </p>
    </Card>

    <PageTitle>
      Datasets
    </PageTitle>

    <Card v-for="dataset in datasource.Datasets" v-bind:key="dataset.Identifier" class="mb-3">
      <p>
        <span class="font-bold">Identifier: </span> {{ dataset.Identifier }}
      </p>
      <p>
        <span class="font-bold">Format: </span> {{ dataset.Format }}
      </p>
      <p>
        <span class="font-bold">Source: </span> {{ dataset.Source }}
      </p>
      <div>
        <table class="table-fixed">
          <tbody>
            <template v-for="(has, object) in dataset.SupportedObjects">
              <tr v-if="has">
                <td>
                  <span class="font-bold">Provides: </span>
                </td>
                <td>{{ object }}</td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </Card>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import axios from 'axios'
import API from '@/API'

export default {
  name: 'DatasourcesProvider',
  components: {
    Card,
    PageTitle,
  },
  data () {
    return {
      datasource: null,
      loading: true,
      error: undefined,
    }
  },
  methods: {
    getDatasource() {
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