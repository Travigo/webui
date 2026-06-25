<template>
  <div class="space-y-4 pb-16 pt-2 sm:pb-20">
    <section class="space-y-3 rounded-2xl bg-blue-50 p-4">
      <div class="flex items-start gap-3">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
          <span class="material-symbols-outlined text-[24px]">route</span>
        </span>
        <div class="min-w-0">
          <h1 class="text-[1.5rem] font-extrabold leading-tight tracking-normal text-slate-950 sm:text-3xl">
            Journey planner
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500">
            Find direct public transport journeys between stops.
          </p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-100 px-4 py-3 sm:px-5">
        <h2 class="text-sm font-extrabold text-slate-950">Plan a journey</h2>
        <p class="mt-1 text-sm text-slate-500">Direct journeys only for now.</p>
      </div>

      <form class="space-y-4 p-4 sm:p-5" @submit.prevent="submit()">
        <div class="rounded-2xl bg-slate-50 p-3">
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">From</label>
          <SearchBar
            mode="store"
            placeholder="Choose origin stop"
            searchClasses="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
            :flush="true"
            v-model="originStop"
          />
        </div>

        <div class="flex justify-center">
          <span class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <span class="material-symbols-outlined text-[22px]">south</span>
          </span>
        </div>

        <div class="rounded-2xl bg-slate-50 p-3">
          <label class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">To</label>
          <SearchBar
            mode="store"
            placeholder="Choose destination stop"
            searchClasses="h-12 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm placeholder:text-slate-400"
            :flush="true"
            v-model="destinationStop"
          />
        </div>

        <button 
          type="submit" 
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-60"
          :disabled="!originStop || !destinationStop"
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

export default {
  name: 'JourneyPlannerHome',
  components: {
    SearchBar
  },
  data(){
    return {
      originStop : "tmr-stop-7152d2ec230f33e6d4d092d6adee",
      destinationStop: "tmr-stop-a499f2e2140c892d3bc61fce694f"
    }
  },
  methods: {
    submit(){
      this.$router.push({ name: 'journeyplanner/search', query: { origin: this.originStop, destination: this.destinationStop } })
    }
  }
}
</script>
