<template>
   <div class="flex flex-col justify-center px-4 py-4 bg-white border shadow-md border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-600">
      <p class="text-3xl font-semibold text-left text-gray-800 dark:text-gray-200">
        {{ value || "--" }}
      </p>
      <p class="text-lg text-left text-gray-500">
        {{ title }}
      </p>
    </div>
</template>

<script>
export default {
  props: {
    title: {},
    value: {}
  }
}
</script>
