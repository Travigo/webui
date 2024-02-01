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
      title: 'Map',
      fullscreen: true
    },
    component: () => import('./views/Map.vue')
  },
  {
    name: 'stops/view',
    path: '/stops/:id',
    meta: { 
      title: 'Stop' // should be the actual stop name
    },
    component: () => import('./views/Stops/View.vue')
  },
  {
    name: 'journeys/view',
    path: '/journeys/:id',
    meta: { 
      title: 'Journey' // should be the actual stop name
    },
    component: () => import('./views/Journeys/View.vue')
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
    name: 'operators/view',
    path: '/operators/:id',
    meta: { 
      title: 'Operator' // should be the actual stop name
    },
    component: () => import('./views/Operators/View.vue')
  },
  {
    name: 'operators/view_group',
    path: '/operators/group/:id',
    meta: { 
      title: 'Operator Group' // should be the actual stop name
    },
    component: () => import('./views/Operators/View_Group.vue')
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
    name: 'statistics/home',
    path: '/statistics',
    meta: { 
      title: 'Statistics'
    },
    component: () => import('./views/Statistics/Home.vue')
  },
  {
    name: 'journeyplanner/home',
    path: '/planner',
    meta: { 
      title: 'Planner'
    },
    component: () => import('./views/Planner/Home.vue')
  },
  {
    name: 'journeyplanner/search',
    path: '/planner/search',
    meta: { 
      title: 'Planner'
    },
    component: () => import('./views/Planner/Search.vue')
  },
  {
    name: 'account/home',
    path: '/account',
    meta: { 
      title: 'Account'
    },
    component: () => import('./views/Account/Home.vue')
  },
  {
    name: 'services/view',
    path: '/services/:id',
    meta: {
      title: 'Service'
    },
    component: () => import('./views/Services/View.vue')
  },
  { path: '/:path(.*)', component: NotFound },
]
