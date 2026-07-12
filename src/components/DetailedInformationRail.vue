<template>
  <div v-if="showFacilities && journey?.Service?.TransportType == 'Rail'">
    <div v-if="railInfo.ReplacementBus">
      <div class="mb-3 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200">
        This is a rail replacement bus
      </div>
    </div>

    <IconPillRow
      v-if="facilityChips.length > 0"
      :chips="facilityChips"
      @select="openFacilityModal"
    />
  </div>

  <TrainLayout v-if="showTrainLayout" :trains="trains" />

  <Modal
    v-model:open="facilityModalOpen"
    :title="selectedFacility?.label || ''"
    :subtitle="selectedFacility?.summary || ''"
    :icon="selectedFacility?.icon || 'info'"
    close-label="Close facility details"
    body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
  >
            <div class="rounded-2xl bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
              {{ selectedFacility?.description }}
            </div>

            <div v-if="selectedFacility?.key === 'Toilets' && carriageToilets.length > 0" class="mt-4 space-y-2">
              <article
                v-for="item in carriageToilets"
                v-bind:key="`${item.carriage.ID}-${item.index}`"
                class="rounded-2xl border border-slate-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800/70"
              >
                <div class="flex items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200">
                    <span class="material-symbols-outlined text-[20px]">wc</span>
                  </span>
                  <div class="min-w-0">
                    <h3 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Toilet in {{ carriageLabel(item.carriage) }}</h3>
                    <p class="mt-1 text-sm text-slate-600 dark:text-slate-300">{{ item.toilet.Type || 'Toilet available' }}</p>
                    <p v-if="item.toilet.Status" class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {{ item.toilet.Status }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <dl v-if="selectedFacilityDetails.length > 0" class="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div
                v-for="detail in selectedFacilityDetails"
                v-bind:key="detail.label"
                class="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70"
              >
                <dt class="font-semibold text-slate-500 dark:text-slate-400">{{ detail.label }}</dt>
                <dd class="mt-1 font-bold text-slate-950 dark:text-slate-100">{{ detail.value }}</dd>
              </div>
            </dl>
  </Modal>
</template>

<script>
import IconPillRow from '@/components/IconPillRow.vue'
import Modal from '@/components/Modal.vue'
import TrainLayout from '@/components/TrainLayout.vue'

export default {
  name: 'DetailedInformationRail',
  components: {
    IconPillRow,
    Modal,
    TrainLayout
  },
  props: {
    journey: {},
    showFacilities: {
      type: Boolean,
      default: true
    },
    showTrainLayout: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    railInfo() {
      return this.journey?.RealtimeJourney?.DetailedRailInformation ||
        this.journey?.DetailedRailInformation ||
        {}
    },
    trains() {
      return [...(this.railInfo.Trains || [])].sort((first, second) => {
        return (first.Position || first.AllocationSequence || 0) -
          (second.Position || second.AllocationSequence || 0)
      })
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
          available: this.hasTrainFacility('AirConditioning'),
          summary: 'Air conditioning is available.',
          description: 'This service is listed as having air conditioning onboard.'
        },
        {
          key: 'WiFi',
          label: 'Wi-Fi',
          icon: 'wifi',
          available: this.hasTrainFacility('WiFi'),
          summary: 'Wi-Fi is available.',
          description: 'This service is listed as having onboard Wi-Fi.'
        },
        {
          key: 'PowerPlugs',
          label: 'Power sockets',
          icon: 'power',
          available: this.hasTrainFacility('PowerPlugs'),
          summary: 'Power sockets are available.',
          description: 'This service is listed as having onboard power sockets.'
        },
        {
          key: 'USBPlugs',
          label: 'USB charging',
          icon: 'usb',
          available: this.hasTrainFacility('USBPlugs'),
          summary: 'USB charging is available.',
          description: 'This service is listed as having USB charging points.'
        },
        {
          key: 'BicycleSpaces',
          label: 'Bike spaces',
          icon: 'pedal_bike',
          available: this.hasTrainFacility('BicycleSpaces'),
          summary: 'Bike spaces are available.',
          description: this.railInfo.ReservationBikeRequired
            ? 'Bike spaces are available, but a reservation is listed as required.'
            : 'Bike spaces are available on this service.'
        },
        {
          key: 'DisabledAccess',
          label: 'Accessible access',
          icon: 'accessible',
          available: this.hasTrainFacility('DisabledAccess'),
          summary: 'Accessible access is available.',
          description: 'This service is listed as having accessible access facilities.'
        },
        {
          key: 'Toilets',
          label: 'Toilets',
          icon: 'wc',
          available: this.hasTrainFacility('Toilets') || this.carriageToilets.length > 0,
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
            value: 'Available'
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
      return this.trains.flatMap(train => train.Carriages || [])
    },
    passengerCarriages() {
      return this.carriages.filter(carriage => !this.isPowerCarriage(carriage))
    }
  },
  data() {
    return {
      facilityModalOpen: false,
      selectedFacilityKey: null
    }
  },
  methods: {
    hasTrainFacility(key) {
      return this.trains.some(train => Boolean(train[key]))
    },
    openFacilityModal(key) {
      this.selectedFacilityKey = key
      this.facilityModalOpen = true
    },
    closeFacilityModal() {
      this.facilityModalOpen = false
    },
    normaliseVehicleRole(value) {
      return String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')
    },
    isPowerCarriage(carriage) {
      return this.normaliseVehicleRole(carriage?.VehicleRole) === 'powercar'
    },
    carriageLabel(carriage) {
      if (carriage.Label || carriage.Name) {
        return carriage.Label || carriage.Name
      }

      if (this.isPowerCarriage(carriage)) {
        return 'Power car'
      }

      const carriageIndex = this.passengerCarriages.indexOf(carriage)

      return carriageIndex >= 0 ? `Coach ${carriageIndex + 1}` : 'this coach'
    }
  }
}
</script>
