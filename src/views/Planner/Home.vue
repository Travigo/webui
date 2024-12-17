<template>
  <div>
    <PageTitle>
      Journey Planner
    </PageTitle>
    <Card>
      <Alert type="warning">
        <strong>Limited Functionality</strong> Currently only supports direct journeys
      </Alert>

      <form>
        <div class="mb-6">
          <SearchBar
            mode="store"
            placeholder="Origin"
            searchClasses="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm p-2.5 text-gray-900"
            v-model="originStop"
          />
        </div>
        <div class="mb-6">
          <SearchBar
            mode="store"
            placeholder="Destination"
            searchClasses="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-sm p-2.5 text-gray-900"
            v-model="destinationStop"
          />
        </div>
        <button 
          type="submit" 
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          @click.stop.prevent="submit()"
        >
          Lookup
        </button>
      </form>
    </Card>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import Alert from "@/components/Alert.vue"
import SearchBar from '@/components/SearchBar.vue'

export default {
  name: 'JourneyPlannerHome',
  components: {
    Card,
    PageTitle,
    Alert,
    SearchBar
  },
  data(){
    return {
      originStop : "tmr-stop-f2682658fb0233a2c24c460d6b97",
      destinationStop: "tmr-stop-6d4a16c404d022a7e49dd47971e6"
    }
  },
  methods: {
    submit(){
      this.$router.push({ name: 'journeyplanner/search', query: { origin: this.originStop, destination: this.destinationStop } })
    }
  }
}
</script>