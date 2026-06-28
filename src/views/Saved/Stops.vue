<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">Saved</p>
          <h1 class="mt-1 text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            Saved stops
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage stops you want quick access to.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          aria-label="Add saved stop"
        >
          <span class="material-symbols-outlined text-[22px]">add</span>
        </button>
      </div>

      <div class="mt-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        <span class="material-symbols-outlined mt-0.5 text-[22px]">warning</span>
        <p class="text-sm font-medium">
          Saved stops are placeholder data at the moment. Adding, removing, and syncing saved stops does not function yet.
        </p>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
        <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Your stops</h2>
        <button
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          @click="toggleEditing"
        >
          <span class="material-symbols-outlined text-[18px]">{{ editing ? 'done' : 'edit' }}</span>
          {{ editing ? 'Done' : 'Edit' }}
        </button>
      </div>

      <article
        v-for="stop in savedStops"
        v-bind:key="stop.PrimaryIdentifier"
        class="relative border-b border-slate-100 last:border-b-0 dark:border-slate-800"
      >
        <div :class="editing ? 'pr-14 sm:pr-16' : ''">
          <StopInfo
            :stop="stop"
            :bordered="false"
            status-label=""
            meta-icon="bookmark"
            distance-label-fallback="Saved stop"
          />
        </div>

        <button
          v-if="editing"
          type="button"
          class="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-2xl bg-red-50 text-red-600 shadow-sm shadow-red-100/80 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:shadow-black/20 dark:hover:bg-red-500/20 sm:right-5"
          @click="removeSavedStop(stop)"
          :aria-label="`Remove ${stop.PrimaryName}`"
        >
          <span class="material-symbols-outlined text-[21px]">delete</span>
        </button>
      </article>
    </section>

    <Teleport to="body">
      <Transition name="modal-overlay">
        <div
          v-if="placeholderModalOpen"
          class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          @click.self="closePlaceholderModal"
        >
          <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
              <div>
                <h2 class="text-lg font-extrabold text-slate-950 dark:text-slate-100">{{ placeholderModalTitle }}</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Saved stop management is placeholder-only for now.</p>
              </div>
              <button
                type="button"
                @click="closePlaceholderModal"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close saved stop action"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div class="p-4 sm:p-5">
              <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
                {{ placeholderModalMessage }}
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import StopInfo from '@/components/Stops/StopInfo.vue'

export default {
  name: 'SavedStops',
  components: {
    StopInfo
  },
  data() {
    return {
      placeholderModalOpen: false,
      placeholderModalTitle: '',
      placeholderModalMessage: '',
      editing: false,
      savedStops: [
        {
          PrimaryIdentifier: 'placeholder-cambridge',
          PrimaryName: 'Cambridge',
          LocalityName: 'Cambridge',
          OtherNames: {
            Descriptor: 'Rail station'
          },
          Services: [
            {
              PrimaryIdentifier: 'great-northern',
              ServiceName: 'Great Northern',
              TransportType: 'Rail',
              BrandColour: '#4c1268',
              SecondaryBrandColour: '#ffffff',
              BrandIcon: ''
            },
            {
              PrimaryIdentifier: 'thameslink',
              ServiceName: 'Thameslink',
              TransportType: 'Rail',
              BrandColour: '#1f2937',
              SecondaryBrandColour: '#f472b6',
              BrandIcon: ''
            }
          ]
        },
        {
          PrimaryIdentifier: 'placeholder-drummer-street',
          PrimaryName: 'Drummer Street (Stop D)',
          LocalityName: 'Cambridge',
          OtherNames: {
            Descriptor: 'Bus stop'
          },
          Services: [
            {
              PrimaryIdentifier: 'bus-1',
              ServiceName: '1',
              TransportType: 'Bus',
              BrandColour: '#2563eb',
              SecondaryBrandColour: '#ffffff',
              BrandIcon: ''
            },
            {
              PrimaryIdentifier: 'bus-19',
              ServiceName: '19',
              TransportType: 'Bus',
              BrandColour: '#2563eb',
              SecondaryBrandColour: '#ffffff',
              BrandIcon: ''
            }
          ]
        }
      ]
    }
  },
  methods: {
    toggleEditing() {
      this.editing = !this.editing
    },
    removeSavedStop(stop) {
      this.placeholderModalTitle = `Remove ${stop.PrimaryName}`
      this.placeholderModalMessage = 'Removing saved stops will be available when saved stop management is connected to your account.'
      this.placeholderModalOpen = true
    },
    closePlaceholderModal() {
      this.placeholderModalOpen = false
    }
  }
}
</script>
