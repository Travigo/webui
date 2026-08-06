<template>
  <div class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
    <span
      v-if="loading"
      class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:h-8 sm:px-2"
    >
      <span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      {{ loadingLabel }}
    </span>

    <span
      v-else-if="error"
      class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:h-8 sm:px-2"
    >
      <span class="material-symbols-outlined text-[18px]">warning</span>
      {{ errorLabel }}
    </span>

    <template v-else-if="chips.length > 0">
      <button
        v-for="chip in chips"
        v-bind:key="chip.key"
        type="button"
        class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-slate-700 shadow-sm transition hover:border-brand-blue/20 hover:bg-brand-blue/10 hover:text-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-blue/40 dark:hover:bg-brand-blue/100/10 dark:hover:text-brand-blue-light sm:h-8 sm:px-2"
        :title="chip.label"
        @click="$emit('select', chip.key)"
      >
        <span class="material-symbols-outlined text-[20px]">{{ chip.icon }}</span>
        <span
          class="text-xs font-bold"
          v-if="chip.badge !== undefined || chip.count !== undefined"
        >
          {{ chip.badge !== undefined ? chip.badge : chip.count }}
        </span>
      </button>
    </template>

    <span
      v-else
      class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 sm:h-8 sm:px-2"
    >
      <span class="material-symbols-outlined text-[18px]">info</span>
      {{ emptyLabel }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'IconPillRow',
  props: {
    chips: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: Boolean,
      default: false
    },
    loadingLabel: {
      type: String,
      default: 'Loading'
    },
    errorLabel: {
      type: String,
      default: 'Unavailable'
    },
    emptyLabel: {
      type: String,
      default: 'None listed'
    }
  },
  emits: ['select']
}
</script>
