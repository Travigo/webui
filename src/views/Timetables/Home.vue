<template>
  <div class="ui-page ui-page-stack">
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
