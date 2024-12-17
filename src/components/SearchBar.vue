<template>
  <div class="mt-4 relative">
    <input
      type="text" id="searchTerm"
      :class="searchClasses + ' shadow-md border rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'"
      :placeholder="placeholder" required
      autocomplete="off"
      v-model="searchTerm"
      v-on:input="searchStops"
    >

    <div 
      :class="searchClasses + ' absolute top-0 left-0 cursor-pointer border rounded-lg block w-full  dark:text-white'"
      v-if="selectedResult !== undefined"
      @click="this.selectedResult = undefined"
    >
      <div class="flex">
        <div class="mt-0.5">
          <StopIcon :stop="selectedResult" size="4" />
        </div>

        <div class="flex-auto my-auto font-medium ml-2 dark:text-white">
          <div>
            {{ selectedResult.PrimaryName }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <ul class="rounded-lg bg-white shadow-md p-3 border border-gray-200 dark:bg-gray-800 dark:border-gray-600" v-if="this.results?.stops?.length > 0">
    <li v-for="result in this.results.stops">
      <a
        class="cursor-pointer"
        @click="handleClick(result)"
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
      </a>
    </li>
  </ul>
</template>

<script>
import search from "@/views/Planner/Search.vue";
import axios from "axios";
import API from "@/API";
import ServiceIcon from "@/components/ServiceIcon.vue";
import StopIcon from "@/components/StopIcon.vue";

export default {
  props: {
    modelValue: {},
    placeholder: {
      default: ''
    },
    searchClasses: {
      default: ''
    },
    mode: {
      default: 'link'
    }
  },
  emits: ['update:modelValue'],
  components: {StopIcon, ServiceIcon},
  computed: {
    search() {
      return search
    }
  },
  data () {
    return {
      searchTerm: '',
      loadingResults: false,
      results: {},
      selectedResult: undefined,
    }
  },
  mounted: function() {
    if (this.modelValue == "" || this.modelValue === undefined) {
      return
    }

    this.searchTerm = this.modelValue + "...."

    axios
      .get(`${API.URL}/core/stops/${this.modelValue}`)
      .then(response => {
        this.searchTerm = ""
        this.selectedResult = response.data
      })
      .catch(error => {
        console.log(error)
        // this.error = error
      })
      // .finally(() => this.loading = false)
  },
  methods: {
    handleClick(result) {
      console.log(result)

      if (this.mode == 'link') {
        this.$router.push({ name: 'stops/view', params: {'id': result.PrimaryIdentifier} })
      } else if(this.mode == 'store') {
        this.selectedResult = result
        this.searchTerm = ""
        this.results = {}
        this.$emit('update:modelValue', result.PrimaryIdentifier)
      }
    },
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
