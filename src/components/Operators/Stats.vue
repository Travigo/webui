<template>
  <div class="space-y-4 p-4 sm:p-5">
    <div v-if="operatorStats === null" class="rounded-2xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-500">
      Loading statistics...
    </div>

    <section v-else class="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div class="mb-3">
        <h2 class="text-sm font-extrabold text-slate-950">Journey identification</h2>
        <p class="mt-1 text-sm text-slate-500">Realtime matching performance</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div
          v-for="stat in statsCards"
          v-bind:key="stat.label"
          class="rounded-2xl bg-white p-3"
        >
          <div class="mb-2 flex items-center gap-2">
            <span class="material-symbols-outlined text-[22px]" :class="stat.iconClass">{{ stat.icon }}</span>
            <span class="text-lg font-extrabold text-slate-950">{{ stat.value }}</span>
          </div>
          <p class="text-sm text-slate-600">{{ stat.label }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios'
import API from '@/API'

export default {
  data () {
    return {
      operatorStats: null,
    }
  },
  props: {
    operator: {},
  },
  computed: {
    statsCards() {
      return [
        {
          label: 'Last day success',
          value: this.formatRate(this.operatorStats?.LastDayRate),
          icon: 'today',
          iconClass: 'text-blue-600'
        },
        {
          label: 'Last week success',
          value: this.formatRate(this.operatorStats?.LastWeekRate),
          icon: 'date_range',
          iconClass: 'text-green-700'
        },
        {
          label: 'Last month success',
          value: this.formatRate(this.operatorStats?.LastMonthRate),
          icon: 'calendar_month',
          iconClass: 'text-purple-600'
        },
        {
          label: 'Rating',
          value: this.operatorStats?.Rating || 'Unknown',
          icon: 'verified_user',
          iconClass: this.ratingIconClass
        }
      ]
    },
    ratingIconClass() {
      return {
        GOOD: 'text-green-700',
        POOR: 'text-amber-600',
        'TEMPORARY-ISSUES': 'text-red-600'
      }[this.operatorStats?.Rating] || 'text-slate-500'
    }
  },
  methods: {
    formatRate(rate) {
      if (rate === undefined || rate === null) {
        return 'Unknown'
      }

      return `${(rate * 100).toFixed(1)}%`
    },
    getOperatorStats() {
      axios
        .get(`${API.URL}/stats/identification_rate`, {
          params: {
            'operators': this.operator.PrimaryIdentifier
          }
        })
        .then(response => {
          let firstValKey = Object.keys(response.data.Operators)[0]
          this.operatorStats = response.data.Operators[firstValKey]
        })
        .catch(error => {
          console.log(error)
          this.operatorStats = {}
        })
    }
  },
  mounted () {
    this.getOperatorStats()
  }
}
</script>
