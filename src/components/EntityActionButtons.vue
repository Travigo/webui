<template>
  <div class="relative" @click.stop>
    <button
      type="button"
      class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
      :aria-label="`${entityType} actions`"
      :aria-expanded="menuOpen"
      @click="toggleMenu"
    >
      <span class="material-symbols-outlined" style="font-size: 24px; line-height: 1">more_horiz</span>
    </button>

    <Transition name="entity-action-menu">
      <div
        v-if="menuOpen"
        class="absolute right-0 top-12 z-[80] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
      >
        <div class="p-2">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            @click="share"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">ios_share</span>
            Share
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            @click="save"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">bookmark</span>
            Save
          </button>

          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
            @click="registerNotifications"
          >
            <span class="material-symbols-outlined" style="font-size: 20px; line-height: 1">notifications_active</span>
            Notify me
          </button>
        </div>

        <p
          v-if="message"
          class="mx-2 mb-2 rounded-2xl border px-3 py-2 text-sm font-medium"
          :class="messageType === 'warning'
            ? 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
            : 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100'"
        >
          {{ message }}
        </p>
      </div>
    </Transition>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import notify from '@/notify'

export default {
  name: 'EntityActionButtons',
  props: {
    entityType: {
      type: String,
      required: true
    },
    entityName: {
      type: String,
      required: true
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
      notify
    }
  },
  computed: {
    readableEntityType() {
      return this.entityType.toLowerCase()
    }
  },
  methods: {
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
    async share() {
      const url = window.location.href
      const title = `${this.entityName} on Travigo`

      try {
        if (navigator.share) {
          await navigator.share({
            title,
            text: title,
            url
          })
          this.closeMenu()
          return
        }

        await navigator.clipboard.writeText(url)
        this.setMessage('Link copied to clipboard.')
      } catch (error) {
        if (error?.name !== 'AbortError') {
          this.setMessage('Could not share this link.', 'warning')
        }
      }
    },
    save() {
      this.setMessage(`Saving ${this.readableEntityType}s is not connected yet. This button is a placeholder.`, 'warning')
    },
    registerNotifications() {
      if (!this.isAuthenticated) {
        this.setMessage('Sign in to register notifications.', 'warning')
        this.loginWithRedirect({
          appState: {
            targetUrl: this.$route.fullPath
          }
        })
        return
      }

      if (!('Notification' in window)) {
        this.setMessage('Notifications are not available in this browser.', 'warning')
        return
      }

      this.notify.setupNotifications(this.auth0, this.$messaging)
      this.setMessage(`${this.entityType} notifications requested. Specific ${this.readableEntityType} alert rules are not connected yet.`, 'warning')
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
    document.removeEventListener('click', this.handleDocumentClick)
    document.removeEventListener('keydown', this.handleEscape)
  }
}
</script>

<style scoped>
.entity-action-menu-enter-active,
.entity-action-menu-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.entity-action-menu-enter-from,
.entity-action-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem) scale(0.98);
}
</style>
