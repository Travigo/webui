<template>
  <Notice :type="type">
    <slot></slot>
  </Notice>
</template>

<script>
import Notice from '@/components/Notice.vue'

export default {
  name: 'Alert',
  components: {
    Notice
  },
  props: {
    type: {
      type: String,
      default: 'info'
    }
  }
}
</script>
