<template>
  <button
    :type="type"
    class="inline-flex h-10 w-10 shrink-0 items-center justify-center bg-white text-slate-700 shadow-sm transition hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
    :class="shapeClass"
    :disabled="disabled"
    :aria-label="label"
  >
    <span
      class="material-symbols-outlined"
      :class="{ 'animate-spin': spinning }"
      :style="{ fontSize: `${iconSize}px`, lineHeight: 1 }"
    >
      {{ icon }}
    </span>
    <slot />
  </button>
</template>

<script>
export default {
  name: 'IconButton',
  props: {
    icon: {
      type: String,
      required: true
    },
    label: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'button'
    },
    shape: {
      type: String,
      default: 'square',
      validator: value => ['circle', 'square'].includes(value)
    },
    disabled: {
      type: Boolean,
      default: false
    },
    spinning: {
      type: Boolean,
      default: false
    },
    iconSize: {
      type: Number,
      default: 23
    }
  },
  computed: {
    shapeClass() {
      return this.shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
    }
  }
}
</script>
