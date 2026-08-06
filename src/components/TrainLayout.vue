<template>
  <section v-if="normalisedCarriages.length > 0" class="mt-2 space-y-2">
    <div class="flex items-center justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-bold text-slate-950 dark:text-slate-100">Train formation</p>
        <p class="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{{ formationSummary }}</p>
      </div>
      <span
        v-if="layoutStatus"
        class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold"
        :class="layoutStatus.classes"
      >
        {{ layoutStatus.label }}
      </span>
    </div>

    <div v-if="formationDetails.length > 0" class="flex flex-wrap gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300">
      <span v-for="detail in formationDetails" :key="detail" class="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">{{ detail }}</span>
    </div>

    <div class="-mx-1 overflow-x-auto px-1">
      <div class="min-w-max">
        <ol class="flex items-end gap-2">
          <li
            v-for="unit in normalisedUnits"
            v-bind:key="unit.key"
            class="shrink-0"
          >
            <p v-if="normalisedUnits.length > 1" class="mb-1 text-center text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{{ unit.label }}</p>
            <ol class="flex items-stretch gap-1 rounded-xl border border-slate-200 bg-slate-50/70 p-1 dark:border-slate-700 dark:bg-slate-800/40">
              <li v-for="carriage in unit.carriages" v-bind:key="carriage.key" class="shrink-0" :class="carriageShellClasses(carriage)">
                <button
                  type="button"
                  class="relative flex w-full flex-col overflow-hidden border text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-brand-blue/20"
                  :class="[carriageShapeClasses(carriage), carriage.occupancyClasses, carriageButtonSizeClasses(carriage)]"
                  :title="carriageTitle(carriage)"
                  :aria-label="`Open details for ${carriage.locationLabel}`"
                  @click="openCarriageModal(carriage)"
                >
                  <div v-if="carriage.isPowerCar" class="flex min-h-[2rem] flex-col items-center justify-center gap-0.5 text-center">
                    <span class="material-symbols-outlined text-[18px] leading-none text-slate-700 dark:text-slate-100">electric_bolt</span>
                    <p class="text-[9px] font-black uppercase leading-none text-slate-600 dark:text-slate-200">Power Car</p>
                  </div>
                  <template v-else>
                    <div class="min-w-0">
                      <p class="truncate text-[11px] font-bold text-slate-950 dark:text-slate-100">{{ carriage.label }}</p>
                      <p v-if="carriage.hasOccupancy" class="mt-0.5 truncate text-[10px] font-bold" :class="carriage.occupancyTextClass">{{ carriage.occupancyLabel }}</p>
                      <span v-if="carriage.id" class="sr-only">{{ carriage.id }}</span>
                    </div>

                    <div v-if="carriage.features.length > 0" class="mt-1.5 flex min-h-5 flex-wrap items-center gap-1">
                      <span v-for="feature in carriage.features" v-bind:key="feature.key" class="inline-flex h-5 w-5 items-center justify-center rounded-md bg-white/80 text-slate-700 shadow-sm dark:bg-slate-950/80 dark:text-slate-200" :title="feature.label">
                        <span v-if="feature.text" class="text-[9px] font-black leading-none">{{ feature.text }}</span>
                        <span v-else class="material-symbols-outlined text-[14px] leading-none">{{ feature.icon }}</span>
                      </span>
                    </div>
                  </template>
                </button>
              </li>
            </ol>
          </li>
        </ol>
      </div>
    </div>
  </section>

  <Modal
    v-model:open="carriageModalOpen"
    :title="selectedCarriage?.label || 'Coach details'"
    :subtitle="selectedCarriageSubtitle"
    icon="train"
    close-label="Close coach details"
  >
    <div v-if="selectedCarriage" class="space-y-4">
      <section
        v-if="selectedCarriage.hasOccupancy"
        class="rounded-xl p-3"
        :class="selectedCarriage.occupancyClasses"
      >
        <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Occupancy</p>
        <p class="mt-1 text-base font-bold" :class="selectedCarriage.occupancyTextClass">{{ selectedCarriage.occupancyLabel }}</p>
      </section>

      <section v-if="selectedCarriage.features.length > 0" class="space-y-2">
        <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">Facilities</h3>
        <div class="grid gap-2 sm:grid-cols-2">
          <article
            v-for="feature in selectedCarriage.features"
            v-bind:key="feature.key"
            class="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
          >
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light">
              <span v-if="feature.text" class="text-xs font-black leading-none">{{ feature.text }}</span>
              <span v-else class="material-symbols-outlined text-[20px]">{{ feature.icon }}</span>
            </span>
            <span class="text-sm font-bold text-slate-800 dark:text-slate-100">{{ feature.label }}</span>
          </article>
        </div>
      </section>

      <section v-if="selectedTrainDetails.length > 0" class="space-y-2">
        <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">Train</h3>
        <dl class="grid gap-2 text-sm sm:grid-cols-2">
          <div
            v-for="detail in selectedTrainDetails"
            v-bind:key="detail.label"
            class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
          >
            <dt class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ detail.label }}</dt>
            <dd class="mt-1 break-words font-bold text-slate-950 dark:text-slate-100">{{ detail.value }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="selectedCarriageToilets.length > 0" class="space-y-2">
        <h3 class="text-sm font-bold text-slate-950 dark:text-slate-100">Toilets</h3>
        <div class="space-y-2">
          <article
            v-for="(toilet, index) in selectedCarriageToilets"
            v-bind:key="index"
            class="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/70"
          >
            <p class="font-bold text-slate-800 dark:text-slate-100">{{ toilet.Type || 'Toilet available' }}</p>
            <p v-if="toilet.Accessible || toilet.Type === 'Accessible'" class="mt-1 text-xs font-semibold text-brand-blue dark:text-brand-blue-light">
              Accessible toilet
            </p>
          </article>
        </div>
      </section>

      <dl v-if="selectedCarriageDetails.length > 0" class="grid gap-2 text-sm sm:grid-cols-2">
        <div
          v-for="detail in selectedCarriageDetails"
          v-bind:key="detail.label"
          class="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/70"
        >
          <dt class="text-xs font-semibold text-slate-500 dark:text-slate-400">{{ detail.label }}</dt>
          <dd class="mt-1 break-words font-bold text-slate-950 dark:text-slate-100">{{ detail.value }}</dd>
        </div>
      </dl>
    </div>
  </Modal>
</template>

<script>
import Pretty from '@/pretty'
import Modal from '@/components/Modal.vue'

export default {
  name: 'TrainLayout',
  components: {
    Modal
  },
  props: {
    carriages: {
      type: Array,
      default: () => []
    },
    trains: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      pretty: Pretty,
      carriageModalOpen: false,
      selectedCarriage: null
    }
  },
  computed: {
    orderedTrains() {
      if (this.trains.length === 0) {
        return this.carriages.length > 0
          ? [{ ID: '', Position: 1, Carriages: this.carriages }]
          : []
      }

      return [...this.trains]
        .sort((first, second) => {
          return (first.Position || first.AllocationSequence || 0) -
            (second.Position || second.AllocationSequence || 0)
        })
        .map(train => {
          const carriages = [...(train.Carriages || [])].sort((first, second) => {
            return (first.VehiclePosition || 0) - (second.VehiclePosition || 0)
          })
          let passengerNumber = 0
          const numberedCarriages = carriages.map(carriage => {
            const displayPassengerNumber = this.countsAsPassengerCarriage(carriage)
              ? passengerNumber++
              : null

            return {
              ...carriage,
              displayPassengerNumber
            }
          })

          return {
            ...train,
            Carriages: train.Reversed ? numberedCarriages.reverse() : numberedCarriages
          }
        })
    },
    normalisedCarriages() {
      let visualIndex = 0
      let passengerIndex = 0

      return this.orderedTrains.flatMap((train, trainIndex) => {
        return (train.Carriages || []).map((carriage, carriageIndex) => {
          const isPowerCar = this.isPowerCarriage(carriage)
          const isPassengerCarriage = this.countsAsPassengerCarriage(carriage)
          const occupancy = this.normaliseOccupancy(carriage.Occupancy)
          const normalised = {
            raw: carriage,
            train,
            trainIndex,
            startsTrain: carriageIndex === 0,
            key: `${train.ID || trainIndex}-${carriage.ID || carriage.Id || carriage.Identifier || carriageIndex}`,
            id: carriage.ID || carriage.Id || carriage.Identifier || '',
            index: visualIndex,
            passengerIndex: isPassengerCarriage ? passengerIndex : -1,
            isPowerCar,
            isPassengerCarriage,
            label: this.coachLabel(carriage, carriage.displayPassengerNumber ?? passengerIndex),
            locationLabel: this.carriageLocationLabel(carriage, carriage.displayPassengerNumber ?? passengerIndex, train, trainIndex),
            features: this.carriageFeatures(carriage),
            occupancy,
            hasOccupancy: occupancy >= 0,
            occupancyLabel: this.occupancyLabel(occupancy),
            occupancyClasses: this.occupancyClasses(occupancy),
            occupancyTextClass: this.occupancyTextClass(occupancy)
          }

          visualIndex += 1
          if (isPassengerCarriage) {
            passengerIndex += 1
          }
          return normalised
        })
      })
    },
    passengerCarriages() {
      return this.normalisedCarriages.filter(carriage => carriage.isPassengerCarriage)
    },
    powerCarriages() {
      return this.normalisedCarriages.filter(carriage => carriage.isPowerCar)
    },
    normalisedUnits() {
      return this.orderedTrains.map((train, trainIndex) => ({
        key: train.ID || `unit-${trainIndex}`,
        label: this.unitLabel(train, trainIndex),
        carriages: this.normalisedCarriages.filter(carriage => carriage.trainIndex === trainIndex)
      }))
    },
    formationSummary() {
      const unitCount = this.orderedTrains.length
      return `${unitCount} unit${unitCount === 1 ? '' : 's'} · ${this.formatCoachCount(this.passengerCarriages.length)}`
    },
    formationDetails() {
      const powerCarCount = this.powerCarriages.length > 0
        ? `${this.powerCarriages.length} power car${this.powerCarriages.length === 1 ? '' : 's'}`
        : ''
      const seatingClasses = [...new Set(this.passengerCarriages
        .flatMap(carriage => this.normaliseCarriageClasses(carriage.raw.SeatingClasses))
        .filter(seatingClass => seatingClass !== 'unknown'))]
        .map(seatingClass => `${seatingClass.charAt(0).toUpperCase()}${seatingClass.slice(1)} class`)
      const toiletLabels = this.passengerCarriages
        .filter(carriage => carriage.features.some(feature => feature.key === 'toilet' || feature.key === 'accessible-toilet'))
        .map(carriage => carriage.locationLabel)

      return [
        powerCarCount,
        seatingClasses.length > 0 ? seatingClasses.join(' & ') : '',
        toiletLabels.length > 0 ? `Toilets: ${toiletLabels.join(', ')}` : ''
      ].filter(Boolean)
    },
    layoutStatus() {
      const knownOccupancies = this.passengerCarriages
        .map(carriage => carriage.occupancy)
        .filter(occupancy => occupancy >= 0)

      if (knownOccupancies.length === 0) {
        return null
      }

      const averageOccupancy = knownOccupancies.reduce((total, occupancy) => total + occupancy, 0) / knownOccupancies.length

      return {
        label: this.occupancyLabel(averageOccupancy),
        classes: this.occupancyBadgeClasses(averageOccupancy)
      }
    },
    selectedCarriageSubtitle() {
      return [
        this.selectedCarriage?.train?.VehicleTypeName,
        this.selectedCarriage?.train?.ID ? `Unit ${this.selectedCarriage.train.ID}` : '',
        this.selectedCarriage?.id ? `${this.selectedCarriage?.isPowerCar ? 'Power car' : 'Carriage'} ${this.selectedCarriage.id}` : ''
      ].filter(Boolean).join(' · ')
    },
    selectedCarriageToilets() {
      return this.selectedCarriage?.raw?.Toilets || []
    },
    selectedCarriageDetails() {
      if (!this.selectedCarriage) {
        return []
      }

      const carriage = this.selectedCarriage.raw

      return [
        this.detail('Vehicle role', this.displayVehicleRole(carriage.VehicleRole)),
        this.detail('Seating classes', this.displaySeatingClasses(carriage.SeatingClasses)),
        this.detail('Seats', carriage.SeatCount > 0 ? carriage.SeatCount : ''),
        this.detail('Carriage type', carriage.CarriageType),
        this.detail('Specific type', carriage.SpecificType, carriage.SpecificType !== carriage.CarriageType),
        this.detail('Vehicle ID', carriage.VehicleID),
        this.detail('Position in unit', carriage.VehiclePosition > 0 ? carriage.VehiclePosition : ''),
        this.detail('Length', carriage.LengthMM > 0 ? `${(carriage.LengthMM / 1000).toFixed(1)} m` : ''),
        this.detail('Livery', carriage.Livery),
      ].filter(Boolean)
    },
    selectedTrainDetails() {
      const train = this.selectedCarriage?.train

      if (!train) {
        return []
      }

      const formationCount = this.trainPassengerCarriageCount(train)

      return [
        this.detail('Vehicle', train.VehicleTypeName || train.VehicleType),
        this.detail('Unit ID', train.ID),
        this.detail('Fleet', train.FleetID),
        this.detail('Power', train.PowerType),
        this.detail('Top speed', train.SpeedKMH > 0 ? `${train.SpeedKMH} km/h` : ''),
        this.detail('Formation', formationCount > 0 ? this.formatCoachCount(formationCount) : ''),
        this.detail('Direction', train.Reversed ? 'Reversed formation' : '')
      ].filter(Boolean)
    }
  },
  methods: {
    openCarriageModal(carriage) {
      this.selectedCarriage = carriage
      this.carriageModalOpen = true
    },
    coachLabel(carriage, passengerIndex) {
      if (this.isPowerCarriage(carriage)) {
        return carriage.Label || carriage.Name || 'Power car'
      }

      return carriage.Label || carriage.Name || `Coach ${passengerIndex + 1}`
    },
    unitLabel(train, trainIndex) {
      return `Unit ${train?.ID || trainIndex + 1}`
    },
    carriageLocationLabel(carriage, passengerIndex, train, trainIndex) {
      const coach = this.coachLabel(carriage, passengerIndex)
      return this.orderedTrains.length > 1 && !this.isPowerCarriage(carriage)
        ? `${coach} of ${this.unitLabel(train, trainIndex)}`
        : coach
    },
    carriageTitle(carriage) {
      if (carriage.isPowerCar) {
        return carriage.id ? `Power car ID: ${carriage.id}` : 'Power car'
      }

      return carriage.id ? `Carriage ID: ${carriage.id}` : carriage.label
    },
    detail(label, value, include = true) {
      if (!include || value === '' || value === null || value === undefined) {
        return null
      }

      return { label, value }
    },
    displayVehicleRole(value) {
      const role = this.normaliseVehicleRole(value)

      if (role === 'powercar') {
        return 'Power car'
      }

      if (role === 'passenger') {
        return 'Passenger'
      }

      if (role === 'unknown') {
        return 'Unknown'
      }

      return ''
    },
    normaliseVehicleRole(value) {
      return String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')
    },
    isPowerCarriage(carriage) {
      return this.normaliseVehicleRole(carriage?.VehicleRole) === 'powercar'
    },
    countsAsPassengerCarriage(carriage) {
      return !this.isPowerCarriage(carriage)
    },
    trainPassengerCarriageCount(train) {
      if (train?.TrainLength > 0) {
        return train.TrainLength
      }

      return (train?.Carriages || []).filter(carriage => this.countsAsPassengerCarriage(carriage)).length
    },
    formatCoachCount(count) {
      return `${count} coach${count === 1 ? '' : 'es'}`
    },
    displaySeatingClasses(values) {
      const seatingClasses = this.normaliseCarriageClasses(values)
        .filter(seatingClass => seatingClass !== 'unknown')

      if (seatingClasses.length === 0) {
        return ''
      }

      return seatingClasses
        .map(seatingClass => `${seatingClass.charAt(0).toUpperCase()}${seatingClass.slice(1)}`)
        .join(' and ')
    },
    normaliseOccupancy(occupancy) {
      if (typeof occupancy !== 'number') {
        return -1
      }

      return occupancy
    },
    occupancyLabel(occupancy) {
      if (occupancy < 0) {
        return 'Unknown'
      }

      return this.pretty.occupancyDescription(occupancy) || 'Unknown'
    },
    occupancyClasses(occupancy) {
      if (occupancy < 0) {
        return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80'
      }

      if (occupancy < 40) {
        return 'border-emerald-100 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10'
      }

      if (occupancy < 70) {
        return 'border-brand-blue/20 bg-brand-blue/10 dark:border-brand-blue/20 dark:bg-brand-blue/100/10'
      }

      if (occupancy < 90) {
        return 'border-amber-100 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10'
      }

      return 'border-red-100 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10'
    },
    occupancyTextClass(occupancy) {
      if (occupancy < 0) {
        return 'text-slate-500 dark:text-slate-400'
      }

      if (occupancy < 40) {
        return 'text-emerald-700 dark:text-emerald-200'
      }

      if (occupancy < 70) {
        return 'text-brand-blue dark:text-brand-blue-light'
      }

      if (occupancy < 90) {
        return 'text-amber-700 dark:text-amber-200'
      }

      return 'text-red-700 dark:text-red-200'
    },
    occupancyBadgeClasses(occupancy) {
      if (occupancy < 40) {
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200'
      }

      if (occupancy < 70) {
        return 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/100/10 dark:text-brand-blue-light'
      }

      if (occupancy < 90) {
        return 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-200'
      }

      return 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200'
    },
    carriageShellClasses(carriage) {
      return carriage.isPowerCar ? 'w-[3.25rem] self-center' : 'w-[5.75rem]'
    },
    carriageButtonSizeClasses(carriage) {
      if (carriage.isPowerCar) {
        return 'min-h-[3.75rem] items-center justify-center px-1.5 py-1.5 border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-700/70'
      }

      return 'min-h-[3.75rem] justify-between px-2.5 py-2'
    },
    carriageShapeClasses(carriage) {
      if (this.normalisedCarriages.length === 1) {
        return 'rounded-[1.75rem]'
      }

      if (carriage.index === 0) {
        return 'rounded-l-[2rem] rounded-r-xl'
      }

      if (carriage.index === this.normalisedCarriages.length - 1) {
        return 'rounded-l-xl rounded-r-[2rem]'
      }

      return 'rounded-xl'
    },
    carriageFeatures(carriage) {
      if (this.isPowerCarriage(carriage)) {
        return [{
          key: 'power-car',
          label: 'Power car',
          icon: 'electric_bolt'
        }]
      }

      const features = []
      const toilets = carriage.Toilets || []

      if (toilets.length > 0) {
        const hasAccessibleToilet = toilets.some(toilet => toilet.Type === 'Accessible' || toilet.Accessible)

        features.push({
          key: hasAccessibleToilet ? 'accessible-toilet' : 'toilet',
          label: hasAccessibleToilet ? 'Accessible toilet' : 'Toilet',
          icon: hasAccessibleToilet ? 'accessible' : 'wc'
        })
      }

      if (this.hasFeature(carriage, ['BicycleSpaces', 'BikeSpaces', 'Bikes', 'BikeStorage'])) {
        features.push({
          key: 'bike',
          label: 'Bike spaces',
          icon: 'pedal_bike'
        })
      }

      if (this.hasFeature(carriage, ['WheelchairSpaces', 'WheelchairSpace', 'Wheelchair'])) {
        features.push({
          key: 'wheelchair',
          label: 'Wheelchair spaces',
          icon: 'accessible'
        })
      }

      if (this.hasFirstClass(carriage)) {
        features.push({
          key: 'first-class',
          label: 'First class',
          text: '1st'
        })
      }

      return features
    },
    hasFirstClass(carriage) {
      const carriageClasses = this.normaliseCarriageClasses(carriage.SeatingClasses)

      if (carriageClasses.length > 0) {
        return carriageClasses.includes('first')
      }

      const directFirstClassKeys = [
        'FirstClass',
        'FirstClassAvailable',
        'FirstClassAccommodation',
        'FirstClassSeats',
        'FirstClassSeating',
        'FirstClassCoach',
        'FirstClassZone'
      ]

      if (directFirstClassKeys.some(key => this.hasFeatureValue(carriage[key]))) {
        return true
      }

      return [
        'CoachClass',
        'TravelClass',
        'AccommodationClass',
        'SeatingClasses',
        'Accommodation'
      ].some(key => {
        const value = carriage[key]

        if (!this.hasFeatureValue(value)) {
          return false
        }

        const stringValue = this.stringifyFeatureValue(value).toLowerCase()

        return stringValue.includes('first') || stringValue.includes('1st')
      })
    },
    normaliseCarriageClass(value) {
      if (typeof value !== 'string') {
        return ''
      }

      const normalisedValue = value.trim().toLowerCase()

      if (['first', 'standard', 'unknown'].includes(normalisedValue)) {
        return normalisedValue
      }

      return ''
    },
    normaliseCarriageClasses(values) {
      const classes = Array.isArray(values) ? values : [values]

      return [...new Set(classes
        .map(value => this.normaliseCarriageClass(value))
        .filter(Boolean))]
    },
    hasFeature(carriage, keys) {
      return keys.some(key => this.hasFeatureValue(carriage[key]))
    },
    hasFeatureValue(value) {
      if (Array.isArray(value)) {
        return value.length > 0
      }

      if (typeof value === 'string') {
        const normalisedValue = value.trim().toLowerCase()

        return normalisedValue !== '' &&
          !['0', 'false', 'no', 'none', 'unknown', 'n/a'].includes(normalisedValue)
      }

      return Boolean(value)
    },
    stringifyFeatureValue(value) {
      if (Array.isArray(value)) {
        return value.join(' ')
      }

      return String(value || '')
    },
  }
}
</script>
