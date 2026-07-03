<template>
  <div class="pb-16 pt-3 sm:pb-20 sm:pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-8">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
        <span class="material-symbols-outlined text-[27px]">travel_explore</span>
      </span>
      <h1 class="mt-4 text-2xl font-extrabold text-slate-950 dark:text-slate-100 sm:text-3xl">
        Page could not be found
      </h1>
      <p class="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
        This page is not available. Return home to continue searching stops, journeys, and transport data.
      </p>
      <router-link
        :to="{ name: 'home' }"
        class="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
      >
        <span class="material-symbols-outlined text-[20px]">home</span>
        Go home
      </router-link>
    </section>
  </div>
</template>
