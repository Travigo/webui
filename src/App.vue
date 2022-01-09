<script>
export default {
    name: 'App',
    watch: {
      $route: {
        immediate: true,
          handler(to, from) {
            if (to.meta.title === undefined) {
              document.title = 'BritBus';
            } else {
              document.title = 'BritBus / ' + to.meta.title;
            }
          }
        },
    }
};
</script>

<template>
  <div class="min-h-screen flex flex-col justify-between">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div class="relative flex items-center justify-between h-16">
          <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
            <!-- Mobile menu button-->
            <button class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 focus:text-white transition duration-150 ease-in-out" aria-label="Main menu" aria-expanded="false">
              <svg class="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg class="hidden h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
            <router-link :to="{ path: '/' }">
              <div class="flex-shrink-0 text-white text-2xl tracking-wider">
                <span class="text-unionjack-red">Brit</span><span class="text-unionjack-blue">Bus</span>
              </div>
            </router-link>
            <div class="hidden sm:block sm:ml-6">
              <div class="flex">
                <router-link :to="{ name: 'map' }" active-class="active-nav-tab" class="ml-4 px-3 py-2 rounded-md text-sm font-medium leading-5 text-gray-600 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">
                  Map
                </router-link>
                <router-link :to="{ name: 'operators/home' }" active-class="active-nav-tab" class="ml-4 px-3 py-2 rounded-md text-sm font-medium leading-5 text-gray-600 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">
                  Operators
                </router-link>
                <router-link :to="{ name: 'timetables/home' }" active-class="active-nav-tab" class="ml-4 px-3 py-2 rounded-md text-sm font-medium leading-5 text-gray-600 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">
                  Timetables
                </router-link>
                <router-link :to="{ name: 'historical/home' }" active-class="active-nav-tab" class="ml-4 px-3 py-2 rounded-md text-sm font-medium leading-5 text-gray-600 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">
                  Historical
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    
      <div class="hidden sm:hidden">
        <div class="px-2 pt-2 pb-3">
          <a href="#" class="block px-3 py-2 rounded-md text-base font-medium text-white bg-gray-900 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">Map</a>
          <a href="#" class="mt-1 block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">Operators</a>
          <a href="#" class="mt-1 block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">Timetables</a>
          <a href="#" class="mt-1 block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none focus:text-white focus:bg-gray-700 transition duration-150 ease-in-out">Historical</a>
        </div>
      </div>
    </nav>
    <main class="flex-grow">
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <router-view />
      </div>
    </main>
    <footer>
      <div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center text-xs text-gray-500">
        &copy; BritBus |
        <router-link :to="{ name: 'about' }">About</router-link> | 
        <router-link :to="{ name: 'faq' }">FAQ</router-link> | 
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
