<script>
import UserOrLogin from '@/components/UserOrLogin.vue'
import { useAuth0 } from '@auth0/auth0-vue'
import notify from "@/notify"

export default {
  name: 'App',
  components: {
    UserOrLogin
  },
  computed: {
    isDev() { return process.env.NODE_ENV === 'development' },
    isFullscreen() { return this.$route.meta.fullscreen === true }
  },
  data () {
    return {
      auth0: useAuth0(),
      notify: notify,
      hamburgerMenuOpen: false,
      navItems: [
        {
          name: 'Map',
          route: { name: 'map' }
        },
        {
          name: 'Journey Planner',
          route: { name: 'journeyplanner/home' }
        },
        {
          name: 'Operators',
          route: { name: 'operators/home' }
        },
        {
          name: 'Timetables',
          route: { name: 'timetables/home' }
        },
        {
          name: 'Statistics',
          route: { name: 'statistics/home' }
        },
        {
          name: 'Account',
          route: { name: 'account/home' }
        }
      ]
    }
  },
  methods: {
    hamburgerMenuToggle() {
      this.hamburgerMenuOpen = !this.hamburgerMenuOpen
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        this.hamburgerMenuOpen = false
        if (to.meta.title === undefined) {
          document.title = 'Travigo'
        } else {
          document.title = 'Travigo / ' + to.meta.title
        }
      }
    },
  },
  mounted() {
    this.$nextTick(function () {
      notify.setupNotifications(this.auth0, this.$messaging)
    })
  }
}
</script>

<template>
  <div class="mmin-h-screen flex flex-col justify-between">
    <nav
      class="mt-2 sm:mt-3 lg:mt-4 mx-2 sm:mx-6 lg:mx-8 bg-white rounded-lg border border-gray-200 shadow-md sticky top-0 z-50 dark:bg-gray-800 dark:border-gray-600"
    >
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div class="relative flex items-center justify-between h-12 lg:h-16">
          <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <!-- Mobile menu button-->
            <button @click="$router.go(-1)" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 focus:outline-none transition duration-150 ease-in-out" aria-label="Main menu" aria-expanded="false">
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M16.74 21.24a0.539 0.539 0 1 0 0.72 -0.8l-7.74 -7c-0.2 -0.18 -0.2 -0.44 0 -0.62l7.74 -6.76a0.559 0.559 0 0 0 0.06 -0.76 0.559 0.559 0 0 0 -0.76 -0.06l-7.74 6.78a1.462 1.462 0 0 0 -0.02 2.22l7.74 7z"/>
              </svg>
            </button>
          </div>
          <div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <router-link :to="{ path: '/' }">
              <div class="flex-shrink-0 text-white text-2xl tracking-wider">
                <span class="text-brand-travi">
                  <span>Travi</span>
                </span>
                <span class="text-brand-go">
                  <span>go</span>
                </span>
                <span v-if="this.isDev" class="text-xs font-semibold inline-block px-2 uppercase rounded text-red-600">
                  Dev
                </span>
                <span v-else class="text-xs font-semibold inline-block px-2 uppercase rounded text-orange-600">
                  Beta
                </span>
              </div>
            </router-link>
            <div class="hidden sm:block sm:ml-6">
              <div class="flex">
                <router-link
                  v-for="navItem in navItems"
                  v-bind:key="navItem.name"
                  :to="navItem.route" 
                  active-class="active-nav-tab"
                  class="ml-4 px-3 py-2 rounded-md text-sm font-medium leading-5 text-gray-600 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out dark:text-gray-100"
                >
                  {{ navItem.name }}
                </router-link>
              </div>
            </div>
          </div>

          <div class="hidden sm:block sm:ml-6">
            <UserOrLogin />
          </div>
          <div class="absolute inset-y-0 right-0 flex items-center sm:hidden">
            <!-- Mobile menu button-->
            <button @click="hamburgerMenuToggle" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white transition duration-150 ease-in-out" aria-label="Main menu" aria-expanded="false">
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg class="hidden h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    
      <div class="sm:hidden" v-bind:class="{ hidden: !hamburgerMenuOpen }">
        <div class="px-2 pt-2 pb-3">
          <router-link
            v-for="navItem in navItems"
            v-bind:key="navItem.name"
            :to="navItem.route" 
            active-class="active-nav-tab"
            class="mt-1 block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out"
          >
            {{ navItem.name }}
          </router-link>

          <UserOrLogin />
        </div>
      </div>
    </nav>
    <main class="flex-grow h-full">
      <div 
        class="h-full"
        v-bind:class="{'max-w-7xl mx-auto px-2 sm:px-6 lg:px-8': !this.isFullscreen}"
      >
        <router-view />
      </div>
    </main>
    <footer class="mx-2 my-4" v-if="!this.isFullscreen">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
        &copy; Aaron Claydon {{ new Date().getFullYear() }} &bull; 
        <router-link :to="{ name: 'about' }">About</router-link> &bull; 
        <!-- <router-link :to="{ name: 'faq' }">FAQ</router-link> &bull;  -->
        <router-link :to="{ name: 'contact' }">Contact</router-link>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.active-nav-tab {
  background: rgba(26, 32, 44);
  color: white;
}
.active-nav-tab:hover {
  background: rgba(74, 85, 104);
}
</style>
