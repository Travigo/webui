<template>
  <div class="rounded-2xl border px-4 py-3 text-sm font-medium" :class="toneClass">
    <div class="flex items-start gap-3">
      <span v-if="resolvedIcon" class="material-symbols-outlined mt-0.5 text-[20px] leading-none">
        {{ resolvedIcon }}
      </span>
      <div class="min-w-0">
        <h2 v-if="title" class="font-extrabold">
          {{ title }}
        </h2>
        <div :class="title ? 'mt-1' : ''">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Notice',
  props: {
    type: {
      type: String,
      default: 'info'
    },
    title: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    }
  },
  computed: {
    resolvedIcon() {
      if (this.icon) {
        return this.icon
      }

      return {
        info: 'info',
        success: 'check_circle',
        warning: 'warning',
        error: 'error',
        neutral: ''
      }[this.type] || 'info'
    },
    toneClass() {
      return {
        info: 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100',
        success: 'border-green-100 bg-green-50 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100',
        warning: 'border-amber-100 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
        error: 'border-red-100 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100',
        neutral: 'border-slate-100 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300'
      }[this.type] || 'border-blue-100 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100'
    }
  }
}
</script>
