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
          @click.stop.prevent="setupNotifications()"
        >
          Setup Notifications
        </button>
        <p>{{ token }}</p>
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
import { getToken } from "firebase/messaging"
import { useAuth0 } from '@auth0/auth0-vue'
import axios from "axios"
import API from "@/API"

export default {
  name: 'AccountHome',
  components: {
    Card,
    PageTitle,
  },
  data() {
    return {
      token: 'Click button',
      auth0: useAuth0(),
    }
  },
  methods: {
    setupNotifications() {
      // Get registration token. Initially this makes a network call, once retrieved
      // subsequent calls to getToken will return from cache.
      getToken(this.$messaging, {vapidKey: 'BLbDyMEaWm3gNuSdan4mGyihI-R5vEUB-ANqH5pp8AczAOWSt7mVamXD4CiRREXV0Xh0qlPKa7jVyv2aPxP1S5E'}).then((currentToken) => {
        if (currentToken) {
          console.log('push token', currentToken)
          this.token = currentToken
          this.sendTokenToServer(currentToken);
        } else {
          // Show permission request.
          console.log('No registration token available. Request permission to generate one.');
          // Show permission UI.
          console.log('Requesting permission...');
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              // TODO(developer): Retrieve a registration token for use with FCM.
              // In many cases once an app has been granted notification permission,
              // it should update its UI reflecting this.
            } else {
              console.log('Unable to get permission to notify.');
            }
          });
          // setTokenSentToServer(false);
        }
      }).catch((err) => {
        console.log('An error occurred while retrieving token. ', err)
        // setTokenSentToServer(false);
      })
    },
    async sendTokenToServer(fcmToken) {
      const auth0token = await this.auth0.getAccessTokenSilently();
      const config = {
        headers: { Authorization: `Bearer ${auth0token}` }
      }
      
      axios
        .post(`${API.URL}/core/account/notificationtoken`, {
          token: fcmToken
        }, config)
        .then((response) => {
          console.log(response.data)
        })
        .catch((error) => {
          console.log(error)
        })
    }
  },
  requestPermission() {
    console.log('Requesting permission...');
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // TODO(developer): Retrieve a registration token for use with FCM.
        // In many cases once an app has been granted notification permission,
        // it should update its UI reflecting this.
        setupNotifications()
      } else {
        console.log('Unable to get permission to notify.');
      }
    });
  }
}
</script>