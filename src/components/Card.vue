<template>
   <div class="max-w-7xl mx-auto">
      <div class="rounded-lg bg-white shadow-md p-6 border border-gray-200">
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
