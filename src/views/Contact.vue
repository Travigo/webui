<script setup>
import PageHeader from '@/components/PageHeader.vue'
import Panel from '@/components/Panel.vue'
</script>

<template>
  <div class="ui-page ui-page-stack">
    <PageHeader
      title="Contact us"
      subtitle="Get in touch about Travigo."
      icon="mail"
      variant="panel"
    />

    <Panel padded>
      You can contact me by email at <a href="mailto:aaron@travigo.app" class="underline text-brand-blue hover:text-brand-blue-dark visited:text-purple-600">
        aaron@travigo.app
      </a>
    </Panel>
  </div>
</template>
