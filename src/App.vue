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
    showChrome() { return this.$route.meta.hideChrome !== true },
    themeIcon() { return this.darkMode ? 'light_mode' : 'dark_mode' },
    themeLabel() { return this.darkMode ? 'Use light mode' : 'Use dark mode' }
  },
  data () {
    return {
      auth0: useAuth0(),
      notify: notify,
      darkMode: false,
      systemThemeQuery: undefined,
      toastId: 0,
      toasts: [],
      bottomNavItems: [
        {
          name: 'Home',
          icon: 'home',
          route: { name: 'home' }
        },
        // {
        //   name: 'Explore',
        //   icon: 'explore',
        //   route: { name: 'operators/home' }
        // },
        {
          name: 'Map',
          icon: 'map',
          route: { name: 'map' }
        },
        {
          name: 'Planner',
          icon: 'route',
          route: { name: 'journeyplanner/home' }
        },
        // {
        //   name: 'Trips',
        //   icon: 'directions_bus',
        //   route: { name: 'timetables/home' }
        // },
        {
          name: 'Saved',
          icon: 'bookmark',
          route: { name: 'saved/home' }
        }
      ]
    }
  },
  methods: {
    initTheme() {
      this.systemThemeQuery?.removeEventListener('change', this.handleSystemThemeChange)
      this.systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const savedTheme = localStorage.getItem('travigo_theme')
      const shouldUseDark = savedTheme === 'dark' || (savedTheme !== 'light' && this.systemThemeQuery.matches)

      this.applyTheme(shouldUseDark)
      this.systemThemeQuery.addEventListener('change', this.handleSystemThemeChange)
    },
    applyTheme(shouldUseDark) {
      this.darkMode = shouldUseDark
      document.documentElement.classList.toggle('dark', shouldUseDark)
      document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
    },
    toggleTheme() {
      const nextTheme = !this.darkMode

      localStorage.setItem('travigo_theme', nextTheme ? 'dark' : 'light')
      this.applyTheme(nextTheme)
    },
    handleSystemThemeChange(event) {
      if (localStorage.getItem('travigo_theme') !== null) {
        return
      }

      this.applyTheme(event.matches)
    },
    showToast(event) {
      const toast = {
        id: ++this.toastId,
        message: event.detail?.message || '',
        type: event.detail?.type || 'info'
      }

      if (!toast.message) {
        return
      }

      this.toasts.push(toast)
      window.setTimeout(() => this.dismissToast(toast.id), 3600)
    },
    dismissToast(id) {
      this.toasts = this.toasts.filter(toast => toast.id !== id)
    },
    toastClasses(type) {
      if (type === 'success') {
        return 'border-green-100 bg-green-50 text-green-800 shadow-green-900/10 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100'
      }

      if (type === 'error') {
        return 'border-red-100 bg-red-50 text-red-800 shadow-red-900/10 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100'
      }

      if (type === 'warning') {
        return 'border-amber-100 bg-amber-50 text-amber-800 shadow-amber-900/10 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
      }

      return 'border-blue-100 bg-blue-50 text-blue-800 shadow-blue-900/10 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100'
    },
    toastIcon(type) {
      if (type === 'success') {
        return 'check_circle'
      }

      if (type === 'error') {
        return 'error'
      }

      if (type === 'warning') {
        return 'warning'
      }

      return 'info'
    }
  },
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        if (to.meta.title === undefined) {
          document.title = 'Travigo'
        } else {
          document.title = 'Travigo / ' + to.meta.title
        }
      }
    },
  },
  beforeMount() {
    this.initTheme()
  },
  mounted() {
    window.addEventListener('travigo-toast', this.showToast)

    this.$nextTick(function () {
      if (this.auth0.isAuthenticated) {
        notify.setupNotifications(this.auth0, this.$messaging).catch(error => console.log(error))
      }
    })
  },
  beforeUnmount() {
    this.systemThemeQuery?.removeEventListener('change', this.handleSystemThemeChange)
    window.removeEventListener('travigo-toast', this.showToast)
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f8fafc] text-slate-950 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <nav
      v-if="this.showChrome"
      class="relative z-50 mx-auto max-w-5xl px-4 pt-5 sm:px-8 sm:pt-8 lg:px-10"
    >
      <div class="flex items-start justify-between gap-3 sm:gap-4">
        <div>
          <router-link :to="{ path: '/' }" class="inline-flex items-center gap-2 sm:gap-3">
            <span class="bg-gradient-to-r from-pink-500 via-fuchsia-400 to-indigo-600 bg-clip-text text-2xl font-semibold tracking-normal text-transparent sm:text-5xl">
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

        <div class="flex items-center gap-2 sm:hidden">
          <button
            @click="toggleTheme"
            class="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            :aria-label="themeLabel"
          >
            <span class="material-symbols-outlined text-xl">{{ themeIcon }}</span>
          </button>

          <UserOrLogin />
        </div>

        <div class="hidden sm:flex sm:items-center sm:gap-2">
          <button
            @click="toggleTheme"
            class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-blue-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-blue-300"
            :aria-label="themeLabel"
          >
            <span class="material-symbols-outlined text-[22px]">{{ themeIcon }}</span>
          </button>

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
      class="fixed inset-x-0 bottom-3 z-50 mx-auto w-[calc(100%-2rem)] max-w-5xl rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-xl shadow-slate-300/60 backdrop-blur sm:bottom-5 sm:w-[calc(100%-2.5rem)] sm:rounded-3xl sm:px-4 sm:py-3 sm:shadow-2xl dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40"
      aria-label="Primary"
    >
      <div
        id="bottom-nav-extra"
        class="mb-2 border-b border-slate-100 pb-2 empty:mb-0 empty:hidden empty:border-0 empty:pb-0 dark:border-slate-800"
      ></div>

      <div class="flex justify-center gap-1">
        <router-link
          v-for="item in bottomNavItems"
          v-bind:key="item.name"
          v-show="!item.requiresLogin || (item.requiresLogin && this.auth0.isAuthenticated)"
          :to="item.route"
          class="group flex min-w-0 max-w-20 flex-1 flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[11px] font-medium text-slate-600 transition hover:text-blue-600 sm:gap-1 sm:rounded-2xl sm:text-xs dark:text-slate-300 dark:hover:text-blue-300"
          active-class="bottom-nav-active"
        >
          <span class="flex h-8 w-8 items-center justify-center rounded-full transition group-hover:bg-blue-50 sm:h-10 sm:w-10 dark:group-hover:bg-blue-500/10">
            <span
              class="material-symbols-outlined [--bottom-nav-icon-size:24px] sm:[--bottom-nav-icon-size:26px]"
              style="font-size: var(--bottom-nav-icon-size); line-height: 1"
            >
              {{ item.icon }}
            </span>
          </span>
          <span class="truncate">{{ item.name }}</span>
        </router-link>
      </div>
    </nav>

    <div class="pointer-events-none fixed inset-x-0 top-4 z-[1100] mx-auto flex w-full max-w-sm flex-col gap-2 px-4 sm:left-auto sm:right-4 sm:mx-0 sm:w-96 sm:max-w-none sm:px-0">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          v-bind:key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-bold shadow-xl backdrop-blur"
          :class="toastClasses(toast.type)"
        >
          <span class="material-symbols-outlined mt-0.5 text-[21px]">{{ toastIcon(toast.type) }}</span>
          <p class="min-w-0 flex-1 leading-snug">{{ toast.message }}</p>
          <button
            type="button"
            class="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:opacity-100"
            @click="dismissToast(toast.id)"
            aria-label="Dismiss notification"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped lang="scss">
.active-nav-tab {
  background: white;
  color: #2563eb;
  box-shadow: 0 8px 24px rgba(148, 163, 184, 0.18);
}

:global(.dark) .active-nav-tab {
  background: #1e293b;
  color: #93c5fd;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.bottom-nav-active {
  color: #2563eb;
}

:global(.dark) .bottom-nav-active {
  color: #93c5fd;
}

.bottom-nav-active > span:first-child {
  background: #dbeafe;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.16);
}

:global(.dark) .bottom-nav-active > span:first-child {
  background: rgba(37, 99, 235, 0.18);
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.12);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem) scale(0.98);
}
</style>
