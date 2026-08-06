<template>
  <div class="pb-16 pt-3 sm:pb-20 sm:pt-4">
    <section class="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-xl sm:p-8">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
        <span class="material-symbols-outlined text-[27px]">travel_explore</span>
      </span>
      <h1 class="mt-4 text-2xl font-bold text-slate-950 dark:text-slate-100 sm:text-3xl">
        Page could not be found
      </h1>
      <p class="mx-auto mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
        This page is not available. Return home to continue searching stops, journeys, and transport data.
      </p>
      <router-link
        :to="{ name: 'home' }"
        class="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue-dark"
      >
        <span class="material-symbols-outlined text-[20px]">home</span>
        Go home
      </router-link>
    </section>
  </div>
</template>
