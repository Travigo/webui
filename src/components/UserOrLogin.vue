<template>
  <div>
    <div v-if="isAuthenticated">
      <button 
        @click="logout"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Log out
      </button>
    </div>
    <div v-else>
      <button 
        @click="login"
        class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
      >
        Log in
      </button>
    </div>
  </div>
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
