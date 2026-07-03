<template>
  <div class="space-y-4 pb-16 pt-3 sm:space-y-5 sm:pb-20 sm:pt-4">
    <PageHeader
      title="Statistics"
      subtitle="Performance and reliability insights for public transport."
      icon="monitoring"
      variant="panel"
    />

    <Notice type="warning" title="Coming soon">
      <p class="leading-relaxed">
        Here you will be able to see statistics on how on-time bus services &amp; operators really are based on previously recorded bus journeys.
      </p>
    </Notice>
  </div>
</template>

<script>
import Notice from '@/components/Notice.vue'
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'StatisticsHome',
  components: {
    Notice,
    PageHeader,
  },
}
</script>
