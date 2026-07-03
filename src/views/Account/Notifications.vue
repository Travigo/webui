<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <PageHeader
      eyebrow="Account"
      title="Notifications"
      subtitle="Choose what Travigo should notify you about."
      icon="notifications_active"
      variant="panel"
    />

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
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'AccountNotifications',
  components: {
    PageHeader
  }
}
</script>
