<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      title="Saved items"
      subtitle="Manage stops and journeys you want quick access to."
      icon="bookmark"
      variant="panel"
    >
      <template #actions>
        <button
          v-if="hasSavedItems"
          type="button"
          class="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          @click="toggleEditing"
        >
          <span class="material-symbols-outlined text-[18px]">{{ editing ? 'done' : 'edit' }}</span>
          {{ editing ? 'Done' : 'Edit items' }}
        </button>
      </template>
    </PageHeader>

    <div
      v-if="savedItemsFromCache"
      class="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 dark:bg-amber-500/10 dark:text-amber-200"
    >
      <span class="material-symbols-outlined text-[17px]">offline_pin</span>
      Showing items saved on this device · {{ savedItemsCacheLabel }}
    </div>

    <section class="ui-panel">
      <TabBar
        :tabs="savedItemTabs"
        :model-value="savedItemsTab"
        storage-key="travigo_saved_items_tab"
        @update:model-value="changeSavedItemsTab"
      />

      <template v-if="savedItemsTab === 'stops'">
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
        <div class="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {{ savedObjectsError }}
        </div>
      </div>

      <div v-else-if="!auth0.isAuthenticated" class="px-4 py-6 sm:px-5">
        <div class="rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3 text-sm font-medium text-brand-blue-dark dark:border-brand-blue/40 dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
          Sign in to see your saved stops.
        </div>
      </div>

      <div v-else-if="savedStops.length === 0" class="px-4 py-6 sm:px-5">
        <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
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
            meta-icon=""
            distance-label-fallback=""
          />
        </div>

        <button
          v-if="editing"
          type="button"
          class="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm shadow-red-100/80 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:shadow-black/20 dark:hover:bg-red-500/20 sm:right-5"
          @click="removeSavedItem(stop, 'stop')"
          :aria-label="`Remove ${stop.PrimaryName}`"
        >
          <span class="material-symbols-outlined text-[21px]">delete</span>
        </button>
      </article>
      </template>

      <template v-else>
      <LoadingState
        v-if="loadingSavedObjects"
        title="Loading saved journeys"
        subtitle="Fetching your saved journeys."
        compact
        bare
        :rows="3"
        :show-tabs="false"
      />

      <div v-else-if="savedObjectsError" class="px-4 py-6 sm:px-5">
        <div class="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          {{ savedObjectsError }}
        </div>
      </div>

      <div v-else-if="!auth0.isAuthenticated" class="px-4 py-6 sm:px-5">
        <div class="rounded-xl border border-brand-blue/20 bg-brand-blue/10 px-4 py-3 text-sm font-medium text-brand-blue-dark dark:border-brand-blue/40 dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
          Sign in to see your saved journeys.
        </div>
      </div>

      <div v-else-if="savedJourneys.length === 0" class="px-4 py-6 sm:px-5">
        <div class="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
          You do not have any saved journeys yet.
        </div>
      </div>

      <article
        v-for="journey in savedJourneys"
        v-bind:key="journey.SavedObjectPrimaryIdentifier || journey.PrimaryIdentifier"
        class="relative border-b border-slate-100 last:border-b-0 dark:border-slate-800"
      >
        <div :class="editing ? 'pr-14 sm:pr-16' : ''">
          <SavedJourneyCard
            :journey="journey"
            :saved-object-identifier="journey.SavedObjectIdentifier"
          />
        </div>

        <button
          v-if="editing"
          type="button"
          class="absolute right-4 top-1/2 z-10 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-sm shadow-red-100/80 transition hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:shadow-black/20 dark:hover:bg-red-500/20 sm:right-5"
          @click="removeSavedItem(journey, 'journey')"
          :aria-label="`Remove ${journey.DestinationDisplay || 'saved journey'}`"
        >
          <span class="material-symbols-outlined text-[21px]">delete</span>
        </button>
      </article>
      </template>
    </section>

    <Modal
      v-model:open="confirmRemoveModalOpen"
      title="Remove saved item?"
      :subtitle="`${savedItemName} will be removed from your saved items.`"
      icon="delete"
      size="sm"
      close-label="Close saved stop action"
      :close-disabled="removingSavedStop"
      body-class="space-y-4 p-4 sm:p-5"
      @close="closeRemoveConfirm"
    >
              <div
                v-if="removeSavedStopError"
                class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              >
                {{ removeSavedStopError }}
              </div>

              <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  :disabled="removingSavedStop"
                  @click="closeRemoveConfirm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="removingSavedStop"
                  @click="confirmRemoveSavedStop"
                >
                  <span class="material-symbols-outlined text-[20px]" :class="{ 'animate-spin': removingSavedStop }">
                    {{ removingSavedStop ? 'progress_activity' : 'delete' }}
                  </span>
                  {{ removingSavedStop ? 'Removing...' : 'Remove stop' }}
                </button>
              </div>
    </Modal>
  </div>
</template>

<script>
import { useAuth0 } from '@auth0/auth0-vue'
import axios from 'axios'
import API from '@/API'
import { getApiAccessToken } from '@/auth'
import LoadingState from '@/components/LoadingState.vue'
import Modal from '@/components/Modal.vue'
import PageHeader from '@/components/PageHeader.vue'
import SavedJourneyCard from '@/components/SavedJourneyCard.vue'
import StopInfo from '@/components/Stops/StopInfo.vue'
import TabBar from '@/components/TabBar.vue'
import { reportRequestFailure, reportRequestSuccess } from '@/offline/connectivity'
import {
  auth0CacheScope,
  cacheAgeLabel,
  CACHE_MAX_AGE,
  CACHE_REVALIDATE_AFTER,
  cacheKeys,
  getCachedResource,
  loadCachedResource,
  putCachedResource
} from '@/offline/resourceCache'

export default {
  name: 'SavedStops',
  components: {
    LoadingState,
    Modal,
    PageHeader,
    SavedJourneyCard,
    StopInfo,
    TabBar
  },
  data() {
    return {
      auth0: useAuth0(),
      confirmRemoveModalOpen: false,
      stopPendingRemoval: undefined,
      pendingRemovalType: '',
      removingSavedStop: false,
      removeSavedStopError: '',
      editing: false,
      savedItemsTab: 'stops',
      loadingSavedObjects: false,
      savedObjectsError: '',
      savedStops: [],
      savedJourneys: [],
      savedItemsFromCache: false,
      savedItemsUpdatedAt: null
    }
  },
  computed: {
    hasSavedItems() {
      return this.savedStops.length > 0 || this.savedJourneys.length > 0
    },
    savedItemTabs() {
      return [
        { id: 'stops', name: 'Stops', icon: 'location_on' },
        { id: 'journeys', name: 'Journeys', icon: 'route' }
      ]
    },
    savedItemName() {
      return this.savedItemNameFrom(this.stopPendingRemoval || {})
    },
    savedItemsCacheLabel() {
      if (!this.savedItemsUpdatedAt) {
        return 'saved previously'
      }

      return `saved ${cacheAgeLabel(this.savedItemsUpdatedAt)}`
    }
  },
  methods: {
    changeSavedItemsTab(tab) {
      this.savedItemsTab = tab
    },
    toggleEditing() {
      this.editing = !this.editing
    },
    removeSavedItem(item, type) {
      this.stopPendingRemoval = item
      this.pendingRemovalType = type
      this.removeSavedStopError = ''
      this.confirmRemoveModalOpen = true
    },
    closeRemoveConfirm() {
      if (this.removingSavedStop) {
        return
      }

      this.confirmRemoveModalOpen = false
      this.stopPendingRemoval = undefined
      this.pendingRemovalType = ''
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
        this.removeSavedStopError = 'This saved item could not be removed.'
        return
      }

      this.removingSavedStop = true
      this.removeSavedStopError = ''

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        await this.deleteSavedItem(this.stopPendingRemoval, this.pendingRemovalType, auth0token)
        reportRequestSuccess()
        const removedItem = this.stopPendingRemoval

        if (this.pendingRemovalType === 'journey') {
          this.savedJourneys = this.savedJourneys.filter(journey => journey.SavedObjectPrimaryIdentifier !== removedItem.SavedObjectPrimaryIdentifier)
        } else {
          this.savedStops = this.savedStops.filter(stop => stop.SavedObjectPrimaryIdentifier !== removedItem.SavedObjectPrimaryIdentifier)
        }
        this.confirmRemoveModalOpen = false
        this.stopPendingRemoval = undefined
        this.pendingRemovalType = ''
        this.removeSavedStopError = ''
        this.showToast(`${this.savedItemNameFrom(removedItem)} removed.`, 'success')

        if (this.savedStops.length === 0 && this.savedJourneys.length === 0) {
          this.editing = false
        }
        this.savedItemsFromCache = false
        await this.cacheSavedItems()
      } catch (error) {
        console.log(error)
        reportRequestFailure(error)
        this.removeSavedStopError = 'Saved item could not be removed.'
        this.showToast('Saved item could not be removed.', 'error')
      } finally {
        this.removingSavedStop = false
      }
    },
    async deleteSavedItem(item, type, auth0token) {
      const config = {
        headers: {
          Authorization: `Bearer ${auth0token}`
        }
      }

      try {
        return await axios.delete(`${API.URL}/core/saved/${item.SavedObjectPrimaryIdentifier}`, config)
      } catch (error) {
        if (![404, 405].includes(error.response?.status)) {
          throw error
        }

        return axios.delete(`${API.URL}/core/saved`, {
          ...config,
          data: {
            Type: type === 'journey' ? 'Journey' : 'Stop',
            ObjectIdentifier: item.SavedObjectIdentifier || item.PrimaryIdentifier
          }
        })
      }
    },
    async getSavedObjects() {
      this.savedObjectsError = ''

      if (!this.auth0.isAuthenticated) {
        this.savedStops = []
        this.savedJourneys = []
        return
      }

      const scope = auth0CacheScope(this.auth0)
      const cached = scope
        ? await getCachedResource(cacheKeys.savedItems, { maxAgeMs: CACHE_MAX_AGE.savedItems, scope })
        : null

      if (cached) {
        this.applySavedItems(cached.data, cached.savedAt, true)
      }

      this.loadingSavedObjects = !cached

      try {
        const auth0token = await getApiAccessToken(this.auth0)
        const response = await this.getSavedObjectsResponse(auth0token)
        reportRequestSuccess()
        const savedObjects = this.normaliseSavedObjects(response.data)
        const [savedStops, savedJourneys] = await Promise.all([
          this.hydrateSavedStops(savedObjects),
          this.hydrateSavedJourneys(savedObjects)
        ])
        this.savedStops = savedStops
        this.savedJourneys = savedJourneys
        this.savedItemsFromCache = false
        await this.cacheSavedItems()
      } catch (error) {
        console.log(error)
        reportRequestFailure(error)
        if (!cached) {
          this.savedStops = []
          this.savedJourneys = []
          this.savedObjectsError = 'Saved items could not be loaded.'
        }
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
    applySavedItems(snapshot, savedAt, fromCache) {
      this.savedStops = snapshot?.savedStops || []
      this.savedJourneys = snapshot?.savedJourneys || []
      this.savedItemsUpdatedAt = new Date(savedAt)
      this.savedItemsFromCache = fromCache
    },
    async cacheSavedItems() {
      const scope = auth0CacheScope(this.auth0)
      if (!scope) {
        return
      }

      const record = await putCachedResource(cacheKeys.savedItems, {
        savedStops: this.savedStops,
        savedJourneys: this.savedJourneys
      }, { scope })
      this.savedItemsUpdatedAt = new Date(record.savedAt)
    },
    async hydrateSavedStops(savedObjects) {
      const savedStops = savedObjects.filter(savedObject => this.isStopSavedObject(savedObject))
      const hydratedStops = await Promise.all(savedStops.map(async savedObject => {
        if (!savedObject.ObjectIdentifier) {
          return undefined
        }

        try {
          loadCachedResource({
            key: cacheKeys.departures(savedObject.ObjectIdentifier),
            maxAgeMs: CACHE_MAX_AGE.board,
            request: () => axios.get(`${API.URL}/core/stops/${savedObject.ObjectIdentifier}/departures`, {
              params: { count: 25 }
            })
          }).catch(() => undefined)

          const stopResult = await loadCachedResource({
            key: cacheKeys.stop(savedObject.ObjectIdentifier),
            maxAgeMs: CACHE_MAX_AGE.entity,
            revalidateAfterMs: CACHE_REVALIDATE_AFTER.stop,
            request: () => axios.get(`${API.URL}/core/stops/${savedObject.ObjectIdentifier}`)
          })

          return {
            ...stopResult.data,
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
    async hydrateSavedJourneys(savedObjects) {
      const savedJourneys = savedObjects.filter(savedObject => this.isJourneySavedObject(savedObject))
      const hydratedJourneys = await Promise.all(savedJourneys.map(async savedObject => {
        if (!savedObject.ObjectIdentifier) {
          return undefined
        }

        try {
          const result = await loadCachedResource({
            key: cacheKeys.journey(savedObject.ObjectIdentifier),
            maxAgeMs: CACHE_MAX_AGE.entity,
            request: () => axios.get(`${API.URL}/core/journeys/${savedObject.ObjectIdentifier}`)
          })

          return {
            ...result.data,
            SavedObjectPrimaryIdentifier: savedObject.PrimaryIdentifier,
            SavedObjectIdentifier: savedObject.ObjectIdentifier
          }
        } catch (error) {
          console.log(error)
          return undefined
        }
      }))

      return hydratedJourneys.filter(Boolean)
    },
    isStopSavedObject(savedObject) {
      return ['stop', 'stops'].includes(String(savedObject.Type || '').toLowerCase())
    },
    isJourneySavedObject(savedObject) {
      return ['journey', 'journeys'].includes(String(savedObject.Type || '').toLowerCase())
    },
    savedItemNameFrom(item) {
      return item.PrimaryName || item.DestinationDisplay || 'Saved item'
    }
  },
  mounted() {
    this.getSavedObjects()
  }
}
</script>
