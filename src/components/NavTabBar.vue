<template>
  <ul class="flex flex-wrap -mb-px">
    <li 
      class="mr-2"
      v-for="tab in this.tabs"
      v-bind:key="tab.id"
    >
      <a
        @click="changeTab(tab.id)" 
        class="cursor-pointer inline-block py-4 px-4 text-sm font-medium text-center rounded-t-lg border-b-2 border-transparent text-gray-500 hover:text-gray-600 hover:border-gray-300"
        v-bind:class="{'text-blue-600 border-blue-600 hover:text-blue-600 hover:border-blue-600 active': this.currentTab == tab.id}"
      >
        {{ tab.name }}
      </a>
    </li>
  </ul>
</template>

<script>
export default {
  props: {
    tabs: {},
    currentTab: {},
    changeTab: {}
  }
}
</script>
