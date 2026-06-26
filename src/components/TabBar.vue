<template>
  <div
    class="grid divide-x divide-slate-100 dark:divide-slate-800"
    :style="gridStyle"
  >
    <button
      type="button"
      v-for="tab in tabs"
      v-bind:key="tab.id"
      class="relative flex h-12 items-center justify-center gap-1.5 text-xs font-bold text-slate-500 transition sm:text-sm dark:text-slate-400"
      :class="{'text-blue-600 dark:text-blue-300': modelValue === tab.id}"
      @click="$emit('update:modelValue', tab.id)"
    >
      <span v-if="tab.icon" class="material-symbols-outlined text-[20px]">{{ tab.icon }}</span>
      <span>{{ tab.name }}</span>
      <span
        class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-300"
        v-if="modelValue === tab.id"
      />
    </button>
  </div>
</template>

<script>
export default {
  name: 'TabBar',
  props: {
    tabs: {
      type: Array,
      required: true
    },
    modelValue: {
      type: String,
      required: true
    }
  },
  emits: ['update:modelValue'],
  computed: {
    gridStyle() {
      return {
        gridTemplateColumns: `repeat(${this.tabs.length}, minmax(0, 1fr))`
      }
    }
  }
}
</script>
