<template>
  <div>
    <PageTitle>
      Journey Planner
    </PageTitle>
    <Card>
      <Alert type="warning">
        <strong>Limited Functionality</strong> Currently must enter the Stop IDs and can only support direct journeys
      </Alert>

      <form>
        <div class="mb-6">
          <input 
            type="text" id="origin" 
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Origin" required
            v-model="originStop"
          >
        </div>
        <div class="mb-6">
          <input type="text" id="destination" 
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Destination" required
            v-model="destinationStop"
          >
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

export default {
  name: 'JourneyPlannerHome',
  components: {
    Card,
    PageTitle,
    Alert
  },
  data(){
    return {
      originStop : "gb-atco-9100CAMBDGE",
      destinationStop: "gb-atco-9100KNGX"
    }
  },
  methods: {
    submit(){
      this.$router.push({ name: 'journeyplanner/search', query: { origin: this.originStop, destination: this.destinationStop } })
    }
  }
}
</script>