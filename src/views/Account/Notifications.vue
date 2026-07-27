<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <PageHeader
      eyebrow="Account"
      title="Notifications"
      subtitle="Manage the rules Travigo should use when sending notifications."
      icon="notifications_active"
      variant="panel"
    />

    <section
      v-if="auth0.isAuthenticated"
      class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-5"
    >
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Saved rule usage</h2>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {{ ruleUsage }} of {{ ruleLimit }} saved notification rules used.
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
          :class="ruleLimitReached ? 'bg-red-500' : 'bg-brand-blue'"
          :style="{ width: `${ruleLimitPercent}%` }"
        ></div>
      </div>
    </section>

    <section
      v-if="!auth0.isLoading && !auth0.isAuthenticated"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:rounded-3xl sm:px-5"
    >
      Sign in to manage notification rules.
    </section>

    <section
      v-else-if="loadingRules"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 sm:rounded-3xl sm:px-5"
    >
      Loading notification rules…
    </section>

    <section
      v-else-if="rulesError"
      class="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100 sm:rounded-3xl sm:px-5"
    >
      {{ rulesError }}
    </section>

    <section
      v-if="auth0.isAuthenticated && !loadingRules && !rulesError"
      class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl"
    >
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <div>
          <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Configured notifications</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Rules that would be evaluated when data changes.</p>
        </div>
      </div>

      <div v-if="notificationRules.length === 0" class="px-4 py-6 sm:px-5">
        <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          No notification rules are configured.
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
                    :disabled="savingRuleIdentifier === rule.id"
                    :aria-label="`Edit ${rule.entityName} notification`"
                    @click="openEditRule(rule)"
                  >
                    <span class="material-symbols-outlined text-[20px]">edit</span>
                  </button>
                  <button
                    type="button"
                    class="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-red-50 hover:text-red-700 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                    :disabled="deletingRuleIdentifier === rule.id"
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
        This notification rule will be permanently removed.
      </p>

      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          :disabled="Boolean(deletingRuleIdentifier)"
          @click="closeDeleteRule"
        >
          Cancel
        </button>
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700"
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

      return notificationRuleTypesForSubject(this.activeRuleEntityType, {
        stopOptions: stopRefs.map(stopRef => ({
          value: stopRef,
          label: stopRef
        }))
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
          if (field.id === 'platformStopRefs' && value.length > 0) {
            return [`${value.length} platform ${value.length === 1 ? 'stop' : 'stops'}`]
          }

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
  },
  mounted() {
    this.loadRules()
  }
}
</script>
