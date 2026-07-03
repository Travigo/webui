<script setup>
import PageHeader from '@/components/PageHeader.vue'
import Notice from '@/components/Notice.vue'
import Panel from '@/components/Panel.vue'
</script>

<template>
  <div class="space-y-4 pb-16 pt-3 sm:space-y-5 sm:pb-20 sm:pt-4">
    <PageHeader
      title="Frequently asked questions"
      subtitle="Answers to common questions will appear here."
      icon="quiz"
      variant="panel"
    />

    <Panel padded>
      <Notice type="neutral" icon="">
        No frequently asked questions are published yet.
      </Notice>
    </Panel>
  </div>
</template>
