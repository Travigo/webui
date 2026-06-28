<template>
  <div
    class="animate-pulse"
    :class="containerClass"
  >
    <section
      v-if="!compact"
      class="space-y-3 rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10"
    >
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm dark:bg-slate-900 dark:text-blue-200">
          <span class="material-symbols-outlined animate-spin text-[23px]">progress_activity</span>
        </span>
        <div class="min-w-0 flex-1">
          <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 dark:text-slate-100 sm:text-3xl">
            {{ title }}
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            {{ subtitle }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <span class="h-8 w-20 rounded-xl bg-white/80 dark:bg-slate-900/80"></span>
        <span class="h-8 w-24 rounded-xl bg-white/80 dark:bg-slate-900/80"></span>
        <span class="h-8 w-16 rounded-xl bg-white/80 dark:bg-slate-900/80"></span>
      </div>
    </section>

    <section :class="bodyClass">
      <div
        v-if="showTabs"
        class="grid grid-cols-3 border-b border-slate-100 dark:border-slate-800"
      >
        <div class="h-14 border-r border-slate-100 p-4 dark:border-slate-800">
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div class="h-14 border-r border-slate-100 p-4 dark:border-slate-800">
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
        <div class="h-14 p-4">
          <div class="h-4 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        </div>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-800">
        <div
          v-for="row in rows"
          v-bind:key="row"
          class="grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-4 py-4 sm:grid-cols-[4rem_1fr_auto] sm:px-5"
        >
          <div class="h-13 w-13 rounded-xl bg-slate-200 dark:bg-slate-700 sm:h-16 sm:w-16 sm:rounded-2xl"></div>

          <div class="min-w-0 space-y-2">
            <div class="h-4 w-2/3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div class="h-3 w-1/2 rounded-full bg-slate-100 dark:bg-slate-800"></div>
            <div class="flex gap-1.5">
              <div class="h-5 w-10 rounded-md bg-slate-100 dark:bg-slate-800"></div>
              <div class="h-5 w-14 rounded-md bg-slate-100 dark:bg-slate-800"></div>
            </div>
          </div>

          <div class="space-y-2 text-right">
            <div class="ml-auto h-4 w-12 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            <div class="ml-auto h-3 w-16 rounded-full bg-slate-100 dark:bg-slate-800"></div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'LoadingState',
  props: {
    title: {
      type: String,
      default: 'Loading'
    },
    subtitle: {
      type: String,
      default: 'Getting things ready.'
    },
    rows: {
      type: Number,
      default: 4
    },
    compact: {
      type: Boolean,
      default: false
    },
    showTabs: {
      type: Boolean,
      default: true
    },
    bare: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    containerClass() {
      if (this.bare) {
        return ''
      }

      return this.compact ? 'px-4 py-4 sm:px-5' : 'space-y-4 pb-16 pt-2 sm:pb-20'
    },
    bodyClass() {
      if (this.bare) {
        return 'overflow-hidden'
      }

      return 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900'
    }
  }
}
</script>
