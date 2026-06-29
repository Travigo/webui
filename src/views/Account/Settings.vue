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
          :disabled="!auth0.isAuthenticated || settingUpNotifications"
          @click.stop.prevent="setupNotifications"
        >
          <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': settingUpNotifications }">
            {{ settingUpNotifications ? 'progress_activity' : 'notifications_active' }}
          </span>
          {{ settingUpNotifications ? 'Setting up...' : 'Set up notifications' }}
        </button>
      </div>

      <div
        v-if="!auth0.isAuthenticated"
        class="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      >
        Sign in to set up notification devices.
      </div>

      <div
        v-if="notificationTargetsError"
        class="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
      >
        {{ notificationTargetsError }}
      </div>

      <div v-if="auth0.isAuthenticated" class="mt-4 overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
        <div
          v-if="loadingNotificationTargets"
          class="flex items-center gap-3 px-4 py-4 text-sm font-bold text-slate-500 dark:text-slate-400"
        >
          <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          Loading notification devices
        </div>

        <div
          v-else-if="notificationTargets.length === 0"
          class="px-4 py-4 text-sm font-medium text-slate-500 dark:text-slate-400"
        >
          No notification devices are set up yet.
        </div>

        <template v-else>
          <div
            v-for="target in notificationTargets"
            v-bind:key="notificationTargetToken(target)"
            class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                <span class="material-symbols-outlined text-[22px]">{{ notificationTargetIcon(target) }}</span>
              </span>
              <div class="min-w-0">
                <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100 sm:text-base">{{ notificationTargetName(target) }}</h3>
                <p class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ notificationTargetDescription(target) }}</p>
              </div>
            </div>
            <button
              type="button"
              class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
              :disabled="deletingNotificationToken === notificationTargetToken(target)"
              :aria-label="`Remove ${notificationTargetName(target)}`"
              @click="openDeleteNotificationTargetConfirm(target)"
            >
              <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': deletingNotificationToken === notificationTargetToken(target) }">
                {{ deletingNotificationToken === notificationTargetToken(target) ? 'progress_activity' : 'delete' }}
              </span>
            </button>
          </div>
        </template>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="modal-overlay">
        <div
          v-if="confirmDeleteNotificationTargetOpen"
          class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          @click.self="closeDeleteNotificationTargetConfirm"
        >
          <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
              <div>
                <h2 class="text-lg font-extrabold text-slate-950 dark:text-slate-100">Remove notification device?</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ notificationTargetName(notificationTargetPendingDelete) }} will stop receiving notification updates.
                </p>
              </div>
              <button
                type="button"
                @click="closeDeleteNotificationTargetConfirm"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close notification device removal"
                :disabled="deletingNotificationToken !== ''"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div class="space-y-4 p-4 sm:p-5">
              <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  :disabled="deletingNotificationToken !== ''"
                  @click="closeDeleteNotificationTargetConfirm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="deletingNotificationToken !== ''"
                  @click="confirmDeleteNotificationTarget"
                >
                  <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': deletingNotificationToken !== '' }">
                    {{ deletingNotificationToken !== '' ? 'progress_activity' : 'delete' }}
                  </span>
                  {{ deletingNotificationToken !== '' ? 'Removing...' : 'Remove device' }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
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
      loadingNotificationTargets: false,
      settingUpNotifications: false,
      deletingNotificationToken: '',
      confirmDeleteNotificationTargetOpen: false,
      notificationTargetPendingDelete: undefined,
      notificationTargetsError: '',
      notificationTargets: []
    }
  },
  methods: {
    showToast(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('travigo-toast', {
        detail: {
          message,
          type
        }
      }))
    },
    async setupNotifications() {
      if (!this.auth0.isAuthenticated || this.settingUpNotifications) {
        return
      }

      this.settingUpNotifications = true

      try {
        const result = await this.notify.setupNotifications(this.auth0, this.$messaging, { force: true })

        if (result.status === 'registered') {
          this.showToast('Notification device added.', 'success')
        } else if (result.status === 'permission-denied') {
          this.showToast('Notification permission was not granted.', 'warning')
        } else {
          this.showToast('Notification device could not be added.', 'error')
        }

        await this.getNotificationTargets()
      } catch (error) {
        console.log(error)
        this.showToast('Notification device could not be added.', 'error')
      } finally {
        this.settingUpNotifications = false
      }
    },
    async getNotificationTargets() {
      this.notificationTargetsError = ''

      if (!this.auth0.isAuthenticated) {
        this.notificationTargets = []
        return
      }

      this.loadingNotificationTargets = true

      try {
        this.notificationTargets = await this.notify.listNotificationTargets(this.auth0)
      } catch (error) {
        console.log(error)
        this.notificationTargets = []
        this.notificationTargetsError = 'Notification devices could not be loaded.'
      } finally {
        this.loadingNotificationTargets = false
      }
    },
    openDeleteNotificationTargetConfirm(target) {
      if (!this.notificationTargetToken(target) || this.deletingNotificationToken) {
        return
      }

      this.notificationTargetPendingDelete = target
      this.confirmDeleteNotificationTargetOpen = true
    },
    closeDeleteNotificationTargetConfirm() {
      if (this.deletingNotificationToken) {
        return
      }

      this.confirmDeleteNotificationTargetOpen = false
      this.notificationTargetPendingDelete = undefined
    },
    async confirmDeleteNotificationTarget() {
      const target = this.notificationTargetPendingDelete
      const token = this.notificationTargetToken(target)

      if (!token || this.deletingNotificationToken) {
        return
      }

      this.deletingNotificationToken = token

      try {
        await this.notify.deleteNotificationTarget(this.auth0, target)
        this.notificationTargets = this.notificationTargets.filter(notificationTarget => this.notificationTargetToken(notificationTarget) !== token)
        this.confirmDeleteNotificationTargetOpen = false
        this.notificationTargetPendingDelete = undefined
        this.showToast(`${this.notificationTargetName(target)} removed.`, 'success')
      } catch (error) {
        console.log(error)
        this.showToast('Notification device could not be removed.', 'error')
      } finally {
        this.deletingNotificationToken = ''
      }
    },
    notificationTargetToken(target) {
      return this.notify.getNotificationTargetToken(target)
    },
    notificationTargetName(target) {
      const deviceType = target.DeviceType || target.deviceType || 'Notification device'
      const vendor = target.DeviceVendor || target.deviceVendor || ''
      const model = target.DeviceModel || target.deviceModel || ''
      const nameParts = [vendor, model].filter(Boolean)

      if (nameParts.length > 0) {
        return nameParts.join(' ')
      }

      return deviceType === 'PWA' ? 'This browser' : deviceType
    },
    notificationTargetDescription(target) {
      const modifiedAt = target.ModificationDateTime || target.modificationDateTime

      if (!modifiedAt) {
        return 'Push notification target'
      }

      return `Last updated ${new Date(modifiedAt).toLocaleString()}`
    },
    notificationTargetIcon(target) {
      const deviceType = String(target.DeviceType || target.deviceType || '').toLowerCase()
      const model = String(target.DeviceModel || target.deviceModel || '').toLowerCase()

      if (model.includes('iphone') || model.includes('ipad')) {
        return 'phone_iphone'
      }

      if (model.includes('android')) {
        return 'smartphone'
      }

      if (deviceType === 'pwa') {
        return 'install_mobile'
      }

      return 'notifications'
    }
  },
  mounted() {
    this.getNotificationTargets()
  }
}
</script>
