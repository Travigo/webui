import axios from "axios"
import API from "@/API"
import { getToken } from "firebase/messaging"

export default {
  setupNotifications(auth0, messagingObj) {
    // Get registration token. Initially this makes a network call, once retrieved
    // subsequent calls to getToken will return from cache.
    getToken(messagingObj, {vapidKey: 'BLbDyMEaWm3gNuSdan4mGyihI-R5vEUB-ANqH5pp8AczAOWSt7mVamXD4CiRREXV0Xh0qlPKa7jVyv2aPxP1S5E'}).then((currentToken) => {
      if (currentToken) {
        this.sendTokenToServer(auth0, currentToken);
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
      }
    }).catch((err) => {
      console.log('An error occurred while retrieving token. ', err)
    })
  },
  async sendTokenToServer(auth0, fcmToken) {
    const auth0token = await auth0.getAccessTokenSilently();
    const config = {
      headers: { Authorization: `Bearer ${auth0token}` }
    }
    
    axios
      .post(`${API.URL}/core/account/notificationtoken`, {
        token: fcmToken
      }, config)
      .then((response) => {
        console.log('Notification/registerdevice', response.data)
      })
      .catch((error) => {
        console.log(error)
      })
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