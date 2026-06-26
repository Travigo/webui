<template>
  <div class="flex items-start gap-3 px-4 py-4">
    <span
      class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
      :class="card.iconClasses"
    >
      <span class="material-symbols-outlined text-[21px] leading-none">{{ card.icon }}</span>
    </span>
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-3">
        <h2 class="min-w-0 flex-1 truncate text-sm font-extrabold text-slate-900 sm:text-base">
          {{ card.title }}
        </h2>
        <span class="shrink-0 text-xs font-medium text-slate-500 sm:text-sm">{{ card.meta }}</span>
        <button
          v-if="collapsible"
          type="button"
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/70 dark:hover:bg-slate-800/80"
          :aria-label="expanded ? 'Collapse service update' : 'Expand service update'"
          @click="$emit('toggle')"
        >
          <span class="material-symbols-outlined text-lg leading-none">
            {{ expanded ? 'expand_less' : 'expand_more' }}
          </span>
        </button>
      </div>
      <p
        class="mt-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]"
        :class="{'service-alert-card__body--collapsed': collapsible && !expanded}"
      >
        {{ card.body }}
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServiceAlertCard',
  props: {
    card: {
      type: Object,
      required: true
    },
    collapsible: {
      type: Boolean,
      default: false
    },
    expanded: {
      type: Boolean,
      default: true
    }
  },
  emits: ['toggle']
}
</script>

<style scoped>
.service-alert-card__body--collapsed {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
