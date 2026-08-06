<template>
  <div class="pb-16 pt-2 sm:pb-20">
    <main class="mx-auto max-w-3xl">
      <section class="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <header class="bg-gradient-to-br from-brand-blue to-blue-700 px-4 py-5 text-white sm:px-6 sm:py-6">
          <div class="flex items-start gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <span class="material-symbols-outlined text-[25px]">route</span>
            </span>
            <div>
              <h1 class="text-xl font-black tracking-tight sm:text-2xl">Where are you going?</h1>
              <p class="mt-1 text-sm font-medium text-blue-100">Compare public transport journeys and connections.</p>
            </div>
          </div>
        </header>

        <form class="space-y-5 p-4 sm:p-6" @submit.prevent="submit">
          <section aria-labelledby="planner-route-heading">
            <h2 id="planner-route-heading" class="sr-only">Route</h2>
            <div class="relative space-y-3 rounded-3xl bg-slate-50 p-3 dark:bg-slate-800/70 sm:p-4">
              <div>
                <div class="mb-2 flex items-center justify-between gap-3">
                  <label class="text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400" for="planner-origin-stop">From</label>
                  <button
                    type="button"
                    class="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-extrabold transition"
                    :class="originMode === 'location' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200' : 'text-slate-500 hover:bg-white dark:text-slate-400 dark:hover:bg-slate-900'"
                    @click="toggleCurrentLocation"
                  >
                    <span class="material-symbols-outlined text-[18px]">my_location</span>
                    {{ originMode === 'location' ? 'Choose a stop' : 'Current location' }}
                  </button>
                </div>

                <SearchBar
                  v-if="originMode === 'stop'"
                  mode="store"
                  input-id="planner-origin-stop"
                  label="Origin stop"
                  placeholder="Search for a stop or station"
                  searchClasses="h-14 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  :flush="true"
                  :show-filters="false"
                  v-model="originStop"
                  @selected-result="rememberEndpoint('origin', $event)"
                />

                <div v-else class="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm dark:border-blue-500/20 dark:bg-slate-950">
                  <div class="flex items-center gap-3">
                    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                      <span class="material-symbols-outlined text-[21px]" :class="{ 'animate-spin': locatingOrigin }">{{ locatingOrigin ? 'progress_activity' : 'near_me' }}</span>
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ originLocationTitle }}</p>
                      <p class="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{{ originLocationDescription }}</p>
                    </div>
                    <button
                      type="button"
                      class="min-h-11 shrink-0 rounded-xl bg-blue-50 px-3 text-xs font-extrabold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-500/10 dark:text-blue-200"
                      :disabled="locatingOrigin"
                      @click="requestOriginLocation"
                    >
                      {{ originLocation ? 'Refresh' : 'Allow' }}
                    </button>
                  </div>
                  <p v-if="originLocationError" class="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" role="alert">{{ originLocationError }}</p>
                </div>
              </div>

              <button
                type="button"
                class="absolute right-5 top-[7.55rem] z-20 flex h-11 w-11 items-center justify-center rounded-full border-4 border-slate-50 bg-white text-blue-700 shadow-md transition hover:scale-105 hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:scale-100 dark:border-slate-800 dark:bg-slate-950 dark:text-blue-200 dark:disabled:text-slate-600 sm:right-7"
                :disabled="originMode !== 'stop' || !originStop || !destinationStop"
                aria-label="Swap origin and destination"
                title="Swap origin and destination"
                @click="swapStops"
              >
                <span class="material-symbols-outlined text-[21px]">swap_vert</span>
              </button>

              <div class="border-t border-slate-200 pt-3 dark:border-slate-700">
                <label class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400" for="planner-destination-stop">To</label>
                <SearchBar
                  mode="store"
                  input-id="planner-destination-stop"
                  label="Destination stop"
                  placeholder="Search for a stop or station"
                  searchClasses="h-14 rounded-2xl border-slate-200 bg-white px-4 text-base text-slate-950 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  :flush="true"
                  :show-filters="false"
                  v-model="destinationStop"
                  @selected-result="rememberEndpoint('destination', $event)"
                />
              </div>
            </div>

            <p v-if="sameStopError" class="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" role="alert">
              <span class="material-symbols-outlined text-[19px]">error</span>
              Choose two different stops for this journey.
            </p>
          </section>

          <section class="grid gap-4 sm:grid-cols-2" aria-label="Journey time and preferences">
            <div>
              <span class="mb-2 block text-xs font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">When</span>
              <div class="grid grid-cols-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  v-for="option in timeModeOptions"
                  :key="option.value"
                  type="button"
                  class="min-h-11 rounded-xl px-3 text-sm font-extrabold transition"
                  :class="timeMode === option.value ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-950 dark:text-blue-200' : 'text-slate-500 dark:text-slate-400'"
                  @click="timeMode = option.value"
                >
                  {{ option.label }}
                </button>
              </div>
              <input
                v-if="timeMode === 'depart'"
                id="planner-departure-time"
                v-model="departureDateTime"
                type="datetime-local"
                class="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                aria-label="Departure date and time"
              >
            </div>

            <details class="group rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
              <summary class="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                <span class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[20px] text-slate-400">tune</span>
                  Preferences
                </span>
                <span class="material-symbols-outlined text-[20px] text-slate-400 transition group-open:rotate-180">expand_more</span>
              </summary>
              <div class="space-y-3 border-t border-slate-100 p-3 dark:border-slate-800">
                <label class="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Maximum changes
                  <select v-model.number="maxChanges" class="mt-1 h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">
                    <option :value="0">Direct only</option>
                    <option :value="1">Up to 1 change</option>
                    <option :value="2">Up to 2 changes</option>
                    <option :value="3">Up to 3 changes</option>
                    <option :value="4">Up to 4 changes</option>
                  </select>
                </label>
                <label class="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  Maximum walking distance
                  <select v-model.number="maxWalking" class="mt-1 h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900">
                    <option :value="250">250 metres</option>
                    <option :value="500">500 metres</option>
                    <option :value="1000">1 kilometre</option>
                    <option :value="2000">2 kilometres</option>
                  </select>
                </label>
              </div>
            </details>
          </section>

          <p v-if="formError" class="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" role="alert">{{ formError }}</p>

          <button
            type="submit"
            class="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 text-base font-black text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="!hasEndpoints"
          >
            Find journeys
            <span class="material-symbols-outlined text-[22px]">arrow_forward</span>
          </button>
        </form>
      </section>
    </main>
  </div>
</template>

<script>
import { DateTime } from 'luxon'
import SearchBar from '@/components/SearchBar.vue'

const PLANNER_STORAGE_KEY = 'travigo.planner.last-search.v1'

export default {
  name: 'JourneyPlannerHome',
  components: { SearchBar },
  data () {
    return {
      originMode: 'stop',
      originStop: '',
      originLocation: undefined,
      originLocationError: '',
      locatingOrigin: false,
      destinationStop: '',
      originMeta: {},
      destinationMeta: {},
      timeMode: 'now',
      departureDateTime: '',
      maxChanges: 3,
      maxWalking: 1000,
      formError: '',
      timeModeOptions: [
        { value: 'now', label: 'Leave now' },
        { value: 'depart', label: 'Depart at' }
      ]
    }
  },
  computed: {
    hasEndpoints() {
      return Boolean(this.destinationStop) && (this.originMode === 'stop' ? Boolean(this.originStop) : Boolean(this.originLocation))
    },
    sameStopError() {
      return this.originMode === 'stop' && Boolean(this.originStop) && this.originStop === this.destinationStop
    },
    originLocationTitle() {
      if (this.locatingOrigin) return 'Getting your location…'
      return this.originLocation ? 'Current location selected' : 'Use your current location'
    },
    originLocationDescription() {
      return this.originLocation
        ? 'Your exact location is used for this search only.'
        : 'Your browser will ask before sharing it. It is not saved.'
    },
    originPlannerValue() {
      if (this.originMode === 'stop') return this.originStop
      if (!this.originLocation) return ''
      return `${this.originLocation.longitude},${this.originLocation.latitude}`
    }
  },
  created() {
    this.restoreForm()
  },
  methods: {
    queryValue(value) {
      return Array.isArray(value) ? value[0] : value || ''
    },
    readSavedPlanner() {
      try {
        return JSON.parse(localStorage.getItem(PLANNER_STORAGE_KEY) || '{}')
      } catch {
        return {}
      }
    },
    restoreForm() {
      const saved = this.readSavedPlanner()
      const query = this.$route.query
      const queryOrigin = this.queryValue(query.origin)
      const queryOriginType = this.queryValue(query.originType)

      this.originStop = queryOriginType !== 'location' && queryOrigin ? queryOrigin : saved.origin?.id || ''
      this.destinationStop = this.queryValue(query.destination) || saved.destination?.id || ''
      this.originMeta = this.originStop === saved.origin?.id ? saved.origin || {} : {
        id: this.originStop,
        name: this.queryValue(query.originName),
        timezone: this.queryValue(query.originTimezone)
      }
      this.destinationMeta = this.destinationStop === saved.destination?.id ? saved.destination || {} : {
        id: this.destinationStop,
        name: this.queryValue(query.destinationName),
        timezone: this.queryValue(query.destinationTimezone)
      }
      this.timeMode = this.queryValue(query.timeMode) || saved.timeMode || 'now'
      this.maxChanges = Number(this.queryValue(query.maxChanges) || saved.maxChanges || 3)
      this.maxWalking = Number(this.queryValue(query.maxWalking) || saved.maxWalking || 1000)

      if (queryOriginType === 'location' && /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(queryOrigin)) {
        const [longitude, latitude] = queryOrigin.split(',').map(Number)
        this.originMode = 'location'
        this.originLocation = { latitude, longitude }
      }

      const requestedDateTime = this.queryValue(query.datetime)
      const timezone = this.queryValue(query.originTimezone) || this.originMeta.timezone || DateTime.local().zoneName
      const parsed = requestedDateTime ? DateTime.fromISO(requestedDateTime).setZone(timezone) : null
      this.departureDateTime = parsed?.isValid && parsed > DateTime.now()
        ? parsed.toFormat("yyyy-MM-dd'T'HH:mm")
        : DateTime.now().plus({ minutes: 5 }).startOf('minute').toFormat("yyyy-MM-dd'T'HH:mm")
    },
    rememberEndpoint(type, stop) {
      const meta = stop ? {
        id: stop.PrimaryIdentifier || stop.Identifier || stop.id || '',
        name: stop.PrimaryName || stop.Name || stop.name || '',
        timezone: stop.Timezone || stop.timezone || ''
      } : {}

      if (type === 'origin') this.originMeta = meta
      else this.destinationMeta = meta
      this.formError = ''
    },
    toggleCurrentLocation() {
      this.originMode = this.originMode === 'location' ? 'stop' : 'location'
      this.originLocationError = ''
      this.formError = ''
      if (this.originMode === 'location' && !this.originLocation) this.requestOriginLocation()
    },
    requestOriginLocation() {
      this.originLocationError = ''
      if (!navigator.geolocation) {
        this.originLocationError = 'Location is not available in this browser.'
        return
      }

      this.locatingOrigin = true
      navigator.geolocation.getCurrentPosition(
        position => {
          this.originLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude }
          this.locatingOrigin = false
        },
        error => {
          this.originLocationError = error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Choose a stop or enable location access.'
            : 'Could not get your location. Try again in a moment.'
          this.locatingOrigin = false
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      )
    },
    swapStops() {
      if (this.originMode !== 'stop' || !this.originStop || !this.destinationStop) return
      ;[this.originStop, this.destinationStop] = [this.destinationStop, this.originStop]
      ;[this.originMeta, this.destinationMeta] = [this.destinationMeta, this.originMeta]
      this.formError = ''
    },
    plannerDateTime() {
      if (this.timeMode !== 'depart') return ''
      const timezone = this.originMeta.timezone || DateTime.local().zoneName
      const datetime = DateTime.fromISO(this.departureDateTime, { zone: timezone })
      return datetime.isValid ? datetime.toISO() : ''
    },
    savePlanner() {
      try {
        localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify({
          origin: this.originStop ? { ...this.originMeta, id: this.originStop } : undefined,
          destination: this.destinationStop ? { ...this.destinationMeta, id: this.destinationStop } : undefined,
          timeMode: this.timeMode,
          maxChanges: this.maxChanges,
          maxWalking: this.maxWalking
        }))
      } catch {
        // The planner still works when private browsing blocks local storage.
      }
    },
    submit() {
      this.formError = ''
      if (!this.hasEndpoints) return
      if (this.sameStopError) {
        this.formError = 'Choose two different stops for this journey.'
        return
      }

      const datetime = this.plannerDateTime()
      if (this.timeMode === 'depart' && !datetime) {
        this.formError = 'Choose a valid departure date and time.'
        return
      }

      this.savePlanner()
      this.$router.push({
        name: 'journeyplanner/search',
        query: {
          origin: this.originPlannerValue,
          originType: this.originMode,
          destination: this.destinationStop,
          originName: this.originMode === 'location' ? 'Current location' : this.originMeta.name || undefined,
          destinationName: this.destinationMeta.name || undefined,
          originTimezone: this.originMeta.timezone || undefined,
          destinationTimezone: this.destinationMeta.timezone || undefined,
          timeMode: this.timeMode,
          datetime: datetime || undefined,
          maxChanges: this.maxChanges,
          maxWalking: this.maxWalking
        }
      })
    }
  }
}
</script>
