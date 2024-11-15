<template>
  <a 
    class="cursor-pointer material-symbols-outlined text-base bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500 px-2 py-1 rounded-lg inline-block align-middle mr-1"
    @click="share"
  >
    <span>ios_share</span>
  </a>
</template>

<script>
export default {
  props: {

  },
  methods: {
    share() {
      navigator.clipboard.writeText(window.location.href)
    }
  }
}
</script>
