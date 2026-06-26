<template>
  <div>
    <PageTitle>
      Operators
    </PageTitle>
    <section class="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <TabBar :tabs="tabs" :model-value="currentTab" @update:model-value="changeTab" />
    </section>
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
import TabBar from "@/components/TabBar.vue"
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
          icon: 'directions_bus'
        },
        {
          id: "rail",
          name: "Rail",
          icon: 'train'
        },
      ]
    }
  },
  components: {
    PageTitle,
    Card,
    TabBar
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
