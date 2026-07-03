<template>
  <Modal
    :open="open"
    title="Create notification"
    :subtitle="entityName"
    icon="notifications_active"
    close-label="Close notification rule"
    body-class="max-h-[calc(88dvh-9rem)] space-y-4 overflow-y-auto p-4 sm:p-5"
    @update:open="$emit('update:open', $event)"
  >
            <label class="block">
              <span class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Notify me about</span>
              <select
                v-model="selectedNotificationTypeId"
                class="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
              >
                <option value="" disabled>Select notification type</option>
                <option
                  v-for="type in notificationTypes"
                  v-bind:key="type.id"
                  :value="type.id"
                >
                  {{ type.label }}
                </option>
              </select>
            </label>

            <section
              v-for="field in selectedNotificationTypeFields"
              v-bind:key="field.id"
              class="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ field.label }}</h3>
                  <p v-if="field.description" class="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {{ field.description }}
                  </p>
                </div>
              </div>

              <template v-if="field.type === 'multi-select'">
                <button
                  type="button"
                  class="mt-3 flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  :aria-expanded="isFieldDropdownOpen(field.id)"
                  @click="toggleFieldDropdown(field.id)"
                >
                  <span class="truncate">{{ fieldSummary(field) }}</span>
                  <span class="material-symbols-outlined text-[20px] text-slate-500">
                    {{ isFieldDropdownOpen(field.id) ? 'expand_less' : 'expand_more' }}
                  </span>
                </button>

                <div
                  v-if="isFieldDropdownOpen(field.id)"
                  class="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    v-if="field.selectAll !== false || fieldValue(field.id).length > 0"
                    type="button"
                    class="mb-1 flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm font-extrabold text-blue-700 transition hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
                    @click="toggleAll(field)"
                  >
                    {{ bulkActionLabel(field) }}
                    <span class="material-symbols-outlined text-[18px]">done_all</span>
                  </button>

                  <label
                    v-for="option in field.options"
                    v-bind:key="option.value"
                    class="flex items-start gap-3 rounded-xl px-2.5 py-2 transition"
                    :class="isOptionDisabled(field, option)
                      ? 'cursor-not-allowed opacity-45'
                      : 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-500/10'"
                  >
                    <input
                      type="checkbox"
                      class="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950"
                      :checked="fieldValue(field.id).includes(option.value)"
                      :disabled="isOptionDisabled(field, option)"
                      @change="toggleOption(field.id, option.value)"
                    >
                    <span class="min-w-0">
                      <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">{{ option.label }}</span>
                      <span v-if="option.description" class="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        {{ option.description }}
                      </span>
                    </span>
                  </label>
                </div>
              </template>

              <template v-else-if="field.type === 'select'">
                <button
                  type="button"
                  class="mt-3 flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 text-left text-sm font-bold text-slate-900 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                  :aria-expanded="isFieldDropdownOpen(field.id)"
                  @click="toggleFieldDropdown(field.id)"
                >
                  <span class="truncate">{{ fieldSummary(field) }}</span>
                  <span class="material-symbols-outlined text-[20px] text-slate-500">
                    {{ isFieldDropdownOpen(field.id) ? 'expand_less' : 'expand_more' }}
                  </span>
                </button>

                <div
                  v-if="isFieldDropdownOpen(field.id)"
                  class="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    v-for="option in field.options"
                    v-bind:key="option.value"
                    type="button"
                    class="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    @click="selectOption(field.id, option.value)"
                  >
                    <span class="min-w-0">
                      <span class="block text-sm font-bold text-slate-800 dark:text-slate-100">{{ option.label }}</span>
                      <span v-if="option.description" class="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                        {{ option.description }}
                      </span>
                    </span>
                    <span
                      v-if="fieldValues[field.id] === option.value"
                      class="material-symbols-outlined shrink-0 text-[19px] text-blue-600 dark:text-blue-300"
                    >
                      check
                    </span>
                  </button>
                </div>
              </template>
            </section>

          <template #footer>
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              @click="close"
            >
              Cancel
            </button>
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="!canSave"
              @click="save"
            >
              Save notification
            </button>
          </div>
          </template>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal.vue'

export default {
  name: 'NotificationRuleModal',
  components: {
    Modal
  },
  props: {
    open: {
      type: Boolean,
      default: false
    },
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
    notificationTypes: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:open', 'save'],
  data() {
    return {
      selectedNotificationTypeId: '',
      fieldValues: {},
      fieldDropdownOpen: {}
    }
  },
  computed: {
    selectedNotificationType() {
      return this.notificationTypes.find(type => type.id === this.selectedNotificationTypeId) || null
    },
    allSelectedNotificationTypeFields() {
      return this.selectedNotificationType?.fields || []
    },
    selectedNotificationTypeFields() {
      return this.allSelectedNotificationTypeFields.filter(field => this.isFieldVisible(field))
    },
    canSave() {
      if (this.selectedNotificationType === null) {
        return false
      }

      return this.selectedNotificationTypeFields.every(field => {
        if (field.required === false) {
          return true
        }

        if (field.type === 'multi-select') {
          return this.fieldValue(field.id).length > 0
        }

        return Boolean(this.fieldValues[field.id])
      })
    }
  },
  watch: {
    open(value) {
      if (value) {
        this.prepareInitialSelection()
      }
    },
    notificationTypes: {
      handler() {
        if (this.open) {
          this.syncNotificationTypes()
        }
      },
      deep: true
    },
    selectedNotificationTypeId() {
      this.prepareFieldValues()
      this.fieldDropdownOpen = {}
    }
  },
  methods: {
    close() {
      this.$emit('update:open', false)
    },
    prepareInitialSelection() {
      if (this.notificationTypes.length === 0) {
        this.selectedNotificationTypeId = ''
        this.fieldValues = {}
        return
      }

      this.selectedNotificationTypeId = ''
      this.fieldValues = {}
      this.fieldDropdownOpen = {}
      this.prepareFieldValues()
    },
    syncNotificationTypes() {
      if (this.notificationTypes.length === 0) {
        this.selectedNotificationTypeId = ''
        this.fieldValues = {}
        this.fieldDropdownOpen = {}
        return
      }

      if (!this.selectedNotificationTypeId) {
        return
      }

      if (!this.notificationTypes.some(type => type.id === this.selectedNotificationTypeId)) {
        this.prepareInitialSelection()
        return
      }

      this.prepareFieldValues()
    },
    prepareFieldValues() {
      const nextFieldValues = {}

      for (const field of this.allSelectedNotificationTypeFields) {
        if (field.type === 'multi-select') {
          nextFieldValues[field.id] = this.fieldValue(field.id)
          continue
        }

        nextFieldValues[field.id] = this.fieldValues[field.id] || ''
      }

      this.fieldValues = nextFieldValues
    },
    fieldValue(fieldId) {
      return this.fieldValues[fieldId] || []
    },
    isFieldVisible(field) {
      if (!field.visibleWhen) {
        return true
      }

      const sourceValue = this.fieldValues[field.visibleWhen.fieldId]

      if (field.visibleWhen.includesAny) {
        if (Array.isArray(sourceValue)) {
          return field.visibleWhen.includesAny.some(value => sourceValue.includes(value))
        }

        return field.visibleWhen.includesAny.includes(sourceValue)
      }

      if (field.visibleWhen.equals !== undefined) {
        return sourceValue === field.visibleWhen.equals
      }

      return true
    },
    fieldSummary(field) {
      if (field.type === 'select') {
        const selectedOption = field.options.find(option => option.value === this.fieldValues[field.id])

        return selectedOption?.label || field.placeholder || 'Select an option'
      }

      const selectedOptions = field.options.filter(option => this.fieldValue(field.id).includes(option.value))

      if (selectedOptions.length === 0) {
        return field.placeholder || 'Select options'
      }

      if (selectedOptions.length === field.options.length) {
        return field.allSelectedLabel || 'All selected'
      }

      if (selectedOptions.length === 1) {
        return selectedOptions[0].label
      }

      return `${selectedOptions.length} alert types selected`
    },
    isFieldDropdownOpen(fieldId) {
      return Boolean(this.fieldDropdownOpen[fieldId])
    },
    toggleFieldDropdown(fieldId) {
      this.fieldDropdownOpen = {
        ...this.fieldDropdownOpen,
        [fieldId]: !this.isFieldDropdownOpen(fieldId)
      }
    },
    selectOption(fieldId, optionValue) {
      this.fieldValues = {
        ...this.fieldValues,
        [fieldId]: optionValue
      }
      this.fieldDropdownOpen = {
        ...this.fieldDropdownOpen,
        [fieldId]: false
      }
    },
    toggleOption(fieldId, optionValue) {
      const field = this.allSelectedNotificationTypeFields.find(field => field.id === fieldId)
      const option = field?.options.find(option => option.value === optionValue)

      if (field && option && this.isOptionDisabled(field, option)) {
        return
      }

      const currentValues = this.fieldValue(fieldId)
      const nextValues = currentValues.includes(optionValue)
        ? currentValues.filter(value => value !== optionValue)
        : [...currentValues, optionValue]

      this.fieldValues = {
        ...this.fieldValues,
        [fieldId]: nextValues
      }
    },
    selectedExclusiveGroup(field) {
      const selectedOptions = field.options.filter(option => this.fieldValue(field.id).includes(option.value))
      const groupedOption = selectedOptions.find(option => option.exclusiveGroup)

      return groupedOption?.exclusiveGroup || ''
    },
    isOptionDisabled(field, option) {
      if (this.fieldValue(field.id).includes(option.value)) {
        return false
      }

      const selectedGroup = this.selectedExclusiveGroup(field)

      return Boolean(selectedGroup && option.exclusiveGroup && option.exclusiveGroup !== selectedGroup)
    },
    allFieldOptionsSelected(field) {
      const currentValues = this.fieldValue(field.id)
      const selectableOptions = this.selectableOptions(field)

      return selectableOptions.length > 0 && selectableOptions.every(option => currentValues.includes(option.value))
    },
    bulkActionLabel(field) {
      if (field.selectAll === false) {
        return 'Clear selection'
      }

      return this.allFieldOptionsSelected(field) ? 'Clear all' : 'Select all'
    },
    toggleAll(field) {
      if (field.selectAll === false) {
        this.fieldValues = {
          ...this.fieldValues,
          [field.id]: []
        }
        return
      }

      const selectableOptions = this.selectableOptions(field)

      this.fieldValues = {
        ...this.fieldValues,
        [field.id]: this.allFieldOptionsSelected(field) ? [] : selectableOptions.map(option => option.value)
      }
    },
    selectableOptions(field) {
      return field.options.filter(option => !this.isOptionDisabled(field, option))
    },
    save() {
      if (!this.canSave) {
        return
      }

      this.$emit('save', {
        entityType: this.entityType,
        entityName: this.entityName,
        entityIdentifier: this.entityIdentifier,
        notificationType: this.selectedNotificationTypeId,
        values: this.visibleFieldValues()
      })
      this.close()
    },
    visibleFieldValues() {
      return this.selectedNotificationTypeFields.reduce((values, field) => ({
        ...values,
        [field.id]: this.fieldValues[field.id]
      }), {})
    }
  }
}
</script>
