<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      eyebrow="Account"
      title="Commutes"
      subtitle="Set the journeys you rely on and Travigo will watch the route for you."
      icon="directions_transit"
      variant="panel"
    />

    <section v-if="!auth0.isLoading && !auth0.isAuthenticated" class="ui-panel border-dashed px-5 py-10 text-center">
      <span class="material-symbols-outlined text-3xl text-brand-blue">lock</span>
      <h2 class="ui-section-title mt-3">Sign in to save a commute</h2>
      <p class="ui-body mt-1">Your route and notification schedule stay private to your account.</p>
    </section>

    <template v-else>
      <section class="ui-panel p-4 sm:p-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="ui-section-title">{{ editing ? 'Edit commute' : 'New commute' }}</h2>
            <p class="ui-body mt-1">The morning trip arrives by your chosen time; the return trip leaves after its chosen time.</p>
          </div>
          <button v-if="editing" type="button" class="text-sm font-bold text-brand-blue" @click="resetForm">Cancel</button>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="save">
          <label class="block">
            <span class="ui-label">Name</span>
            <input v-model.trim="form.name" class="ui-input mt-1" maxlength="80" placeholder="Work commute" required>
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <span class="ui-label">Origin</span>
              <SearchBar v-model="form.originRef" mode="store" :flush="true" :show-filters="false" placeholder="Search for a stop or station" search-classes="ui-input mt-1 h-12" @selected-result="rememberStop('origin', $event)" />
            </div>
            <div>
              <span class="ui-label">Destination</span>
              <SearchBar v-model="form.destinationRef" mode="store" :flush="true" :show-filters="false" placeholder="Search for a stop or station" search-classes="ui-input mt-1 h-12" @selected-result="rememberStop('destination', $event)" />
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="ui-label">Arrive at destination by</span>
              <input v-model="form.arrivalAtDestinationTime" class="ui-input mt-1" type="time" required>
            </label>
            <label class="block">
              <span class="ui-label">Leave destination after</span>
              <input v-model="form.returnDepartureTime" class="ui-input mt-1" type="time" required>
            </label>
          </div>

          <fieldset>
            <legend class="ui-label">Days</legend>
            <div class="mt-2 flex flex-wrap gap-2">
              <button v-for="day in days" :key="day" type="button" class="rounded-xl px-3 py-2 text-xs font-bold transition" :class="form.daysOfWeek.includes(day) ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'" @click="toggleDay(day)">
                {{ day.slice(0, 3) }}
              </button>
            </div>
          </fieldset>

          <p v-if="error" class="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 dark:bg-red-500/10 dark:text-red-100" role="alert">{{ error }}</p>
          <button type="submit" class="ui-button-primary" :disabled="saving || !ready">{{ saving ? 'Saving…' : editing ? 'Save commute' : 'Add commute' }}</button>
        </form>
      </section>

      <section class="space-y-3">
        <h2 class="ui-section-title px-1">Your commutes</h2>
        <div v-if="loading" class="ui-panel p-5 text-sm text-slate-500">Loading commutes…</div>
        <div v-else-if="commutes.length === 0" class="ui-panel border-dashed px-5 py-8 text-center text-sm font-medium text-slate-500">No commutes yet.</div>
        <div v-else class="ui-panel divide-y divide-slate-100 dark:divide-slate-800">
          <article v-for="commute in commutes" :key="commute.id" class="flex items-center gap-3 p-4 sm:p-5">
            <span class="material-symbols-outlined text-brand-blue">commute</span>
            <div class="min-w-0 flex-1">
              <h3 class="font-bold text-slate-950 dark:text-slate-100">{{ commute.name }}</h3>
              <p class="mt-0.5 text-sm font-medium text-slate-500 dark:text-slate-400">{{ stopName(commute.origin, 'Origin') }} → {{ stopName(commute.destination, 'Destination') }}</p>
              <p class="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">Arrive by {{ commute.arrivalAtDestinationTime }} · Leave after {{ commute.returnDepartureTime }} · {{ commute.daysOfWeek.map(day => day.slice(0, 3)).join(', ') }}</p>
            </div>
            <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" :aria-label="`Edit ${commute.name}`" @click="edit(commute)"><span class="material-symbols-outlined">edit</span></button>
            <button type="button" class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10" :aria-label="`Delete ${commute.name}`" @click="remove(commute)"><span class="material-symbols-outlined">delete</span></button>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import PageHeader from '@/components/PageHeader.vue'
import SearchBar from '@/components/SearchBar.vue'
import commutes from '@/commutes'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const newForm = () => ({ id: '', name: '', originRef: '', destinationRef: '', arrivalAtDestinationTime: '09:00', returnDepartureTime: '18:00', daysOfWeek: DAYS.slice() })

export default {
  name: 'AccountCommutes',
  components: { PageHeader, SearchBar },
  data: () => ({ auth0: useAuth0(), commutes: [], form: newForm(), editing: false, loading: false, saving: false, error: '', days: DAYS }),
  computed: {
    ready () { return this.form.name && this.form.originRef && this.form.destinationRef && this.form.originRef !== this.form.destinationRef && this.form.daysOfWeek.length > 0 }
  },
  watch: { 'auth0.isAuthenticated' () { this.load() } },
  mounted () { this.load() },
  methods: {
    async load () {
      if (!this.auth0.isAuthenticated) return
      this.loading = true
      try { this.commutes = await commutes.list(this.auth0) } catch { this.error = 'Commutes could not be loaded.' } finally { this.loading = false }
    },
    rememberStop (field, stop) { this.form[`${field}Ref`] = stop?.PrimaryIdentifier || stop?.Identifier || stop?.id || this.form[`${field}Ref`] },
    toggleDay (day) { this.form.daysOfWeek = this.form.daysOfWeek.includes(day) ? this.form.daysOfWeek.filter(value => value !== day) : [...this.form.daysOfWeek, day] },
    stopName (stop, fallback) { return stop?.name || stop?.PrimaryName || fallback },
    edit (commute) { this.form = { ...commute, daysOfWeek: [...(commute.daysOfWeek || [])] }; this.editing = true; this.error = '' },
    resetForm () { this.form = newForm(); this.editing = false; this.error = '' },
    async save () {
      if (!this.ready || this.saving) return
      this.saving = true; this.error = ''
      try {
        const saved = this.editing ? await commutes.update(this.auth0, this.form) : await commutes.create(this.auth0, this.form)
        const index = this.commutes.findIndex(commute => commute.id === saved.id)
        if (index >= 0) this.commutes.splice(index, 1, saved)
        else this.commutes.unshift(saved)
        this.resetForm()
      } catch (error) { this.error = error?.response?.data?.error || 'Commute could not be saved.' } finally { this.saving = false }
    },
    async remove (commute) {
      if (!window.confirm(`Delete ${commute.name}?`)) return
      try { await commutes.delete(this.auth0, commute.id); this.commutes = this.commutes.filter(item => item.id !== commute.id); if (this.form.id === commute.id) this.resetForm() } catch { this.error = 'Commute could not be deleted.' }
    }
  }
}
</script>
