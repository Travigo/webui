<template>
  <div class="mt-4">
    <input
      type="text" id="searchTerm"
      class="bg-white shadow-md p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder="Search Stops" required
      v-model="searchTerm"
      v-on:input="searchStops"
    >
  </div>
  <ul class="rounded-lg bg-white shadow-md p-3 border border-gray-200 dark:bg-gray-800 dark:border-gray-600" v-if="this.results?.stops?.length > 0">
    <li v-for="result in this.results.stops">
      <router-link
          :to="{'name': 'stops/view', params: {'id': result.PrimaryIdentifier}}"
      >
        <div>
          {{ result.TransportTypes }}

          <span class="text-xl font-medium">{{ result.PrimaryName }}</span>
        </div>
        <div class="font-light">
          <span v-if="'Crs' in result.OtherIdentifiers">{{ result.OtherIdentifiers['Crs'] }}</span>
          <span v-else-if="'AtcoCode' in result.OtherIdentifiers">{{ result.OtherIdentifiers['AtcoCode'] }}</span>
        </div>
      </router-link>
    </li>
  </ul>
</template>

<script>
import search from "@/views/Planner/Search.vue";
import axios from "axios";
import API from "@/API";

export default {
  computed: {
    search() {
      return search
    }
  },
  data () {
    return {
      searchTerm: '',
      loadingResults: false,
      results: {}
    }
  },
  methods: {
    searchStops() {
      if (this.searchTerm === '') {
        this.results = []
        return
      }
      this.loadingResults = true

      axios
          .get(`${API.URL}/core/stops/search?name=`+this.searchTerm)
          .then(response => {
            this.results = response.data
          })
          .catch(error => {
            console.log(error)
            // this.error = error
          })
          .finally(() => this.loadingResults = false)
    },
  },
}
</script>
