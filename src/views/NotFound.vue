<template>
  <div class="pb-16 pt-3 sm:pb-20 sm:pt-4">
    <ErrorState
      icon="travel_explore"
      title="Page not found"
      message="This page is not available. Return home to continue searching stops, journeys, and transport data."
      :action-to="{ name: 'home' }"
    />
  </div>
</template>

<script>
import ErrorState from '@/components/ErrorState.vue'

export default {
  name: 'NotFound',
  components: { ErrorState }
}
</script>
