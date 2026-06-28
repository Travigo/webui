<template>
  <div class="space-y-4 pt-3 sm:space-y-5 sm:pt-4">
    <section class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl sm:p-5">
      <div class="flex items-start justify-between gap-3">
        <div>

          <h1 class="mt-1 text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            Saved stops
          </h1>
          <p class="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage stops you want quick access to.
          </p>
        </div>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/80 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:rounded-3xl">
      <div class="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5 sm:py-4">
        <h2 class="text-base font-extrabold text-slate-950 dark:text-slate-100 sm:text-lg">Your stops</h2>
        <button
          v-if="savedStops.length > 0"
          type="button"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          @click="toggleEditing"
        >
          <span class="material-symbols-outlined text-[18px]">{{ editing ? 'done' : 'edit' }}</span>
          {{ editing ? 'Done' : 'Edit' }}
        </button>
      </div>

      <LoadingState
        v-if="loadingSavedObjects"
        title="Loading saved stops"
        subtitle="Fetching your saved stops."
        compact
        bare
        :rows="3"
        :show-tabs="false"
      />

      <div v-else-if="savedObjectsError" class="px-4 py-6 sm:px-5">
        <div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {{ savedObjectsError }}
        </div>
      </div>

      <div v-else-if="!auth0.isAuthenticated" class="px-4 py-6 sm:px-5">
        <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100">
          Sign in to see your saved stops.
        </div>
      </div>

      <div v-else-if="savedStops.length === 0" class="px-4 py-6 sm:px-5">
        <div class="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          You do not have any saved stops yet.
        </div>
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
          v-if="confirmRemoveModalOpen"
          class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          @click.self="closeRemoveConfirm"
        >
          <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 sm:max-w-md">
            <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 dark:border-slate-800 sm:p-5">
              <div>
                <h2 class="text-lg font-extrabold text-slate-950 dark:text-slate-100">Remove saved stop?</h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ stopPendingRemoval?.PrimaryName }} will be removed from your saved stops.
                </p>
              </div>
              <button
                type="button"
                @click="closeRemoveConfirm"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                aria-label="Close saved stop action"
                :disabled="removingSavedStop"
              >
                <span class="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div class="space-y-4 p-4 sm:p-5">
              <div
                v-if="removeSavedStopError"
                class="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              >
                {{ removeSavedStopError }}
              </div>

              <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-100 px-4 text-sm font-extrabold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  :disabled="removingSavedStop"
                  @click="closeRemoveConfirm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="removingSavedStop"
                  @click="confirmRemoveSavedStop"
                >
                  <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': removingSavedStop }">
                    {{ removingSavedStop ? 'progress_activity' : 'delete' }}
                  </span>
                  {{ removingSavedStop ? 'Removing...' : 'Remove stop' }}
                </button>
              </div>
            </div>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import LoadingState from '@/components/LoadingState.vue'
import StopInfo from '@/components/Stops/StopInfo.vue'

export default {
  name: 'SavedStops',
  components: {
    LoadingState,
    StopInfo
  },
  data() {
    return {
      auth0: useAuth0(),
      confirmRemoveModalOpen: false,
      stopPendingRemoval: undefined,
      removingSavedStop: false,
      removeSavedStopError: '',
      editing: false,
      loadingSavedObjects: false,
      savedObjectsError: '',
      savedStops: []
    }
  },
  methods: {
    toggleEditing() {
      this.editing = !this.editing
    },
    removeSavedStop(stop) {
      this.stopPendingRemoval = stop
      this.removeSavedStopError = ''
      this.confirmRemoveModalOpen = true
    },
    closeRemoveConfirm() {
      if (this.removingSavedStop) {
        return
      }

      this.confirmRemoveModalOpen = false
      this.stopPendingRemoval = undefined
      this.removeSavedStopError = ''
    },
    showToast(message, type = 'info') {
      window.dispatchEvent(new CustomEvent('travigo-toast', {
        detail: {
          message,
          type
        }
      }))
    },
    async confirmRemoveSavedStop() {
      if (!this.stopPendingRemoval?.SavedObjectPrimaryIdentifier) {
        this.removeSavedStopError = 'This saved stop could not be removed.'
        return
      }

      this.removingSavedStop = true
      this.removeSavedStopError = ''

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        await this.deleteSavedStop(this.stopPendingRemoval, auth0token)
        const removedStop = this.stopPendingRemoval

        this.savedStops = this.savedStops.filter(stop => stop.SavedObjectPrimaryIdentifier !== removedStop.SavedObjectPrimaryIdentifier)
        this.confirmRemoveModalOpen = false
        this.stopPendingRemoval = undefined
        this.removeSavedStopError = ''
        this.showToast(`${removedStop.PrimaryName} removed.`, 'success')

        if (this.savedStops.length === 0) {
          this.editing = false
        }
      } catch (error) {
        console.log(error)
        this.removeSavedStopError = 'Saved stop could not be removed.'
        this.showToast('Saved stop could not be removed.', 'error')
      } finally {
        this.removingSavedStop = false
      }
    },
    async deleteSavedStop(stop, auth0token) {
      const config = {
        headers: {
          Authorization: `Bearer ${auth0token}`
        }
      }

      try {
        return await axios.delete(`${API.URL}/core/saved/${stop.SavedObjectPrimaryIdentifier}`, config)
      } catch (error) {
        if (![404, 405].includes(error.response?.status)) {
          throw error
        }

        return axios.delete(`${API.URL}/core/saved`, {
          ...config,
          data: {
            Type: 'Stop',
            ObjectIdentifier: stop.SavedObjectIdentifier || stop.PrimaryIdentifier
          }
        })
      }
    },
    async getSavedObjects() {
      this.savedObjectsError = ''

      if (!this.auth0.isAuthenticated) {
        this.savedStops = []
        return
      }

      this.loadingSavedObjects = true

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        const response = await this.getSavedObjectsResponse(auth0token)
        const savedObjects = this.normaliseSavedObjects(response.data)
        this.savedStops = await this.hydrateSavedStops(savedObjects)
      } catch (error) {
        console.log(error)
        this.savedStops = []
        this.savedObjectsError = 'Saved stops could not be loaded.'
      } finally {
        this.loadingSavedObjects = false
      }
    },
    async getSavedObjectsResponse(auth0token) {
      const config = {
        headers: {
          Authorization: `Bearer ${auth0token}`
        }
      }

      return await axios.get(`${API.URL}/core/saved`, config)
    },
    normaliseSavedObjects(responseData) {
      const resultSet = [
        responseData,
        responseData?.SavedObjects,
        responseData?.savedObjects,
        responseData?.data,
        responseData?.Data
      ].find(result => Array.isArray(result))

      return resultSet || []
    },
    async hydrateSavedStops(savedObjects) {
      const savedStops = savedObjects.filter(savedObject => this.isStopSavedObject(savedObject))
      const hydratedStops = await Promise.all(savedStops.map(async savedObject => {
        if (!savedObject.ObjectIdentifier) {
          return undefined
        }

        try {
          const response = await axios.get(`${API.URL}/core/stops/${savedObject.ObjectIdentifier}`)

          return {
            ...response.data,
            SavedObjectPrimaryIdentifier: savedObject.PrimaryIdentifier,
            SavedObjectIdentifier: savedObject.ObjectIdentifier
          }
        } catch (error) {
          console.log(error)

          return undefined
        }
      }))

      return hydratedStops.filter(Boolean)
    },
    isStopSavedObject(savedObject) {
      return ['stop', 'stops'].includes(String(savedObject.Type || '').toLowerCase())
    }
  },
  mounted() {
    this.getSavedObjects()
  }
}
</script>
