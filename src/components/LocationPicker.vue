<template>
  <button
    @click="open"
    class="-my-1 inline-flex min-h-11 items-center"
  >
    <span class="inline-flex items-center gap-1.5 rounded-xl border border-indigo-100 bg-white/80 px-2.5 py-1.5 text-sm font-medium text-slate-900 shadow-sm shadow-slate-200/60 sm:gap-2 sm:rounded-2xl sm:px-3 sm:py-2 sm:text-lg">
      <span class="material-symbols-outlined text-lg text-slate-900 sm:text-2xl">location_on</span>
      {{ location }}
      <span class="material-symbols-outlined text-base text-blue-600 sm:text-xl">keyboard_arrow_down</span>
    </span>
  </button>

  <Modal
    v-model:open="openPicker"
    title="Choose location"
    subtitle="Limit responses to only one region to reduce clutter."
    icon="location_on"
    size="sm"
    close-label="Close location picker"
    body-class="p-4 sm:p-5"
  >
    <label for="locationSearch" class="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Search for a town or city</label>
    <div class="relative">
      <span class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-slate-400">search</span>
      <input
        id="locationSearch"
        v-model="searchTerm"
        type="text"
        class="block h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:bg-slate-900 dark:focus:ring-blue-500/20"
        placeholder="Search locations"
        autocomplete="off"
      >
    </div>

    <div class="mt-4 rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
      This is only a placeholder for now. Searching here will not update nearby stops or the map yet.
    </div>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal.vue'

export default {
  name: 'LocationPicker',
  components: {
    Modal
  },
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
