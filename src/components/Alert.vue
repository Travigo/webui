<template>
  <div class="p-4 text-sm" v-bind:class="typeClasses[type]">
    <slot></slot>
  </div>
</template>

<script>
export default {
  props: {
    type: {
      default: 'info'
    }
  },
  data () {
    return {
      typeClasses: {
        'info': 'text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800',
        'success': 'text-green-700 bg-green-100 rounded-lg dark:bg-green-200 dark:text-green-800',
        'warning': 'text-yellow-700 bg-yellow-100 rounded-lg dark:bg-yellow-200 dark:text-yellow-800',
        'error': 'text-red-700 bg-red-100 rounded-lg dark:bg-red-200 dark:text-red-800'
      }
    }
  }
}
</script>
