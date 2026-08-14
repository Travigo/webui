<template>
  <section class="ui-panel border-dashed px-5 py-10 text-center" role="alert">
    <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-200">
      <span class="material-symbols-outlined text-[25px]">{{ icon }}</span>
    </span>
    <h1 class="ui-section-title mt-3">{{ title }}</h1>
    <p class="mx-auto mt-1 max-w-md text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">
      {{ message }}
    </p>
    <div v-if="retry || actionTo" class="mt-5 flex flex-wrap justify-center gap-2">
      <button v-if="retry" type="button" class="ui-button-primary" @click="$emit('retry')">
        {{ retryLabel }}
      </button>
      <router-link v-if="actionTo" :to="actionTo" class="ui-button-secondary">
        {{ actionLabel }}
      </router-link>
    </div>
  </section>
</template>

<script>
export default {
  name: 'ErrorState',
  props: {
    icon: {
      type: String,
      default: 'error_outline'
    },
    title: {
      type: String,
      default: 'Something went wrong'
    },
    message: {
      type: String,
      default: 'This information could not be loaded. Please try again.'
    },
    retry: {
      type: Boolean,
      default: false
    },
    retryLabel: {
      type: String,
      default: 'Try again'
    },
    actionTo: {
      type: [Object, String],
      default: null
    },
    actionLabel: {
      type: String,
      default: 'Go home'
    }
  },
  emits: ['retry']
}
</script>
