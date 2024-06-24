<template>
  <a class="material-symbols-outlined text-base bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded-lg inline-block align-middle mr-1">
    <span v-if="this.loading">cloud_sync</span><span v-else>sync</span>
  </a>
</template>

<script>
export default {
 props: {
   loading: {}
 }
}
</script>
