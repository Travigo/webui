import { createApp } from 'vue'
import './tailwind.css'
import './main.css'
import '@vuepic/vue-datepicker/dist/main.css'
// import 'leaflet/dist/leaflet.css'
import App from './App.vue'
import { routes } from './routes.js'
import { createRouter, createWebHistory } from 'vue-router'
import VueGtag from "vue-gtag"
import { registerSW } from 'virtual:pwa-register'
import VueMapboxTs from "vue-mapbox-ts"
import { createAuth0 } from '@auth0/auth0-vue'

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes,
})
router.beforeEach((to, from, next) => {
  const isInStandaloneMode = () => (window.matchMedia('(display-mode: standalone)').matches) || (window.navigator.standalone) || document.referrer.includes('android-app://')

  // Only care about this in PWA world
  if (!isInStandaloneMode()) {
    next()
    return
  }

  if (from['name'] === undefined && from['href'] === undefined && from['path'] === '/') {
    console.log("fresh load")
    if (to['name'] === 'home' && to['href'] === '/'  && to['path'] === '/') {
      console.log('onto homepage')

      let lastRouteJSON = localStorage.getItem('last_route')
      if (lastRouteJSON === null) {
        next()
        return
      }
      let lastRoute = JSON.parse(lastRouteJSON)
      console.log(lastRoute.name)
      localStorage.removeItem('last_route')
      next({ name: lastRoute.name, params: lastRoute.params, query: lastRoute.query })
      return
    }
  }

  console.log(to, from)
  next()
  localStorage.setItem('last_route', JSON.stringify(to));
})
// router.afterEach((to, from) => {
//   localStorage.setItem('last_route', JSON.stringify(to))
// })
app.use(router)

app.use(VueGtag, {config: { id: "G-X0ZSSZCPYX" }})

app.use(VueMapboxTs)

app.use(
  createAuth0({
    domain: 'travigo.uk.auth0.com',
    clientId: 'Vh6gHFJv724xjISfxHJK3bp8XvLqkw4K',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: 'https://api-travigo.claydonlee.com'
    },
    cacheLocation: 'localstorage'
  })
)

app.mount('#app')

registerSW({ immediate: true })

import { useRegisterSW } from 'virtual:pwa-register/vue'

const intervalMS = 60 * 60 * 1000

const updateServiceWorker = useRegisterSW({
  onRegistered(r) {
    r && setInterval(() => {
      r.update()
    }, intervalMS)
  }
})

// Firebase setup
import { initializeApp } from "firebase/app"
import { getMessaging, getToken } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const firebaseApp = initializeApp(firebaseConfig)
const messaging = getMessaging(firebaseApp)

app.config.globalProperties.$messaging = messaging

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