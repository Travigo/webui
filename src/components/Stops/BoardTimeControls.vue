<template>
  <div v-if="!footer" class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
    <div ref="summary" tabindex="-1" class="text-sm font-semibold focus:outline-brand-blue">
      {{ boardType === 'arrivals' ? 'Arriving' : 'Departing' }} from: {{ label }}
      <span class="block text-xs font-normal text-slate-500">Times shown in {{ timezone }}</span>
      <span v-if="live && canChangeTime" class="block text-xs font-normal text-slate-500">Live predictions may change while browsing</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button v-if="canChangeTime" class="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-bold dark:bg-slate-800" type="button" @click="openPicker">Change time</button>
      <button v-if="canReset" class="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-bold dark:bg-slate-800" type="button" @click="$emit('now')">Back to now</button>
    </div>
    <Modal v-if="canChangeTime" :open="open" title="Change time" @update:open="open = $event">
      <form id="board-time-form" class="space-y-4" @submit.prevent="submit">
        <p class="text-sm text-slate-500">Times are in {{ timezone }}.</p>
        <label class="block text-sm font-bold">Date<input v-model="date" type="date" required class="mt-1 block min-h-11 w-full rounded-lg dark:bg-slate-800" /></label>
        <label class="block text-sm font-bold">Time<input v-model="clock" type="time" required class="mt-1 block min-h-11 w-full rounded-lg dark:bg-slate-800" /></label>
        <fieldset v-if="choices.length > 1" class="space-y-2 text-sm">
          <legend class="font-bold">This time occurs twice. Choose an occurrence:</legend>
          <label v-for="(choice, index) in choices" :key="choice.toISO()" class="flex min-h-11 items-center gap-2"><input v-model="choiceIndex" type="radio" :value="index" /> {{ index === 0 ? 'First' : 'Second' }} (UTC{{ choice.toFormat('ZZ') }})</label>
        </fieldset>
        <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ error }}</p>
      </form>
      <template #footer><div class="flex justify-end gap-2"><button type="button" class="min-h-11 rounded-xl px-4" @click="open = false">Cancel</button><button form="board-time-form" type="submit" class="min-h-11 rounded-xl bg-brand-blue px-4 font-bold text-white">Show journeys</button></div></template>
    </Modal>
  </div>
  <div v-if="footer" class="space-y-2 border-t border-slate-100 p-3 dark:border-slate-800">
    <p v-if="loading" class="text-sm text-slate-500" role="status">Loading board…</p>
    <p v-else-if="refreshed" class="text-sm text-slate-500" role="status">Board updated.</p>
    <p v-if="errorMessage" role="alert" class="text-sm text-red-700 dark:text-red-300">{{ errorMessage }} <button v-if="restartRequired" class="min-h-11 font-bold underline" type="button" @click="$emit('restart')">Restart search</button><button v-else class="min-h-11 font-bold underline" type="button" @click="$emit('retry')">Try again</button></p>
    <p v-if="page?.NextCursor && !nextAvailable" class="text-sm text-slate-500">Connect to load later journeys.</p>
    <p v-if="page?.Unsupported" class="text-sm">Later journeys are not available for this stop yet.</p>
    <p v-else-if="page?.Continuation === 'unknown'" class="text-sm">The search could not establish whether more journeys are available. Change time to search again.</p>
    <p v-else-if="page?.Continuation === 'exhausted'" class="text-sm text-slate-500">No more journeys found before {{ horizon }}.</p>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
    <div class="flex flex-wrap justify-between gap-2">
      <button v-if="canBack" type="button" class="min-h-11 rounded-xl bg-slate-100 px-4 font-bold dark:bg-slate-800" :disabled="loading" @click="$emit('back')">Back</button>
      <button v-if="page?.NextCursor" type="button" class="min-h-11 w-full rounded-xl bg-brand-blue px-4 font-bold text-white disabled:opacity-50 sm:ml-auto sm:w-auto" :disabled="loading || !nextAvailable" @click="$emit('next')">{{ loading ? 'Loading…' : (boardType === 'arrivals' ? 'Later arrivals →' : 'Later journeys →') }}</button>
    </div>
  </div>
</template>
<script>
import { DateTime } from 'luxon'
import { boardTimeChoices } from '@/components/Stops/boardTime.mjs'
import Modal from '@/components/Modal.vue'
export default {
  components: { Modal },
  props: { timezone: String, reference: [String, Number], live: Boolean, canChangeTime: Boolean, canReset: Boolean, boardType: String, page: Object, loading: Boolean, canBack: Boolean, refreshed: Boolean, restartRequired: Boolean, errorMessage: String, announcement: String, footer: Boolean, nextAvailable: { type: Boolean, default: true } },
  emits: ['time', 'now', 'next', 'back', 'retry', 'restart'],
  data() { return { open: false, date: '', clock: '', choiceIndex: null, error: '' } },
  computed: {
    label() { if (this.live) return 'Now'; const value = DateTime.fromISO(String(this.reference || ''), { setZone: true }).setZone(this.timezone); return value.isValid ? value.toFormat('ccc d LLL, HH:mm') : 'Selected time' },
    horizon() { return this.page?.SearchEndDateTime ? DateTime.fromISO(this.page.SearchEndDateTime).setZone(this.timezone).toFormat('ccc d LLL, HH:mm') : '' },
    choices() { return boardTimeChoices(this.date, this.clock, this.timezone) }
  },
  watch: { date() { this.choiceIndex = null; this.error = '' }, clock() { this.choiceIndex = null; this.error = '' } },
  methods: {
    openPicker() { const value = this.live ? DateTime.now().setZone(this.timezone) : DateTime.fromISO(String(this.reference), { setZone: true }).setZone(this.timezone); this.date = value.toISODate(); this.clock = value.toFormat('HH:mm'); this.error = ''; this.choiceIndex = null; this.open = true },
    submit() { if (!this.choices.length) { this.error = 'This local time does not exist because the clocks change. Choose another time.'; return }; if (this.choices.length > 1 && this.choiceIndex === null) { this.error = 'Choose the first or second occurrence of this time.'; return }; this.$emit('time', this.choices[this.choiceIndex || 0].toISO()); this.open = false },
    focusSummary() { this.$refs.summary?.focus({ preventScroll: true }) }
  }
}
</script>
