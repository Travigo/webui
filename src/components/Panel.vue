<template>
  <section class="ui-panel" :class="sectionClass">
    <div
      v-if="title || subtitle || icon || $slots.header || $slots.actions"
      class="ui-panel-header"
      :class="headerClass"
    >
      <div class="flex min-w-0 items-start gap-3">
        <span v-if="icon" class="ui-icon h-9 w-9">
          <span class="material-symbols-outlined text-[21px] leading-none">{{ icon }}</span>
        </span>
        <div class="min-w-0">
          <slot name="header">
            <h2 v-if="title" class="ui-section-title">
              {{ title }}
            </h2>
            <p v-if="subtitle" class="ui-body mt-0.5">
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
