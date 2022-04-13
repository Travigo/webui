<script setup>
import PageTitle from '@/components/PageTitle.vue'
import Card from '@/components/Card.vue'
</script>

<template>
  <div>
    <PageTitle>
      About
    </PageTitle>
    <Card>
      BritBus is an app that uses open datasets to provide realtime &amp; up to date information on bus transport within Great Britain.
    </Card>
    <PageTitle>
      Datasets Used
    </PageTitle>
    <Card>
      <div>
        <h3 class="text-xl font-bold">Bus Open Data Service</h3>

        <div class="mt-1">
          <span class="font-bold">Source: </span>
          <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://data.bus-data.dft.gov.uk/">https://data.bus-data.dft.gov.uk/</a>
        </div>

        <div>
          <span class="font-bold">Provider: </span>
          UK Department of Transport
        </div>

        <div class="mt-3">
          The Bus Open Data Service (BODS) is a UK Department of Transport ran service that provides bus timetable and realtime vehicle location data for all of England EXCEPT London (legal requirement for operators) and for some of Wales & Scotland (not a legal requirement)
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-xl font-bold">National Public Transport Access Nodes (NaPTAN)</h3>

        <div class="mt-1">
          <span class="font-bold">Source: </span>
          <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://beta-naptan.dft.gov.uk/">https://beta-naptan.dft.gov.uk/</a>
        </div>

        <div>
          <span class="font-bold">Provider: </span>
          UK Department of Transport
        </div>

        <div class="mt-3">
          The National Public Transport Access Nodes (NaPTAN) dataset is provided by the UK Department of Transport and provides the details &amp; location of all public transport stops (bus stops, rail stations, coach stations, taxi ranks, etc) in Great Britain.
        </div>
      </div>

      <div class="mt-6">
        <h3 class="text-xl font-bold">Traveline</h3>

        <div class="mt-1">
          <span class="font-bold">Source: </span>
          <a class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600" href="https://www.travelinedata.org.uk/">https://www.travelinedata.org.uk/</a>
        </div>

        <div>
          <span class="font-bold">Provider: </span>
          Traveline Information Ltd
        </div>

        <div class="mt-4">
          Traveline provides the NOC (National Operator Code) database which is used for Operator &amp; Operator Groups details.
        </div>
      </div>
    </Card>
  </div>
</template>
