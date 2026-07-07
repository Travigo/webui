<template>
  <div class="space-y-4 pb-16 pt-2 sm:pb-20">
    <PageHeader
      title="Journey planner"
      subtitle="Find public transport journeys between stops or from your current location."
      icon="route"
    />

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
        <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Plan a journey</h2>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Journeys may include transfers where needed.</p>
      </div>

      <form class="space-y-4 p-4 sm:p-5" @submit.prevent="submit()">
        <div class="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <div class="mb-3 flex items-center justify-between gap-3">
            <label class="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">From</label>
            <div class="inline-flex rounded-xl bg-white p-1 shadow-sm dark:bg-slate-950">
              <button
                v-for="option in originModeOptions"
                v-bind:key="option.value"
                type="button"
                class="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold transition"
                :class="originMode === option.value ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'"
                @click="setOriginMode(option.value)"
              >
                <span class="material-symbols-outlined text-[17px]">{{ option.icon }}</span>
                {{ option.label }}
              </button>
            </div>
          </div>

          <SearchBar
            v-if="originMode === 'stop'"
            mode="store"
            placeholder="Choose origin stop"
            searchClasses="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            :flush="true"
            v-model="originStop"
          />

          <div v-else class="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <div class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                <span class="material-symbols-outlined text-[22px]">my_location</span>
              </span>
              <div class="min-w-0 flex-1">
                <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ originLocationTitle }}</h3>
                <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{{ originLocationDescription }}</p>
              </div>
            </div>

            <div v-if="originLocationError" class="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
              {{ originLocationError }}
            </div>

            <button
              type="button"
              class="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-70"
              :disabled="locatingOrigin"
              @click="requestOriginLocation"
            >
              <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': locatingOrigin }">
                {{ locatingOrigin ? 'progress_activity' : 'near_me' }}
              </span>
              {{ originLocationButtonLabel }}
            </button>
          </div>
        </div>

        <div class="flex justify-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
            <span class="material-symbols-outlined text-[22px]">south</span>
          </span>
        </div>

        <div class="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">To</label>
          <SearchBar
            mode="store"
            placeholder="Choose destination stop"
            searchClasses="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            :flush="true"
            v-model="destinationStop"
          />
        </div>

        <button 
          type="submit" 
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
          :disabled="!canSubmit"
        >
          <span class="material-symbols-outlined text-[22px]">search</span>
          Find journeys
        </button>
      </form>
    </section>
  </div>
</template>

<script>
import SearchBar from '@/components/SearchBar.vue'
import PageHeader from '@/components/PageHeader.vue'

const DEFAULT_ORIGIN_STOP = 'tmr-stop-7152d2ec230f33e6d4d092d6adee'
const DEFAULT_DESTINATION_STOP = 'tmr-stop-a499f2e2140c892d3bc61fce694f'

export default {
  name: 'JourneyPlannerHome',
  components: {
    PageHeader,
    SearchBar
  },
  data(){
    return {
      originMode: 'stop',
      originStop: DEFAULT_ORIGIN_STOP,
      originLocation: undefined,
      originLocationError: '',
      locatingOrigin: false,
      destinationStop: DEFAULT_DESTINATION_STOP,
      originModeOptions: [
        { value: 'stop', label: 'Stop', icon: 'location_on' },
        { value: 'location', label: 'Current location', icon: 'my_location' }
      ]
    }
  },
  computed: {
    canSubmit() {
      return Boolean(this.destinationStop) &&
        (this.originMode === 'stop' ? Boolean(this.originStop) : Boolean(this.originLocation))
    },
    originLocationButtonLabel() {
      if (this.locatingOrigin) {
        return 'Getting location'
      }

      return this.originLocation ? 'Refresh location' : 'Use current location'
    },
    originLocationTitle() {
      return this.originLocation ? 'Current location selected' : 'Use your current location'
    },
    originLocationDescription() {
      if (!this.originLocation) {
        return 'Your browser will ask for permission before sharing your location.'
      }

      return `${this.originLocation.latitude.toFixed(5)}, ${this.originLocation.longitude.toFixed(5)}`
    },
    originPlannerValue() {
      if (this.originMode === 'stop') {
        return this.originStop
      }

      if (!this.originLocation) {
        return ''
      }

      return `${this.originLocation.longitude},${this.originLocation.latitude}`
    }
  },
  methods: {
    setOriginMode(mode) {
      this.originMode = mode
      this.originLocationError = ''
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
          this.originLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          this.locatingOrigin = false
        },
        error => {
          this.originLocationError = error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Enable location access to use your current location.'
            : 'Could not get your location. Try again in a moment.'
          this.locatingOrigin = false
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 60000
        }
      )
    },
    submit(){
      if (!this.canSubmit) {
        return
      }

      this.$router.push({
        name: 'journeyplanner/search',
        query: {
          origin: this.originPlannerValue,
          originType: this.originMode,
          destination: this.destinationStop
        }
      })
    }
  }
}
</script>
