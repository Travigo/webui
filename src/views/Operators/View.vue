<template>
  <div v-if="loading">Loading...</div>
  <div v-else class="h-full">
    <PageTitle>
      {{ this.operator.PrimaryName }}
    </PageTitle>
    <Card>
      <div v-if="this.operator.Website" class="mb-2">
        <strong>Website: </strong>
        <a :href="this.operator.Website" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
          {{ this.operator.Website }}
        </a>
      </div>

      <div v-if="this.operator.Email" class="mb-2">
        <strong>Email: </strong>
        <a :href="'mailto://' + this.operator.Email" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
          {{ this.operator.Email }}
        </a>
      </div>

      <div v-if="this.operator.PhoneNumber" class="mb-2">
        <strong>Phone: </strong>
        <a :href="'tel://' + this.operator.PhoneNumber" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
          {{ this.operator.PhoneNumber }}
        </a>
      </div>

      <div v-if="this.operator.SocialMedia.Twitter" class="mb-2">
        <strong>Twitter: </strong>
        <a :href="'https://twitter.com/' + this.operator.SocialMedia.Twitter" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
          {{ this.operator.SocialMedia.Twitter }}
        </a>
      </div>
    </Card>

    <Card v-if="this.operator.OperatorGroup" class="mt-4">
      Part of the group 
      <router-link :to="{'name': 'operators/view_group', params: {'id': this.operator.OperatorGroup.Identifier}}" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
        {{ this.operator.OperatorGroup.Name }}
      </router-link>
    </Card>

    <Card v-if="this.operator.OtherNames" class="mt-4">
      <span class="font-bold">Also know as:</span>

      <ul class="list-disc">
        <li v-for="name in this.operator.OtherNames" v-bind:key="name" class="ml-5">
          {{ name }}
        </li>
      </ul>
    </Card>
  </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
import axios from 'axios'
import API from '@/API'

import { latLng } from 'leaflet';
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from '@vue-leaflet/vue-leaflet';

export default {
  name: 'StopsView',
  data () {
    return {
      operator: null,
      loading: true,
      error: null,
    }
  },
  components: {
    PageTitle,
    Card
  },
  methods: {
    getOperator() {
      axios
      .get(`${API.URL}/operators/${this.$route.params.id}`)
      .then(response => {
        this.operator = response.data
      })
      .catch(error => {
        console.log(error)
        this.error = error
      })
      .finally(() => this.loading = false)
    },
  },
  mounted () {
    this.getOperator()
  }
}
</script>