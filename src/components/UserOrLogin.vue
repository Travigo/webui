<template>
  <div class="relative flex h-8 w-8 items-center justify-center sm:h-10 sm:w-10" @click.stop>
    <button
      type="button"
      @click="toggleMenu"
      class="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-slate-950 shadow-sm transition hover:bg-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/30"
      :title="isAuthenticated ? 'Account controls' : 'Log in or register'"
      :aria-label="isAuthenticated ? 'Account controls' : 'Log in or register'"
      :aria-expanded="menuOpen"
    >
      <img
        v-if="isAuthenticated && user?.picture"
        :src="user.picture"
        :alt="displayName"
        class="block h-full w-full object-cover"
      >
      <span v-else class="material-symbols-outlined text-[22px] sm:text-[24px]">person</span>
    </button>

    <Transition name="account-menu">
      <div
        v-if="menuOpen"
        class="absolute right-0 top-11 z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:top-12"
      >
        <div class="border-b border-slate-100 p-4 dark:border-slate-800">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
            Account
          </p>
          <h2 class="mt-1 truncate text-base font-extrabold text-slate-950 dark:text-slate-100">
            {{ isAuthenticated ? `Hi, ${displayName}` : 'Welcome to Travigo' }}
          </h2>
          <p class="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
            {{ isAuthenticated ? user?.email || 'Signed in' : 'Sign in to manage saved stops and preferences.' }}
          </p>
        </div>

        <div class="p-2">
          <template v-if="!isAuthenticated">
            <button
              type="button"
              @click="login"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            >
              <span class="material-symbols-outlined text-[20px]">login</span>
              Log in
            </button>
            <button
              type="button"
              @click="register"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            >
              <span class="material-symbols-outlined text-[20px]">person_add</span>
              Register
            </button>
          </template>

          <template v-else>
            <router-link
              :to="{ name: 'account/settings' }"
              @click="closeMenu"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            >
              <span class="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </router-link>
            <button
              type="button"
              @click="logout"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
            >
              <span class="material-symbols-outlined text-[20px]">logout</span>
              Log out
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'

export default {
  setup() {
    const { loginWithRedirect, logout: auth0Logout, user, isAuthenticated } = useAuth0()

    return {
      auth0Logout,
      isAuthenticated,
      loginWithRedirect,
      user
    }
  },
  data() {
    return {
      menuOpen: false
    }
  },
  computed: {
    displayName() {
      return this.user?.name || this.user?.nickname || this.user?.email || 'user'
    }
  },
  methods: {
    toggleMenu() {
      this.menuOpen = !this.menuOpen
    },
    closeMenu() {
      this.menuOpen = false
    },
    login() {
      this.closeMenu()
      this.loginWithRedirect()
    },
    register() {
      this.closeMenu()
      this.loginWithRedirect({
        authorizationParams: {
          screen_hint: 'signup'
        }
      })
    },
    logout() {
      this.closeMenu()
      this.auth0Logout({ logoutParams: { returnTo: window.location.origin } })
    },
    handleDocumentClick() {
      this.closeMenu()
    },
    handleEscape(event) {
      if (event.key === 'Escape') {
        this.closeMenu()
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
    document.addEventListener('keydown', this.handleEscape)
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
    document.removeEventListener('keydown', this.handleEscape)
  }
}
</script>

<style scoped>
.account-menu-enter-active,
.account-menu-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.account-menu-enter-from,
.account-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
</style>
