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

  <TrainLayout :carriages="carriages" />

  <Modal
    v-model:open="facilityModalOpen"
    :title="selectedFacility?.label || ''"
    :subtitle="selectedFacility?.summary || ''"
    :icon="selectedFacility?.icon || 'info'"
    close-label="Close facility details"
    body-class="max-h-[calc(88dvh-5rem)] overflow-y-auto p-4 sm:p-5"
  >
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
                    <h3 class="text-sm font-extrabold text-slate-950">Toilet in {{ carriageLabel(item.carriage) }}</h3>
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
      facilityModalOpen: false,
      selectedFacilityKey: null
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
    carriageLabel(carriage) {
      const carriageIndex = this.carriages.indexOf(carriage)

      if (carriage.Label || carriage.Name) {
        return carriage.Label || carriage.Name
      }

      return carriageIndex >= 0 ? `Coach ${carriageIndex + 1}` : 'this coach'
    }
  }
}
</script>
