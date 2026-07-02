<template>
  <div class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-200">
          <span class="material-symbols-outlined text-[23px]">database</span>
        </span>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Data</p>
          <h1 class="mt-1 text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-3xl">
            Datasources
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Supported transport data providers and datasets.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-200">
          <span class="material-symbols-outlined text-[23px]">construction</span>
        </span>
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Provider index coming soon</h2>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Individual provider pages are available from data attribution links across stops, journeys, and services.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'DatasourcesHome'
}
</script>
