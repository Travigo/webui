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
    isFullscreen() { return this.$route.meta.fullscreen === true },
    showChrome() { return this.$route.meta.hideChrome !== true }
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
          name: 'Assistant',
          route: { name: 'assistant/home' },
          requiresLogin: true
        },
        {
          name: 'Account',
          route: { name: 'account/home' },
          requiresLogin: true
        }
      ],
      bottomNavItems: [
        {
          name: 'Home',
          icon: 'home',
          route: { name: 'home' }
        },
        {
          name: 'Explore',
          icon: 'explore',
          route: { name: 'operators/home' }
        },
        {
          name: 'Map',
          icon: 'map',
          route: { name: 'map' }
        },
        {
          name: 'Trips',
          icon: 'directions_bus',
          route: { name: 'timetables/home' }
        },
        {
          name: 'Saved',
          icon: 'bookmark',
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
      if (this.auth0.isAuthenticated) {
        notify.setupNotifications(this.auth0, this.$messaging)
      }
    })
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] text-slate-950">
    <nav
      v-if="this.showChrome"
      class="relative z-50 mx-auto max-w-5xl px-4 pt-5 sm:px-8 sm:pt-8 lg:px-10"
    >
      <div class="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <router-link :to="{ path: '/' }" class="inline-flex items-center gap-2 sm:gap-3">
            <span class="bg-gradient-to-r from-pink-500 via-fuchsia-400 to-indigo-600 bg-clip-text text-4xl font-semibold tracking-normal text-transparent sm:text-5xl">
              Travigo
            </span>
            <span
              v-if="this.isDev"
              class="rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-red-600 sm:rounded-lg sm:px-3 sm:py-1 sm:text-sm"
            >
              Dev
            </span>
            <span
              v-else
              class="rounded-md border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-orange-600 sm:rounded-lg sm:px-3 sm:py-1 sm:text-sm"
            >
              Beta
            </span>
          </router-link>

        </div>

        <button
          @click="hamburgerMenuToggle"
          class="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-slate-950 shadow-sm transition hover:bg-indigo-200 sm:hidden"
          aria-label="Open navigation"
        >
          <span class="material-symbols-outlined text-2xl">person</span>
        </button>

        <div class="hidden sm:flex sm:items-center sm:gap-2">
          <router-link
            v-for="navItem in navItems"
            v-bind:key="navItem.name"
            v-show="!navItem.requiresLogin || (navItem.requiresLogin && this.auth0.isAuthenticated)"
            :to="navItem.route"
            active-class="active-nav-tab"
            class="rounded-full px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-blue-600 hover:shadow-sm"
          >
            {{ navItem.name }}
          </router-link>
          <UserOrLogin />
        </div>
      </div>
    
      <div class="sm:hidden" v-bind:class="{ hidden: !hamburgerMenuOpen }">
        <div class="mt-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/80">
          <router-link
            v-for="navItem in navItems"
            v-bind:key="navItem.name"
            v-show="!navItem.requiresLogin || (navItem.requiresLogin && this.auth0.isAuthenticated)"
            :to="navItem.route" 
            active-class="active-nav-tab"
            class="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-600"
          >
            {{ navItem.name }}
          </router-link>

          <UserOrLogin />
        </div>
      </div>
    </nav>
    <main class="h-full" v-bind:class="{ 'pb-20 sm:pb-28': this.showChrome && !this.isFullscreen }">
      <div 
        class="h-full"
        v-bind:class="{'max-w-5xl mx-auto px-4 sm:px-8 lg:px-10': !this.isFullscreen}"
      >
        <router-view />
      </div>
    </main>

    <nav
      v-if="this.showChrome"
      class="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl shadow-slate-300/60 backdrop-blur sm:bottom-5 sm:w-[calc(100%-2.5rem)] sm:rounded-3xl sm:px-4 sm:py-3 sm:shadow-2xl"
      aria-label="Primary"
    >
      <div
        id="bottom-nav-extra"
        class="mb-2 border-b border-slate-100 pb-2 empty:mb-0 empty:hidden empty:border-0 empty:pb-0"
      ></div>

      <div class="grid grid-cols-5 gap-1">
        <router-link
          v-for="item in bottomNavItems"
          v-bind:key="item.name"
          v-show="!item.requiresLogin || (item.requiresLogin && this.auth0.isAuthenticated)"
          :to="item.route"
          class="group flex min-w-0 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-medium text-slate-600 transition hover:text-blue-600 sm:gap-1 sm:rounded-2xl sm:text-xs"
          active-class="bottom-nav-active"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-full transition group-hover:bg-blue-50 sm:h-10 sm:w-10">
            <span class="material-symbols-outlined text-[22px] sm:text-[28px]">{{ item.icon }}</span>
          </span>
          <span class="truncate">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.active-nav-tab {
  background: white;
  color: #2563eb;
  box-shadow: 0 8px 24px rgba(148, 163, 184, 0.18);
}

.bottom-nav-active {
  color: #2563eb;
}

.bottom-nav-active > span:first-child {
  background: #dbeafe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16);
}
</style>
