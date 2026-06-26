<template>
  <section class="space-y-2.5" v-if="alertCards.length > 0">
    <article
      v-for="(card, index) in visibleAlertCards"
      v-bind:key="card.key"
      class="overflow-hidden rounded-2xl border shadow-sm"
      :class="card.classes"
    >
      <ServiceAlertCard
        :card="card"
        :collapsible="collapsible"
        :expanded="isAlertExpanded(card)"
        @toggle="toggleAlertCard(card)"
      />

      <button
        v-if="hiddenAlertCards.length > 0 && index === visibleAlertCards.length - 1"
        type="button"
        class="flex w-full items-center gap-3 border-t border-slate-900/5 bg-white/50 px-4 py-3 text-left transition hover:bg-white/80 dark:border-white/10 dark:bg-slate-900/40 dark:hover:bg-slate-800/80"
        @click="openAlertsModal"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
          <span class="material-symbols-outlined text-[21px] leading-none">campaign</span>
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-extrabold text-slate-950 dark:text-slate-100">
            View {{ hiddenAlertCards.length }} more service update{{ hiddenAlertCards.length === 1 ? '' : 's' }}
          </span>
        </span>
        <span class="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
      </button>
    </article>

    <Teleport to="body">
      <Transition name="modal-overlay">
        <div
          v-if="alertsModalOpen"
          class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          @click.self="closeAlertsModal"
        >
          <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl">
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
              <div>
                <h2 class="text-lg font-bold text-slate-950 sm:text-xl">Service updates</h2>
                <p class="mt-1 text-sm text-slate-500">{{ modalDescription }}</p>
              </div>
              <button
                @click="closeAlertsModal"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close service updates"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div class="max-h-[calc(88dvh-5rem)] space-y-3 overflow-y-auto p-4 sm:p-5">
              <article
                v-for="card in hiddenAlertCards"
                v-bind:key="`modal-${card.key}`"
                class="rounded-2xl border"
                :class="card.classes"
              >
                <ServiceAlertCard :card="card" />
              </article>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script>
import Pretty from '@/pretty'
import ServiceAlertCard from '@/components/ServiceAlertCard.vue'

const ALERT_FALLBACKS = {
  Information: { title: 'Service update', tone: 'info' },
  Warning: { title: 'Service warning', tone: 'warning' },
  StopClosed: { title: 'Stop closed', tone: 'error' },
  ServiceSuspended: { title: 'Service suspended', tone: 'error' },
  ServicePartSuspended: { title: 'Service suspended', tone: 'error' },
  SevereDelays: { title: 'Severe delays', tone: 'error' },
  Delays: { title: 'Service delays', tone: 'warning' },
  MinorDelays: { title: 'Minor delays', tone: 'warning' },
  Planned: { title: 'Planned notice', tone: 'info' },
  JourneyDelayed: { title: 'Journey delayed', tone: 'warning' },
  JourneyPartiallyCancelled: { title: 'Journey partially cancelled', tone: 'error' },
  JourneyCancelled: { title: 'Journey cancelled', tone: 'error' },
}

export default {
  name: 'ServiceAlertList',
  components: {
    ServiceAlertCard
  },
  props: {
    alerts: {
      type: Array,
      default: () => []
    },
    maxVisible: {
      type: Number,
      default: 0
    },
    collapsible: {
      type: Boolean,
      default: false
    },
    contextName: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      pretty: Pretty,
      alertsModalOpen: false,
      expandedAlertCards: {}
    }
  },
  computed: {
    sortedAlerts() {
      if (this.alerts === null || this.alerts.length === 0) {
        return []
      }

      return [...this.alerts].sort((first, second) => {
        const severityDiff = this.alertSeverity(second) - this.alertSeverity(first)

        if (severityDiff !== 0) {
          return severityDiff
        }

        return new Date(second.CreationDateTime || 0) - new Date(first.CreationDateTime || 0)
      })
    },
    alertCards() {
      return this.sortedAlerts.map((alert, index) => this.alertToCard(alert, index))
    },
    visibleAlertCards() {
      if (this.maxVisible <= 0 || this.alertCards.length <= this.maxVisible) {
        return this.alertCards
      }

      return this.alertCards.slice(0, this.maxVisible)
    },
    hiddenAlertCards() {
      if (this.maxVisible <= 0 || this.alertCards.length <= this.maxVisible) {
        return []
      }

      return this.alertCards.slice(this.maxVisible)
    },
    modalDescription() {
      if (this.contextName) {
        return `Additional alerts for ${this.contextName}.`
      }

      return 'Additional service alerts.'
    }
  },
  methods: {
    alertToCard(alert, index) {
      const fallback = ALERT_FALLBACKS[alert.AlertType] || ALERT_FALLBACKS.Information
      const tone = fallback.tone

      return {
        key: alert.PrimaryIdentifier || alert.ID || `alert-${index}`,
        title: alert.Title || fallback.title,
        meta: alert.CreationDateTime ? `${this.pretty.date(alert.CreationDateTime)}` : 'Live',
        body: this.cleanAlertText(alert.Text) || 'Check before you travel.',
        icon: this.statusIcon(tone),
        classes: this.statusClasses(tone),
        iconClasses: this.statusIconClasses(tone),
        severity: this.alertSeverity(alert)
      }
    },
    alertSeverity(alert) {
      const tone = (ALERT_FALLBACKS[alert.AlertType] || ALERT_FALLBACKS.Information).tone

      return {
        error: 3,
        warning: 2,
        info: 1,
        success: 0
      }[tone]
    },
    statusIcon(tone) {
      return {
        info: 'info',
        warning: 'warning',
        error: 'error',
        success: 'verified_user'
      }[tone]
    },
    statusClasses(tone) {
      return {
        info: 'border-blue-100 bg-blue-50',
        warning: 'border-amber-100 bg-amber-50',
        error: 'border-red-100 bg-red-50',
        success: 'border-emerald-100 bg-emerald-50'
      }[tone]
    },
    statusIconClasses(tone) {
      return {
        info: 'bg-blue-600 text-white',
        warning: 'bg-orange-500 text-white',
        error: 'bg-red-600 text-white',
        success: 'bg-emerald-600 text-white'
      }[tone]
    },
    cleanAlertText(text) {
      if (!text) {
        return ''
      }

      return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    },
    openAlertsModal() {
      this.alertsModalOpen = true
    },
    closeAlertsModal() {
      this.alertsModalOpen = false
    },
    isAlertExpanded(card) {
      return !this.collapsible || this.expandedAlertCards[card.key] === true
    },
    toggleAlertCard(card) {
      this.expandedAlertCards = {
        ...this.expandedAlertCards,
        [card.key]: !this.isAlertExpanded(card)
      }
    }
  }
}
</script>
