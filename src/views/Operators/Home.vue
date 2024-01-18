<template>
  <div>
    <PageTitle>
      Operators
    </PageTitle>
    <NavTabBar :tabs="tabs" :currentTab="currentTab" :changeTab="changeTab" />
    <Card>
      <div v-for="(region, id) in this.operatorRegions" v-bind:key="id" class="mt-4 first:mt-0">
        <h3 class="text-xl font-bold">{{ region.Name }}</h3>

        <ul class="columns-2 md:columns-4">
          <li v-for="operator in region.Operators" v-bind:key="operator.PrimaryIdentifier">
            <router-link :to="{'name': 'operators/view', params: {'id': operator.PrimaryIdentifier}}" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
              {{ operator.PrimaryName }}
            </router-link>
          </li>
        </ul>
      </div>
    </Card>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import NavTabBar from "@/components/NavTabBar.vue"
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'

export default {
  name: 'OperatorHome',
  data () {
    return {
      operatorRegions: null,
      loading: true,
      error: null,

      currentTab: "bus",
      tabs: [
        {
          id: "bus",
          name: "Bus",
        },
        {
          id: "rail",
          name: "Rail",
        },
      ]
    }
  },
  components: {
    PageTitle,
    Card,
    NavTabBar
  },
  methods: {
    changeTab(newTab) {
      this.currentTab = newTab
    },
    getOperators() {
      axios
      .get(`${API.URL}/core/operators`)
      .then(response => {
        this.operatorRegions = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperators()
  }
}
</script>