<template>
  <div class="ui-page ui-page-stack">
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
