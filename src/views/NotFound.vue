<template>
  <div>
    <div class="flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div>
        <h2 class="mt-6 text-center text-3xl leading-9 font-extrabold text-gray-900">
          Page could not be found
        </h2>
        <p class="mt-2 text-center text-sm leading-5 text-gray-600">
          Sorry about that, try
          <router-link :to="{ name: 'home' }" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
            going back home
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
