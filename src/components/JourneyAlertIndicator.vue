<template>
  <button
    v-if="alerts.length > 0"
    type="button"
    class="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900"
    :class="indicatorClasses"
    :aria-label="alertLabel"
    aria-haspopup="dialog"
    :aria-expanded="alertsModalOpen"
    :title="alertLabel"
    @click.stop.prevent="alertsModalOpen = true"
  >
    <span class="material-symbols-outlined text-[17px] leading-none">{{ indicatorIcon }}</span>
  </button>

  <Modal
    v-if="alerts.length > 0"
    v-model:open="alertsModalOpen"
    :title="modalTitle"
    :subtitle="alertLabel"
    :icon="indicatorIcon"
    size="lg"
    close-label="Close journey alerts"
    body-class="max-h-[calc(88dvh-5rem)] space-y-3 overflow-y-auto p-4 sm:p-5"
  >
    <ServiceAlertList
      :alerts="alerts"
      :context-name="journeyTitle"
    />
  </Modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'

const ERROR_ALERT_TYPES = [
  'StopClosed',
  'ServiceSuspended',
  'ServicePartSuspended',
  'SevereDelays',
  'JourneyPartiallyCancelled',
  'JourneyCancelled'
]

const WARNING_ALERT_TYPES = [
  'Warning',
  'Delays',
  'MinorDelays',
  'JourneyDelayed'
]

export default {
  name: 'JourneyAlertIndicator',
  components: {
    Modal,
    ServiceAlertList
  },
  props: {
    alerts: {
      type: Array,
      default: () => []
    },
    journeyTitle: {
      type: String,
      default: 'This journey'
    }
  },
  data() {
    return {
      alertsModalOpen: false
    }
  },
  computed: {
    alertTone() {
      if (this.alerts.some(alert => ERROR_ALERT_TYPES.includes(alert.AlertType))) {
        return 'error'
      }

      if (this.alerts.some(alert => WARNING_ALERT_TYPES.includes(alert.AlertType))) {
        return 'warning'
      }

      return 'info'
    },
    indicatorIcon() {
      return this.alertTone === 'info' ? 'info' : 'warning_amber'
    },
    indicatorClasses() {
      return {
        info: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-200 dark:hover:bg-blue-500/20',
        warning: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-200 dark:hover:bg-amber-500/20',
        error: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20'
      }[this.alertTone]
    },
    alertLabel() {
      return `${this.alerts.length} service alert${this.alerts.length === 1 ? '' : 's'}`
    },
    modalTitle() {
      return `${this.journeyTitle} alerts`
    }
  }
}
</script>
