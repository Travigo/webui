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
      :aria-busy="loadingResults"
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
      v-if="selectedResult !== undefined && !editingSelection"
      @click="beginEditingSelectedResult"
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
    <button
      v-if="selectedResult !== undefined && !editingSelection"
      type="button"
      class="absolute right-1.5 top-1/2 z-[21] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue dark:hover:bg-slate-800 dark:hover:text-slate-200"
      :aria-label="`Clear ${stopName(selectedResult) || 'selected stop'}`"
      @click.stop="clearSelectedResult"
    >
      <span class="material-symbols-outlined text-[20px]">close</span>
    </button>
  </div>
  <ul :id="resultsListId" role="listbox" class="relative z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70" v-if="searchResults.length > 0">
    <li v-for="(result, index) in searchResults" v-bind:key="stopIdentifier(result) || index">
      <button
        type="button"
        role="option"
        :id="resultId(index)"
        :aria-selected="index === activeResultIndex"
        class="block w-full cursor-pointer px-3 py-2 text-left transition hover:bg-slate-50 focus:bg-brand-blue/10 focus:outline-none"
        :class="{ 'bg-brand-blue/10': index === activeResultIndex }"
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

  <div v-if="loadingResults" class="mt-2 flex min-h-11 items-center gap-2 rounded-xl bg-brand-blue/10 px-3 text-sm font-bold text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light" role="status">
    <span class="material-symbols-outlined animate-spin text-[19px]">progress_activity</span>
    Searching stops…
  </div>
  <div v-else-if="searchError" class="mt-2 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-100" role="alert">
    <span class="font-semibold">Stops could not be loaded.</span>
    <button type="button" class="shrink-0 rounded-lg bg-amber-100 px-3 py-2 font-bold text-amber-950 dark:bg-amber-400/20 dark:text-amber-100" @click="searchStops">Retry</button>
  </div>
  <div v-else-if="searchAttempted && searchTerm && searchResults.length === 0 && (selectedResult === undefined || editingSelection)" class="mt-2 rounded-xl bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
    No matching stops found. Try a broader name or change the filters.
  </div>

  <Modal
    v-if="showIcons && showFilters"
    v-model:open="filtersOpen"
    title="Search filters"
    subtitle="Refine which stops and stations appear."
    icon="tune"
    close-label="Close search filters"
    body-class="max-h-[calc(88dvh-7rem)] overflow-y-auto overscroll-contain p-4 sm:p-5"
  >
          <div class="space-y-5">
            <section
              v-for="section in filterSections"
              v-bind:key="section.id"
            >
              <div class="mb-2 flex items-end justify-between gap-3">
                <div>
                  <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">{{ section.title }}</h3>
                  <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400" v-if="section.description">{{ section.description }}</p>
                </div>
                <span class="shrink-0 text-xs font-bold text-brand-blue dark:text-brand-blue-light" v-if="selectedSectionCount(section.id) > 0">
                  {{ selectedSectionCount(section.id) }} selected
                </span>
              </div>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <button
                  v-for="option in section.options"
                  v-bind:key="option.id"
                  type="button"
                  class="flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 text-left transition"
                  :class="isFilterSelected(section.id, option.id)
                    ? 'border-brand-blue/40 bg-brand-blue/10 text-brand-blue shadow-sm dark:border-brand-blue/40 dark:bg-brand-blue/100/10 dark:text-brand-blue-light'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-brand-blue/20 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-brand-blue/40 dark:hover:bg-brand-blue/100/10'"
                  @click="toggleFilter(section.id, option.id)"
                >
                  <span
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    :class="isFilterSelected(section.id, option.id) ? 'bg-brand-blue text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'"
                  >
                    <span class="material-symbols-outlined text-[21px] leading-none">{{ option.icon }}</span>
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block text-sm font-bold leading-tight">{{ option.label }}</span>
                  </span>
                  <span
                    class="material-symbols-outlined text-[20px]"
                    :class="isFilterSelected(section.id, option.id) ? 'text-brand-blue dark:text-brand-blue-light' : 'text-slate-300 dark:text-slate-600'"
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
              class="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              @click="clearFilters"
            >
              Clear all
            </button>
            <button
              type="button"
              class="min-h-11 rounded-xl bg-brand-blue px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-blue/20"
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
  emits: ['update:modelValue', 'selected-result'],
  components: {Modal, StopIcon, ServiceIcon},
  computed: {
    wrapperClass() {
      return [
        'relative',
        this.flush ? '' : 'mt-4'
      ].filter(Boolean).join(' ')
    },
    inputClass() {
      let classes = this.searchClasses + ' shadow-md border rounded-xl focus:ring-brand-blue focus:border-brand-blue block w-full dark:placeholder-gray-400 dark:focus:ring-brand-blue dark:focus:border-brand-blue'

      if (this.showIcons) {
        classes += ' pl-10 sm:pl-20'
      }

      if (this.showIcons && this.showFilters) {
        classes += ' pr-12 sm:pr-20'
      }

      return classes
    },
    selectedResultClass() {
      return `${this.searchClasses} absolute top-0 left-0 z-20 cursor-text border rounded-xl block w-full bg-white pr-12 text-left text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100`
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
      searchAttempted: false,
      searchError: false,
      searchRequestToken: 0,
      selectedResultRequestToken: 0,
      results: {},
      selectedResult: undefined,
      editingSelection: false,
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
            { id: 'Rail', label: 'Train', icon: 'train' },
            { id: 'Metro', label: 'Metro', icon: 'subway' },
            { id: 'Ferry', label: 'Ferry', icon: 'directions_boat' },
            { id: 'CableCar', label: 'Cable car', icon: 'gondola_lift' },
            { id: 'Funicular', label: 'Funicular', icon: 'funicular' },
            { id: 'Taxi Bus', label: 'Bus', icon: 'directions_bus' },
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
        this.selectedResultRequestToken += 1
        this.selectedResult = undefined
        this.editingSelection = false
        this.searchTerm = ''
        this.results = {}
        this.searchAttempted = false
        this.searchError = false
        return
      }

      if (this.stopIdentifier(this.selectedResult) === identifier) {
        return
      }

      this.searchTerm = 'Loading stop...'
      const requestToken = ++this.selectedResultRequestToken

      axios
        .get(`${API.URL}/core/stops/${identifier}`, { params: { view: 'summary' } })
        .then(response => {
          if (requestToken !== this.selectedResultRequestToken) {
            return
          }

          const stop = this.unwrapStop(response.data)

          this.selectedResult = stop
          this.editingSelection = false
          this.searchTerm = this.stopName(stop)
          this.searchAttempted = false
          this.searchError = false
          this.$emit('selected-result', stop)
        })
        .catch(error => {
          if (requestToken !== this.selectedResultRequestToken) {
            return
          }

          console.log(error)
          this.selectedResult = undefined
          this.searchTerm = ''
          this.searchAttempted = true
          this.searchError = true
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
      this.searchRequestToken += 1
      this.selectedResult = undefined
      this.editingSelection = false
      this.searchTerm = ''
      this.results = {}
      this.activeResultIndex = -1
      this.searchAttempted = false
      this.searchError = false
      this.loadingResults = false

      if (this.mode == 'store') {
        this.$emit('update:modelValue', '')
        this.$emit('selected-result', undefined)
      }

      this.$nextTick(() => this.$refs.searchInput.focus())
    },
    beginEditingSelectedResult() {
      this.editingSelection = true
      this.searchTerm = ''
      this.results = {}
      this.searchAttempted = false
      this.searchError = false
      this.$nextTick(() => this.$refs.searchInput?.focus())
    },
    cancelSelectionEdit() {
      if (this.selectedResult === undefined) {
        return
      }

      this.editingSelection = false
      this.searchTerm = this.stopName(this.selectedResult)
      this.results = {}
      this.activeResultIndex = -1
      this.searchAttempted = false
      this.searchError = false
    },
    handleResultClick(result) {
      const stop = this.unwrapStop(result)
      const identifier = this.stopIdentifier(stop)

      if (this.mode == 'link') {
        this.$router.push({ name: 'stops/view', params: {'id': identifier} })
      } else if(this.mode == 'store') {
        this.searchRequestToken += 1
        this.selectedResult = stop
        this.editingSelection = false
        this.searchTerm = this.stopName(stop)
        this.results = {}
        this.loadingResults = false
        this.$emit('update:modelValue', identifier)
        this.$emit('selected-result', stop)
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

      if (event.key === 'Enter' && this.editingSelection) {
        event.preventDefault()
        return
      }

      if (event.key === 'Escape') {
        this.cancelSelectionEdit()
        this.results = {}
        this.activeResultIndex = -1
      }
    },
    searchStops() {
      if (this.selectedResult !== undefined && this.searchTerm !== this.stopName(this.selectedResult)) {
        this.editingSelection = true
      }

      if (this.searchTerm === '') {
        this.searchRequestToken += 1
        this.results = {}
        this.activeResultIndex = -1
        this.searchAttempted = false
        this.searchError = false
        this.loadingResults = false
        return
      }
      this.loadingResults = true
      this.searchAttempted = true
      this.searchError = false
      const requestToken = ++this.searchRequestToken

      axios
        .get(`${API.URL}/core/stops/search`, {
          params: {
            name: this.searchTerm,
            transporttype: this.selectedFilters.transportType.join(','),
            view: 'web'
          }
        })
        .then(response => {
            if (requestToken !== this.searchRequestToken) {
              return
            }

            this.results = response.data
            this.searchError = false
            this.activeResultIndex = this.searchResults.length > 0 ? 0 : -1
          })
          .catch(error => {
            if (requestToken !== this.searchRequestToken) {
              return
            }

            console.log(error)
            this.results = {}
            this.activeResultIndex = -1
            this.searchError = true
          })
          .finally(() => {
            if (requestToken === this.searchRequestToken) {
              this.loadingResults = false
            }
          })
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
