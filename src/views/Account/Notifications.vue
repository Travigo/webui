<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <PageHeader
      eyebrow="Account"
      title="Notifications"
      subtitle="Manage the rules Travigo should use when sending notifications."
      icon="notifications_active"
      variant="panel"
    />

    <section class="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-amber-900 shadow-sm shadow-amber-100/60 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 dark:shadow-black/20 sm:rounded-3xl sm:p-5">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-amber-600 dark:bg-slate-900/70 dark:text-amber-200">
          <span class="material-symbols-outlined text-[23px]">info</span>
        </span>
        <div>
          <h2 class="text-base font-extrabold sm:text-lg">Placeholder preferences</h2>
          <p class="mt-1 text-sm font-medium leading-relaxed">
            These notification rules are placeholder data. Editing and deleting updates this page only until rule storage is connected.
          </p>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Saved rule usage</h2>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {{ notificationRules.length }} of {{ ruleLimit }} saved notification rules used.
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold"
          :class="ruleLimitReached
            ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200'
            : 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200'"
        >
          {{ ruleLimitRemaining }} left
        </span>
      </div>

      <div class="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          class="h-full rounded-full transition-all"
          :class="ruleLimitReached ? 'bg-red-500' : 'bg-blue-600'"
          :style="{ width: `${ruleLimitPercent}%` }"
        ></div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Configured notifications</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Rules that would be evaluated when data changes.</p>
        </div>
      </div>

      <div v-if="notificationRules.length === 0" class="px-4 py-6 sm:px-5">
        <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          No placeholder notification rules are configured.
        </div>
      </div>

      <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
        <article
          v-for="rule in notificationRules"
          v-bind:key="rule.id"
          class="px-4 py-4 sm:px-5"
        >
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
              <span class="material-symbols-outlined text-[23px]">{{ notificationTypeIcon(rule.notificationType) }}</span>
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <h3 class="truncate text-sm font-extrabold text-slate-950 dark:text-slate-100 sm:text-base">{{ rule.entityName }}</h3>
                  <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                    {{ readableEntityType(rule.entityType) }} · {{ notificationTypeLabel(rule.notificationType) }}
                  </p>
                </div>

                <div class="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-blue-50 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                    :aria-label="`Edit ${rule.entityName} notification`"
                    @click="openEditRule(rule)"
                  >
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                    :aria-label="`Delete ${rule.entityName} notification`"
                    @click="openDeleteRule(rule)"
                  >
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-if="rule.entityName"
                  class="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-extrabold text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                >
                  {{ readableEntityType(rule.entityType) }}: {{ rule.entityName }}
                </span>
                <span
                  v-for="chip in ruleChips(rule)"
                  v-bind:key="chip"
                  class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  {{ chip }}
                </span>
              </div>
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
        This placeholder notification rule will be removed from the list.
      </p>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          @click="closeDeleteRule"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
          @click="deleteRule"
        >
          <span class="material-symbols-outlined text-[20px]">delete</span>
          Delete rule
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import Modal from '@/components/Modal.vue'
import NotificationRuleModal from '@/components/NotificationRuleModal.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'AccountNotifications',
  components: {
    Modal,
    NotificationRuleModal,
    PageHeader
  },
  data() {
    return {
      ruleLimit: 5,
      ruleModalOpen: false,
      deleteModalOpen: false,
      editingRule: null,
      rulePendingDeletion: null,
      notificationRules: [
        {
          id: 1,
          entityType: 'Stop',
          entityName: 'Cambridge Rail Station',
          entityIdentifier: 'tmr-stop-a499f2e2140c892d3bc61fce694f',
          notificationType: 'service-alert',
          values: {
            serviceAlertTypes: ['Delays', 'SevereDelays', 'JourneyCancelled']
          }
        },
        {
          id: 2,
          entityType: 'Journey',
          entityName: 'Cambridge to Brighton',
          entityIdentifier: 'placeholder-journey-1',
          notificationType: 'realtime-journey',
          values: {
            realtimeJourneyEvents: ['RealtimeJourneyPlatformChanged', 'RealtimeJourneyCancelled']
          }
        },
        {
          id: 3,
          entityType: 'Stop',
          entityName: 'London Kings Cross',
          entityIdentifier: 'placeholder-stop-1',
          notificationType: 'service-alert',
          values: {
            serviceAlertTypes: ['Information', 'Warning', 'Planned']
          }
        }
      ],
      notificationTypes: [
        {
          id: 'service-alert',
          label: 'Service Alert',
          icon: 'campaign',
          fields: [
            {
              id: 'serviceAlertTypes',
              label: 'Type of service alert',
              type: 'multi-select',
              placeholder: 'Select alert types',
              allSelectedLabel: 'All alert types',
              description: 'Choose which alert types should trigger this notification.',
              options: [
                { value: 'Information', label: 'Service update' },
                { value: 'Warning', label: 'Service warning' },
                { value: 'StopClosed', label: 'Stop closed' },
                { value: 'ServiceSuspended', label: 'Service suspended' },
                { value: 'ServicePartSuspended', label: 'Service part suspended' },
                { value: 'SevereDelays', label: 'Severe delays' },
                { value: 'Delays', label: 'Delays' },
                { value: 'MinorDelays', label: 'Minor delays' },
                { value: 'Planned', label: 'Planned notice' },
                { value: 'JourneyDelayed', label: 'Journey delayed' },
                { value: 'JourneyPartiallyCancelled', label: 'Journey partially cancelled' },
                { value: 'JourneyCancelled', label: 'Journey cancelled' }
              ]
            }
          ]
        },
        {
          id: 'realtime-journey',
          label: 'Realtime Journey',
          icon: 'rss_feed',
          fields: [
            {
              id: 'realtimeJourneyEvents',
              label: 'Realtime journey events',
              type: 'multi-select',
              placeholder: 'Select event types',
              description: 'Choose realtime journey changes that should trigger this notification.',
              options: [
                { value: 'RealtimeJourneyCreated', label: 'Created' },
                { value: 'RealtimeJourneyActivelyTracked', label: 'Actively tracked' },
                { value: 'RealtimeJourneyPlatformSet', label: 'Platform set' },
                { value: 'RealtimeJourneyPlatformChanged', label: 'Platform changed' },
                { value: 'RealtimeJourneyCancelled', label: 'Cancelled' },
                { value: 'RealtimeJourneyLocationTextChanged', label: 'Location text changed' },
                { value: 'RealtimeJourneyNextStopChanged', label: 'Next stop changed' }
              ]
            }
          ]
        }
      ]
    }
  },
  computed: {
    ruleLimitReached() {
      return this.notificationRules.length >= this.ruleLimit
    },
    ruleLimitRemaining() {
      return Math.max(this.ruleLimit - this.notificationRules.length, 0)
    },
    ruleLimitPercent() {
      return Math.min(Math.round((this.notificationRules.length / this.ruleLimit) * 100), 100)
    },
    activeRuleEntityType() {
      return this.editingRule?.entityType || 'Stop'
    },
    activeRuleEntityName() {
      return this.editingRule?.entityName || 'Placeholder stop'
    },
    activeRuleEntityIdentifier() {
      return this.editingRule?.entityIdentifier || 'placeholder-stop-new'
    },
    ruleModalKey() {
      return this.editingRule ? `edit-${this.editingRule.id}` : 'edit-none'
    },
    activeNotificationTypes() {
      return this.notificationTypes
    }
  },
  methods: {
    openEditRule(rule) {
      this.editingRule = rule
      this.ruleModalOpen = true
    },
    saveRule(rule) {
      if (!this.editingRule) {
        return
      }

      this.notificationRules = this.notificationRules.map(existingRule => existingRule.id === this.editingRule.id
        ? {
            ...existingRule,
            notificationType: rule.notificationType,
            values: rule.values
          }
        : existingRule)
      this.showToast('Notification rule updated.', 'success')
      this.editingRule = null
    },
    openDeleteRule(rule) {
      this.rulePendingDeletion = rule
      this.deleteModalOpen = true
    },
    closeDeleteRule() {
      this.deleteModalOpen = false
      this.rulePendingDeletion = null
    },
    deleteRule() {
      if (!this.rulePendingDeletion) {
        return
      }

      const deletedRule = this.rulePendingDeletion
      this.notificationRules = this.notificationRules.filter(rule => rule.id !== deletedRule.id)
      this.closeDeleteRule()
      this.showToast('Notification rule deleted.', 'success')
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
    readableEntityType(entityType) {
      return String(entityType || 'Object').toLowerCase()
    },
    ruleChips(rule) {
      const notificationType = this.notificationType(rule.notificationType)

      if (!notificationType) {
        return []
      }

      return notificationType.fields.flatMap(field => {
        const value = rule.values?.[field.id]

        if (Array.isArray(value)) {
          return value.map(optionValue => this.optionLabel(field, optionValue))
        }

        return value ? [this.optionLabel(field, value)] : []
      })
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
  }
}
</script>
