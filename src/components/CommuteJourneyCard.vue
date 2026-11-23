<template>
  <div class="ui-panel block overflow-hidden">
    <div class="px-4 py-3 sm:px-5 sm:py-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <span class="inline-flex items-center gap-1.5 text-xs font-bold text-(--ui-muted)">
            <span
              aria-hidden="true"
              class="size-1.5 shrink-0 rounded-full"
              :class="commute.inProgress ? 'bg-emerald-500' : 'bg-brand-blue'"
            ></span>
            {{ commute.inProgress ? 'Commute in progress' : 'Upcoming commute' }}
          </span>
          <span class="truncate text-xs font-semibold text-(--ui-muted)">{{ commute.name }} · {{ commute.directionLabel }}</span>
        </div>
      </div>

      <ol class="mt-3 space-y-2.5">
        <li
          v-for="(step, index) in commute.steps"
          :key="`${step.key}-${index}`"
          class="relative"
        >
          <component
            :is="step.journeyRoute ? 'router-link' : 'div'"
            v-bind="step.journeyRoute ? { to: step.journeyRoute } : {}"
            class="relative grid grid-cols-[1.25rem_minmax(0,1fr)] gap-x-2.5 rounded-lg"
            :class="step.journeyRoute ? 'transition hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue dark:hover:bg-brand-blue/100/5' : ''"
          >
            <div class="flex flex-col items-center">
              <span
                class="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                :class="step.isTransfer ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : step.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'"
              >
                <span class="material-symbols-outlined text-[15px]" aria-hidden="true">{{ step.isTransfer ? 'sync_alt' : step.icon }}</span>
              </span>
              <span v-if="index < commute.steps.length - 1" class="my-1 min-h-3 w-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
            </div>

            <div class="min-w-0 pb-1">
              <template v-if="step.isTransfer">
                <p class="text-sm font-bold text-(--ui-text)">{{ step.title }}</p>
                <p class="mt-0.5 text-xs text-(--ui-muted)">{{ step.subtitle }}</p>
              </template>
              <template v-else>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <ServiceIcon v-if="step.service" class="max-w-full text-xs leading-5" :service="step.service" />
                  <span v-else class="text-sm font-bold text-(--ui-text)">{{ step.title }}</span>
                  <span v-if="step.isActive" class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">Now</span>
                  <span v-if="step.journeyRoute" class="material-symbols-outlined text-[16px] text-(--ui-muted)" aria-hidden="true">chevron_right</span>
                </div>
                <p class="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 text-sm font-semibold text-(--ui-text)">
                  <span class="wrap-anywhere">{{ step.origin }}</span>
                  <span class="material-symbols-outlined text-[15px] text-(--ui-muted)" aria-hidden="true">arrow_forward</span>
                  <span class="wrap-anywhere">{{ step.destination }}</span>
                </p>
                <p v-if="step.nextStop" class="mt-0.5 truncate text-xs font-medium text-(--ui-muted)">
                  Next stop: <strong class="text-(--ui-text)">{{ step.nextStop }}</strong><span v-if="step.nextStopTime"> · {{ step.nextStopTime }}</span>
                </p>
              </template>
            </div>

            <div class="col-start-2 mt-0.5 flex flex-wrap gap-x-3 text-xs font-medium text-(--ui-muted)">
              <span v-if="step.startTime">Departs <strong class="tabular-nums text-(--ui-text)">{{ step.startTime }}</strong></span>
              <span v-if="step.arrivalTime">Arrives <strong class="tabular-nums text-(--ui-text)">{{ step.arrivalTime }}</strong></span>
            </div>
          </component>
        </li>
      </ol>
    </div>

    <div v-if="alertSummary" class="flex items-start gap-2 border-t border-(--ui-divider) bg-amber-50 px-4 py-2 text-xs font-semibold leading-4 text-amber-900 sm:px-5 dark:bg-amber-400/5 dark:text-amber-200">
      <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">warning</span>
      <span class="line-clamp-2 wrap-anywhere">{{ alertSummary }}</span>
    </div>
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'

export default {
  name: 'CommuteJourneyCard',
  components: { ServiceIcon },
  props: {
    commute: {
      type: Object,
      required: true
    },
    alertSummary: {
      type: String,
      default: ''
    }
  }
}
</script>
