<template>
  <Alert type="error" class="mt-4" v-if="errorJourney !== undefined">{{ errorJourney }}</Alert>
  <LoadingState
    v-if="loadingJourney"
    title="Loading journey"
    subtitle="Fetching live journey status, stops, and alerts."
  />

  <div v-else class="space-y-4 pb-16 pt-2 sm:pb-20">
    <PageHeader
      :title="journeyHeaderTitle"
      variant="tinted"
      compact
    >
      <template #meta>
        <div class="mb-1 flex flex-wrap items-center gap-2">
          <ServiceIcon
            v-if="journey.Service!==undefined"
            class="h-6 rounded-md px-2 text-xs font-bold shadow-sm"
            style="line-height: 24px"
            :service="journey.Service"
          />
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold"
            :class="journeyStatus.classes"
          >
            <DepartureTypeIcon :journey="journey"/>
            {{ journeyStatus.label }}
          </span>
        </div>
      </template>

      <template #actions>
          <IconButton
            icon="refresh"
            label="Refresh realtime journey"
            :disabled="loadingRealtime"
            :spinning="loadingRealtime"
            @click="getRealtimeJourney()"
          />
          
          <EntityActionButtons
            entity-type="Journey"
            :entity-name="journeyTitle"
            :entity-identifier="$route.params.id"
            :notification-types="journeyNotificationTypes"
            shape="square"
          />
      </template>

      <p
        class="truncate text-xs font-medium text-slate-500 dark:text-slate-400"
        v-if="journey.RealtimeJourney && journey.RealtimeJourney.ActivelyTracked && journey.RealtimeJourney.VehicleLocationDescription"
      >
        {{ journey.RealtimeJourney.VehicleLocationDescription }}
      </p>

      <div v-if="headerRailOverviewItem" class="flex items-center gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <span class="material-symbols-outlined text-[17px] text-blue-600 dark:text-blue-300">{{ headerRailOverviewItem.icon }}</span>
          {{ headerRailOverviewItem.label }}
        </span>
        <button
          type="button"
          class="ml-auto inline-flex min-h-8 items-center gap-1 rounded-xl px-1 text-xs font-extrabold text-blue-700 transition hover:bg-blue-50 dark:text-blue-200 dark:hover:bg-blue-500/10"
          @click="changeTab('details')"
        >
          Onboard details
          <span class="material-symbols-outlined text-[17px]">chevron_right</span>
        </button>
      </div>
    </PageHeader>

    <ServiceAlertList
      :alerts="serviceAlerts"
      :max-visible="1"
      :context-name="journeyTitle"
      compact
    />

    <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <TabBar :tabs="tabs" :model-value="currentTab" @update:model-value="changeTab" />

      <div v-if="currentTab === 'timeline'" class="xl:grid xl:grid-cols-[15rem_minmax(0,1fr)]">
        <aside class="hidden border-b border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70 xl:block">
          <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Journey overview</p>
          <div class="mt-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-950">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Status</p>
            <p class="mt-1 text-sm font-extrabold" :class="journeyStatus.classes">{{ journeyStatus.label }}</p>
          </div>
          <div v-if="nextJourneyPoint" class="mt-3 rounded-2xl bg-white p-3 shadow-sm dark:bg-slate-950">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400">Next stop</p>
            <p class="mt-1 text-sm font-extrabold text-slate-950 dark:text-slate-100">{{ nextJourneyPoint.stop.PrimaryName }}</p>
            <p class="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {{ pretty.time(nextJourneyPoint.realtime?.DepartureTime || nextJourneyPoint.departureTime, journey.DepartureTimezone) }}
              <template v-if="nextJourneyPoint.platform"> · Platform {{ nextJourneyPoint.platform }}</template>
            </p>
          </div>
        </aside>

        <div class="p-4 sm:p-5">
          <button
            v-if="hasHiddenStops"
            @click="toggleInactiveStops()"
            type="button"
            class="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
          >
            <span class="material-symbols-outlined text-[19px]">{{ expandInactiveStops ? 'unfold_less' : 'history' }}</span>
            {{ expandInactiveStops ? 'Collapse previous stops' : 'Show previous stops' }}
          </button>

          <ol class="relative space-y-0">
          <li
            v-for="(point, index) in journeyPoints"
            v-bind:key="index"
          >
            <div
              v-if="showStop(index)"
              class="relative grid grid-cols-[1.5rem_1fr_auto] gap-3 py-3"
              :class="{'opacity-65': !point.active}"
            >
              <div class="relative flex justify-center">
                <span
                  class="absolute top-7 h-full w-px bg-slate-200"
                  v-if="index < journeyPoints.length - 1"
                ></span>
                <span
                  class="relative z-10 mt-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white shadow-sm"
                  :class="point.active ? 'bg-brand-blue' : 'bg-slate-300'"
                ></span>
              </div>

              <div class="min-w-0">
                <router-link
                  :to="{'name': 'stops/view', params: {'id': point.stop.PrimaryIdentifier}}"
                  class="block truncate text-[15px] font-extrabold leading-tight text-slate-950 sm:text-base"
                  :class="{'text-slate-600': !point.active}"
                >
                  {{ point.stop.PrimaryName }}
                </router-link>
                <div class="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span
                    v-if="stopServiceAlerts[point.stop.PrimaryIdentifier]?.closed"
                    class="rounded-md bg-red-600 px-1.5 py-0.5 text-white"
                  >
                    Stop closed
                  </span>
                  <span v-if="point.platform">
                    Platform {{ point.platform }} <span v-if="point.platformType !== 'ACTUAL'">(Est.)</span>
                  </span>
                  <span v-if="point.activity?.length == 1">
                    {{ point.activity[0] }} only
                  </span>
                  <span
                    v-if="doorSideLoading[point.stop.PrimaryIdentifier]"
                    class="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    title="Fetching door side"
                  >
                    <span class="h-2.5 w-2.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500"></span>
                    Door side
                  </span>
                  <span
                    v-else-if="doorSideByStop[point.stop.PrimaryIdentifier]"
                    class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200"
                    :title="`Doors open on the ${doorSideByStop[point.stop.PrimaryIdentifier].toLowerCase()} side`"
                  >
                    <span class="material-symbols-outlined text-[14px]">door_open</span>
                    Doors {{ doorSideByStop[point.stop.PrimaryIdentifier] }}
                  </span>
                </div>
              </div>

              <div class="min-w-[4.75rem] text-right">
                <div
                  v-if="pointCancelled(point)"
                  class="inline-flex rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white"
                >
                  Cancelled
                </div>
                <div v-else>
                  <div
                    v-if="pointSetdownOnly(point)"
                    class="text-[15px] font-bold leading-tight text-slate-400"
                  >
                    --:--
                  </div>
                  <div
                    v-else-if="point.lastOne && pointRealtimeArrivalChanged(point)"
                    class="text-[15px] font-bold leading-tight"
                  >
                    <span class="mr-1 text-xs text-slate-400 line-through">
                      {{ pretty.time(point.arrivalTime, journey.DepartureTimezone) }}
                    </span>
                    <span class="text-red-500">
                      {{ pretty.time(point.realtime.ArrivalTime, journey.DepartureTimezone) }}
                    </span>
                  </div>
                  <div
                    v-else-if="pointRealtimeDepartureChanged(point)"
                    class="text-[15px] font-bold leading-tight"
                  >
                    <span class="mr-1 text-xs text-slate-400 line-through">
                      {{ pretty.time(point.departureTime, journey.DepartureTimezone) }}
                    </span>
                    <span class="text-red-500">
                      {{ pretty.time(point.realtime.DepartureTime, journey.DepartureTimezone) }}
                    </span>
                  </div>
                  <div
                    v-else
                    class="text-[15px] font-bold leading-tight"
                    :class="(point.lastOne ? pointRealtimeArrivalSame(point) : pointRealtimeDepartureSame(point)) ? 'text-green-700' : 'text-slate-950'"
                  >
                    {{ pretty.time(point.lastOne ? point.arrivalTime : point.departureTime, journey.DepartureTimezone) }}
                  </div>
                </div>

                <div class="mt-1 text-xs text-slate-500" v-if="pointArrivalSummary(point)">
                  {{ pointArrivalSummary(point) }}
                </div>
              </div>
            </div>
          </li>
          </ol>
        </div>
      </div>

      <div v-else-if="currentTab === 'details'" class="space-y-4 p-4 sm:p-5">
        <section
          v-if="hasRailFacilities"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Facilities</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Onboard amenities and accessibility information.</p>
            </div>
            <span class="material-symbols-outlined text-[22px] text-blue-600 dark:text-blue-300">chair</span>
          </div>
          <DetailedInformationRail :journey="journey" :show-train-layout="false" />
        </section>

        <section
          v-if="hasTrainFormation"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
        >
          <div class="mb-3 flex items-start justify-between gap-3">
            <div>
              <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Train formation</h2>
              <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Coach layout, facilities by carriage, and occupancy.</p>
            </div>
            <span class="material-symbols-outlined text-[22px] text-blue-600 dark:text-blue-300">train</span>
          </div>
          <DetailedInformationRail :journey="journey" :show-facilities="false" />
        </section>

        <section
          v-if="journey?.RealtimeJourney?.Occupancy?.OccupancyAvailable"
          class="rounded-2xl border border-slate-100 bg-slate-50 p-4"
        >
          <h2 class="text-sm font-extrabold text-slate-950">Occupancy</h2>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div class="rounded-2xl bg-white p-3">
              <p class="text-xs font-semibold text-slate-500">Overall</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ pretty.occupancyDescription(journey?.RealtimeJourney?.Occupancy.TotalPercentageOccupancy) }}</p>
            </div>
            <div class="rounded-2xl bg-white p-3" v-if="journey?.RealtimeJourney?.Occupancy.SeatedInformation">
              <p class="text-xs font-semibold text-slate-500">Seats</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ journey?.RealtimeJourney?.Occupancy.SeatedOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.SeatedCapacity }}</p>
            </div>
            <div class="rounded-2xl bg-white p-3" v-if="journey?.RealtimeJourney?.Occupancy.WheelchairInformation">
              <p class="text-xs font-semibold text-slate-500">Wheelchair</p>
              <p class="mt-1 text-lg font-extrabold text-slate-950">{{ journey?.RealtimeJourney?.Occupancy.WheelchairOccupancy }} / {{ journey?.RealtimeJourney?.Occupancy.WheelchairCapacity }}</p>
            </div>
          </div>
        </section>

        <section v-if="hasDetailedRailDetails" class="space-y-3">
          <article
            v-for="(train, index) in detailedRailTrains"
            v-bind:key="train.ID || index"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {{ detailedRailTrains.length > 1 ? `Train ${index + 1}` : 'Train' }}
                </p>
                <h2 class="mt-1 text-sm font-extrabold text-slate-950 dark:text-slate-100">
                  {{ train.VehicleTypeName || train.VehicleType || 'Vehicle details' }}
                </h2>
              </div>
              <span v-if="train.ID" class="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                {{ train.ID }}
              </span>
            </div>
            <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div
                v-for="detail in trainDetailItems(train)"
                v-bind:key="detail.label"
                class="rounded-xl bg-white p-3 dark:bg-slate-900"
              >
                <dt class="font-semibold text-slate-500 dark:text-slate-400">{{ detail.label }}</dt>
                <dd class="mt-1 font-bold text-slate-950 dark:text-slate-100">{{ detail.value }}</dd>
              </div>
            </dl>
          </article>

          <article
            v-if="railServiceDetailItems.length > 0"
            class="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
          >
            <h2 class="text-sm font-extrabold text-slate-950 dark:text-slate-100">Onboard service</h2>
            <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div
                v-for="detail in railServiceDetailItems"
                v-bind:key="detail.label"
                class="rounded-xl bg-white p-3 dark:bg-slate-900"
              >
                <dt class="font-semibold text-slate-500 dark:text-slate-400">{{ detail.label }}</dt>
                <dd class="mt-1 font-bold text-slate-950 dark:text-slate-100">{{ detail.value }}</dd>
              </div>
            </dl>
          </article>
        </section>

        <section v-if="!journey?.RealtimeJourney?.Occupancy?.OccupancyAvailable && !hasDetailedRailDetails" class="rounded-2xl bg-amber-50 px-3 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
          No extra journey details are available.
        </section>
      </div>

      <div v-else class="h-[420px] overflow-hidden sm:h-[520px]">
        <mapbox-map
          accessToken="pk.eyJ1IjoiYnJpdGJ1cyIsImEiOiJjbDExNzVsOHIwajAxM2Rtc3A4ZmEzNjU2In0.B-307FL4WGtmuwEfQjabOg"
          mapStyle="mapbox://styles/britbus/cl1177uct008715o8qnee8str"
          style="height: 100%"
          :zoom="zoom"
          :center="center"
          @loaded="mapLoaded"
        >
          <div v-for="(point, index) in journeyPoints" v-bind:key="index">
            <mapbox-marker :lngLat="point.location" v-if="point.location">
              <template v-slot:icon>
                <StopIcon :stop="stopForMapIcon(point)" />
              </template>
            </mapbox-marker>

            <mapbox-geogeometry-raw :source="point.track" v-if="point.track">
              <mapbox-geogeometry-line :width="5" :color="point.active ? '#2563eb' : '#94a3b8'" />
            </mapbox-geogeometry-raw>
          </div>

          <mapbox-geogeometry-raw :source="convertTrackToFeatureCollection(journey.Track)">
            <mapbox-geogeometry-line :width="5" color="#2563eb" />
          </mapbox-geogeometry-raw>

          <mapbox-marker 
            :lngLat="journey.RealtimeJourney.VehicleLocation.coordinates"
            :rotation="journey.RealtimeJourney.VehicleBearing-90" 
            v-if="journey.RealtimeJourney && journey.RealtimeJourney.VehicleLocation?.coordinates?.length === 2"
          >
            <template v-slot:icon>
              <span class="material-symbols-outlined text-[32px] leading-none text-blue-600">
                {{ transportIcon(journey.Service?.TransportType) }}
              </span>
            </template>
          </mapbox-marker>
        </mapbox-map>
      </div>
    </section>

    <DatasourceAttributes v-if="!loadingJourney" :datasources="utils.getDatasources(journey, journeyPoints, journey?.Path)" />
  </div>
</template>

<script>
import ServiceIcon from '@/components/ServiceIcon.vue'
import StopIcon from '@/components/StopIcon.vue'
import Alert from "@/components/Alert.vue"
import DetailedInformationRail from '@/components/DetailedInformationRail.vue'
import DepartureTypeIcon from '@/components/DepartureTypeIcon.vue'
import DatasourceAttributes from "@/components/DatasourceAttributes.vue"
import EntityActionButtons from '@/components/EntityActionButtons.vue'
import IconButton from '@/components/IconButton.vue'
import LoadingState from '@/components/LoadingState.vue'
import PageHeader from '@/components/PageHeader.vue'
import TabBar from '@/components/TabBar.vue'
import ServiceAlertList from '@/components/ServiceAlertList.vue'
import axios from "axios"
import API from "@/API"
import Pretty from "@/pretty"
import Utils from '@/utils'

export default {
  data() {
    return {
      utils: Utils,
      journey: null,
      journeyPoints: null,

      serviceAlerts: [],

      stopServiceAlerts: {},
      doorSideByStop: {},
      doorSideLoading: {},

      loadingJourney: true,
      errorJourney: undefined,

      loadingRealtime: false,
      errorRealtime: undefined,

      pretty: Pretty,

      zoom: 4,
      center: [-4, 55],

      mapboxObject: undefined,
      bounds: undefined,

      refreshTimer: null,
      serviceAlertsRefreshTimer: null,

      expandInactiveStops: false,
      hasHiddenStops: false,

      currentTab: "timeline",
      tabs: [
        {
          id: "timeline",
          name: "Timeline",
          icon: 'timeline'
        },
        {
          id: "details",
          name: "Details",
          icon: 'info'
        },
        {
          id: "map",
          name: "Map",
          icon: 'map'
        },
      ]
    };
  },
  components: {
    Alert,
    ServiceIcon,
    StopIcon,
    DetailedInformationRail,
    DepartureTypeIcon,
    DatasourceAttributes,
    EntityActionButtons,
    IconButton,
    LoadingState,
    PageHeader,
    TabBar,
    ServiceAlertList
  },
  computed: {
    journeyTitle() {
      if (this.journey?.DestinationDisplay) {
        return this.journey.DestinationDisplay
      }

      return this.journeyPoints?.[this.journeyPoints.length - 1]?.stop?.PrimaryName || 'Journey'
    },
    journeyHeaderTitle() {
      const origin = this.journeyPoints?.[0]?.stop?.PrimaryName
      const destination = this.journeyTitle

      return origin && destination ? `${origin} → ${destination}` : destination
    },
    journeySubtitle() {
      const origin = this.journeyPoints?.[0]?.stop?.PrimaryName
      const destination = this.journeyPoints?.[this.journeyPoints.length - 1]?.stop?.PrimaryName

      if (origin && destination) {
        return `${origin} to ${destination}`
      }

      return 'Live journey information'
    },
    journeyStatus() {
      if (this.journey?.RealtimeJourney?.Cancelled) {
        return {
          label: 'Cancelled',
          classes: 'bg-red-50 text-red-700'
        }
      }

      if (this.journey?.RealtimeJourney?.ActivelyTracked) {
        return {
          label: 'Live',
          classes: 'bg-green-50 text-green-700'
        }
      }

      return {
        label: 'Scheduled',
        classes: 'bg-slate-100 text-slate-600'
      }
    },
    detailedRailInfo() {
      return this.journey?.RealtimeJourney?.DetailedRailInformation ||
        this.journey?.DetailedRailInformation ||
        {}
    },
    detailedRailTrains() {
      return [...(this.detailedRailInfo.Trains || [])].sort((first, second) => {
        return (first.Position || first.AllocationSequence || 0) -
          (second.Position || second.AllocationSequence || 0)
      })
    },
    detailedRailCarriages() {
      return this.detailedRailTrains.flatMap(train => train.Carriages || [])
    },
    detailedRailPassengerCarriages() {
      return this.detailedRailCarriages.filter(carriage => !this.isPowerCarriage(carriage))
    },
    detailedRailPassengerCarriageCount() {
      return this.detailedRailTrains.reduce((total, train) => {
        return total + this.trainPassengerCarriageCount(train)
      }, 0)
    },
    hasDetailedRailFacilityPills() {
      const trainFacilityKeys = [
        'AirConditioning',
        'WiFi',
        'PowerPlugs',
        'USBPlugs',
        'BicycleSpaces',
        'DisabledAccess',
        'Toilets'
      ]

      return this.detailedRailInfo.CateringAvailable ||
        this.detailedRailTrains.some(train => trainFacilityKeys.some(key => Boolean(train[key])))
    },
    railSeatingClasses() {
      const classes = [
        ...(this.detailedRailInfo.Seating || []),
        ...this.detailedRailPassengerCarriages.flatMap(carriage => carriage.SeatingClasses || [])
      ]

      return [...new Set(classes.filter(value => value && value.toLowerCase() !== 'unknown'))]
    },
    railServiceDetailItems() {
      const details = []

      if (this.railSeatingClasses.length > 0) {
        details.push({ label: 'Seating', value: this.railSeatingClasses.join(' and ') })
      }

      if (this.detailedRailInfo.SleeperAvailable) {
        const sleeperClasses = (this.detailedRailInfo.Sleepers || []).filter(value => value && value !== 'Unknown')
        details.push({
          label: 'Sleeper',
          value: sleeperClasses.length > 0 ? sleeperClasses.join(' and ') : 'Available'
        })
      }

      if (this.detailedRailInfo.CateringAvailable) {
        details.push({
          label: 'Catering',
          value: this.detailedRailInfo.CateringDescription || 'Available'
        })
      }

      if (this.detailedRailInfo.ReservationRequired || this.detailedRailInfo.ReservationRecommended) {
        details.push({
          label: 'Seat reservation',
          value: this.detailedRailInfo.ReservationRequired ? 'Required' : 'Recommended'
        })
      }

      if (this.detailedRailInfo.ReservationBikeRequired) {
        details.push({ label: 'Bike reservation', value: 'Required' })
      }

      return details
    },
    hasDetailedRailDetails() {
      return this.detailedRailTrains.length > 0 || this.railServiceDetailItems.length > 0
    },
    hasRailFacilities() {
      return Boolean(this.detailedRailInfo.ReplacementBus || this.hasDetailedRailFacilityPills)
    },
    hasTrainFormation() {
      return this.detailedRailTrains.length > 0 || this.detailedRailCarriages.length > 0
    },
    railOverviewItems() {
      const items = []
      const facilityKeys = [
        'AirConditioning',
        'WiFi',
        'PowerPlugs',
        'USBPlugs',
        'BicycleSpaces',
        'DisabledAccess',
        'Toilets'
      ]
      const facilityCount = facilityKeys.filter(key => this.detailedRailTrains.some(train => Boolean(train[key]))).length +
        (this.detailedRailInfo.CateringAvailable ? 1 : 0)

      if (this.detailedRailInfo.ReplacementBus) {
        items.push({ icon: 'directions_bus', label: 'Rail replacement bus' })
      }

      if (this.detailedRailPassengerCarriageCount > 0) {
        items.push({
          icon: 'train',
          label: this.formatCoachCount(this.detailedRailPassengerCarriageCount)
        })
      }

      if (facilityCount > 0) {
        items.push({ icon: 'verified', label: `${facilityCount} onboard amenit${facilityCount === 1 ? 'y' : 'ies'}` })
      }

      if (this.detailedRailInfo.ReservationRequired || this.detailedRailInfo.ReservationRecommended) {
        items.push({
          icon: 'event_seat',
          label: this.detailedRailInfo.ReservationRequired ? 'Seat reservation required' : 'Seat reservation recommended'
        })
      }

      return items.slice(0, 3)
    },
    headerRailOverviewItem() {
      return this.railOverviewItems.find(item => item.icon === 'train') || this.railOverviewItems[0] || null
    },
    nextJourneyPoint() {
      return (this.journeyPoints || []).find(point => point.active) || this.journeyPoints?.[0]
    },
    showDetailedInformationRail() {
      if (this.journey?.RealtimeJourney?.Cancelled) {
        return false
      }

      return Boolean(
        this.detailedRailInfo.ReplacementBus ||
        this.detailedRailTrains.length > 0 ||
        this.hasDetailedRailFacilityPills ||
        this.detailedRailCarriages.length > 0
      )
    },
    journeyStopOptions() {
      const seenStops = new Set()

      return (this.journeyPoints || [])
        .filter(point => point.stop?.PrimaryIdentifier)
        .filter(point => {
          if (seenStops.has(point.stop.PrimaryIdentifier)) {
            return false
          }

          seenStops.add(point.stop.PrimaryIdentifier)
          return true
        })
        .map(point => ({
          value: point.stop.PrimaryIdentifier,
          label: point.stop.PrimaryName || point.stop.PrimaryIdentifier
        }))
    },
    journeyNotificationTypes() {
      return [
        {
          id: 'journey',
          label: 'Journey',
          icon: 'route',
          fields: [
            {
              id: 'journeyEvents',
              label: 'Journey changes',
              type: 'multi-select',
              placeholder: 'Select journey changes',
              allSelectedLabel: 'All journey changes',
              description: 'Choose which scheduled journey changes should trigger this notification.',
              options: [
                { value: 'JourneyRemoved', label: 'Removed' },
                { value: 'JourneyEdited', label: 'Edited' }
              ]
            }
          ]
        },
        {
          id: 'realtime-journey',
          label: 'Realtime journey',
          icon: 'directions',
          fields: [
            {
              id: 'realtimeJourneyEvents',
              label: 'Realtime journey changes',
              type: 'multi-select',
              placeholder: 'Select realtime changes',
              selectAll: false,
              description: 'Choose which live journey changes should trigger this notification.',
              options: [
                { value: 'RealtimeJourneyCreated', label: 'Created', exclusiveGroup: 'general' },
                { value: 'RealtimeJourneyActivelyTracked', label: 'Actively tracked', exclusiveGroup: 'general' },
                { value: 'RealtimeJourneyPlatformSet', label: 'Platform set', exclusiveGroup: 'platform' },
                { value: 'RealtimeJourneyPlatformChanged', label: 'Platform changed', exclusiveGroup: 'platform' },
                { value: 'RealtimeJourneyCancelled', label: 'Cancelled', exclusiveGroup: 'general' },
                { value: 'RealtimeJourneyLocationTextChanged', label: 'Location text changed', exclusiveGroup: 'general' },
                { value: 'RealtimeJourneyNextStopChanged', label: 'Next stop changed', exclusiveGroup: 'general' }
              ]
            },
            {
              id: 'platformStopRefs',
              label: 'Stops for platform alerts',
              type: 'multi-select',
              placeholder: 'Select stops',
              allSelectedLabel: 'All stops',
              description: 'Required when platform set or platform changed is selected.',
              visibleWhen: {
                fieldId: 'realtimeJourneyEvents',
                includesAny: ['RealtimeJourneyPlatformSet', 'RealtimeJourneyPlatformChanged']
              },
              options: this.journeyStopOptions
            }
          ]
        }
      ]
    }
  },
  methods: {
    stopForMapIcon(point) {
      const services = point?.stop?.Services

      return {
        ...point?.stop,
        Services: Array.isArray(services) && services.length > 0
          ? services
          : this.journey?.Service ? [this.journey.Service] : []
      }
    },
    transportIcon(type) {
      return {
        Rail: 'train',
        Train: 'train',
        Bus: 'directions_bus',
        Coach: 'airport_shuttle',
        Tram: 'tram',
        Metro: 'subway',
        Ferry: 'directions_boat',
        Air: 'flight'
      }[type] || 'directions'
    },
    trainDetailItems(train) {
      const details = []
      const carriageCount = this.trainPassengerCarriageCount(train)

      if (carriageCount > 0) {
        details.push({
          label: 'Formation',
          value: this.formatCoachCount(carriageCount)
        })
      }

      if (train.PowerType) {
        details.push({ label: 'Power', value: train.PowerType })
      }

      if (train.SpeedKMH > 0) {
        details.push({ label: 'Top speed', value: `${train.SpeedKMH} km/h` })
      }

      if (train.FleetID) {
        details.push({ label: 'Fleet', value: train.FleetID })
      }

      if (train.ResourceGroupType) {
        details.push({ label: 'Resource group', value: train.ResourceGroupType })
      }

      if (train.ResourceGroupStatus) {
        details.push({ label: 'Resource status', value: train.ResourceGroupStatus })
      }

      return details
    },
    normaliseVehicleRole(value) {
      return String(value || '').trim().toLowerCase().replace(/[\s_-]/g, '')
    },
    isPowerCarriage(carriage) {
      return this.normaliseVehicleRole(carriage?.VehicleRole) === 'powercar'
    },
    trainPassengerCarriageCount(train) {
      if (train?.TrainLength > 0) {
        return train.TrainLength
      }

      return (train?.Carriages || []).filter(carriage => !this.isPowerCarriage(carriage)).length
    },
    formatCoachCount(count) {
      return `${count} coach${count === 1 ? '' : 'es'}`
    },
    pointCancelled(point) {
      return point.realtime && point.realtime.Cancelled
    },
    pointSetdownOnly(point) {
      return point.activity?.length == 1 && point.activity[0] == 'Setdown' && !point?.lastOne
    },
    pointRealtimeDepartureChanged(point) {
      return point.realtime &&
        this.pretty.time(point.departureTime, this.journey.DepartureTimezone) !== this.pretty.time(point.realtime.DepartureTime, this.journey.DepartureTimezone) &&
        point.realtime.DepartureTime !== '0001-01-01T00:00:00Z'
    },
    pointRealtimeDepartureSame(point) {
      return point.realtime &&
        this.pretty.time(point.departureTime, this.journey.DepartureTimezone) === this.pretty.time(point.realtime.DepartureTime, this.journey.DepartureTimezone)
    },
    pointRealtimeArrivalChanged(point) {
      return point.realtime &&
        point.realtime.ArrivalTime &&
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) !== this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone) &&
        point.realtime.ArrivalTime !== '0001-01-01T00:00:00Z'
    },
    pointRealtimeArrivalSame(point) {
      return point.lastOne &&
        point.realtime &&
        point.realtime.ArrivalTime &&
        point.realtime.ArrivalTime !== '0001-01-01T00:00:00Z' &&
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) === this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone)
    },
    pointArrivalSummary(point) {
      if (
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) === this.pretty.time(point.departureTime, this.journey.DepartureTimezone) ||
        point.arrivalTime == null ||
        this.pointCancelled(point)
      ) {
        return ''
      }

      if (
        point.realtime &&
        this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone) !== this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone) &&
        point.realtime.ArrivalTime !== '0001-01-01T00:00:00Z'
      ) {
        return `Arrives ${this.pretty.time(point.realtime.ArrivalTime, this.journey.DepartureTimezone)}`
      }

      return `Arrives ${this.pretty.time(point.arrivalTime, this.journey.DepartureTimezone)}`
    },
    mapLoaded(map) {
      this.mapboxObject = map

      map.resize()

      this.setBounds()
    },
    setBounds() {
      if (this.mapboxObject !== undefined && this.bounds === undefined && this.journey !== undefined) {
        let northeastern = [999999, 999999]
        let southwestern = [-999999, -999999]

        const boundingBoxPadding = 0.015

        for (let index = 0; index < this.journeyPoints.length; index++) {
          const element = this.journeyPoints[index]
          const cords = element.stop.Location.coordinates

          if (cords[0] < northeastern[0]) {
            northeastern[0] = cords[0] - boundingBoxPadding
          }
          if (cords[1] < northeastern[1]) {
            northeastern[1] = cords[1] - boundingBoxPadding
          }

          if (cords[0] > southwestern[0]) {
            southwestern[0] = cords[0] + boundingBoxPadding
          }
          if (cords[1] > southwestern[1]) {
            southwestern[1] = cords[1] + boundingBoxPadding
          }
        }
        this.bounds = [
          southwestern,
          northeastern
        ]
        
        this.mapboxObject.fitBounds(this.bounds)
      }
    },
    getData() {
      this.getJourney()
      this.getServiceAlerts()
    },
    getJourney() {
      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}`)
        .then((response) => {
          let newJourney = response.data

          this.journeyPoints = this.extractJourneyPoints(newJourney)

          this.journey = newJourney

          this.setBounds()

          this.getStopAlerts()
          this.getDoorSides()
        })
        .catch((error) => {
          console.log(error)
          this.errorJourney = error
        })
        .finally(() => (this.loadingJourney = false))
    },
    getStopAlerts() {
      if (this.journey == null) {
        return
      }

      for (let i = 0; i < this.journeyPoints.length; i++) {
        const journeyPoint = this.journeyPoints[i]

        axios
          .get(`${API.URL}/core/service_alerts/matching/${journeyPoint.stop.PrimaryIdentifier}`)
          .then(response => {
            if (response.data !== null) {
              for (let index = 0; index < response.data.length; index++) {
                const serviceAlert = response.data[index];
                
                if (serviceAlert.AlertType == "StopClosed") {
                  this.stopServiceAlerts[journeyPoint.stop.PrimaryIdentifier] = {closed: true}
                }
              }
            }
          })
          .catch(error => {
            console.log(error)
          })
      }
    },
    getDoorSides() {
      if (this.journey == null || this.journey?.Service?.TransportType === 'Bus') {
        return
      }

      this.doorSideByStop = {}
      this.doorSideLoading = {}

      const requestedStops = new Set()

      for (const [index, journeyPoint] of (this.journeyPoints || []).entries()) {
        const stopIdentifier = journeyPoint.stop?.PrimaryIdentifier

        // Doors do not open at the initial origin stop. Past and cancelled stops are also skipped.
        if (index === 0 || !journeyPoint.active || this.pointCancelled(journeyPoint) || !stopIdentifier || requestedStops.has(stopIdentifier)) {
          continue
        }

        requestedStops.add(stopIdentifier)
        this.doorSideLoading[stopIdentifier] = true

        axios
          .get(`${API.URL}/core/journeys/${this.$route.params.id}/stops/${stopIdentifier}/door-side`)
          .then(response => {
            const data = response.data
            const doorSide = typeof data === 'string'
              ? data
              : data?.DoorSide || data?.doorSide || data?.Side || data?.side || data?.door_side

            if (doorSide && String(doorSide).trim().toLowerCase() !== 'unknown') {
              this.doorSideByStop[stopIdentifier] = String(doorSide).trim()
            }
          })
          .catch(error => {
            // Door-side information is optional; an individual failure should not affect other stops.
            console.log(error)
          })
          .finally(() => {
            this.doorSideLoading[stopIdentifier] = false
          })
      }
    },
    getRealtimeJourney() {
      if (this.journey == null) {
        return
      }

      if (this.loadingRealtime) {
        return
      }

      this.loadingRealtime = true

      axios
        .get(`${API.URL}/core/journeys/${this.$route.params.id}?realtime_only=true`)
        .then((response) => {
          let newRealtimeJourney = response.data

          this.journey.RealtimeJourney = newRealtimeJourney

          this.journeyPoints = this.extractJourneyPoints(this.journey)

          this.setBounds()
        })
        .catch((error) => {
          console.log(error)
          this.errorRealtime = error
        })
        .finally(() => (this.loadingRealtime = false))
    },
    convertTrackToFeatureCollection(track) {
      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              stroke: "#545454",
              "stroke-width": 9.6,
              "stroke-opacity": 1,
            },
            geometry: {
              type: "LineString",
              coordinates: track.map((x) => x.coordinates),
            },
          },
        ],
      }
    },
    getRealtimeForStop(realtimeUpdates, stop, journeyStopIndex, journey) {
      if(realtimeUpdates === undefined || realtimeUpdates === null) {
        return undefined
      }

      const stopIdentifiers = new Set([
        stop?.PrimaryIdentifier,
        ...(stop?.OtherIdentifiers || []),
      ].filter(Boolean))

      const journeyStopRefs = journey?.Path?.length
        ? [journey.Path[0].OriginStopRef, ...journey.Path.map((path) => path.DestinationStopRef)]
        : []
      const matchingJourneyStopIndexes = journeyStopRefs
        .map((stopRef, index) => stopIdentifiers.has(stopRef) ? index : -1)
        .filter((index) => index !== -1)
      const legacyOccurrenceMatches = matchingJourneyStopIndexes.length <= 1 || matchingJourneyStopIndexes[0] === journeyStopIndex

      for (const [key, value] of Object.entries(realtimeUpdates)) {
        const stopRef = value?.StopRef || key
        const occurrenceMatches = value?.JourneyStopIndex === undefined
          ? legacyOccurrenceMatches
          : value.JourneyStopIndex === journeyStopIndex

        if (occurrenceMatches && (stopIdentifiers.has(stopRef) || stopIdentifiers.has(key))) {
          return value
        }
      }

      return undefined
    },
    extractJourneyPoints(journey) {
      let journeyPoints = []

      for (let index = 0; index < journey.Path.length; index++) {
        const element = journey.Path[index]

        let track = this.convertTrackToFeatureCollection(element.Track)

        let platform = element.OriginPlatform
        let platformType = 'ESTIMATED'

        let realtimeStop = this.getRealtimeForStop(journey.RealtimeJourney?.Stops, element.OriginStop, index, journey)

        if (realtimeStop?.Platform !== "" && realtimeStop?.Platform !== undefined) {
          platform = realtimeStop?.Platform
          platformType = 'ACTUAL'
        }

        if (element.OriginStop == null) {
          journeyPoints.push({
            stop: {
              "PrimaryIdentifier": element.OriginStopRef,
              "PrimaryName": "UNKNOWN STOP",
              "OtherIdentifiers": [],
            },
            datasource: null,
            location: null,
            arrivalTime: element.OriginArrivalTime,
            departureTime: element.OriginDepartureTime,
            activity: element.OriginActivity,
            track: null,
            realtime: null,
            platform: "",
            platformType: "",
          })

          continue
        }

        journeyPoints.push({
          stop: element.OriginStop,
          datasource: element.OriginStop.DataSource,
          location: element.OriginStop.Location.coordinates,
          arrivalTime: element.OriginArrivalTime,
          departureTime: element.OriginDepartureTime,
          activity: element.OriginActivity,
          track: track,
          realtime: realtimeStop,
          platform: platform,
          platformType: platformType,
        })

        // TODO: is it possible for the path to be broken? eg originstop != last departure stop

        // if last one in list then append the destination stop
        if (index === journey.Path.length - 1) {
          let platform = element.DestinationPlatform
          let platformType = 'ESTIMATED'

          const destinationStopIndex = journey.Path.length
          let realtimeStop = this.getRealtimeForStop(journey.RealtimeJourney?.Stops, element.DestinationStop, destinationStopIndex, journey)

          if (realtimeStop?.Platform !== "") {
            platform = realtimeStop?.Platform
            platformType = 'ACTUAL'
          }
          let destinationArrivalTime = element.DestinationArrivalTime
          if (destinationArrivalTime == "0001-01-01T00:00:00Z" && realtimeStop !== undefined) {
            destinationArrivalTime = realtimeStop.ArrivalTime || realtimeStop.DepartureTime
          }

          journeyPoints.push({
            stop: element.DestinationStop,
            datasource: element.DestinationStop.DataSource,
            arrivalTime: destinationArrivalTime,
            location: element.DestinationStop.Location.coordinates,
            departureTime: destinationArrivalTime,
            activity: element.DestinationActivity,
            track: null,
            realtime: realtimeStop,
            platform: platform,
            platformType: platformType,
            lastOne: true
          })
        }
      }

      let activeStop = journey.RealtimeJourney == undefined || journey.RealtimeJourney?.NextStopRef == ""

      let activeStopIndex = -1
      if (!activeStop) {
        const nextStopIndex = journey.RealtimeJourney.NextStopIndex
        if (Number.isInteger(nextStopIndex) && nextStopIndex > 0 && nextStopIndex < journeyPoints.length) {
          activeStopIndex = nextStopIndex
        } else {
          activeStopIndex = journeyPoints.findIndex((point) => (
            point.realtime?.TimeType === 'EstimatedFuture' &&
            (
              journey.RealtimeJourney.NextStopRef === point.stop.PrimaryIdentifier ||
              point.stop.OtherIdentifiers.includes(journey.RealtimeJourney.NextStopRef)
            )
          ))
        }
      }

      if (!activeStop) {
        this.hasHiddenStops = true
      }

      for (let index = 0; index < journeyPoints.length; index++) {
        if (
          !activeStop &&
          journey.RealtimeJourney != undefined &&
          (index === activeStopIndex || (activeStopIndex === -1 &&
          (
            journey.RealtimeJourney.NextStopRef === journeyPoints[index].stop.PrimaryIdentifier
            || journeyPoints[index].stop.OtherIdentifiers.includes(journey.RealtimeJourney.NextStopRef)
          )))
        ) {
          activeStop = true
        }

        journeyPoints[index]["active"] = activeStop
      }

      return journeyPoints
    },
    getServiceAlerts() {
      // TODO get correct date - this might be wrong when looking at future journey or on journeys that span 2 days
      let yourDate = new Date()
      const offset = yourDate.getTimezoneOffset()
      yourDate = new Date(yourDate.getTime() - (offset*60*1000))
      let journeyRunDate = yourDate.toISOString().split('T')[0]

      let dayinstanceof = 'DAYINSTANCEOF:' + journeyRunDate + ':' + this.$route.params.id
      axios
        .get(`${API.URL}/core/service_alerts/matching/${this.$route.params.id},${dayinstanceof}`)
        .then(response => {
          this.serviceAlerts = response.data
        })
        .catch(error => {
          console.log(error)
          // this.error = error
        })
    },
    changeTab(newTab) {
      this.currentTab = newTab
    },
    showStop(index) {
      return this.journeyPoints[index]["active"] || this.expandInactiveStops
    },
    toggleInactiveStops() {
      this.expandInactiveStops = !this.expandInactiveStops
    },
  },
  mounted() {
    this.getData();
    this.refreshTimer = setInterval(this.getRealtimeJourney, 10000)
    this.serviceAlertsRefreshTimer = setInterval(this.getServiceAlerts, 60000)
  },
  beforeRouteLeave() {
    clearInterval(this.refreshTimer)
    clearInterval(this.serviceAlertsRefreshTimer)
  },
};
</script>
