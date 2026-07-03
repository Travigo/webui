<template>
  <div class="space-y-4 pb-16 pt-3 sm:space-y-5 sm:pb-20 sm:pt-4">
    <PageHeader
      title="Timetables"
      subtitle="Scheduled transport service timings."
      icon="schedule"
      variant="panel"
    />

    <Notice type="warning" title="Coming soon">
      <p class="leading-relaxed">
        Here you will be able to see scheduled timings for transport services.
      </p>
    </Notice>
  </div>
</template>

<script>
import Notice from '@/components/Notice.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'TimetablesHome',
  components: {
    Notice,
    PageHeader,
  },
}
</script>
