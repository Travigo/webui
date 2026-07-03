<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="handleBackdropClick"
      >
        <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900" :class="widthClass">
          <div
            v-if="showHeader"
            class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"
          >
            <div class="flex min-w-0 items-start gap-3">
              <span v-if="icon" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                <span class="material-symbols-outlined text-[24px] leading-none">{{ icon }}</span>
              </span>
              <div class="min-w-0">
                <slot name="header">
                  <h2 class="truncate text-lg font-extrabold text-slate-950 dark:text-slate-100 sm:text-xl">
                    {{ title }}
                  </h2>
                  <p v-if="subtitle" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {{ subtitle }}
                  </p>
                </slot>
              </div>
            </div>

            <button
              type="button"
              @click="close"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              :aria-label="closeLabel"
              :disabled="closeDisabled"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div :class="bodyClass">
            <slot></slot>
          </div>

          <div
            v-if="$slots.footer"
            class="border-t border-slate-100 p-4 dark:border-slate-800 sm:p-5"
          >
            <slot name="footer"></slot>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    open: {
      type: Boolean,
      default: false
    },
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
    closeLabel: {
      type: String,
      default: 'Close dialog'
    },
    closeDisabled: {
      type: Boolean,
      default: false
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    },
    showHeader: {
      type: Boolean,
      default: true
    },
    size: {
      type: String,
      default: 'md',
      validator: value => ['sm', 'md', 'lg'].includes(value)
    },
    bodyClass: {
      type: String,
      default: 'max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5'
    }
  },
  emits: ['update:open', 'close'],
  computed: {
    widthClass() {
      return {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl'
      }[this.size]
    }
  },
  methods: {
    close() {
      if (this.closeDisabled) {
        return
      }

      this.$emit('update:open', false)
      this.$emit('close')
    },
    handleBackdropClick() {
      if (this.closeOnBackdrop) {
        this.close()
      }
    }
  }
}
</script>
