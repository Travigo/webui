<template>
  <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900" :class="sectionClass">
    <div
      v-if="title || subtitle || icon || $slots.header || $slots.actions"
      class="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5"
      :class="headerClass"
    >
      <div class="flex min-w-0 items-start gap-3">
        <span v-if="icon" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span class="material-symbols-outlined text-[21px] leading-none">{{ icon }}</span>
        </span>
        <div class="min-w-0">
          <slot name="header">
            <h2 v-if="title" class="text-sm font-extrabold text-slate-950 dark:text-slate-100 sm:text-base">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {{ subtitle }}
            </p>
          </slot>
        </div>
      </div>

      <div v-if="$slots.actions" class="shrink-0">
        <slot name="actions"></slot>
      </div>
    </div>

    <div v-if="padded" class="p-4 sm:p-5" :class="bodyClass">
      <slot></slot>
    </div>
    <slot v-else></slot>
  </section>
</template>

<script>
export default {
  name: 'Panel',
  props: {
    title: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: ''
    },
    padded: {
      type: Boolean,
      default: false
    },
    sectionClass: {
      type: String,
      default: ''
    },
    headerClass: {
      type: String,
      default: ''
    },
    bodyClass: {
      type: String,
      default: ''
    }
  }
}
</script>
