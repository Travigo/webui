<template>
  <div class="mt-4">
    <input
      type="text" id="searchTerm"
      class="bg-white shadow-md p-4 border border-gray-200 dark:bg-gray-800 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
      placeholder="Search Stops by name or ID" required
      autocomplete="off"
      v-model="searchTerm"
      v-on:input="searchStops"
    >
  </div>
  <ul class="rounded-lg bg-white shadow-md p-3 border border-gray-200 dark:bg-gray-800 dark:border-gray-600" v-if="this.results?.stops?.length > 0">
    <li v-for="result in this.results.stops">
      <router-link
          :to="{'name': 'stops/view', params: {'id': result.PrimaryIdentifier}}"
      >
        <div class="flex">
          <div class="mt-0.5">
            <StopIcon :stop="result" size="10" />
          </div>

          <div class="flex-auto my-auto text-xl font-medium ml-2 dark:text-white">
            <div>
              {{ result.PrimaryName }}
            </div>
            <div class="text-xs font-ligh">
              <span v-if="'Crs' in result.OtherIdentifiers">{{ result.OtherIdentifiers['Crs'] }}</span>
              <span v-else-if="'AtcoCode' in result.OtherIdentifiers">{{ result.OtherIdentifiers['AtcoCode'] }}</span>
            </div>
          </div>
        </div>
      </router-link>
    </li>
  </ul>
</template>

<script>
import search from "@/views/Planner/Search.vue";
import axios from "axios";
import API from "@/API";
import ServiceIcon from "@/components/ServiceIcon.vue";
import DepartureTimeView from "@/components/Stops/DepartureTimeView.vue";
import StopIcon from "@/components/StopIcon.vue";

export default {
  components: {StopIcon, DepartureTimeView, ServiceIcon},
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
