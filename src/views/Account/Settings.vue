<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Account"
      title="Settings"
      subtitle="Manage account preferences and notification devices."
      icon="settings"
      variant="panel"
    />

    <section class="ui-panel p-4 sm:p-5" aria-labelledby="fare-profile-heading">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="fare-profile-heading" class="ui-section-title">Fare profile</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set your age, the discount cards you hold, and any fare eligibility profiles such as student or senior. The journey planner uses these when it quotes fares.
          </p>
        </div>
        <button
          type="button"
          class="ui-button-primary"
          :disabled="!fareProfileAccount || !fareProfileReady || loadingFareProfile || savingFareProfile"
          @click="saveFareProfile"
        >
          <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': savingFareProfile }">
            {{ savingFareProfile ? 'progress_activity' : 'save' }}
          </span>
          {{ savingFareProfile ? 'Saving...' : 'Save fare profile' }}
        </button>
      </div>

      <div
        v-if="fareProfileAccount === false"
        class="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      >
        Sign in to save your fare profile.
      </div>

      <div v-else-if="fareProfileAccount" class="mt-4 grid gap-5 md:grid-cols-[12rem_minmax(0,1fr)]">
        <div>
          <label for="fare-profile-age" class="block text-sm font-bold text-slate-700 dark:text-slate-200">Your age</label>
          <input
            id="fare-profile-age"
            v-model="fareProfileAge"
            type="number"
            inputmode="numeric"
            min="0"
            max="120"
            :disabled="!fareProfileReady || savingFareProfile"
            class="mt-1 min-h-11 w-full rounded-xl border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            placeholder="Age"
          >
          <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Used to match age-based fare eligibility.</p>
        </div>

        <fieldset class="min-w-0">
          <legend class="text-sm font-bold text-slate-700 dark:text-slate-200">Cards and fare eligibility</legend>
          <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            Options are listed from active fare datasets. Eligibility and discount rules come from each dataset.
          </p>

          <div
            v-if="loadingFareProfile"
            class="mt-3 flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400"
          >
            <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Loading fare profile
          </div>
          <div
            v-else-if="fareCardOptionsError"
            class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
            role="status"
          >
            {{ fareCardOptionsError }}
          </div>
          <div
            v-else-if="fareCardOptions.length === 0"
            class="mt-3 rounded-xl border border-slate-100 px-3 py-3 text-sm font-medium text-slate-500 dark:border-slate-800 dark:text-slate-400"
          >
            No discount cards are available in the imported fare data yet.
          </div>
          <div v-else class="mt-3 max-h-72 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-2 dark:border-slate-800">
            <label
              v-for="card in fareCardOptions"
              :key="fareCardKey(card)"
              class="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
            >
              <input
                type="checkbox"
                class="mt-0.5 rounded border-slate-300 text-brand-blue focus:ring-brand-blue dark:border-slate-600"
                :checked="isFareCardSelected(card)"
                :disabled="!fareProfileReady || savingFareProfile"
                @change="toggleFareCard(card, $event.target.checked)"
              >
              <span class="min-w-0">
                <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">{{ card.name }}</span>
                <span class="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  {{ [card.provider, fareProfileOptionType(card), ...(card.eligibility_notes || [])].filter(Boolean).join(' · ') }}
                  <template v-if="card.proof_required"> · {{ card.proof_required }}</template>
                </span>
              </span>
            </label>
          </div>
          <div v-if="staleFareProfileCards.length" class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
            <p class="text-xs font-bold text-amber-800 dark:text-amber-100">Saved options no longer appear in the active fare data</p>
            <div v-for="selection in staleFareProfileCards" :key="fareCardKey(selection)" class="mt-2 flex items-center justify-between gap-3">
              <span class="min-w-0 truncate text-xs font-medium text-amber-800 dark:text-amber-100">{{ selection.name || selection.source_identifier }}</span>
              <button type="button" :disabled="savingFareProfile" class="min-h-9 shrink-0 rounded-lg px-2 text-xs font-bold text-amber-900 underline dark:text-amber-100" @click="removeStaleFareCard(selection)">
                Remove
              </button>
            </div>
          </div>
        </fieldset>
      </div>

      <p
        v-if="fareProfileError"
        class="mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
        role="alert"
      >
        {{ fareProfileError }}
      </p>
      <p
        v-if="fareProfileSaved"
        class="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
        role="status"
      >
        Fare profile saved.
      </p>
    </section>

    <section class="ui-panel p-4 sm:p-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="ui-section-title">Notifications</h2>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Set up push notifications for service changes and saved stop updates.
          </p>
        </div>

        <button
          type="button"
          class="ui-button-primary"
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
        class="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      >
        Sign in to set up notification devices.
      </div>

      <div
        v-if="notificationTargetsError"
        class="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
      >
        {{ notificationTargetsError }}
      </div>

      <div v-if="auth0.isAuthenticated" class="mt-4 overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
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
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
                <span class="material-symbols-outlined text-[22px]">{{ notificationTargetIcon(target) }}</span>
              </span>
              <div class="min-w-0">
                <h3 class="truncate text-sm font-bold text-slate-950 dark:text-slate-100 sm:text-base">{{ notificationTargetName(target) }}</h3>
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

    <Modal
      v-model:open="confirmDeleteNotificationTargetOpen"
      title="Remove notification device?"
      :subtitle="`${notificationTargetName(notificationTargetPendingDelete)} will stop receiving notification updates.`"
      icon="delete"
      size="sm"
      close-label="Close notification device removal"
      :close-disabled="deletingNotificationToken !== ''"
      body-class="space-y-4 p-4 sm:p-5"
      @close="closeDeleteNotificationTargetConfirm"
    >
              <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  :disabled="deletingNotificationToken !== ''"
                  @click="closeDeleteNotificationTargetConfirm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="deletingNotificationToken !== ''"
                  @click="confirmDeleteNotificationTarget"
                >
                  <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': deletingNotificationToken !== '' }">
                    {{ deletingNotificationToken !== '' ? 'progress_activity' : 'delete' }}
                  </span>
                  {{ deletingNotificationToken !== '' ? 'Removing...' : 'Remove device' }}
                </button>
              </div>
    </Modal>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import notify from '@/notify'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'AccountSettings',
  components: {
    Modal,
    PageHeader
  },
  data() {
    return {
      auth0: useAuth0(),
      notify,
      fareProfileAge: '',
      fareProfileCards: [],
      fareCardOptions: [],
      loadingFareProfile: false,
      fareProfileReady: false,
      fareProfileController: null,
      fareCardOptionsError: '',
      savingFareProfile: false,
      fareProfileError: '',
      fareProfileSaved: false,
      loadingNotificationTargets: false,
      settingUpNotifications: false,
      deletingNotificationToken: '',
      confirmDeleteNotificationTargetOpen: false,
      notificationTargetPendingDelete: undefined,
      notificationTargetsError: '',
      notificationTargets: []
    }
  },
  computed: {
    fareProfileAccount() {
      if (this.auth0.isLoading) return null
      return this.auth0.isAuthenticated ? this.auth0.user?.sub || 'authenticated' : false
    },
    staleFareProfileCards() {
      if (!this.fareProfileReady || this.loadingFareProfile || this.fareCardOptionsError) return []
      return this.fareProfileCards.filter(selection => !this.fareCardOptions.some(option =>
        option.dataset_id === selection.dataset_id && option.source_identifier === selection.source_identifier
      ))
    }
  },
  watch: {
    fareProfileAccount() {
      this.loadFareProfile()
    }
  },
  methods: {
    fareCardKey(card) {
      return `${card.dataset_id}::${card.source_identifier}`
    },
    fareProfileOptionType(card) {
      if (card.kind === 'fare_category') return `${card.type || 'Passenger'} fare profile`
      return card.type
    },
    isFareCardSelected(card) {
      return this.fareProfileCards.some(selection =>
        selection.dataset_id === card.dataset_id && selection.source_identifier === card.source_identifier
      )
    },
    toggleFareCard(card, checked) {
      const key = this.fareCardKey(card)
      this.fareProfileCards = this.fareProfileCards.filter(selection => this.fareCardKey(selection) !== key)
      if (checked) {
        this.fareProfileCards.push({
          dataset_id: card.dataset_id,
          source_identifier: card.source_identifier,
          name: card.name,
          kind: card.kind
        })
      }
      this.fareProfileSaved = false
    },
    removeStaleFareCard(selection) {
      const key = this.fareCardKey(selection)
      this.fareProfileCards = this.fareProfileCards.filter(item => this.fareCardKey(item) !== key)
      this.fareProfileSaved = false
    },
    async loadFareProfile() {
      this.fareProfileController?.abort()
      this.fareProfileReady = false
      this.fareProfileAge = ''
      this.fareProfileCards = []
      this.fareCardOptions = []
      this.fareProfileError = ''
      this.fareCardOptionsError = ''
      this.fareProfileSaved = false
      this.savingFareProfile = false
      this.loadingFareProfile = Boolean(this.fareProfileAccount)
      if (!this.fareProfileAccount) return

      const controller = new AbortController()
      this.fareProfileController = controller
      try {
        const token = await getApiAccessToken(this.auth0)
        if (controller.signal.aborted) return
        const config = { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal, timeout: 16000 }
        const [profileResult, optionsResult] = await Promise.allSettled([
          axios.get(`${API.URL}/core/account/fareprofile`, config),
          axios.get(`${API.URL}/core/account/farecards`, config)
        ])
        if (controller.signal.aborted) return

        if (optionsResult.status === 'fulfilled') {
          this.fareCardOptions = optionsResult.value.data || []
        } else {
          this.fareCardOptionsError = 'Fare options could not be loaded. Saved selections will be kept.'
        }

        if (profileResult.status === 'rejected') {
          this.fareProfileError = 'Fare profile settings could not be loaded.'
          return
        }

        const profile = profileResult.value.data || {}
        this.fareProfileAge = profile.age === undefined || profile.age === null ? '' : String(profile.age)
        this.fareProfileCards = (profile.discount_cards || []).map(selection => {
          const option = this.fareCardOptions.find(card =>
            card.dataset_id === selection.dataset_id && card.source_identifier === selection.source_identifier
          )
          return {
            ...selection,
            name: selection.name || option?.name,
            kind: selection.kind || option?.kind
          }
        })
        this.fareProfileReady = true
      } catch (error) {
        if (controller.signal.aborted) return
        console.log(error)
        this.fareProfileError = 'Fare profile settings could not be loaded.'
        this.fareCardOptionsError = 'Fare options could not be loaded.'
      } finally {
        if (!controller.signal.aborted) this.loadingFareProfile = false
      }
    },
    async saveFareProfile() {
      const account = this.fareProfileAccount
      if (!account || !this.fareProfileReady || this.savingFareProfile || this.loadingFareProfile) return
      const age = this.fareProfileAge === '' ? null : Number(this.fareProfileAge)
      if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
        this.fareProfileError = 'Enter an age between 0 and 120.'
        this.fareProfileSaved = false
        return
      }
      this.savingFareProfile = true
      this.fareProfileError = ''
      this.fareProfileSaved = false
      try {
        const token = await getApiAccessToken(this.auth0)
        if (account !== this.fareProfileAccount) return
        const response = await axios.put(`${API.URL}/core/account/fareprofile`, {
          age,
          discount_cards: this.fareProfileCards
        }, { headers: { Authorization: `Bearer ${token}` } })
        if (account !== this.fareProfileAccount) return
        this.fareProfileCards = response.data?.discount_cards || this.fareProfileCards
        this.fareProfileSaved = true
      } catch (error) {
        if (account !== this.fareProfileAccount) return
        console.log(error)
        this.fareProfileError = error.response?.data?.error || 'Fare profile settings could not be saved.'
      } finally {
        if (account === this.fareProfileAccount) this.savingFareProfile = false
      }
    },
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
      return this.notify.getNotificationTargetName(target, 'This browser')
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
    this.loadFareProfile()
  },
  beforeUnmount() {
    this.fareProfileController?.abort()
  }
}
</script>
