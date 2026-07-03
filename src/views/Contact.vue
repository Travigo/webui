<script setup>
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'
</script>

<template>
  <div class="space-y-4 pb-16 pt-3 sm:space-y-5 sm:pb-20 sm:pt-4">
    <PageHeader
      title="Contact us"
      subtitle="Get in touch about Travigo."
      icon="mail"
      variant="panel"
    />

    <Panel padded>
      You can contact me by email at <a href="mailto:aaron@travigo.app" class="underline text-blue-600 hover:text-blue-800 visited:text-purple-600">
        aaron@travigo.app
      </a>
    </Panel>
  </div>
</template>
