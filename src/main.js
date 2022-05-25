import { createApp } from 'vue'
import './tailwind.css'
import './main.css'
// import 'leaflet/dist/leaflet.css'
import App from './App.vue'
import { routes } from './routes.js'
import { createRouter, createWebHistory } from 'vue-router'
import VueGtag from "vue-gtag";
import { registerSW } from 'virtual:pwa-register';

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes,
})
app.use(router)

app.use(VueGtag, {config: { id: "G-X0ZSSZCPYX" }})

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