<template>
   <div class="max-w-7xl mx-auto">
      <div class="rounded-md bg-white shadow p-6">
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
