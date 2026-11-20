<template>
  <div class="relative" @click.stop>
    <IconButton
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
            :title="supportsNotifications ? 'Create notification' : 'Notifications are not connected for this yet'"
            @click="registerNotifications"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">notifications_active</span>
            Notify me
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
      v-model:open="notificationModalOpen"
      :entity-type="entityType"
      :entity-name="entityName"
      :entity-identifier="entityIdentifier"
      :notification-types="availableNotificationTypes"
      @save="saveNotificationRule"
    />
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import IconButton from '@/components/IconButton.vue'
import NotificationRuleModal from '@/components/NotificationRuleModal.vue'
import { notificationRuleTypesForSubject } from '@/notificationRuleTypes'
import notificationSubscriptions from '@/notificationSubscriptions'
import { auth0CacheScope, CACHE_MAX_AGE, cacheKeys, getCachedResource } from '@/offline/resourceCache'

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
      notificationModalOpen: false
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
    registerNotifications() {
      if (!this.supportsNotifications) {
        return
      }

      this.closeMenu()
      this.notificationModalOpen = true
    },
    async saveNotificationRule(rule) {
      if (!this.isAuthenticated) {
        this.showToast('Sign in to save notification rules.', 'warning')
        this.loginWithRedirect({
          appState: {
            targetUrl: this.$route.fullPath
          }
        })
        return
      }

      if (!this.entityIdentifier || this.savingNotification) {
        this.showToast(`This ${this.readableEntityType} could not be used for notifications.`, 'error')
        return
      }

      this.savingNotification = true

      try {
        await notificationSubscriptions.create(this.auth0, rule)
        this.showToast('Notification rule saved.', 'success')
      } catch (error) {
        console.log(error)
        this.showToast(
          error.response?.status === 409
            ? 'Your notification rule limit has been reached.'
            : 'Notification rule could not be saved.',
          error.response?.status === 409 ? 'warning' : 'error'
        )
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
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
    document.addEventListener('keydown', this.handleEscape)
  },
  beforeUnmount() {
    this.savedLookup?.abort()
    document.removeEventListener('click', this.handleDocumentClick)
    document.removeEventListener('keydown', this.handleEscape)
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
