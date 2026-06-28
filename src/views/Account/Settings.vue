<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Account</p>
          <h1 class="mt-1 text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            Settings
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage account preferences and notification devices.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Notifications</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set up push notifications for service changes and saved stop updates.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl"
          :disabled="!auth0.isAuthenticated"
          @click.stop.prevent="setupNotifications"
        >
          <span class="material-symbols-outlined text-[20px]">notifications_active</span>
          Set up notifications
        </button>
      </div>

      <div
        v-if="!auth0.isAuthenticated"
        class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      >
        Sign in to set up notification devices.
      </div>

      <div class="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
        <div
          v-for="device in notificationDevices"
          v-bind:key="device.name"
          class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
        >
          <div class="flex min-w-0 items-center gap-3">
            <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <span class="material-symbols-outlined text-[22px]">{{ device.icon }}</span>
            </span>
            <div class="min-w-0">
              <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100 sm:text-base">{{ device.name }}</h3>
              <p class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ device.description }}</p>
            </div>
          </div>
          <span
            class="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
            :class="device.enabled ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-200' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'"
          >
            {{ device.enabled ? 'Ready' : 'Coming soon' }}
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import notify from '@/notify'

export default {
  name: 'AccountSettings',
  data() {
    return {
      auth0: useAuth0(),
      notify,
      notificationDevices: [
        {
          name: 'iOS phone',
          description: 'Push notifications for your iPhone.',
          icon: 'phone_iphone',
          enabled: false
        },
        {
          name: 'Android phone',
          description: 'Push notifications for your Android device.',
          icon: 'smartphone',
          enabled: false
        },
        {
          name: 'Email',
          description: 'Service updates delivered to your inbox.',
          icon: 'mail',
          enabled: false
        }
      ]
    }
  },
  methods: {
    setupNotifications() {
      this.notify.setupNotifications(this.auth0, this.$messaging)
    }
  }
}
</script>
