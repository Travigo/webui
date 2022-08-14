<template>
   <div class="max-w-7xl mx-auto dark:text-gray-200">
      <div class="rounded-lg bg-white shadow-md p-6 border border-gray-200 dark:bg-gray-800 dark:border-gray-600">
        <PageTitle v-if="hasTitleSlot" paddingStyle="pb-4">
          <slot name="title"></slot>
        </PageTitle>
        <slot></slot>
      </div>
    </div>
</template>

<script>
import PageTitle from '@/components/PageTitle.vue'

export default {
  components: {
    PageTitle
  },
  computed: {
    hasTitleSlot() {
      return !!this.$slots.title
    }
  }
}
</script>
