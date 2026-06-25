<template>
  <div class="space-y-4 pt-3 sm:space-y-6 sm:pt-4">
    <LocationPicker />

    <SearchBar
      placeholder="Search stops, stations or routes"
      searchClasses="h-14 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-md shadow-slate-200/70 placeholder:text-slate-400 sm:h-20 sm:rounded-3xl sm:px-5 sm:text-xl"
      :showIcons="true"
    />

    <section class="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 shadow-sm shadow-slate-200/70 sm:rounded-3xl sm:p-6">
      <div class="relative z-10 max-w-[62%] sm:max-w-md">
        <div class="mb-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 sm:mb-4 sm:text-lg">
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 sm:h-7 sm:w-7">
            <span class="h-2 w-2 rounded-full bg-blue-600 sm:h-3 sm:w-3"></span>
          </span>
          Live updates
        </div>
        <h1 class="text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
          Welcome to Travigo
        </h1>
        <p class="mt-3 text-sm leading-relaxed text-slate-600 sm:mt-4 sm:text-lg">
          Lookup scheduled and real-time information for public transport in the UK, Europe, and beyond, including trains, buses, trams and ferries.
        </p>
        <router-link :to="{ name: 'map' }" class="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blue-600 sm:mt-7 sm:gap-2 sm:text-lg">
          See supported locations
          <span class="material-symbols-outlined text-lg sm:text-2xl">chevron_right</span>
        </router-link>
      </div>

      <div class="absolute right-2 bottom-3 flex w-[50%] max-w-md items-end justify-end sm:right-8 sm:bottom-4">
        <div class="relative h-32 w-full sm:h-48">
          <div class="absolute bottom-8 right-4 h-16 w-28 rounded-[2rem] bg-blue-100/80 blur-2xl sm:bottom-10 sm:right-5 sm:h-24 sm:w-44"></div>
          <div class="absolute right-16 top-0 hidden text-8xl text-blue-200/80 sm:block">
            <span class="material-symbols-outlined text-[112px]">account_balance</span>
          </div>
          <div class="absolute bottom-6 right-1 rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-300/60 sm:bottom-7 sm:right-2 sm:rounded-2xl sm:p-3 sm:shadow-xl">
            <span class="material-symbols-outlined text-3xl sm:text-5xl">directions_bus</span>
          </div>
          <div class="absolute bottom-5 right-16 rounded-2xl bg-white/90 px-3 py-2 text-blue-700 shadow-lg shadow-blue-200/80 sm:bottom-7 sm:right-28 sm:rounded-3xl sm:px-5 sm:py-4 sm:shadow-xl">
            <span class="material-symbols-outlined text-4xl sm:text-6xl">train</span>
          </div>
          <div class="absolute right-9 top-10 rounded-full bg-blue-600 p-1.5 text-white shadow-lg shadow-blue-300 sm:right-14 sm:top-14 sm:p-2">
            <span class="material-symbols-outlined text-3xl sm:text-4xl">location_on</span>
          </div>
        </div>
      </div>

      <div class="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-green-700 shadow-sm sm:right-6 sm:top-7 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-lg">
        <span class="material-symbols-outlined text-lg sm:text-2xl">rss_feed</span>
        Live
      </div>
    </section>

    <!-- <section class="rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-md shadow-slate-200/70 sm:rounded-3xl sm:px-4 sm:py-5 sm:shadow-lg">
      <div class="grid grid-cols-6 gap-1 sm:gap-2">
        <router-link
          v-for="action in quickActions"
          v-bind:key="action.label"
          :to="action.route"
          class="flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-0.5 text-center text-[10px] font-medium text-slate-950 transition hover:bg-slate-50 sm:gap-2 sm:rounded-2xl sm:p-1 sm:text-sm"
        >
          <span :class="action.bg" class="flex h-10 w-10 items-center justify-center rounded-full border sm:h-16 sm:w-16">
            <span :class="action.color" class="material-symbols-outlined text-xl sm:text-3xl">{{ action.icon }}</span>
          </span>
          <span class="leading-tight">{{ action.label }}</span>
        </router-link>
      </div>
    </section> -->

    <section>
      <div class="mb-3 flex items-center justify-between sm:mb-4">
        <h2 class="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">Nearby stops</h2>
        <router-link :to="{ name: 'map' }" class="inline-flex items-center gap-1 text-base font-medium text-blue-600 sm:text-lg">
          View map
          <span class="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
        </router-link>
      </div>

      <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80 sm:rounded-3xl">
        <div
          v-for="stop in nearbyStops"
          v-bind:key="stop.name"
          class="grid grid-cols-[3.25rem_1fr] items-center gap-3 border-b border-slate-200 px-4 py-3 last:border-b-0 sm:grid-cols-[5rem_1fr_auto] sm:gap-4 sm:px-5 sm:py-4"
        >
          <div :class="stop.iconBg" class="flex h-13 w-13 items-center justify-center rounded-xl sm:h-16 sm:w-16 sm:rounded-2xl">
            <img v-if="stop.iconType === 'rail'" src="/icons/national-rail.svg" alt="" class="h-8 w-8 sm:h-10 sm:w-10">
            <span v-else class="material-symbols-outlined text-3xl text-white sm:text-5xl">directions_bus</span>
          </div>

          <div class="min-w-0">
            <div class="flex items-start justify-between gap-2 sm:gap-3">
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="truncate text-base font-bold leading-tight text-slate-950 sm:text-xl">{{ stop.name }}</h3>
                  <!-- <span class="material-symbols-outlined text-base text-blue-600 sm:text-xl">verified</span> -->
                </div>
                <span :class="stop.badgeClass" class="mt-1 inline-flex rounded px-1.5 py-0.5 text-xs font-semibold text-white sm:rounded-md sm:px-2 sm:text-sm">
                  {{ stop.badge }}
                </span>
                <p class="mt-1 flex items-center gap-1 text-xs text-slate-500 sm:text-base">
                  <span class="material-symbols-outlined text-base sm:text-lg">directions_walk</span>
                  {{ stop.distance }}
                </p>
              </div>

              <div class="flex shrink-0 items-center justify-end gap-1 text-right">
                <div>
                  <div class="flex items-center justify-end gap-1 text-base font-semibold text-slate-950 sm:text-xl">
                    <span v-if="stop.kind === 'rail'" class="material-symbols-outlined text-base text-slate-700 sm:text-xl">schedule</span>
                    {{ stop.time }}
                  </div>
                  <p class="mt-0.5 text-xs leading-snug text-slate-500 sm:mt-1 sm:text-base">{{ stop.detail }}</p>
                </div>
                <span class="material-symbols-outlined text-2xl text-slate-400 sm:text-3xl">chevron_right</span>
              </div>
            </div>
          </div>

          <div class="hidden rounded-2xl bg-green-50 px-3 py-1 text-base font-medium text-green-700 sm:inline-flex">
            <span class="mr-2 mt-2 h-2 w-2 rounded-full bg-green-600"></span>
            Live
          </div>
        </div>

        <router-link :to="{ name: 'map' }" class="flex items-center justify-center gap-1 px-4 py-3 text-base font-medium text-blue-600 sm:gap-2 sm:px-5 sm:py-4 sm:text-lg">
          See all nearby stops
          <span class="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
        </router-link>
      </div>
    </section>

    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 sm:rounded-3xl sm:p-5">
      <div class="mb-3 sm:mb-4">
        <h2 class="text-xl font-bold text-slate-950 sm:text-2xl">Network summary</h2>
        <p class="text-sm text-slate-500 sm:text-base">Real-time overview</p>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <button
          v-for="summary in networkSummary"
          v-bind:key="summary.label"
          @click="openStatsModal(summary.view)"
          :class="summary.bg"
          class="rounded-xl p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md sm:rounded-2xl sm:p-4"
        >
          <div class="mb-2 flex items-center gap-2 sm:mb-3 sm:gap-3">
            <span :class="summary.iconColor" class="material-symbols-outlined text-xl sm:text-3xl">{{ summary.icon }}</span>
            <span class="text-lg font-bold text-slate-950 sm:text-xl">{{ summary.value }}</span>
          </div>
          <p class="text-sm leading-snug text-slate-600 sm:text-base">{{ summary.label }}</p>
          <span :class="summary.pillClass" class="mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium sm:mt-3 sm:px-3 sm:py-1 sm:text-sm">
            {{ summary.pill }}
          </span>
        </button>
      </div>
    </section>

    <Teleport to="body">
      <div
        v-if="statsModalOpen"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="closeStatsModal"
      >
        <section class="max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
            <div>
              <h2 class="text-lg font-bold text-slate-950 sm:text-xl">{{ selectedStatsSummary?.label }}</h2>
              <p class="mt-1 text-sm text-slate-500">{{ selectedStatsSummary?.description }}</p>
            </div>
            <button
              @click="closeStatsModal"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Close stats detail"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5">
            <div :class="selectedStatsSummary?.bg" class="mb-4 rounded-2xl p-4">
              <div class="flex items-center gap-3">
                <span :class="selectedStatsSummary?.iconColor" class="material-symbols-outlined text-3xl">{{ selectedStatsSummary?.icon }}</span>
                <div>
                  <div class="text-2xl font-bold text-slate-950">{{ selectedStatsSummary?.value }}</div>
                  <div class="text-sm text-slate-600">{{ selectedStatsSummary?.pill }}</div>
                </div>
              </div>
            </div>

            <div v-if="statsDetailSections.length > 0" class="space-y-4">
              <section
                v-for="section in statsDetailSections"
                v-bind:key="section.title"
                class="rounded-2xl border border-slate-100 bg-slate-50 p-3"
              >
                <h3 class="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{{ section.title }}</h3>
                <div class="divide-y divide-slate-200 overflow-hidden rounded-xl bg-white">
                  <div
                    v-for="item in section.items"
                    v-bind:key="item.name"
                    class="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                  >
                    <span class="min-w-0 truncate text-slate-700">{{ item.name }}</span>
                    <span class="shrink-0 font-semibold text-slate-950">{{ formatNumber(item.count, item.count) }}</span>
                  </div>
                </div>
              </section>
            </div>

            <div v-else class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
              {{ statsDetailEmptyMessage }}
            </div>
          </div>
        </section>
      </div>
    </Teleport>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar.vue'
import LocationPicker from '@/components/LocationPicker.vue'

import axios from 'axios'
import API from '@/API'

export default {
  name: 'Home',
  components: {
    SearchBar,
    LocationPicker
  },
  data () {
    return {
      stats: undefined,
      selectedStatsView: undefined,
      statsModalOpen: false,
      refreshTimer: undefined,
      quickActions: [
        { label: 'Nearby', icon: 'near_me', route: { name: 'map' }, bg: 'border-blue-100 bg-blue-50', color: 'text-blue-600' },
        { label: 'Departures', icon: 'train', route: { name: 'timetables/home' }, bg: 'border-purple-100 bg-purple-50', color: 'text-purple-600' },
        { label: 'Journey Planner', icon: 'route', route: { name: 'journeyplanner/home' }, bg: 'border-green-100 bg-green-50', color: 'text-green-700' },
        { label: 'Operators', icon: 'groups', route: { name: 'operators/home' }, bg: 'border-amber-100 bg-amber-50', color: 'text-amber-600' },
        { label: 'Saved', icon: 'bookmark', route: { name: 'account/home' }, bg: 'border-pink-100 bg-pink-50', color: 'text-pink-500' },
        { label: 'More', icon: 'more_horiz', route: { name: 'about' }, bg: 'border-slate-100 bg-slate-50', color: 'text-slate-700' },
      ],
      nearbyStops: [
        {
          name: 'Cambridge',
          badge: 'Great Northern',
          badgeClass: 'bg-purple-800',
          distance: '2 min walk • 0.2 mi',
          time: '00:53',
          detail: 'Platform 2 (Est.)',
          kind: 'rail',
          iconType: 'rail',
          iconBg: 'bg-purple-950'
        },
        {
          name: 'Cambridge North',
          badge: 'Great Northern',
          badgeClass: 'bg-purple-800',
          distance: '8 min walk • 0.6 mi',
          time: '01:07',
          detail: 'Platform 1 (Est.)',
          kind: 'rail',
          iconType: 'rail',
          iconBg: 'bg-purple-950'
        },
        {
          name: 'Drummer Street (Stop D)',
          badge: 'Bus Stop',
          badgeClass: 'bg-blue-600',
          distance: '3 min walk • 0.3 mi',
          time: '1, 2, 19',
          detail: 'Next in 2 min',
          kind: 'bus',
          iconType: 'bus',
          iconBg: 'bg-blue-600'
        },
      ]
    }
  },
  computed: {
    networkSummary() {
      return [
        {
          icon: 'rss_feed',
          iconColor: 'text-blue-600',
          value: this.formatNumber(this.stats?.realtimejourneys?.stats?.current, '--'),
          label: 'Realtime trips',
          description: 'Realtime trips currently tracked',
          pill: 'Currently tracked',
          pillClass: 'bg-blue-100 text-blue-700',
          bg: 'bg-blue-50',
          view: 'realtimejourneys'
        },
        {
          icon: 'location_on',
          iconColor: 'text-green-600',
          value: this.formatNumber(this.stats?.stops?.stats?.total, '--'),
          label: 'Stops',
          description: 'Known stops and stations',
          pill: 'Total indexed',
          pillClass: 'bg-green-100 text-green-700',
          bg: 'bg-green-50',
          view: 'stops'
        },
        {
          icon: 'route',
          iconColor: 'text-purple-600',
          value: this.formatNumber(this.stats?.services?.stats?.total, '--'),
          label: 'Services',
          description: 'Routes and services available',
          pill: 'Total indexed',
          pillClass: 'bg-purple-100 text-purple-700',
          bg: 'bg-purple-50',
          view: 'services'
        },
        {
          icon: 'warning',
          iconColor: 'text-amber-600',
          value: this.formatNumber(this.stats?.servicealerts?.stats?.total, '--'),
          label: 'Service alerts',
          description: 'Current and stored service alerts',
          pill: 'Alert records',
          pillClass: 'bg-amber-100 text-amber-700',
          bg: 'bg-amber-50',
          view: 'servicealerts'
        },
      ]
    },
    selectedStatsSummary() {
      return this.networkSummary.find((summary) => summary.view === this.selectedStatsView)
    },
    statsDetailSections() {
      let stat = this.stats?.[this.selectedStatsView]?.stats

      if (stat === undefined) {
        return []
      }

      return [
        { title: 'Transport Types', items: this.formatEntries(stat.transporttypes) },
        { title: 'Countries', items: this.formatEntries(stat.countries) },
        { title: 'Datasets', items: this.formatEntries(stat.datasets) },
        { title: 'Providers', items: this.formatEntries(stat.providers) },
        { title: 'Alert Types', items: this.formatEntries(stat.alerttypes) },
      ].filter((section) => section.items.length > 0)
    },
    statsDetailEmptyMessage() {
      if (this.stats === undefined) {
        return 'Stats are still loading. Try again in a moment.'
      }

      if (this.stats?.[this.selectedStatsView] === undefined) {
        return 'This statistic is not available from the stats API yet.'
      }

      return 'No breakdown data is available for this statistic yet.'
    }
  },
  methods: {
    formatNumber(value, fallback) {
      if (value === undefined || value === null) {
        return fallback
      }

      return value.toLocaleString('en', { useGrouping: true })
    },
    formatEntries(entries) {
      if (entries === undefined || entries === null) {
        return []
      }

      return Object.entries(entries)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    },
    openStatsModal(viewName) {
      this.selectedStatsView = viewName
      this.statsModalOpen = true
    },
    closeStatsModal() {
      this.statsModalOpen = false
    },
    getStats() {
      axios
        .get(`${API.URL}/stats/calculated`)
        .then(response => {
          this.stats = response.data
        })
        .catch(error => {
          console.log(error)
          this.error = error
        })
    }
  },
  mounted () {
    this.getStats()
    this.refreshTimer = setInterval(this.getStats, 250000)
  },
  beforeRouteLeave() {
    clearInterval(this.refreshTimer)
  },
}
</script>
