<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
          <span class="material-symbols-outlined text-[23px]">notifications_active</span>
        </span>
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Account</p>
          <h1 class="mt-1 text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            Notifications
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Choose what Travigo should notify you about.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900 shadow-sm shadow-amber-100/60 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 dark:shadow-black/20 sm:rounded-3xl sm:p-5">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-amber-600 dark:bg-slate-900/70 dark:text-amber-200">
          <span class="material-symbols-outlined text-[23px]">info</span>
        </span>
        <div>
          <h2 class="text-base font-extrabold sm:text-lg">Coming soon</h2>
          <p class="mt-1 text-sm font-medium leading-relaxed">
            Notification preferences are not connected yet. This page will be used to manage alerts for saved stops, journeys, service disruption, and other updates.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'AccountNotifications'
}
</script>
