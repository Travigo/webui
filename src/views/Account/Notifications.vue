<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Account"
      title="Notifications"
      subtitle="Choose the live changes and service updates that matter to you."
      icon="notifications_active"
      variant="panel"
    >
      <div
        v-if="auth0.isAuthenticated"
        class="ui-subtle flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-slate-950 dark:text-slate-100">Rules used</p>
            <p class="text-xs font-bold text-slate-500 dark:text-slate-400">
              {{ ruleUsage }} / {{ ruleLimit }}
            </p>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              class="h-full rounded-full transition-all"
              :class="ruleLimitReached ? 'bg-red-500' : 'bg-brand-blue'"
              :style="{ width: `${ruleLimitPercent}%` }"
            ></div>
          </div>
        </div>
        <span
          class="shrink-0 self-start rounded-full px-2.5 py-1 text-xs font-bold sm:self-auto"
          :class="ruleLimitReached
            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200'
            : 'bg-white text-brand-blue shadow-sm dark:bg-slate-900 dark:text-brand-blue-light'"
        >
          {{ ruleLimitReached ? 'Limit reached' : `${ruleLimitRemaining} remaining` }}
        </span>
      </div>
    </PageHeader>

    <section
      v-if="!auth0.isLoading && !auth0.isAuthenticated"
      class="ui-panel border-dashed px-5 py-10 text-center"
    >
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
        <span class="material-symbols-outlined text-[25px]">lock</span>
      </span>
      <h2 class="ui-section-title mt-3">Sign in to view notifications</h2>
      <p class="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
        Your notification rules are private to your Travigo account.
      </p>
    </section>

    <section
      v-else-if="loadingRules"
      class="grid gap-3 sm:grid-cols-2"
    >
      <div
        v-for="index in 2"
        :key="index"
        class="ui-panel h-56 animate-pulse p-5"
      >
        <div class="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
        <div class="mt-5 h-4 w-2/3 rounded bg-slate-100 dark:bg-slate-800"></div>
        <div class="mt-2 h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800"></div>
        <div class="mt-6 h-16 rounded-xl bg-slate-50 dark:bg-slate-950"></div>
      </div>
    </section>

    <section
      v-else-if="rulesError"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100 sm:rounded-xl sm:px-5"
    >
      {{ rulesError }}
    </section>

    <section
      v-if="auth0.isAuthenticated && !loadingRules && !rulesError"
      class="space-y-3"
    >
      <h2 class="ui-section-title px-1">Your rules</h2>

      <div
        v-if="notificationRules.length === 0"
        class="ui-panel border-dashed px-5 py-10 text-center"
      >
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
          <span class="material-symbols-outlined text-[25px]">notifications_off</span>
        </span>
        <h3 class="ui-section-title mt-3">No rules yet</h3>
        <p class="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
          Open a stop, service or journey and choose “Notify me” from its actions menu.
        </p>
      </div>

      <div v-else class="ui-panel divide-y divide-slate-100 dark:divide-slate-800">
        <article
          v-for="rule in notificationRules"
          v-bind:key="rule.id"
          class="flex flex-col p-4 sm:p-5"
        >
          <div class="flex min-w-0 items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
              <span class="material-symbols-outlined text-[23px]">{{ notificationTypeIcon(rule.notificationType) }}</span>
            </span>

            <div class="min-w-0">
              <p class="ui-eyebrow">
                {{ rule.entityType || 'Notification' }} · {{ notificationTypeLabel(rule.notificationType) }}
              </p>
              <router-link
                v-if="entityRoute(rule)"
                :to="entityRoute(rule)"
                class="mt-1 block text-base font-bold leading-snug text-slate-950 transition hover:text-brand-blue dark:text-slate-100 dark:hover:text-brand-blue-light"
              >
                {{ rule.entityName }}
              </router-link>
              <h3 v-else class="mt-1 text-base font-bold leading-snug text-slate-950 dark:text-slate-100">
                {{ rule.entityName }}
              </h3>
              <p v-if="rule.entityDescription" class="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {{ rule.entityDescription }}
              </p>
            </div>
          </div>

          <div class="ui-subtle mt-4 flex-1 p-3.5">
            <p class="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">Notify me when</p>
            <p class="mt-1 text-sm font-bold leading-snug text-slate-900 dark:text-slate-100">
              {{ ruleTriggerSummary(rule) }}
            </p>

            <div v-if="ruleConditions(rule).length > 0" class="mt-3 space-y-3">
              <div v-for="condition in ruleConditions(rule)" :key="condition.label">
                <p class="text-xs font-bold text-slate-500 dark:text-slate-400">{{ condition.label }}</p>
                <div class="mt-1.5 flex flex-wrap gap-1.5">
                  <span
                    v-for="(value, index) in condition.values"
                    :key="`${value}-${index}`"
                    class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200"
                  >
                    {{ value }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-slate-400 dark:text-slate-500">{{ updatedLabel(rule) }}</p>
            <div class="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand-blue/10 px-3 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/20 disabled:opacity-50 dark:bg-brand-blue/100/10 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/20"
                :disabled="savingRuleIdentifier === rule.id"
                :aria-label="`Edit ${rule.entityName} notification`"
                @click="openEditRule(rule)"
              >
                <span class="material-symbols-outlined text-[18px]">edit</span>
                Edit
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                :disabled="deletingRuleIdentifier === rule.id"
                :aria-label="`Delete ${rule.entityName} notification`"
                @click="openDeleteRule(rule)"
              >
                <span class="material-symbols-outlined text-[19px]">delete</span>
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>

    <NotificationRuleModal
      v-model:open="ruleModalOpen"
      :key="ruleModalKey"
      :entity-type="activeRuleEntityType"
      :entity-name="activeRuleEntityName"
      :entity-identifier="activeRuleEntityIdentifier"
      :notification-types="activeNotificationTypes"
      modal-title="Edit notification"
      save-label="Save changes"
      :initial-notification-type="editingRule?.notificationType || ''"
      :initial-values="editingRule?.values || {}"
      show-entity-context
      @save="saveRule"
    />

    <Modal
      v-model:open="deleteModalOpen"
      title="Delete notification?"
      :subtitle="rulePendingDeletion?.entityName || ''"
      icon="delete"
      close-label="Close delete notification dialog"
      body-class="space-y-4 p-4 sm:p-5"
    >
      <p class="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
        This notification rule will be permanently removed.
      </p>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          :disabled="Boolean(deletingRuleIdentifier)"
          @click="closeDeleteRule"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
          :disabled="Boolean(deletingRuleIdentifier)"
          @click="deleteRule"
        >
          <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': deletingRuleIdentifier }">
            {{ deletingRuleIdentifier ? 'progress_activity' : 'delete' }}
          </span>
          {{ deletingRuleIdentifier ? 'Deleting…' : 'Delete rule' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import Modal from '@/components/Modal.vue'
import NotificationRuleModal from '@/components/NotificationRuleModal.vue'
import PageHeader from '@/components/PageHeader.vue'
import { notificationRuleTypesForSubject } from '@/notificationRuleTypes'
import notificationSubscriptions from '@/notificationSubscriptions'

const REALTIME_JOURNEY_SUMMARIES = {
  RealtimeJourneyCreated: 'live data becomes available for this journey',
  RealtimeJourneyActivelyTracked: 'live tracking starts for this journey',
  RealtimeJourneyPlatformSet: 'a platform is assigned to this journey',
  RealtimeJourneyPlatformChanged: 'the platform for this journey changes',
  RealtimeJourneyCancelled: 'this journey is cancelled',
  RealtimeJourneyOverlayCreated: 'this journey is replaced',
  RealtimeJourneyLocationTextChanged: 'the live location description changes',
  RealtimeJourneyNextStopChanged: 'the next stop changes'
}

export default {
  name: 'AccountNotifications',
  components: {
    Modal,
    NotificationRuleModal,
    PageHeader
  },
  data() {
    return {
      auth0: useAuth0(),
      ruleLimit: 0,
      ruleUsage: 0,
      loadingRules: false,
      rulesError: '',
      savingRuleIdentifier: '',
      deletingRuleIdentifier: '',
      ruleModalOpen: false,
      deleteModalOpen: false,
      editingRule: null,
      rulePendingDeletion: null,
      notificationRules: []
    }
  },
  computed: {
    ruleLimitReached() {
      return this.ruleLimit > 0 && this.ruleUsage >= this.ruleLimit
    },
    ruleLimitRemaining() {
      return Math.max(this.ruleLimit - this.ruleUsage, 0)
    },
    ruleLimitPercent() {
      if (this.ruleLimit === 0) {
        return 0
      }

      return Math.min(Math.round((this.ruleUsage / this.ruleLimit) * 100), 100)
    },
    activeRuleEntityType() {
      return this.editingRule?.entityType || ''
    },
    activeRuleEntityName() {
      return this.editingRule?.entityName || ''
    },
    activeRuleEntityIdentifier() {
      return this.editingRule?.entityIdentifier || ''
    },
    ruleModalKey() {
      return this.editingRule ? `edit-${this.editingRule.id}` : 'edit-none'
    },
    notificationTypes() {
      return notificationRuleTypesForSubject('Journey')
    },
    activeNotificationTypes() {
      const stopRefs = this.editingRule?.values?.platformStopRefs || []
      const resolvedStopRefs = this.editingRule?.resolvedValues?.platformStopRefs || []
      const resolvedStopsByRef = new Map(resolvedStopRefs.map(stop => [stop.value, stop]))

      const stopOptions = stopRefs.map((stopRef, index) => {
        const stop = resolvedStopsByRef.get(stopRef)

        return {
          value: stopRef,
          label: stop?.label || `Stop ${index + 1}`,
          description: stop?.description || ''
        }
      })

      return notificationRuleTypesForSubject(this.activeRuleEntityType, {
        stopOptions
      })
    }
  },
  watch: {
    'auth0.isAuthenticated'() {
      this.loadRules()
    }
  },
  methods: {
    async loadRules() {
      this.rulesError = ''

      if (!this.auth0.isAuthenticated) {
        this.notificationRules = []
        this.ruleUsage = 0
        this.ruleLimit = 0
        return
      }

      this.loadingRules = true

      try {
        const [rules, quota] = await Promise.all([
          notificationSubscriptions.list(this.auth0),
          notificationSubscriptions.quota(this.auth0)
        ])
        this.notificationRules = rules
        this.ruleUsage = quota.used
        this.ruleLimit = quota.limit
      } catch (error) {
        console.log(error)
        this.notificationRules = []
        this.rulesError = 'Notification rules could not be loaded.'
      } finally {
        this.loadingRules = false
      }
    },
    openEditRule(rule) {
      if (this.savingRuleIdentifier || this.deletingRuleIdentifier) {
        return
      }

      this.editingRule = rule
      this.ruleModalOpen = true
    },
    async saveRule(rule) {
      if (!this.editingRule) {
        return
      }

      const existingRule = this.editingRule
      this.savingRuleIdentifier = existingRule.id

      try {
        const updatedRule = await notificationSubscriptions.update(this.auth0, {
          ...existingRule,
          ...rule
        })
        this.notificationRules = this.notificationRules.map(notificationRule => notificationRule.id === existingRule.id
          ? { ...existingRule, ...updatedRule }
          : notificationRule)
        this.showToast('Notification rule updated.', 'success')
        this.editingRule = null
      } catch (error) {
        console.log(error)
        this.showToast('Notification rule could not be updated.', 'error')
      } finally {
        this.savingRuleIdentifier = ''
      }
    },
    openDeleteRule(rule) {
      if (this.savingRuleIdentifier || this.deletingRuleIdentifier) {
        return
      }

      this.rulePendingDeletion = rule
      this.deleteModalOpen = true
    },
    closeDeleteRule() {
      if (this.deletingRuleIdentifier) {
        return
      }

      this.deleteModalOpen = false
      this.rulePendingDeletion = null
    },
    async deleteRule() {
      if (!this.rulePendingDeletion) {
        return
      }

      const deletedRule = this.rulePendingDeletion
      this.deletingRuleIdentifier = deletedRule.id

      try {
        await notificationSubscriptions.delete(this.auth0, deletedRule.id)
        this.notificationRules = this.notificationRules.filter(rule => rule.id !== deletedRule.id)
        this.ruleUsage = Math.max(this.ruleUsage - 1, 0)
        this.deleteModalOpen = false
        this.rulePendingDeletion = null
        this.showToast('Notification rule deleted.', 'success')
      } catch (error) {
        console.log(error)
        this.showToast('Notification rule could not be deleted.', 'error')
      } finally {
        this.deletingRuleIdentifier = ''
      }
    },
    notificationType(typeId) {
      return this.notificationTypes.find(type => type.id === typeId) || null
    },
    notificationTypeLabel(typeId) {
      return this.notificationType(typeId)?.label || 'Notification'
    },
    notificationTypeIcon(typeId) {
      return this.notificationType(typeId)?.icon || 'notifications_active'
    },
    entityRoute(rule) {
      if (!rule.entityResolved || !rule.entityIdentifier) {
        return null
      }

      const routeName = {
        Stop: 'stops/view',
        Service: 'services/view',
        Journey: 'journeys/view'
      }[rule.entityType]

      return routeName
        ? { name: routeName, params: { id: rule.entityIdentifier } }
        : null
    },
    ruleTriggerSummary(rule) {
      if (rule.notificationType === 'service-alert') {
        return `a matching alert is published for this ${String(rule.entityType || 'subject').toLowerCase()}`
      }

      const eventValue = rule.values?.realtimeJourneyEvent
      return REALTIME_JOURNEY_SUMMARIES[eventValue] || 'this journey changes'
    },
    ruleConditions(rule) {
      if (rule.notificationType === 'service-alert') {
        const notificationType = this.notificationType(rule.notificationType)
        const alertField = notificationType?.fields.find(field => field.id === 'serviceAlertTypes')
        const selectedAlerts = rule.values?.serviceAlertTypes || []

        if (!alertField || selectedAlerts.length === 0) {
          return []
        }

        const values = selectedAlerts.length === alertField.options.length
          ? ['All alert types']
          : selectedAlerts.map(value => this.optionLabel(alertField, value))

        return [{ label: 'Alert types', values }]
      }

      const platformStops = rule.resolvedValues?.platformStopRefs || []
      return platformStops.length > 0
        ? [{
            label: platformStops.length === 1 ? 'At this stop' : 'At these stops',
            values: platformStops.map(stop => stop.label)
          }]
        : []
    },
    updatedLabel(rule) {
      const value = rule.modificationDateTime || rule.creationDateTime

      if (!value) {
        return 'Saved notification'
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return 'Saved notification'
      }

      return `Updated ${new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric'
      }).format(date)}`
    },
    optionLabel(field, optionValue) {
      return field.options.find(option => option.value === optionValue)?.label || optionValue
    },
    showToast(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('travigo-toast', {
        detail: {
          message,
          type
        }
      }))
    }
  },
  mounted() {
    this.loadRules()
  }
}
</script>
