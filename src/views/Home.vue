<script setup>
import ButtonRepo from '@/components/ButtonRepo.vue'
import Card from '@/components/Card.vue'
</script>

<template>
  <Card class="m-4">
    <h1 class="text-3xl font-bold leading-tight text-gray-900 mb-4">
      Welcome
    </h1>

    <p>
      BritBus is an app that provide realtime &amp; up to date information on bus transport within Great Britain.
    </p>

    <p class="pt-4">
      It is currently in a beta state with only limited functionality, but you can visit the <b>Map</b> using the navigation menu above, select a bus stop and view upcoming scheduled buses &amp; realtime tracked buses with accurate estimated arrivals. Or visit <b>Operators</b> for a list of all bus operators.
    </p>

    <p class="pt-4">
      <h1 class="text-xl font-bold">
        Current Status
      </h1>

      <div class="mt-2">
        Implemented:

        <ul class="list-disc pl-5">
          <li>Import bus stops &amp; bus stop groups</li>
          <li>Import bus operators &amp; operator groups</li>
          <li>Import bus lines</li>
          <li>Import bus timetables</li>
          <li>Endpoint for providing timetable for a given stop on each day</li>
          <li>Calculate realtime bus progress and stop estimates using BODS SIRI-VM</li>
        </ul>
      </div>

      <div class="mt-5">
        The following are in the TODO list:

        <ul class="list-disc pl-5">
          <li>Import bus lines from TfL API</li>
          <li>Import bus lines from TfE API</li>
          <li>Calculate realtime bus progress and stop estimates using TfL API</li>
          <li>Calculate realtime bus progress and stop estimates using TfE API</li>
          <li>Import fares</li>
          <li>Historical bus reliability analysis</li>
          <li>Subscribe to changes in a bus line</li>
          <li>Highlight potential disruptions on the service or area</li>
          <li>Nicer user interface</li>
        </ul>
      </div>
    </p>
  </Card>
</template>
