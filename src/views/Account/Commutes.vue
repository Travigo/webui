<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Account"
      title="Commutes"
      subtitle="Save the regular journeys you rely on and when you usually travel."
      icon="commute"
      variant="panel"
    >
      <template v-if="auth0.isAuthenticated" #actions>
        <button
          type="button"
          aria-label="Add commute"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-blue px-3 text-sm font-bold text-white shadow-lg shadow-brand-blue/20 transition hover:bg-brand-blue-dark sm:px-4"
          @click="openNewCommute"
        >
          <span class="material-symbols-outlined text-[20px]">add</span>
          <span class="hidden sm:inline">Add commute</span>
        </button>
      </template>
    </PageHeader>

    <section v-if="auth0.isLoading" class="grid gap-3 lg:grid-cols-2" aria-label="Loading commutes">
      <div v-for="index in 2" :key="index" class="ui-panel h-56 animate-pulse p-4 sm:p-5">
        <div class="flex items-center gap-3">
          <div class="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
          <div class="flex-1">
            <div class="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800"></div>
            <div class="mt-2 h-4 w-2/5 rounded bg-slate-100 dark:bg-slate-800"></div>
          </div>
        </div>
        <div class="mt-4 h-24 rounded-xl bg-slate-50 dark:bg-slate-950"></div>
      </div>
    </section>

    <section v-else-if="!auth0.isAuthenticated" class="ui-panel border-dashed px-5 py-10 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
        <span class="material-symbols-outlined text-[25px]">lock</span>
      </span>
      <h2 class="ui-section-title mt-3">Sign in to save a commute</h2>
      <p class="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
        Your regular routes and travel times stay private to your Travigo account.
      </p>
    </section>

    <template v-else>
      <section class="space-y-3" aria-labelledby="commutes-heading">
        <div class="flex items-end justify-between gap-3 px-1">
          <div>
            <h2 id="commutes-heading" class="ui-section-title">Your commutes</h2>
            <p v-if="!loading && !loadError && commutes.length > 0" class="ui-meta mt-0.5">
              {{ commutes.length }} saved {{ commutes.length === 1 ? 'route' : 'routes' }}
            </p>
          </div>
        </div>

        <div v-if="loading" class="grid gap-3 lg:grid-cols-2" aria-label="Loading saved commutes">
          <div v-for="index in 2" :key="index" class="ui-panel h-56 animate-pulse p-4 sm:p-5">
            <div class="flex items-center gap-3">
              <div class="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800"></div>
              <div class="flex-1">
                <div class="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800"></div>
                <div class="mt-2 h-4 w-2/5 rounded bg-slate-100 dark:bg-slate-800"></div>
              </div>
            </div>
            <div class="mt-4 h-24 rounded-xl bg-slate-50 dark:bg-slate-950"></div>
          </div>
        </div>

        <div v-else-if="loadError" class="ui-panel border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10 sm:p-5" role="alert">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined mt-0.5 text-[22px] text-red-600 dark:text-red-300">error</span>
              <div>
                <h3 class="text-sm font-bold text-red-900 dark:text-red-100">Commutes could not be loaded</h3>
                <p class="mt-0.5 text-sm font-medium text-red-700 dark:text-red-200">Check your connection and try again.</p>
              </div>
            </div>
            <button type="button" class="ui-button-secondary shrink-0" @click="load">
              <span class="material-symbols-outlined text-[19px]">refresh</span>
              Try again
            </button>
          </div>
        </div>

        <div v-else-if="commutes.length === 0" class="ui-panel border-dashed px-5 py-10 text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <span class="material-symbols-outlined text-[25px]">route</span>
          </span>
          <h3 class="ui-section-title mt-3">No commutes yet</h3>
          <p class="mx-auto mt-1 max-w-md text-sm font-medium text-slate-500 dark:text-slate-400">
            Add a regular route once, then Travigo can use it to keep your everyday travel organised.
          </p>
          <button type="button" class="ui-button-primary mt-4" @click="openNewCommute">
            <span class="material-symbols-outlined text-[20px]">add</span>
            Add your first commute
          </button>
        </div>

        <div v-else class="grid gap-3 lg:grid-cols-2">
          <article v-for="commute in commutes" :key="commute.id" class="ui-panel flex flex-col p-4 sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
                <span class="material-symbols-outlined text-[23px]">commute</span>
              </span>

              <div class="min-w-0 flex-1">
                <p class="ui-eyebrow">{{ travelDaysSummary(commute.daysOfWeek) }}</p>
                <h3 class="mt-1 truncate text-base font-bold leading-snug text-slate-950 dark:text-slate-100">
                  {{ commute.name }}
                </h3>
              </div>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/10 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/10"
                  :aria-label="`Edit ${commute.name}`"
                  @click="edit(commute)"
                >
                  <span class="material-symbols-outlined text-[18px]">edit</span>
                  <span class="hidden sm:inline">Edit</span>
                </button>
                <button
                  type="button"
                  class="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-700 dark:text-slate-500 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                  :aria-label="`Delete ${commute.name}`"
                  @click="openDeleteCommute(commute)"
                >
                  <span class="material-symbols-outlined text-[19px]">delete</span>
                </button>
              </div>
            </div>

            <div class="ui-subtle mt-4 flex-1 p-3.5">
              <div class="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2.5">
                <div class="flex flex-col items-center">
                  <span class="mt-0.5 h-3 w-3 rounded-full border-[3px] border-brand-blue bg-white dark:bg-slate-950"></span>
                  <span class="my-1 h-6 w-px bg-slate-300 dark:bg-slate-700"></span>
                  <span class="h-3 w-3 rounded-full bg-brand-pink ring-4 ring-brand-pink/10"></span>
                </div>
                <div class="min-w-0">
                  <p class="ui-meta uppercase tracking-wide">From</p>
                  <p class="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{{ stopName(commute.origin, 'Origin stop') }}</p>
                  <div class="h-4"></div>
                  <p class="ui-meta uppercase tracking-wide">To</p>
                  <p class="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-slate-100">{{ stopName(commute.destination, 'Destination stop') }}</p>
                </div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800">
              <div class="pr-3">
                <p class="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-[17px]">login</span>
                  Outward
                </p>
                <p class="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">Arrive by {{ commute.arrivalAtDestinationTime || '—' }}</p>
              </div>
              <div class="pl-3">
                <p class="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-[17px]">logout</span>
                  Return
                </p>
                <p class="mt-1 text-sm font-bold text-slate-950 dark:text-slate-100">Leave after {{ commute.returnDepartureTime || '—' }}</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>

    <Modal
      :key="editorKey"
      v-model:open="editorOpen"
      :title="editing ? 'Edit commute' : 'Add commute'"
      :subtitle="editing ? `Update ${form.name || 'this saved route'}.` : 'Choose your route and usual travel times.'"
      icon="commute"
      size="lg"
      close-label="Close commute editor"
      :close-disabled="saving"
      body-class="max-h-[calc(88dvh-6rem)] overflow-y-auto overscroll-contain p-4 sm:p-5"
      @close="handleEditorClosed"
    >
      <form class="space-y-5" @submit.prevent="save">
        <label class="block">
          <span class="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</span>
          <input
            v-model.trim="form.name"
            class="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 shadow-sm placeholder:font-medium placeholder:text-slate-400 focus:border-brand-blue focus:ring-brand-blue dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            maxlength="80"
            placeholder="e.g. Work, school or gym"
            autocomplete="off"
            required
          >
        </label>

        <section aria-labelledby="commute-route-heading">
          <div class="mb-2 flex items-center justify-between gap-3">
            <h3 id="commute-route-heading" class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Route</h3>
            <button
              type="button"
              class="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/10 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-brand-blue-light dark:hover:bg-brand-blue/100/10 dark:disabled:text-slate-600"
              :disabled="!form.originRef || !form.destinationRef"
              @click="swapStops"
            >
              <span class="material-symbols-outlined text-[18px]">swap_vert</span>
              Swap
            </button>
          </div>

          <div class="ui-subtle space-y-3 p-3 sm:p-4">
            <div>
              <label class="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300" for="commute-origin-stop">From</label>
              <SearchBar
                v-model="form.originRef"
                mode="store"
                input-id="commute-origin-stop"
                label="Origin stop"
                :flush="true"
                :show-filters="false"
                placeholder="Search for a stop or station"
                search-classes="h-14 rounded-xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 placeholder:font-medium placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                @selected-result="rememberStop('origin', $event)"
              />
            </div>

            <div class="border-t border-slate-200 pt-3 dark:border-slate-700">
              <label class="mb-2 block text-xs font-bold text-slate-600 dark:text-slate-300" for="commute-destination-stop">To</label>
              <SearchBar
                v-model="form.destinationRef"
                mode="store"
                input-id="commute-destination-stop"
                label="Destination stop"
                :flush="true"
                :show-filters="false"
                placeholder="Search for a stop or station"
                search-classes="h-14 rounded-xl border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 placeholder:font-medium placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                @selected-result="rememberStop('destination', $event)"
              />
            </div>
          </div>

          <p v-if="sameStopSelected" class="mt-2 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" role="alert">
            <span class="material-symbols-outlined text-[19px]">error</span>
            Choose two different stops for this commute.
          </p>
        </section>

        <section aria-labelledby="commute-times-heading">
          <div>
            <h3 id="commute-times-heading" class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Usual times</h3>
            <p class="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Set an arrival time for the outward trip and a departure time for the return.</p>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-2">
            <label class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <span class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span class="material-symbols-outlined text-[18px] text-brand-blue dark:text-brand-blue-light">login</span>
                Arrive at destination by
              </span>
              <input
                v-model="form.arrivalAtDestinationTime"
                class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 focus:border-brand-blue focus:ring-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                type="time"
                required
              >
            </label>
            <label class="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
              <span class="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <span class="material-symbols-outlined text-[18px] text-brand-pink">logout</span>
                Leave destination after
              </span>
              <input
                v-model="form.returnDepartureTime"
                class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-950 focus:border-brand-blue focus:ring-brand-blue dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                type="time"
                required
              >
            </label>
          </div>
        </section>

        <fieldset>
          <legend class="sr-only">Travel days</legend>
          <div class="flex items-center justify-between gap-3">
            <span class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Travel days</span>
            <div class="flex items-center gap-1">
              <button type="button" class="min-h-9 rounded-lg px-2 text-xs font-bold text-brand-blue transition hover:bg-brand-blue/10 dark:text-brand-blue-light" @click="selectWeekdays">Weekdays</button>
              <button type="button" class="min-h-9 rounded-lg px-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800" @click="selectEveryDay">Every day</button>
            </div>
          </div>
          <div class="mt-2 grid grid-cols-7 gap-1.5">
            <button
              v-for="day in days"
              :key="day"
              type="button"
              class="flex min-h-11 items-center justify-center rounded-xl border text-xs font-bold transition sm:min-h-12"
              :class="form.daysOfWeek.includes(day)
                ? 'border-brand-blue bg-brand-blue text-white shadow-sm shadow-brand-blue/20'
                : 'border-slate-200 bg-white text-slate-500 hover:border-brand-blue/30 hover:bg-brand-blue/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-brand-blue/40 dark:hover:bg-brand-blue/100/10'"
              :aria-pressed="form.daysOfWeek.includes(day)"
              :aria-label="day"
              :title="day"
              @click="toggleDay(day)"
            >
              {{ day.slice(0, 2) }}
            </button>
          </div>
        </fieldset>

        <p v-if="formError" class="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-100" role="alert">
          {{ formError }}
        </p>

        <div class="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:justify-end">
          <button type="button" class="ui-button-secondary" :disabled="saving" @click="closeEditor">Cancel</button>
          <button type="submit" class="ui-button-primary" :disabled="saving || !ready">
            <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': saving }">{{ saving ? 'progress_activity' : 'check' }}</span>
            {{ saving ? 'Saving…' : editing ? 'Save changes' : 'Add commute' }}
          </button>
        </div>
      </form>
    </Modal>

    <Modal
      v-model:open="deleteModalOpen"
      title="Delete commute?"
      :subtitle="commutePendingDeletion?.name || ''"
      icon="delete"
      size="sm"
      close-label="Close delete commute dialog"
      :close-disabled="deleting"
      body-class="space-y-4 p-4 sm:p-5"
      @close="closeDeleteCommute"
    >
      <p class="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
        This saved route and its usual travel times will be permanently removed.
      </p>
      <p v-if="deleteError" class="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-100" role="alert">
        {{ deleteError }}
      </p>
      <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="ui-button-secondary" :disabled="deleting" @click="closeDeleteCommute">Cancel</button>
        <button type="button" class="ui-button-danger" :disabled="deleting" @click="confirmDeleteCommute">
          <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': deleting }">{{ deleting ? 'progress_activity' : 'delete' }}</span>
          {{ deleting ? 'Deleting…' : 'Delete commute' }}
        </button>
      </div>
    </Modal>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import commutes from '@/commutes'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const WEEKDAYS = DAYS.slice(0, 5)
const newForm = () => ({
  id: '',
  name: '',
  originRef: '',
  destinationRef: '',
  arrivalAtDestinationTime: '09:00',
  returnDepartureTime: '17:30',
  daysOfWeek: WEEKDAYS.slice()
})

export default {
  name: 'AccountCommutes',
  components: { Modal, PageHeader, SearchBar },
  data: () => ({
    auth0: useAuth0(),
    commutes: [],
    form: newForm(),
    editing: false,
    editorOpen: false,
    editorKey: 0,
    loading: false,
    saving: false,
    deleting: false,
    loadError: '',
    formError: '',
    deleteError: '',
    deleteModalOpen: false,
    commutePendingDeletion: undefined,
    days: DAYS
  }),
  computed: {
    sameStopSelected () {
      return Boolean(this.form.originRef) && this.form.originRef === this.form.destinationRef
    },
    ready () {
      return Boolean(
        this.form.name &&
        this.form.originRef &&
        this.form.destinationRef &&
        !this.sameStopSelected &&
        this.form.arrivalAtDestinationTime &&
        this.form.returnDepartureTime &&
        this.form.daysOfWeek.length > 0
      )
    }
  },
  watch: {
    'auth0.isAuthenticated' () { this.load() }
  },
  mounted () { this.load() },
  methods: {
    async load () {
      if (!this.auth0.isAuthenticated) return
      this.loading = true
      this.loadError = ''
      try {
        this.commutes = await commutes.list(this.auth0)
      } catch {
        this.loadError = 'Commutes could not be loaded.'
      } finally {
        this.loading = false
      }
    },
    openNewCommute () {
      this.form = newForm()
      this.editing = false
      this.formError = ''
      this.editorKey += 1
      this.editorOpen = true
    },
    edit (commute) {
      this.form = { ...commute, daysOfWeek: [...(commute.daysOfWeek || [])] }
      this.editing = true
      this.formError = ''
      this.editorKey += 1
      this.editorOpen = true
    },
    closeEditor () {
      if (this.saving) return
      this.editorOpen = false
      this.resetForm()
    },
    handleEditorClosed () {
      if (!this.saving) this.resetForm()
    },
    resetForm () {
      this.form = newForm()
      this.editing = false
      this.formError = ''
    },
    rememberStop (field, stop) {
      this.form[`${field}Ref`] = stop?.PrimaryIdentifier || stop?.primaryIdentifier || stop?.Identifier || stop?.identifier || stop?.id || this.form[`${field}Ref`]
    },
    swapStops () {
      if (!this.form.originRef || !this.form.destinationRef) return
      ;[this.form.originRef, this.form.destinationRef] = [this.form.destinationRef, this.form.originRef]
      ;[this.form.origin, this.form.destination] = [this.form.destination, this.form.origin]
      this.formError = ''
    },
    toggleDay (day) {
      this.form.daysOfWeek = this.form.daysOfWeek.includes(day)
        ? this.form.daysOfWeek.filter(value => value !== day)
        : DAYS.filter(value => [...this.form.daysOfWeek, day].includes(value))
    },
    selectWeekdays () { this.form.daysOfWeek = WEEKDAYS.slice() },
    selectEveryDay () { this.form.daysOfWeek = DAYS.slice() },
    stopName (stop, fallback) {
      return stop?.name || stop?.PrimaryName || stop?.primaryName || stop?.Name || stop?.OtherNames?.PrimaryName || fallback
    },
    travelDaysSummary (selectedDays = []) {
      const orderedDays = DAYS.filter(day => selectedDays.includes(day))
      if (orderedDays.length === DAYS.length) return 'Every day'
      if (orderedDays.length === WEEKDAYS.length && WEEKDAYS.every(day => orderedDays.includes(day))) return 'Weekdays'
      if (orderedDays.length === 2 && orderedDays.includes('Saturday') && orderedDays.includes('Sunday')) return 'Weekends'
      if (orderedDays.length === 0) return 'No travel days'
      return orderedDays.map(day => day.slice(0, 3)).join(' · ')
    },
    async save () {
      if (!this.ready || this.saving) return
      this.saving = true
      this.formError = ''
      try {
        const saved = this.editing
          ? await commutes.update(this.auth0, this.form)
          : await commutes.create(this.auth0, this.form)
        const index = this.commutes.findIndex(commute => commute.id === saved.id)
        if (index >= 0) this.commutes.splice(index, 1, saved)
        else this.commutes.unshift(saved)
        this.editorOpen = false
        this.resetForm()
      } catch (error) {
        this.formError = error?.response?.data?.error || 'Commute could not be saved.'
      } finally {
        this.saving = false
      }
    },
    openDeleteCommute (commute) {
      this.commutePendingDeletion = commute
      this.deleteError = ''
      this.deleteModalOpen = true
    },
    closeDeleteCommute () {
      if (this.deleting) return
      this.deleteModalOpen = false
      this.commutePendingDeletion = undefined
      this.deleteError = ''
    },
    async confirmDeleteCommute () {
      const commute = this.commutePendingDeletion
      if (!commute?.id || this.deleting) return
      this.deleting = true
      this.deleteError = ''
      try {
        await commutes.delete(this.auth0, commute.id)
        this.commutes = this.commutes.filter(item => item.id !== commute.id)
        if (this.form.id === commute.id) this.closeEditor()
        this.deleteModalOpen = false
        this.commutePendingDeletion = undefined
      } catch {
        this.deleteError = 'Commute could not be deleted. Try again.'
      } finally {
        this.deleting = false
      }
    }
  }
}
</script>
