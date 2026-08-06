<template>
  <section :class="headerClass">
    <div class="flex items-start justify-between gap-3">
      <div class="flex min-w-0 items-start gap-3">
        <span v-if="icon" :class="iconClass">
          <span class="material-symbols-outlined text-[23px] leading-none">{{ icon }}</span>
        </span>

        <div class="min-w-0">
          <slot name="meta"></slot>

          <p v-if="eyebrow" class="ui-eyebrow">
            {{ eyebrow }}
          </p>

          <h1 :class="titleClass">
            <slot name="title">{{ title }}</slot>
          </h1>

          <p v-if="subtitle || $slots.subtitle" class="ui-body mt-1">
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
      default: 'panel',
      validator: value => ['tinted', 'panel', 'plain'].includes(value)
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    headerClass() {
      if (this.variant === 'panel' || this.variant === 'tinted') {
        return 'ui-panel p-4 sm:p-5'
      }

      if (this.variant === 'plain') {
        return 'border-b border-slate-200 pb-3 dark:border-slate-800'
      }

      return 'ui-panel p-4 sm:p-5'
    },
    titleClass() {
      return this.compact
        ? 'mt-1 text-xl font-[800] leading-tight tracking-tight text-slate-950 dark:text-slate-100 sm:text-2xl'
        : 'ui-page-title mt-1'
    },
    contentClass() {
      return this.compact ? 'mt-2 space-y-2' : 'mt-3 space-y-3'
    },
    iconClass() {
      return 'ui-icon'
    }
  }
}
</script>
