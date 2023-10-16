//firebase-messaging-sw.js

importScripts('https://www.gstatic.com/firebasejs/8.2.7/firebase-app.js')
importScripts('https://www.gstatic.com/firebasejs/8.2.7/firebase-messaging.js')

const firebaseConfig = {
  apiKey: "AIzaSyAKk3Q9o38bKB5pQUGt0r8OL0KoXMpCre4",
  authDomain: "travigo-cdd36.firebaseapp.com",
  projectId: "travigo-cdd36",
  storageBucket: "travigo-cdd36.appspot.com",
  messagingSenderId: "190413192330",
  appId: "1:190413192330:web:15315e66725a50ed834173",
  measurementId: "G-3L94RGJK7N"
}

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig)

function resetUI() {
  // Get registration token. Initially this makes a network call, once retrieved
  // subsequent calls to getToken will return from cache.
  firebase.messaging().getToken(messaging, {vapidKey: 'BLbDyMEaWm3gNuSdan4mGyihI-R5vEUB-ANqH5pp8AczAOWSt7mVamXD4CiRREXV0Xh0qlPKa7jVyv2'}).then((currentToken) => {
    if (currentToken) {
      // sendTokenToServer(currentToken);
      // updateUIForPushEnabled(currentToken);
    } else {
      // Show permission request.
      console.log('No registration token available. Request permission to generate one.');
      // Show permission UI.
      requestPermission();
      // setTokenSentToServer(false);
    }
  }).catch((err) => {
    console.log('An error occurred while retrieving token. ', err)
    // setTokenSentToServer(false);
  });
}

resetUI()

function requestPermission() {
  console.log('Requesting permission...');
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      // TODO(developer): Retrieve a registration token for use with FCM.
      // In many cases once an app has been granted notification permission,
      // it should update its UI reflecting this.
      resetUI();
    } else {
      console.log('Unable to get permission to notify.');
    }
  });
}
