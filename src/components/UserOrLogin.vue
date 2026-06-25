<template>
  <button
    v-if="isAuthenticated"
    @click="logout"
    class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-slate-950 transition hover:bg-indigo-200 sm:h-12 sm:w-12"
    title="Log out"
    aria-label="Log out"
  >
    <span class="material-symbols-outlined text-2xl sm:text-3xl">person</span>
  </button>
  <button
    v-else
    @click="login"
    class="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-slate-950 transition hover:bg-indigo-200 sm:h-12 sm:w-12"
    title="Log in"
    aria-label="Log in"
  >
    <span class="material-symbols-outlined text-2xl sm:text-3xl">person</span>
  </button>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue';

export default {
  setup() {
    const { loginWithRedirect, logout, user, isAuthenticated } = useAuth0()

    return {
      login: () => {
        loginWithRedirect()
      },
      logout: () => {
        logout({ logoutParams: { returnTo: window.location.origin } });
      },
      isAuthenticated: isAuthenticated,
      user
    }
  }
}
</script>
