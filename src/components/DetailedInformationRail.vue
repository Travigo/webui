<template>
  <div v-if="journey?.Service?.TransportType == 'Rail'">
    <div v-if="journey.DetailedRailInformation?.ReplacementBus">
      <div class="mb-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
        This is a rail replacement bus
      </div>
    </div>

    <IconPillRow
      v-if="facilityChips.length > 0"
      :chips="facilityChips"
      @select="openFacilityModal"
    />
  </div>

  <div v-if="this.carriages.length > 0" class="mt-3 flex gap-2 overflow-x-auto pb-1">
    <div class="min-w-24 text-center" v-for="(carriage, index) in this.carriages" v-bind:key="carriage.ID || index">
      <div
        class="min-h-14 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 shadow-sm"
        v-bind:class="{ 'rounded-l-3xl': isFrontTrain(carriage, index), 'rounded-r-3xl': isRearTrain(carriage, index) }"
      >
        {{ pretty.occupancyDescription(carriage.Occupancy) }}
        <div class="mt-1 flex justify-center gap-1" v-for="(toilet, toiletIndex) in carriage.Toilets" v-bind:key="toiletIndex">
          <span class="material-symbols-outlined text-base">wc</span>
          <span class="material-symbols-outlined text-base" v-if="toilet.Type=='Accessible'">accessible</span>
        </div>
      </div>
      <div class="mt-1 text-xs font-semibold text-slate-600">{{ carriage.ID }}</div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="modal-overlay">
      <div
        v-if="facilityModalOpen"
        class="fixed inset-0 z-[1000] flex min-h-dvh w-screen items-end bg-slate-950/40 px-4 pb-4 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        @click.self="closeFacilityModal"
      >
        <section class="modal-panel max-h-[88dvh] w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20 sm:max-w-lg">
          <div class="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-5">
            <div class="flex min-w-0 items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <span class="material-symbols-outlined text-[24px] leading-none">{{ selectedFacility?.icon }}</span>
              </span>
              <div class="min-w-0">
                <h2 class="truncate text-lg font-bold text-slate-950 sm:text-xl">{{ selectedFacility?.label }}</h2>
                <p class="mt-1 text-sm text-slate-500">{{ selectedFacility?.summary }}</p>
              </div>
            </div>
            <button
              @click="closeFacilityModal"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
              aria-label="Close facility details"
            >
              <span class="material-symbols-outlined text-xl">close</span>
            </button>
          </div>

          <div class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5">
            <div class="rounded-2xl bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700">
              {{ selectedFacility?.description }}
            </div>

            <div v-if="selectedFacility?.key === 'Toilets' && carriageToilets.length > 0" class="mt-4 space-y-2">
              <article
                v-for="item in carriageToilets"
                v-bind:key="`${item.carriage.ID}-${item.index}`"
                class="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <span class="material-symbols-outlined text-[20px]">wc</span>
                  </span>
                  <div class="min-w-0">
                    <h3 class="text-sm font-extrabold text-slate-950">Carriage {{ item.carriage.ID || 'unknown' }}</h3>
                    <p class="mt-1 text-sm text-slate-600">{{ item.toilet.Type || 'Toilet available' }}</p>
                  </div>
                </div>
              </article>
            </div>

            <dl v-if="selectedFacilityDetails.length > 0" class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div
                v-for="detail in selectedFacilityDetails"
                v-bind:key="detail.label"
                class="rounded-2xl bg-slate-50 p-3"
              >
                <dt class="font-semibold text-slate-500">{{ detail.label }}</dt>
                <dd class="mt-1 font-bold text-slate-950">{{ detail.value }}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import Pretty from "@/pretty"
import IconPillRow from '@/components/IconPillRow.vue'

export default {
  name: 'DetailedInformationRail',
  components: {
    IconPillRow
  },
  props: {
    journey: {},
  },
  computed: {
    railInfo() {
      return this.journey?.DetailedRailInformation || {}
    },
    facilityChips() {
      return this.facilitySections.filter(facility => facility.available)
    },
    facilitySections() {
      return [
        {
          key: 'AirConditioning',
          label: 'Air conditioning',
          icon: 'ac_unit',
          available: this.railInfo.AirConditioning,
          summary: 'Air conditioning is available.',
          description: 'This service is listed as having air conditioning onboard.'
        },
        {
          key: 'WiFi',
          label: 'Wi-Fi',
          icon: 'wifi',
          available: this.railInfo.WiFi,
          summary: 'Wi-Fi is available.',
          description: 'This service is listed as having onboard Wi-Fi.'
        },
        {
          key: 'PowerPlugs',
          label: 'Power sockets',
          icon: 'power',
          available: this.railInfo.PowerPlugs,
          summary: 'Power sockets are available.',
          description: 'This service is listed as having onboard power sockets.'
        },
        {
          key: 'USBPlugs',
          label: 'USB charging',
          icon: 'usb',
          available: this.railInfo.USBPlugs,
          summary: 'USB charging is available.',
          description: 'This service is listed as having USB charging points.'
        },
        {
          key: 'BicycleSpaces',
          label: 'Bike spaces',
          icon: 'pedal_bike',
          available: this.railInfo.BicycleSpaces,
          badge: this.facilityBadge(this.railInfo.BicycleSpaces),
          summary: 'Bike spaces are available.',
          description: this.railInfo.ReservationBikeRequired
            ? 'Bike spaces are available, but a reservation is listed as required.'
            : 'Bike spaces are available on this service.'
        },
        {
          key: 'DisabledAccess',
          label: 'Accessible access',
          icon: 'accessible',
          available: this.railInfo.DisabledAccess,
          summary: 'Accessible access is available.',
          description: 'This service is listed as having accessible access facilities.'
        },
        {
          key: 'Toilets',
          label: 'Toilets',
          icon: 'wc',
          available: this.railInfo.Toilets,
          badge: this.carriageToilets.length > 0 ? this.carriageToilets.length : '',
          summary: 'Toilets are available.',
          description: this.carriageToilets.length > 0
            ? 'Toilet information is available by carriage.'
            : 'This service is listed as having toilets onboard.'
        },
        {
          key: 'CateringAvailable',
          label: 'Food & drink',
          icon: 'restaurant',
          available: this.railInfo.CateringAvailable,
          summary: 'Catering is available.',
          description: this.railInfo.CateringDescription || 'This service is listed as having onboard catering.'
        }
      ]
    },
    selectedFacility() {
      if (this.selectedFacilityKey === null) {
        return null
      }

      return this.facilitySections.find(facility => facility.key === this.selectedFacilityKey) || null
    },
    selectedFacilityDetails() {
      if (this.selectedFacility === null) {
        return []
      }

      if (this.selectedFacility.key === 'BicycleSpaces') {
        return [
          {
            label: 'Reservation',
            value: this.railInfo.ReservationBikeRequired ? 'Required' : 'Not required'
          },
          {
            label: 'Spaces',
            value: this.facilityBadge(this.railInfo.BicycleSpaces) || 'Available'
          }
        ]
      }

      if (this.selectedFacility.key === 'CateringAvailable' && this.railInfo.CateringDescription) {
        return [
          {
            label: 'Description',
            value: this.railInfo.CateringDescription
          }
        ]
      }

      return []
    },
    carriageToilets() {
      return this.carriages.flatMap(carriage => (carriage.Toilets || []).map((toilet, index) => ({
        carriage,
        toilet,
        index
      })))
    },
    carriages() {
      if (this.journey?.RealtimeJourney?.DetailedRailInformation?.Carriages?.length > 0) {
        return this.journey?.RealtimeJourney?.DetailedRailInformation?.Carriages
      }
      
      if (this.journey?.DetailedRailInformation?.Carriages?.length > 0) {
        return this.journey?.DetailedRailInformation?.Carriages
      }

      return []
    }
  },
  data() {
    return {
      pretty: Pretty,
      facilityModalOpen: false,
      selectedFacilityKey: null,
    }
  },
  methods: {
    facilityBadge(value) {
      return typeof value === 'number' && value > 1 ? value : ''
    },
    openFacilityModal(key) {
      this.selectedFacilityKey = key
      this.facilityModalOpen = true
    },
    closeFacilityModal() {
      this.facilityModalOpen = false
    },
    isNumericChar(c) { return /\d/.test(c); },
    isFrontTrain(carriage, index) {
      if (index===0) {
        return true
      }

      let previousCarriage = this.carriages[index-1]
      let currentCarriageFirstChar = carriage.ID[0]
      let previousCarriageFirstChar = previousCarriage.ID[0]

      if (!this.isNumericChar(currentCarriageFirstChar) && !this.isNumericChar(previousCarriageFirstChar) && 
          currentCarriageFirstChar !== previousCarriageFirstChar) {
        return true
      }
    },
    isRearTrain(carriage, index) {
      if (index===this.carriages.length-1) {
        return true
      }

      let nextCarriage = this.carriages[index+1]
      let currentCarriageFirstChar = carriage.ID[0]
      let nextCarriageFirstChar = nextCarriage.ID[0]

      if (!this.isNumericChar(currentCarriageFirstChar) && !this.isNumericChar(nextCarriageFirstChar) && 
          currentCarriageFirstChar !== nextCarriageFirstChar) {
        return true
      }
    }
  }
}
</script>

<style scoped lang="scss">
.carriage {
  width: 100px;
  display: inline-block;

  .carriage-icon {
    background: white;
    border: 1px solid gray;
    height: 50px;
  }
  .carriage-icon-front {
    border-top-left-radius: 20px;
  }
  .carriage-icon-rear {
    border-top-right-radius: 20px;
  }
}
</style>
