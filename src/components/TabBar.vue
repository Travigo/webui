<template>
  <div
    class="grid divide-x divide-slate-100 dark:divide-slate-800"
    :style="gridStyle"
  >
    <button
      type="button"
      v-for="tab in tabs"
      v-bind:key="tab.id"
      class="relative flex h-12 items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition sm:text-sm dark:text-slate-400"
      :class="{'text-brand-blue dark:text-brand-blue-light': modelValue === tab.id}"
      @click="selectTab(tab.id)"
    >
      <span v-if="tab.icon" class="material-symbols-outlined text-[20px]">{{ tab.icon }}</span>
      <span>{{ tab.name }}</span>
      <span
        class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-pink dark:bg-brand-pink-light"
        v-if="modelValue === tab.id"
      />
    </button>
  </div>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    tabs: {
      type: Array,
      required: true
    },
    modelValue: {
      type: String,
      required: true
    },
    storageKey: {
      type: String,
      default: ''
    },
    persist: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:modelValue'],
  computed: {
    gridStyle() {
      return {
        gridTemplateColumns: `repeat(${this.tabs.length}, minmax(0, 1fr))`
      }
    },
    resolvedStorageKey() {
      if (!this.persist) {
        return ''
      }

      return this.storageKey || `travigo_tab_bar_${this.tabs.map(tab => tab.id).join('_')}`
    }
  },
  methods: {
    selectTab(tabId) {
      if (this.resolvedStorageKey) {
        sessionStorage.setItem(this.resolvedStorageKey, tabId)
      }

      this.$emit('update:modelValue', tabId)
    }
  },
  mounted() {
    if (!this.resolvedStorageKey) {
      return
    }

    const savedTab = sessionStorage.getItem(this.resolvedStorageKey)
    const isKnownTab = this.tabs.some(tab => tab.id === savedTab)

    if (isKnownTab && savedTab !== this.modelValue) {
      this.$emit('update:modelValue', savedTab)
    }
  }
}
</script>
