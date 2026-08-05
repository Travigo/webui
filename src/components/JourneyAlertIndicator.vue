<template>
  <button
    v-if="alerts.length > 0"
    type="button"
    class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-white/70 dark:hover:bg-slate-800/80"
    :class="indicatorClasses"
    :aria-label="alertLabel"
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
        info: 'text-blue-600 dark:text-blue-300',
        warning: 'text-amber-600 dark:text-amber-300',
        error: 'text-red-600 dark:text-red-300'
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
