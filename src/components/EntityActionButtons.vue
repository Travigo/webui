<template>
  <div class="relative" @click.stop>
    <IconButton
      ref="actionsButton"
      :icon="saved ? 'bookmark_added' : 'more_horiz'"
      :aria-label="saved ? `${entityType} actions, saved` : `${entityType} actions`"
      :aria-expanded="menuOpen"
      :label="saved ? `${entityType} actions, saved` : `${entityType} actions`"
      :shape="shape"
      :icon-size="24"
      :style="saved ? { color: 'var(--brand-blue)' } : undefined"
      @click="toggleMenu"
    />

    <Transition name="entity-action-menu">
      <div
        v-if="menuOpen"
        class="absolute right-0 top-12 z-[800] w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
      >
        <div class="p-2">
          <button
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light"
            @click="share"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">ios_share</span>
            Share
          </button>

          <button
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:disabled:text-slate-600"
            :class="saved ? 'text-brand-blue dark:text-brand-blue-light disabled:text-brand-blue dark:disabled:text-brand-blue-light' : saveDisabled
              ? 'text-slate-400 dark:text-slate-600'
              : 'text-slate-700 hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light'"
            :disabled="saveDisabled"
            :title="saveTitle"
            @click="save"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">{{ saved ? 'bookmark_added' : 'bookmark' }}</span>
            {{ saveLabel }}
          </button>

          <button
            type="button"
            class="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent dark:disabled:text-slate-600"
            :class="supportsNotifications
              ? 'text-slate-700 hover:bg-brand-blue/10 hover:text-brand-blue dark:text-slate-200 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light'
              : 'text-slate-400 dark:text-slate-600'"
            :disabled="!supportsNotifications"
            :title="supportsNotifications ? notificationActionLabel : 'Notifications are not connected for this yet'"
            @click="registerNotifications"
          >
            <span class="material-symbols-outlined" aria-hidden="true" style="font-size: 20px; line-height: 1">notifications_active</span>
            {{ notificationActionLabel }}
          </button>
        </div>

        <p
          v-if="message"
          class="mx-2 mb-2 rounded-xl border px-3 py-2 text-sm font-medium"
          :class="messageType === 'warning'
            ? 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
            : 'border-brand-blue/20 bg-brand-blue/10 text-brand-blue dark:border-brand-blue/40 dark:bg-brand-blue/20 dark:text-brand-blue-light'"
        >
          {{ message }}
        </p>
      </div>
    </Transition>

    <NotificationRuleModal
      ref="notificationModal"
      v-model:open="notificationModalOpen"
      :entity-type="entityType"
      :entity-name="entityName"
      :entity-identifier="entityIdentifier"
      :notification-types="availableNotificationTypes"
      :modal-title="notificationModalTitle"
      :show-form="notificationView === 'form'"
      :draft-key="editingNotification?.id || 'new'"
      :alert-presets="stopAlertPresets"
      :initial-notification-type="editingNotification?.notificationType || ''"
      :initial-values="editingNotification?.values"
      :saving="savingNotification"
      :save-label="editingNotification ? 'Save changes' : 'Save notification'"
      :save-error="notificationSaveError"
      :return-focus-to="notificationTrigger"
      @save="saveNotificationRule"
    >
      <template #content>
        <template v-if="notificationView === 'rules'">
          <p v-if="notificationRuleRequest" class="text-sm text-slate-600 dark:text-slate-300" role="status">Checking existing alerts…</p>
          <div v-if="notificationRulesError" class="text-sm text-amber-800 dark:text-amber-200">
            <p role="status">Existing alerts could not be loaded.</p>
            <button type="button" class="min-h-11 font-bold underline" @click="loadNotificationRules()">Try again</button>
          </div>
          <ul v-if="stopNotificationRules.length" class="space-y-2">
            <li v-for="rule in stopNotificationRules" :key="rule.id" class="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800">
              <p class="min-w-0 text-sm font-medium text-slate-700 dark:text-slate-200">{{ notificationSummary(rule) }}</p>
              <button type="button" class="min-h-11 shrink-0 rounded-lg px-2 text-sm font-bold text-brand-blue dark:text-brand-blue-light" :aria-label="`Edit alert for ${notificationSummary(rule)}`" @click="openNotificationForm(rule)">Edit</button>
            </li>
          </ul>
          <p v-else-if="!notificationRuleRequest && !notificationRulesError" class="text-sm text-slate-600 dark:text-slate-300">There are no alerts for this stop yet.</p>
        </template>
        <p v-else-if="notificationView === 'success'" class="rounded-xl bg-green-50 px-3 py-3 text-sm font-semibold text-green-800 dark:text-green-200" role="status">{{ notificationSummary(confirmedNotification) }}</p>
        <button v-else-if="stopNotificationRules.length" type="button" class="min-h-11 text-sm font-bold text-brand-blue dark:text-brand-blue-light" :disabled="savingNotification" @click="notificationView = 'rules'; focusNotificationContent()">Back to alerts</button>
      </template>
      <template #footer-note v-if="notificationView !== 'rules' && isAuthenticated">
        <div class="mb-3 space-y-1 text-xs font-medium text-slate-700 dark:text-slate-200">
          <p><strong>Delivery</strong> · {{ notificationDeliveryStatus }}</p>
          <p v-if="browserDeliveryStatus">{{ browserDeliveryStatus }}</p>
          <router-link :to="{ name: 'account/settings' }" target="_blank" rel="noopener" class="inline-flex min-h-8 items-center font-bold text-brand-blue underline-offset-4 hover:underline dark:text-brand-blue-light">
            {{ browserDeliveryStatus ? 'Set up this browser' : 'Manage devices' }} <span class="sr-only"> (opens in a new tab)</span>
          </router-link>
        </div>
      </template>
      <template #footer-actions>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <button type="button" class="min-h-11 rounded-lg px-3 text-sm font-bold" @click="notificationModalOpen = false">{{ notificationView === 'success' ? 'Done' : 'Close' }}</button>
          <button v-if="notificationView === 'rules' && (!notificationRuleRequest || stopNotificationRules.length)" type="button" class="min-h-11 rounded-lg bg-brand-blue px-4 text-sm font-bold text-white" @click="openNotificationForm()">{{ stopNotificationRules.length ? 'Add another alert' : 'Add an alert' }}</button>
          <router-link v-if="notificationView === 'success'" :to="{ name: 'account/notifications' }" class="inline-flex min-h-11 items-center rounded-lg bg-brand-blue px-4 text-sm font-bold text-white">Manage notifications</router-link>
        </div>
      </template>
    </NotificationRuleModal>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import IconButton from '@/components/IconButton.vue'
import NotificationRuleModal from '@/components/NotificationRuleModal.vue'
import { NOTIFICATION_DAYS_OF_WEEK, notificationRuleTypesForSubject } from '@/notificationRuleTypes'
import notificationSubscriptions from '@/notificationSubscriptions'
import notify from '@/notify'
import { auth0CacheScope, CACHE_MAX_AGE, cacheKeys, getCachedResource } from '@/offline/resourceCache'

const stopAlertPresets = [
  { label: 'Closures only', values: ['StopClosed'] },
  { label: 'Major disruption', values: ['StopClosed', 'ServiceSuspended', 'ServicePartSuspended', 'SevereDelays', 'JourneyCancelled'] }
]

export default {
  name: 'EntityActionButtons',
  components: {
    IconButton,
    NotificationRuleModal
  },
  props: {
    entityType: {
      type: String,
      required: true
    },
    entityName: {
      type: String,
      required: true
    },
    entityIdentifier: {
      type: String,
      default: ''
    },
    shape: {
      type: String,
      default: 'circle',
      validator: value => ['circle', 'square'].includes(value)
    },
    notificationTypes: {
      type: Array,
      default: () => []
    }
  },
  setup() {
    const auth0 = useAuth0()

    return {
      auth0,
      isAuthenticated: auth0.isAuthenticated,
      loginWithRedirect: auth0.loginWithRedirect
    }
  },
  data() {
    return {
      menuOpen: false,
      message: '',
      messageType: 'info',
      saving: false,
      saved: false,
      checkingSaved: false,
      savedLookup: null,
      savingNotification: false,
      notificationModalOpen: false,
      notificationView: 'form',
      notificationRules: [],
      notificationRulesLoaded: false,
      notificationRuleRequest: null,
      notificationRulesError: false,
      editingNotification: null,
      confirmedNotification: null,
      notificationSaveError: '',
      notificationDeliveryStatus: '',
      browserDeliveryStatus: '',
      notificationDeviceRequest: null
    }
  },
  computed: {
    savedAccountScope() {
      return this.isAuthenticated ? auth0CacheScope(this.auth0) : null
    },
    readableEntityType() {
      return this.entityType.toLowerCase()
    },
    supportsSave() {
      return ['stop', 'journey'].includes(this.readableEntityType)
    },
    supportsNotifications() {
      return this.availableNotificationTypes.length > 0
    },
    notificationSubjectKey() {
      return JSON.stringify([this.savedAccountScope, this.entityType, this.entityIdentifier])
    },
    canLoadStopRules() {
      return this.readableEntityType === 'stop' && this.supportsNotifications && this.isAuthenticated && Boolean(this.entityIdentifier)
    },
    stopNotificationRules() {
      return this.notificationRules.filter(rule => rule.entityType === 'Stop' && rule.entityIdentifier === this.entityIdentifier)
    },
    notificationActionLabel() {
      return this.stopNotificationRules.length ? 'Manage alerts' : 'Notify me'
    },
    notificationModalTitle() {
      if (this.notificationView === 'success') return 'Notification saved'
      if (this.notificationView === 'rules') return 'Manage alerts'
      return this.editingNotification ? 'Edit notification' : 'Create notification'
    },
    stopAlertPresets() {
      return this.readableEntityType === 'stop' ? stopAlertPresets : []
    },
    availableNotificationTypes() {
      if (this.notificationTypes.length > 0) {
        return this.notificationTypes
      }

      return notificationRuleTypesForSubject(this.entityType)
    },
    saveDisabled() {
      return !this.supportsSave || this.checkingSaved || this.saving || this.saved
    },
    saveLabel() {
      if (this.saved) {
        return 'Saved'
      }

      if (this.saving) {
        return 'Saving...'
      }

      if (this.checkingSaved) return 'Checking saved status…'

      return 'Save'
    },
    saveTitle() {
      if (!this.supportsSave) {
        return `Saving ${this.readableEntityType}s is not available yet`
      }

      if (this.saved) {
        return 'Saved'
      }

      return `Save ${this.readableEntityType}`
    }
  },
  watch: {
    notificationSubjectKey() {
      this.notificationRules = []
      this.notificationRulesLoaded = false
      this.notificationRuleRequest = null
      this.notificationRulesError = false
      this.notificationDeviceRequest = null
      this.notificationModalOpen = false
    },
    savedAccountScope: { immediate: true, handler: 'getSavedStatus' },
    entityIdentifier: 'getSavedStatus',
    entityType: 'getSavedStatus'
  },
  methods: {
    async getSavedStatus() {
      this.savedLookup?.abort()
      this.saved = false
      this.checkingSaved = false

      const scope = this.savedAccountScope
      if (!scope || !this.entityIdentifier || !this.supportsSave) return

      const identifier = this.entityIdentifier
      const type = this.readableEntityType
      const lookup = new AbortController()
      this.savedLookup = lookup
      this.checkingSaved = true

      try {
        const token = await getApiAccessToken(this.auth0)
        if (lookup.signal.aborted) return
        // The default response supplies saved identifiers without hydrating stops or journeys.
        const { data } = await axios.get(`${API.URL}/core/saved`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: lookup.signal,
          timeout: 8000
        })
        if (lookup.signal.aborted) return
        const items = Array.isArray(data) ? data : []
        this.saved = items.some(item => {
          const itemType = String(item?.Type || '').toLowerCase()
          return (itemType === type || itemType === `${type}s`) && item.ObjectIdentifier === identifier
        })
      } catch {
        if (lookup.signal.aborted) return
        const cached = await getCachedResource(cacheKeys.savedItems, { scope, maxAgeMs: CACHE_MAX_AGE.savedItems })
        if (lookup.signal.aborted) return
        const items = type === 'stop' ? cached?.data?.savedStops : cached?.data?.savedJourneys
        this.saved = items?.some(item => item.SavedObjectIdentifier === identifier || item.PrimaryIdentifier === identifier) ?? false
      } finally {
        if (!lookup.signal.aborted) this.checkingSaved = false
      }
    },
    toggleMenu() {
      this.menuOpen = !this.menuOpen
      if (this.menuOpen && this.canLoadStopRules) this.loadNotificationRules()
    },
    closeMenu() {
      this.menuOpen = false
    },
    setMessage(message, type = 'info') {
      this.menuOpen = true
      this.message = message
      this.messageType = type
    },
    showToast(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('travigo-toast', {
        detail: {
          message,
          type
        }
      }))
    },
    async share() {
      const url = window.location.href
      const title = `${this.entityName} on Travigo`
      this.closeMenu()

      try {
        if (navigator.share) {
          await navigator.share({
            title,
            text: title,
            url
          })
          return
        }

        await navigator.clipboard.writeText(url)
        this.showToast('Link copied to clipboard.', 'success')
      } catch (error) {
        if (error?.name !== 'AbortError') {
          this.showToast('Could not share this link.', 'warning')
        }
      }
    },
    async save() {
      if (this.saveDisabled) {
        return
      }

      if (!this.isAuthenticated) {
        this.closeMenu()
        this.showToast(`Sign in to save ${this.readableEntityType}s.`, 'warning')
        return
      }

      if (!this.entityIdentifier) {
        this.closeMenu()
        this.showToast(`This ${this.readableEntityType} could not be saved.`, 'error')
        return
      }

      this.saving = true
      const identifier = this.entityIdentifier
      const type = this.entityType
      const scope = this.savedAccountScope

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        await axios.post(`${API.URL}/core/saved`, {
          Type: type,
          ObjectIdentifier: identifier
        }, {
          headers: {
            Authorization: `Bearer ${auth0token}`
          },
          params: { view: 'web' }
        })

        if (scope !== this.savedAccountScope || identifier !== this.entityIdentifier || type !== this.entityType) return
        this.saved = true
        this.closeMenu()
        this.showToast(`${this.entityName} saved.`, 'success')
      } catch (error) {
        console.log(error)

        if (error.response?.status === 409) {
          if (scope !== this.savedAccountScope || identifier !== this.entityIdentifier || type !== this.entityType) return
          this.saved = true
          this.closeMenu()
          this.showToast(`${this.entityName} is already saved.`, 'success')
          return
        }

        this.showToast(`Saved ${this.readableEntityType} could not be updated.`, 'error')
      } finally {
        this.saving = false
      }
    },
    async registerNotifications() {
      if (!this.supportsNotifications) return

      this.editingNotification = null
      this.confirmedNotification = null
      this.notificationSaveError = ''
      this.notificationView = this.canLoadStopRules ? 'rules' : 'form'
      this.closeMenu()
      this.notificationModalOpen = true
      this.loadNotificationDevices()

      if (this.canLoadStopRules) {
        await (this.notificationRuleRequest || (!this.notificationRulesLoaded && this.loadNotificationRules()))
        if (this.notificationModalOpen && this.notificationView === 'rules' &&
            !this.notificationRulesError && !this.stopNotificationRules.length) this.openNotificationForm()
      }
    },
    notificationTrigger() {
      return this.$refs.actionsButton?.$el
    },
    focusNotificationContent() {
      this.$refs.notificationModal?.focusContent()
    },
    openNotificationForm(rule = null) {
      this.editingNotification = rule
      this.notificationSaveError = ''
      this.notificationView = 'form'
      this.focusNotificationContent()
    },
    loadNotificationRules() {
      if (!this.canLoadStopRules || this.notificationRuleRequest) return this.notificationRuleRequest

      this.notificationRulesError = false
      const request = notificationSubscriptions.list(this.auth0, { resolveSubjects: false })
        .then(rules => {
          if (this.notificationRuleRequest !== request) return
          this.notificationRules = rules
          this.notificationRulesLoaded = true
        })
        .catch(() => {
          if (this.notificationRuleRequest === request) this.notificationRulesError = true
        })
        .finally(() => {
          if (this.notificationRuleRequest === request) this.notificationRuleRequest = null
        })
      this.notificationRuleRequest = request
      return request
    },
    async loadNotificationDevices() {
      if (!this.isAuthenticated || this.notificationDeviceRequest) return

      this.notificationDeliveryStatus = 'Checking registered devices…'
      const permission = window.Notification?.permission
      this.browserDeliveryStatus = permission === 'denied' ? 'This browser is blocking push notifications.'
        : permission === 'default' ? 'Push notifications are off in this browser.'
        : !permission ? 'Push delivery is unavailable in this browser.' : ''

      const request = notify.listNotificationTargets(this.auth0)
      this.notificationDeviceRequest = request
      try {
        const targets = await request
        if (this.notificationDeviceRequest !== request) return
        const names = targets.map(target => notify.getNotificationTargetName(target))
        this.notificationDeliveryStatus = names.length ? `Registered devices: ${names.join(', ')}` : 'No devices are registered yet.'
        if (!names.length && !this.browserDeliveryStatus) this.browserDeliveryStatus = 'Set up a device to receive alerts.'
      } catch {
        if (this.notificationDeviceRequest === request) this.notificationDeliveryStatus = 'Could not check registered devices.'
      } finally {
        if (this.notificationDeviceRequest === request) this.notificationDeviceRequest = null
      }
    },
    notificationSummary(rule) {
      const type = this.availableNotificationTypes.find(option => option.id === rule.notificationType)
      const days = rule.values?.daysOfWeek || NOTIFICATION_DAYS_OF_WEEK
      const schedule = days.length === NOTIFICATION_DAYS_OF_WEEK.length ? 'Every day' : days.join(', ')
      if (rule.notificationType === 'service-alert') {
        const alertValues = rule.values?.serviceAlertTypes || []
        const alertOptions = type?.fields.find(field => field.id === 'serviceAlertTypes')?.options || []
        const labels = alertOptions.filter(option => alertValues.includes(option.value)).map(option => option.label)
        const alerts = !labels.length || labels.length === alertOptions.length ? 'All alert types' : labels.join(', ')
        return `${alerts} · ${schedule}`
      }

      const eventOptions = type?.fields.find(field => field.id === 'realtimeJourneyEvent')?.options || []
      const event = eventOptions.find(option => option.value === rule.values?.realtimeJourneyEvent)
      return `${event?.label || type?.label || 'Live journey changes'} · ${schedule}`
    },
    async saveNotificationRule(rule) {
      if (this.savingNotification) return

      if (!this.isAuthenticated) {
        this.showToast('Sign in to save notification rules.', 'warning')
        this.loginWithRedirect({
          appState: {
            targetUrl: this.$route.fullPath
          }
        })
        return
      }

      if (!this.entityIdentifier) {
        this.notificationSaveError = `This ${this.readableEntityType} could not be used for notifications.`
        return
      }

      this.notificationSaveError = ''
      this.savingNotification = true
      const subject = this.notificationSubjectKey
      const editing = this.editingNotification

      try {
        const saved = editing
          ? await notificationSubscriptions.update(this.auth0, { ...rule, id: editing.id })
          : await notificationSubscriptions.create(this.auth0, rule)
        if (subject !== this.notificationSubjectKey || !this.notificationModalOpen) return

        this.notificationRules = [...this.notificationRules.filter(rule => rule.id !== saved.id), saved]
        this.confirmedNotification = saved
        this.notificationView = 'success'
        this.focusNotificationContent()
      } catch (error) {
        if (subject !== this.notificationSubjectKey) return
        this.notificationSaveError = error.response?.status === 409
          ? 'You’ve reached your notification rule limit. Remove an existing rule to add another.'
          : 'Could not save this notification. Try again.'
      } finally {
        this.savingNotification = false
      }
    },
    handleDocumentClick() {
      this.closeMenu()
    },
    handleEscape(event) {
      if (event.key === 'Escape') {
        this.closeMenu()
      }
    },
    refreshNotificationDelivery() {
      if (this.notificationModalOpen && !document.hidden) this.loadNotificationDevices()
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
    document.addEventListener('keydown', this.handleEscape)
    document.addEventListener('visibilitychange', this.refreshNotificationDelivery)
  },
  beforeUnmount() {
    this.savedLookup?.abort()
    this.notificationRuleRequest = null
    this.notificationDeviceRequest = null
    document.removeEventListener('click', this.handleDocumentClick)
    document.removeEventListener('keydown', this.handleEscape)
    document.removeEventListener('visibilitychange', this.refreshNotificationDelivery)
  }
}
</script>

<style scoped>
.entity-action-menu-enter-active,
.entity-action-menu-leave-active {
  transition: opacity var(--motion-reveal) ease, transform var(--motion-reveal) var(--motion-ease-out);
}

.entity-action-menu-enter-from,
.entity-action-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
</style>
