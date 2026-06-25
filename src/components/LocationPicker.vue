<template>
  <button
    @click="open"
    class="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/60 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-lg"
  >
    <span class="material-symbols-outlined text-lg text-slate-900 sm:text-2xl">location_on</span>
    {{ location }}
    <span class="material-symbols-outlined text-base text-blue-600 sm:text-xl">keyboard_arrow_down</span>
  </button>

  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="openPicker"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="close"
      >
        <section class="modal-panel w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-950/20 sm:max-w-md sm:p-5">
          <div class="mb-4 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-bold text-slate-950 sm:text-xl">Choose location</h2>
              <p class="mt-1 text-sm text-slate-500">Location search does not work at the moment.</p>
            </div>
            <button
              @click="close"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Close location picker"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <label for="locationSearch" class="mb-2 block text-sm font-medium text-slate-700">Search for a town or city</label>
          <div class="relative">
            <span class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
            <input
              id="locationSearch"
              v-model="searchTerm"
              type="text"
              class="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
              placeholder="Search locations"
              autocomplete="off"
            >
          </div>

          <div class="mt-4 rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800">
            This is only a placeholder for now. Searching here will not update nearby stops or the map yet.
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'LocationPicker',
  props: {
    location: {
      default: 'Global'
    }
  },
  data() {
    return {
      openPicker: false,
      searchTerm: ''
    }
  },
  methods: {
    open() {
      this.openPicker = true
    },
    close() {
      this.openPicker = false
    }
  }
}
</script>
