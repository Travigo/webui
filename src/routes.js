import Home from './views/Home.vue'
import About from './views/About.vue'
import Contact from './views/Contact.vue'
import Faq from './views/Faq.vue'
import NotFound from './views/NotFound.vue'

/** @type {import('vue-router').RouterOptions['routes']} */
export const routes = [
  { name: 'home',
    path: '/', 
    component: Home,
    meta: { 
      title: 'Home'
    }
  },
  {
    name: 'about',
    path: '/about',
    meta: { 
      title: 'About'
    },
    component: About,
  },
  {
    name: 'faq',
    path: '/faq',
    meta: { 
      title: 'FAQ'
    },
    component: Faq,
  },
  {
    name: 'contact',
    path: '/contact',
    meta: { 
      title: 'Contact'
    },
    component: Contact,
  },
  {
    name: 'map',
    path: '/map',
    meta: { 
      title: 'Map'
    },
    component: () => import('./views/Map.vue')
  },
  {
    name: 'operators/home',
    path: '/operators',
    meta: { 
      title: 'Operators'
    },
    component: () => import('./views/Operators/Home.vue')
  },
  {
    name: 'timetables/home',
    path: '/timetables',
    meta: { 
      title: 'Timetables'
    },
    component: () => import('./views/Timetables/Home.vue')
  },
  {
    name: 'historical/home',
    path: '/historical',
    meta: { 
      title: 'Historical'
    },
    component: () => import('./views/Historical/Home.vue')
  },

  { path: '/:path(.*)', component: NotFound },
]
