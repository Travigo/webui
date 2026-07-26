<template>
  <div :class="wrapperClass">
    <label v-if="label" :for="searchInputId" class="sr-only">{{ label }}</label>
    <span
      v-if="showIcons"
      class="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-xl text-slate-400 sm:left-5 sm:text-4xl"
    >
      search
    </span>
    <input
      type="text"
      :id="searchInputId"
      ref="searchInput"
      :class="inputClass"
      :placeholder="placeholder"
      :required="mode !== 'store'"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      :aria-label="label || placeholder"
      :aria-expanded="searchResults.length > 0"
      :aria-controls="resultsListId"
      :aria-activedescendant="activeResultIndex >= 0 ? resultId(activeResultIndex) : undefined"
      v-model="searchTerm"
      v-on:input="searchStops"
      @keydown="handleSearchKeydown"
    >
    <button
      v-if="showIcons && showFilters"
      type="button"
      class="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 sm:right-5 sm:h-12 sm:w-12"
      aria-label="Open search filters"
      @click="openFilters"
    >
      <span class="material-symbols-outlined text-xl sm:text-4xl">tune</span>
      <span
        v-if="selectedFilterCount > 0"
        class="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-pink px-1 text-[10px] font-bold leading-none text-white sm:h-5 sm:min-w-5 sm:text-xs"
      >
        {{ selectedFilterCount }}
      </span>
    </button>

    <button
      type="button"
      :class="selectedResultClass"
      v-if="selectedResult !== undefined"
      @click="clearSelectedResult()"
      :aria-label="`Change selected stop: ${stopName(selectedResult) || 'selected stop'}`"
    >
      <div class="flex h-full items-center">
        <div class="shrink-0">
          <StopIcon :stop="selectedResult" size="4" />
        </div>

        <div class="ml-2 min-w-0 flex-auto font-medium text-slate-950">
          <div class="truncate">
            {{ stopName(selectedResult) || 'Selected stop' }}
          </div>
          <div class="truncate text-xs font-light text-slate-500" v-if="stopDescription(selectedResult)">
            {{ stopDescription(selectedResult) }}
          </div>
        </div>
      </div>
    </button>
  </div>
  <ul :id="resultsListId" role="listbox" class="relative z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70" v-if="searchResults.length > 0">
    <li v-for="(result, index) in searchResults" v-bind:key="stopIdentifier(result) || index">
      <button
        type="button"
        role="option"
        :id="resultId(index)"
        :aria-selected="index === activeResultIndex"
        class="block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-slate-50 focus:bg-blue-50 focus:outline-none"
        :class="{ 'bg-blue-50': index === activeResultIndex }"
        @click="handleResultClick(result)"
        @mouseenter="activeResultIndex = index"
      >
        <div class="flex">
          <div class="mt-0.5">
            <StopIcon :stop="result" size="10" />
          </div>

          <div class="flex-auto my-auto ml-2 min-w-0 font-medium">
            <div class="truncate text-sm font-bold text-slate-950">
              {{ stopName(result) || 'Unnamed stop' }}
            </div>
            <div class="truncate text-xs font-light text-slate-500" v-if="stopDescription(result)">
              {{ stopDescription(result) }}
            </div>
          </div>
        </div>
      </button>
    </li>
  </ul>

  <Modal
    v-if="showIcons && showFilters"
    v-model:open="filtersOpen"
    title="Search filters"
    subtitle="Refine which stops and stations appear."
    icon="tune"
    close-label="Close search filters"
    body-class="p-4 sm:p-5"
  >
          <div class="space-y-5">
            <section
              v-for="section in filterSections"
              v-bind:key="section.id"
            >
              <div class="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ section.title }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400" v-if="section.description">{{ section.description }}</p>
                </div>
                <span class="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-300" v-if="selectedSectionCount(section.id) > 0">
                  {{ selectedSectionCount(section.id) }} selected
                </span>
              </div>

              <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  v-for="option in section.options"
                  v-bind:key="option.id"
                  type="button"
                  class="flex min-h-16 items-center gap-3 rounded-2xl border px-3 py-3 text-left transition"
                  :class="isFilterSelected(section.id, option.id)
                    ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/30 dark:hover:bg-blue-500/10'"
                  @click="toggleFilter(section.id, option.id)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    :class="isFilterSelected(section.id, option.id) ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
                  >
                    <span class="material-symbols-outlined text-[21px] leading-none">{{ option.icon }}</span>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-extrabold">{{ option.label }}</span>
                  </span>
                  <span
                    class="material-symbols-outlined text-[20px]"
                    :class="isFilterSelected(section.id, option.id) ? 'text-blue-600 dark:text-blue-300' : 'text-slate-300 dark:text-slate-600'"
                  >
                    {{ isFilterSelected(section.id, option.id) ? 'check_circle' : 'radio_button_unchecked' }}
                  </span>
                </button>
              </div>
            </section>
          </div>

          <div class="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              class="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              @click="clearFilters"
            >
              Clear all
            </button>
            <button
              type="button"
              class="rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
              @click="closeFilters"
            >
              Apply filters
            </button>
          </div>
  </Modal>
</template>

<script>
import axios from "axios";
import API from "@/API";
import Modal from '@/components/Modal.vue'
import ServiceIcon from "@/components/ServiceIcon.vue";
import StopIcon from "@/components/StopIcon.vue";

export default {
  props: {
    modelValue: {},
    placeholder: {
      default: ''
    },
    label: {
      type: String,
      default: ''
    },
    inputId: {
      type: String,
      default: ''
    },
    searchClasses: {
      default: ''
    },
    showIcons: {
      default: false
    },
    showFilters: {
      type: Boolean,
      default: true
    },
    flush: {
      default: false
    },
    mode: {
      default: 'link'
    }
  },
  emits: ['update:modelValue'],
  components: {Modal, StopIcon, ServiceIcon},
  computed: {
    wrapperClass() {
      return [
        'relative',
        this.flush ? '' : 'mt-4'
      ].filter(Boolean).join(' ')
    },
    inputClass() {
      let classes = this.searchClasses + ' shadow-md border rounded-2xl focus:ring-blue-500 focus:border-blue-500 block w-full dark:placeholder-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500'

      if (this.showIcons) {
        classes += ' pl-10 sm:pl-20'
      }

      if (this.showIcons && this.showFilters) {
        classes += ' pr-12 sm:pr-20'
      }

      return classes
    },
    selectedResultClass() {
      return `${this.searchClasses} absolute top-0 left-0 z-20 cursor-pointer border rounded-2xl block w-full bg-white text-slate-950`
    },
    searchInputId() {
      return this.inputId || `travigo-search-${this.$.uid}`
    },
    resultsListId() {
      return `${this.searchInputId}-results`
    },
    searchResults() {
      const resultSet = [
        this.results?.stops,
        this.results?.Stops,
        this.results?.data?.stops,
        this.results?.data?.Stops,
        this.results?.Data?.stops,
        this.results?.Data?.Stops,
        this.results?.data?.results,
        this.results?.data?.Results,
        this.results?.Data?.results,
        this.results?.Data?.Results,
        this.results?.results,
        this.results?.Results,
        this.results?.data,
        this.results?.Data,
        this.results,
      ].find(result => Array.isArray(result))

      return (resultSet || [])
        .map(result => this.unwrapStop(result))
        .filter(Boolean)
    },
    selectedFilterCount() {
      return Object.values(this.selectedFilters).reduce((total, selectedOptions) => total + selectedOptions.length, 0)
    }
  },
  data () {
    return {
      searchTerm: '',
      loadingResults: false,
      results: {},
      selectedResult: undefined,
      activeResultIndex: -1,
      filtersOpen: false,
      selectedFilters: {
        transportType: []
      },
      filterSections: [
        {
          id: 'transportType',
          title: 'Transport type',
          description: 'Show stops served by selected modes.',
          type: 'multi-select',
          options: [
            { id: 'Bus', label: 'Bus', icon: 'directions_bus' },
            { id: 'Coach', label: 'Coach', icon: 'airport_shuttle' },
            { id: 'Tram', label: 'Tram', icon: 'tram' },
            { id: 'Taxi', label: 'Taxi', icon: 'local_taxi' },
            { id: 'Rail', label: 'Train', icon: 'train' },
            { id: 'Metro', label: 'Metro', icon: 'subway' },
            { id: 'Ferry', label: 'Ferry', icon: 'directions_boat' },
            { id: 'Airport', label: 'Airport', icon: 'flight' },
            { id: 'CableCar', label: 'Cable car', icon: 'gondola_lift' },
            { id: 'Funicular', label: 'Funicular', icon: 'funicular' },
            { id: 'UNKNOWN', label: 'Other', icon: 'pin_drop' },
          ],
        }
      ],
    }
  },
  watch: {
    modelValue(newValue) {
      this.loadSelectedResult(newValue)
    },
    searchResults(results) {
      if (results.length === 0) {
        this.activeResultIndex = -1
      } else if (this.activeResultIndex >= results.length) {
        this.activeResultIndex = 0
      }
    }
  },
  mounted: function() {
    this.loadSelectedResult(this.modelValue)
  },
  methods: {
    loadSelectedResult(identifier) {
      if (this.mode !== 'store') {
        return
      }

      if (identifier == "" || identifier === undefined || identifier === null) {
        this.selectedResult = undefined
        this.searchTerm = ''
        this.results = {}
        return
      }

      if (this.stopIdentifier(this.selectedResult) === identifier) {
        return
      }

      this.searchTerm = 'Loading stop...'

      axios
        .get(`${API.URL}/core/stops/${identifier}`)
        .then(response => {
          const stop = this.unwrapStop(response.data)

          this.selectedResult = stop
          this.searchTerm = this.stopName(stop)
        })
        .catch(error => {
          console.log(error)
          this.selectedResult = undefined
          this.searchTerm = ''
        })
    },
    openFilters() {
      this.filtersOpen = true
    },
    closeFilters() {
      this.filtersOpen = false
      this.searchStops()
    },
    selectedSectionCount(sectionId) {
      return this.selectedFilters[sectionId]?.length || 0
    },
    isFilterSelected(sectionId, optionId) {
      return this.selectedFilters[sectionId]?.includes(optionId) || false
    },
    toggleFilter(sectionId, optionId) {
      const selectedOptions = this.selectedFilters[sectionId] || []

      if (this.isFilterSelected(sectionId, optionId)) {
        this.selectedFilters = {
          ...this.selectedFilters,
          [sectionId]: selectedOptions.filter(id => id !== optionId)
        }
        return
      }

      this.selectedFilters = {
        ...this.selectedFilters,
        [sectionId]: [...selectedOptions, optionId]
      }
    },
    clearFilters() {
      this.selectedFilters = Object.fromEntries(
        this.filterSections.map(section => [section.id, []])
      )
    },
    clearSelectedResult() {
      this.selectedResult = undefined
      this.searchTerm = ''
      this.results = {}
      this.activeResultIndex = -1

      if (this.mode == 'store') {
        this.$emit('update:modelValue', '')
      }

      this.$nextTick(() => this.$refs.searchInput.focus())
    },
    handleResultClick(result) {
      const stop = this.unwrapStop(result)
      const identifier = this.stopIdentifier(stop)

      if (this.mode == 'link') {
        this.$router.push({ name: 'stops/view', params: {'id': identifier} })
      } else if(this.mode == 'store') {
        this.selectedResult = stop
        this.searchTerm = this.stopName(stop)
        this.results = {}
        this.$emit('update:modelValue', identifier)
      }
    },
    resultId(index) {
      return `${this.resultsListId}-option-${index}`
    },
    handleSearchKeydown(event) {
      if (event.key === 'ArrowDown' && this.searchResults.length > 0) {
        event.preventDefault()
        this.activeResultIndex = (this.activeResultIndex + 1) % this.searchResults.length
        return
      }

      if (event.key === 'ArrowUp' && this.searchResults.length > 0) {
        event.preventDefault()
        this.activeResultIndex = this.activeResultIndex <= 0
          ? this.searchResults.length - 1
          : this.activeResultIndex - 1
        return
      }

      if (event.key === 'Enter' && this.activeResultIndex >= 0) {
        event.preventDefault()
        this.handleResultClick(this.searchResults[this.activeResultIndex])
        return
      }

      if (event.key === 'Escape') {
        this.results = {}
        this.activeResultIndex = -1
      }
    },
    searchStops() {
      if (this.selectedResult !== undefined && this.searchTerm !== this.stopName(this.selectedResult)) {
        this.selectedResult = undefined

        if (this.mode == 'store') {
          this.$emit('update:modelValue', '')
        }
      }

      if (this.searchTerm === '') {
        this.results = {}
        this.activeResultIndex = -1
        return
      }
      this.loadingResults = true

      axios
          .get(`${API.URL}/core/stops/search`, {
            params: {
              name: this.searchTerm,
              transporttype: this.selectedFilters.transportType.join(',')
            }
          })
          .then(response => {
            this.results = response.data
            this.activeResultIndex = this.searchResults.length > 0 ? 0 : -1
          })
          .catch(error => {
            console.log(error)
            // this.error = error
          })
          .finally(() => this.loadingResults = false)
    },
    unwrapStop(result) {
      if (Array.isArray(result)) {
        return undefined
      }

      return result?.Stop ||
        result?.stop ||
        result?.Station ||
        result?.station ||
        result?.Data?.Stop ||
        result?.Data?.stop ||
        result?.data?.Stop ||
        result?.data?.stop ||
        result?.Data ||
        result?.data ||
        result?.Result ||
        result?.result ||
        result
    },
    stopName(stop) {
      const normalizedStop = this.unwrapStop(stop) || {}

      return normalizedStop.PrimaryName ||
        normalizedStop.primaryName ||
        normalizedStop.Name ||
        normalizedStop.name ||
        normalizedStop.CommonName ||
        normalizedStop.commonName ||
        normalizedStop.StopName ||
        normalizedStop.stopName ||
        normalizedStop.DisplayName ||
        normalizedStop.displayName ||
        normalizedStop.Title ||
        normalizedStop.title ||
        normalizedStop.OtherNames?.PrimaryName ||
        normalizedStop.OtherNames?.primaryName ||
        normalizedStop.OtherNames?.Name ||
        normalizedStop.OtherNames?.name ||
        normalizedStop.OtherNames?.CommonName ||
        normalizedStop.OtherNames?.commonName ||
        ''
    },
    stopDescription(stop) {
      const normalizedStop = this.unwrapStop(stop) || {}

      return normalizedStop.Descriptor ||
        normalizedStop.Description ||
        normalizedStop.LocalityName ||
        normalizedStop.Locality ||
        normalizedStop.Indicator ||
        normalizedStop.OtherNames?.Descriptor ||
        normalizedStop.OtherNames?.Description ||
        ''
    },
    stopIdentifier(stop) {
      const normalizedStop = this.unwrapStop(stop) || {}

      return normalizedStop.PrimaryIdentifier ||
        normalizedStop.primaryIdentifier ||
        normalizedStop.Identifier ||
        normalizedStop.identifier ||
        normalizedStop.ID ||
        normalizedStop.Id ||
        normalizedStop.id ||
        normalizedStop.StopID ||
        normalizedStop.StopId ||
        normalizedStop.ATCOCode ||
        normalizedStop.NaptanCode ||
        normalizedStop.PrimaryCode ||
        ''
    },
  },
}
</script>
