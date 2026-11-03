<template>
  <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
    <div class="text-sm font-semibold">
      {{ boardType === 'arrivals' ? 'Arriving' : 'Departing' }} from: {{ label }}
      <span class="block text-xs font-normal text-slate-500">Times shown in {{ timezone }}</span>
    </div>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-bold dark:bg-slate-800" @click="openPicker">Change time</button>
      <button v-if="selected || pending" type="button" class="min-h-11 rounded-xl bg-slate-100 px-3 text-sm font-bold dark:bg-slate-800" @click="$emit('now')">Back to now</button>
    </div>
    <Modal :open="open" title="Change time" @update:open="open = $event">
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
</template>

<script>
import { DateTime } from 'luxon'
import Modal from '@/components/Modal.vue'
import { boardTimeChoices } from './boardTime.mjs'

export default {
  components: { Modal },
  props: { timezone: String, boardType: String, selected: String, pending: Boolean },
  emits: ['time', 'now'],
  data() { return { open: false, date: '', clock: '', choiceIndex: null, error: '' } },
  computed: {
    label() { return this.selected ? DateTime.fromISO(this.selected, { setZone: true }).setZone(this.timezone).toFormat('ccc d LLL, HH:mm') : 'Now' },
    choices() { return boardTimeChoices(this.date, this.clock, this.timezone) }
  },
  watch: { date() { this.choiceIndex = null; this.error = '' }, clock() { this.choiceIndex = null; this.error = '' } },
  methods: {
    openPicker() {
      const value = this.selected ? DateTime.fromISO(this.selected, { setZone: true }).setZone(this.timezone) : DateTime.now().setZone(this.timezone)
      this.date = value.toISODate(); this.clock = value.toFormat('HH:mm'); this.choiceIndex = null; this.error = ''; this.open = true
    },
    submit() {
      if (!this.choices.length) { this.error = 'This local time does not exist because the clocks change. Choose another time.'; return }
      if (this.choices.length > 1 && this.choiceIndex === null) { this.error = 'Choose the first or second occurrence of this time.'; return }
      this.$emit('time', this.choices[this.choiceIndex || 0].toISO()); this.open = false
    }
  }
}
</script>
