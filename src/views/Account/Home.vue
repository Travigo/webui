<template>
  <div class="space-y-4 pt-3 sm:pt-4">
    <PageHeader
      eyebrow="Account"
      title="Account"
      subtitle="Account features will appear here as they are connected."
      icon="person"
      variant="panel"
    />
  </div>
</template>

<script>
import PageHeader from '@/components/PageHeader.vue'

export default {
  name: 'AccountHome',
  components: {
    PageHeader
  }
}
</script>
