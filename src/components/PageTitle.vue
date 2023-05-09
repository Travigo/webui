<template>
   <div class="max-w-7xl mx-auto" :class="paddingStyle">
    <h1 class="text-2xl font-bold leading-tight text-gray-900 dark:text-gray-200">
      <slot></slot>
    </h1>
  </div>
</template>

<script>
export default {
  props: {
    paddingStyle: {
      type: String,
      default: 'py-2 md:py-4 lg:py-6'
    }
  },
  setup() {
    
  },
}
</script>