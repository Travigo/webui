<template>
  <details ref="menu" class="relative" @keydown.esc="close">
    <summary
      class="-m-1.5 inline-flex h-11 w-11 cursor-pointer list-none items-center justify-center [&::-webkit-details-marker]:hidden"
      aria-label="Choose appearance"
    >
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 sm:h-10 sm:w-10 sm:text-slate-600 sm:hover:text-brand-blue sm:dark:text-slate-200 sm:dark:hover:text-brand-blue-light">
        <span class="material-symbols-outlined text-xl sm:text-[22px]">{{ icon }}</span>
      </span>
    </summary>

    <div class="absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800" role="menu" aria-label="Appearance">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        role="menuitemradio"
        :aria-checked="preference === option.value"
        class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold transition hover:bg-slate-100 dark:hover:bg-slate-700"
        :class="preference === option.value ? 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/15 dark:text-brand-blue-light' : 'text-slate-700 dark:text-slate-200'"
        @click="select(option.value)"
      >
        <span class="material-symbols-outlined text-[18px]">{{ option.icon }}</span>
        <span>{{ option.label }}</span>
        <span v-if="preference === option.value" class="material-symbols-outlined ml-auto text-[18px]">check</span>
      </button>
    </div>
  </details>
</template>

<script>
export default {
  name: 'ThemeMenu',
  props: {
    preference: {
      type: String,
      required: true
    },
    darkMode: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    icon() {
      if (this.preference === 'system') {
        return 'brightness_auto'
      }

      return this.darkMode ? 'dark_mode' : 'light_mode'
    },
    options() {
      return [
        { value: 'light', label: 'Light', icon: 'light_mode' },
        { value: 'dark', label: 'Dark', icon: 'dark_mode' },
        { value: 'system', label: 'Follow system', icon: 'brightness_auto' }
      ]
    }
  },
  methods: {
    select(preference) {
      this.$emit('select', preference)
      this.close()
    },
    close() {
      this.$refs.menu?.removeAttribute('open')
    }
  }
}
</script>
