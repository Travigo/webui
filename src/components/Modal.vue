<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="handleBackdropClick"
      >
        <section
          ref="panel"
          class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl"
          :class="widthClass"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="subtitle ? subtitleId : undefined"
          tabindex="-1"
          @keydown.esc.prevent="close"
          @keydown.tab="trapFocus"
        >
          <div
            v-if="showHeader"
            class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5"
          >
            <div class="flex min-w-0 items-start gap-3">
              <span v-if="icon" class="ui-icon">
                <span class="material-symbols-outlined text-[24px] leading-none">{{ icon }}</span>
              </span>
              <div class="min-w-0">
                <slot name="header">
                  <h2 :id="titleId" class="truncate text-lg font-bold text-slate-950 dark:text-slate-100 sm:text-xl">
                    {{ title }}
                  </h2>
                  <p v-if="subtitle" :id="subtitleId" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {{ subtitle }}
                  </p>
                </slot>
              </div>
            </div>

            <button
              type="button"
              @click="close"
              ref="closeButton"
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
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
  data() {
    return {
      previouslyFocusedElement: undefined,
      originalBodyOverflow: ''
    }
  },
  computed: {
    titleId() {
      return `travigo-modal-${this.$.uid}-title`
    },
    subtitleId() {
      return `travigo-modal-${this.$.uid}-subtitle`
    },
    widthClass() {
      return {
        sm: 'sm:max-w-md',
        md: 'sm:max-w-lg',
        lg: 'sm:max-w-2xl'
      }[this.size]
    }
  },
  watch: {
    open(isOpen) {
      if (isOpen) {
        this.openDialog()
        return
      }

      this.restorePageFocus()
    }
  },
  methods: {
    openDialog() {
      this.previouslyFocusedElement = document.activeElement
      this.originalBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', this.handleDocumentKeydown)

      this.$nextTick(() => {
        if (!this.closeDisabled && this.$refs.closeButton) {
          this.$refs.closeButton.focus()
          return
        }

        this.$refs.panel?.focus()
      })
    },
    restorePageFocus() {
      document.body.style.overflow = this.originalBodyOverflow
      document.removeEventListener('keydown', this.handleDocumentKeydown)
      this.$nextTick(() => this.previouslyFocusedElement?.focus?.())
      this.previouslyFocusedElement = undefined
    },
    handleDocumentKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        this.close()
      }
    },
    trapFocus(event) {
      const focusable = this.$refs.panel?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      const targets = Array.from(focusable || [])

      if (targets.length === 0) {
        event.preventDefault()
        this.$refs.panel?.focus()
        return
      }

      const first = targets[0]
      const last = targets[targets.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    },
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
  },
  beforeUnmount() {
    document.removeEventListener('keydown', this.handleDocumentKeydown)
    document.body.style.overflow = this.originalBodyOverflow
  }
}
</script>
