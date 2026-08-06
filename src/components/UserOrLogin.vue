<template>
  <div class="relative" @click.stop>
    <button
      type="button"
      @click="toggleMenu"
      class="-m-1.5 flex h-11 w-11 items-center justify-center sm:-m-0.5"
      :title="isAuthenticated ? 'Account controls' : 'Log in or register'"
      :aria-label="isAuthenticated ? 'Account controls' : 'Log in or register'"
      :aria-expanded="menuOpen"
    >
      <span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-indigo-100 text-slate-950 shadow-sm transition hover:bg-indigo-200 dark:bg-indigo-400/20 dark:text-indigo-100 dark:hover:bg-indigo-400/30 sm:h-10 sm:w-10">
        <img
          v-if="isAuthenticated && user?.picture"
          :src="user.picture"
          :alt="displayName"
          class="block h-full w-full object-cover"
        >
        <span v-else class="material-symbols-outlined text-[22px] sm:text-[24px]">person</span>
      </span>
    </button>

    <Transition name="account-menu">
      <div
        v-if="menuOpen"
        class="absolute right-0 top-11 z-[80] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40 sm:top-12"
      >
        <div class="border-b border-slate-100 p-4 dark:border-slate-800">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-400">
            Account
          </p>
          <h2 class="mt-1 truncate text-base font-bold text-slate-950 dark:text-slate-100">
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
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
            >
              <span class="material-symbols-outlined text-[20px]">login</span>
              Log in
            </button>
            <button
              type="button"
              @click="register"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
            >
              <span class="material-symbols-outlined text-[20px]">person_add</span>
              Register
            </button>
          </template>

          <template v-else>
            <router-link
              :to="{ name: 'account/settings' }"
              @click="closeMenu"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
            >
              <span class="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </router-link>
            <router-link
              :to="{ name: 'account/notifications' }"
              @click="closeMenu"
              class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
            >
              <span class="material-symbols-outlined text-[20px]">notifications_active</span>
              Notifications
            </router-link>

            <template v-if="canRunImports">
              <div class="my-2 border-t border-slate-100 dark:border-slate-800"></div>

              <div>
                <p class="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Admin
                </p>

                <router-link
                  :to="{ name: 'admin/importer' }"
                  @click="closeMenu"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
                >
                  <span class="material-symbols-outlined text-[20px]">manufacturing</span>
                  Data importer
                </router-link>
              </div>
            </template>
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
import { DATA_IMPORTER_PERMISSION, getApiAccessTokenClaims, hasAuth0Permission } from '@/auth'

export default {
  setup() {
    const auth0 = useAuth0()
    const { loginWithRedirect, logout: auth0Logout, user, isAuthenticated, idTokenClaims } = auth0

    return {
      auth0,
      auth0Logout,
      isAuthenticated,
      idTokenClaims,
      loginWithRedirect,
      user
    }
  },
  data() {
    return {
      accessTokenClaims: undefined,
      menuOpen: false
    }
  },
  computed: {
    canRunImports() {
      return hasAuth0Permission(this.idTokenClaims, DATA_IMPORTER_PERMISSION) ||
        hasAuth0Permission(this.accessTokenClaims, DATA_IMPORTER_PERMISSION)
    },
    displayName() {
      return this.user?.name || this.user?.nickname || this.user?.email || 'user'
    }
  },
  methods: {
    async loadAccessTokenClaims() {
      while (this.auth0.isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      if (!this.isAuthenticated) {
        return
      }

      this.accessTokenClaims = await getApiAccessTokenClaims(this.auth0).catch(() => undefined)
    },
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
    this.loadAccessTokenClaims()
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
