<template>
  <div v-if="compact" class="ui-panel block overflow-hidden">
    <component
      :is="compactJourneyRoute ? 'router-link' : 'div'"
      v-bind="compactJourneyRoute ? { to: compactJourneyRoute } : {}"
      class="flex items-center gap-3 px-3 py-2.5 sm:px-4"
      :class="compactJourneyRoute ? 'transition hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-blue dark:hover:bg-brand-blue/100/5' : ''"
    >
      <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
        <span class="material-symbols-outlined text-[18px]" aria-hidden="true">schedule</span>
      </span>
      <span class="min-w-0 flex-1">
        <span class="block text-xs font-bold leading-4 text-(--ui-muted)">Commute later today</span>
        <span class="block truncate text-sm font-semibold leading-5 text-(--ui-text)">
          {{ commute.name }} · {{ commute.directionLabel }}<span v-if="compactDepartureTime"> · Departs {{ compactDepartureTime }}</span>
        </span>
      </span>
      <span v-if="compactJourneyRoute" class="material-symbols-outlined shrink-0 text-[18px] text-(--ui-muted)" aria-hidden="true">chevron_right</span>
    </component>

    <button
      v-if="alertSummary"
      type="button"
      class="flex w-full items-start gap-2 border-t border-(--ui-divider) bg-amber-50 px-3 py-1.5 text-left text-xs font-semibold leading-4 text-amber-900 transition hover:bg-amber-100/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-700 sm:px-4 dark:bg-amber-400/5 dark:text-amber-200 dark:hover:bg-amber-400/10"
      :aria-label="`View ${alerts.length} service alert${alerts.length === 1 ? '' : 's'} for ${commute.name}`"
      aria-haspopup="dialog"
      :aria-expanded="alertsModalOpen"
      @click="alertsModalOpen = true"
    >
      <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">warning</span>
      <span class="line-clamp-2 min-w-0 flex-1 wrap-anywhere">{{ alertSummary }}</span>
      <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">chevron_right</span>
    </button>
  </div>

  <div v-else class="ui-panel block overflow-hidden">
    <div class="px-3 py-2.5 sm:px-4 sm:py-3">
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

      <ol class="mt-2 space-y-1.5">
        <li
          v-for="(step, index) in commute.steps"
          :key="`${step.key}-${index}`"
          class="relative"
        >
          <component
            :is="step.journeyRoute ? 'router-link' : 'div'"
            v-bind="step.journeyRoute ? { to: step.journeyRoute } : {}"
            class="relative grid grid-cols-[1.1rem_minmax(0,1fr)] gap-x-2 rounded-lg"
            :class="step.journeyRoute ? 'transition hover:bg-brand-blue/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue dark:hover:bg-brand-blue/100/5' : ''"
          >
            <div class="flex flex-col items-center">
              <span
                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                :class="step.isTransfer ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' : step.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'"
              >
                <span class="material-symbols-outlined text-[13px]" aria-hidden="true">{{ step.isTransfer ? 'sync_alt' : step.icon }}</span>
              </span>
              <span v-if="index < commute.steps.length - 1" class="my-0.5 min-h-2 w-px flex-1 bg-slate-200 dark:bg-slate-700"></span>
            </div>

            <div class="min-w-0 pb-1">
              <template v-if="step.isTransfer">
                <p class="text-xs font-bold leading-5 text-(--ui-text)">
                  {{ step.title }}<span v-if="step.subtitle" class="font-medium text-(--ui-muted)"> · {{ step.subtitle }}</span>
                </p>
              </template>
              <template v-else>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <ServiceIcon v-if="step.service" class="max-w-full text-xs leading-5" :service="step.service" />
                  <span v-else class="text-sm font-bold text-(--ui-text)">{{ step.title }}</span>
                  <span v-if="step.isActive" class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">Now</span>
                  <span v-if="step.journeyRoute" class="material-symbols-outlined text-[16px] text-(--ui-muted)" aria-hidden="true">chevron_right</span>
                </div>
                <p class="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1 text-xs font-semibold leading-5 text-(--ui-text)">
                  <span class="wrap-anywhere">{{ step.origin }}</span>
                  <span class="material-symbols-outlined text-[13px] text-(--ui-muted)" aria-hidden="true">arrow_forward</span>
                  <span class="wrap-anywhere">{{ step.destination }}</span>
                </p>
                <p v-if="step.nextStop" class="mt-0.5 truncate text-[11px] font-medium leading-4 text-(--ui-muted)">
                  Next stop: <strong class="text-(--ui-text)">{{ step.nextStop }}</strong><span v-if="step.nextStopTime"> · {{ step.nextStopTime }}</span>
                </p>
              </template>
            </div>

            <div v-if="!step.isTransfer" class="col-start-2 mt-0.5 flex flex-wrap gap-x-2 text-[11px] font-medium leading-4 text-(--ui-muted)">
              <span v-if="step.startTime">Departs <strong class="tabular-nums text-(--ui-text)">{{ step.startTime }}</strong></span>
              <span v-if="step.arrivalTime">Arrives <strong class="tabular-nums text-(--ui-text)">{{ step.arrivalTime }}</strong></span>
            </div>
          </component>
        </li>
      </ol>
    </div>

    <div v-if="alertSummary" class="border-t border-(--ui-divider) bg-amber-50 dark:bg-amber-400/5">
      <button
        type="button"
        class="flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs font-semibold leading-4 text-amber-900 transition hover:bg-amber-100/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-700 sm:px-4 dark:text-amber-200 dark:hover:bg-amber-400/10"
        :aria-label="`View ${alerts.length} service alert${alerts.length === 1 ? '' : 's'} for ${commute.name}`"
        aria-haspopup="dialog"
        :aria-expanded="alertsModalOpen"
        @click="alertsModalOpen = true"
      >
        <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">warning</span>
        <span class="line-clamp-2 min-w-0 flex-1 wrap-anywhere">{{ alertSummary }}</span>
        <span class="material-symbols-outlined shrink-0 text-[16px]" aria-hidden="true">chevron_right</span>
      </button>
    </div>

  </div>

  <Modal
    v-if="alerts.length"
    v-model:open="alertsModalOpen"
    title="Commute service alerts"
    :subtitle="`${commute.name} · ${commute.directionLabel}`"
    icon="warning_amber"
    size="lg"
    close-label="Close commute alerts"
    body-class="max-h-[calc(88dvh-5rem)] space-y-3 overflow-y-auto p-4 sm:p-5"
  >
    <ServiceAlertList :alerts="alerts" :context-name="commute.name" />
  </Modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'
import ServiceIcon from '@/components/ServiceIcon.vue'

export default {
  name: 'CommuteJourneyCard',
  components: { Modal, ServiceAlertList, ServiceIcon },
  data() {
    return {
      alertsModalOpen: false
    }
  },
  props: {
    commute: {
      type: Object,
      required: true
    },
    alertSummary: {
      type: String,
      default: ''
    },
    alerts: {
      type: Array,
      default: () => []
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    compactJourneyRoute() {
      return this.commute.steps.find(step => step.journeyRoute)?.journeyRoute || ''
    },
    compactDepartureTime() {
      return this.commute.steps.find(step => !step.isTransfer && step.startTime)?.startTime || ''
    }
  },
  watch: {
    alerts(alerts) {
      if (!alerts.length) this.alertsModalOpen = false
    }
  }
}
</script>
