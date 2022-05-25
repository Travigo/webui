import { createApp } from 'vue'
import './tailwind.css'
import './main.css'
// import 'leaflet/dist/leaflet.css'
import App from './App.vue'
import { routes } from './routes.js'
import { createRouter, createWebHistory } from 'vue-router'
import VueGtag from "vue-gtag";

const app = createApp(App)

const router = createRouter({
  history: createWebHistory(),
  routes,
})
app.use(router)

app.use(VueGtag, {config: { id: "G-X0ZSSZCPYX" }})

app.mount('#app')
