<template>
  <div class="text-gray-400 dark:text-gray-500 text-center text-sm mt-3">
    Data provided by: 
    <span
      v-for="(datasource, i) in datasources"
      v-bind:key="datasource.DatasetID"
      class="py-2"
    >
      <span v-if="i !== 0">, </span>
      <router-link :to="{'name': 'datasets/view', params: {'id': datasource.DatasetID}}" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
        {{ datasource.Provider }}
      </router-link>
    </span>
  </div>
</template>

<script>
export default {
  props: {
    datasources: {
      default: []
    }
  },
}
</script>
