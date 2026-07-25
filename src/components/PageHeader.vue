<template>
  <section :class="headerClass">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <span v-if="icon" :class="iconClass">
          <span class="material-symbols-outlined text-[23px] leading-none">{{ icon }}</span>
        </span>

        <div class="min-w-0">
          <slot name="meta"></slot>

          <p v-if="eyebrow" class="text-xs font-bold uppercase tracking-wide text-brand-blue dark:text-brand-blue-light">
            {{ eyebrow }}
          </p>

          <h1 :class="titleClass">
            <slot name="title">{{ title }}</slot>
          </h1>

          <p v-if="subtitle || $slots.subtitle" class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            <slot name="subtitle">{{ subtitle }}</slot>
          </p>
        </div>
      </div>

      <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
        <slot name="actions"></slot>
      </div>
    </div>

    <div v-if="$slots.default" :class="contentClass">
      <slot></slot>
    </div>
  </section>
</template>

<script>
export default {
  name: 'PageHeader',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    eyebrow: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    variant: {
      type: String,
      default: 'tinted',
      validator: value => ['tinted', 'panel', 'plain'].includes(value)
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    headerClass() {
      if (this.variant === 'panel') {
        return 'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5'
      }

      if (this.variant === 'plain') {
        return 'border-b border-slate-200 pb-3 dark:border-slate-800'
      }

      return this.compact
        ? 'rounded-2xl bg-blue-50 p-3 dark:bg-blue-500/10 sm:p-4'
        : 'rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10'
    },
    titleClass() {
      return this.compact
        ? 'mt-1 text-xl font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-2xl'
        : 'mt-1 text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-3xl'
    },
    contentClass() {
      return this.compact ? 'mt-2 space-y-2' : 'mt-3 space-y-3'
    },
    iconClass() {
      if (this.variant === 'panel') {
        return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200'
      }

      return 'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-200'
    }
  }
}
</script>
