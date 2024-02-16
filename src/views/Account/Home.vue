<template>
  <div>
    <PageTitle>
      Account
    </PageTitle>
    <Card>
      <div v-if="auth0.isAuthenticated">
        <button 
          type="submit" 
          class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          @click.stop.prevent="notify.setupNotifications(this.auth0, this.$messaging)"
        >
          Setup Notifications
        </button>
      </div>
      <div v-else>
        Please login to access this page
      </div>
    </Card>
  </div>
</template>

<script>
import Card from '@/components/Card.vue'
import PageTitle from '@/components/PageTitle.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import notify from "@/notify"

export default {
  name: 'AccountHome',
  components: {
    Card,
    PageTitle,
  },
  data() {
    return {
      auth0: useAuth0(),
      notify: notify,
    }
  }
}
</script>