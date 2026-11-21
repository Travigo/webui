<template>
  <div class="relative min-w-0">
    <div
      ref="viewport"
      class="horizontal-scroll-viewport overflow-x-auto"
      :role="label ? 'group' : undefined"
      :aria-label="label"
      :tabindex="focusable ? 0 : undefined"
      @scroll.passive="measureOverflow"
    >
      <div ref="track" class="flex w-max" :class="trackClass">
        <slot />
      </div>
    </div>
    <span
      aria-hidden="true"
      class="scroll-fade scroll-fade--left"
      :class="hasLeftOverflow ? 'opacity-100' : 'opacity-0'"
    ></span>
    <span
      aria-hidden="true"
      class="scroll-fade scroll-fade--right"
      :class="hasRightOverflow ? 'opacity-100' : 'opacity-0'"
    ></span>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'

defineProps({
  label: String,
  focusable: Boolean,
  trackClass: String
})

const viewport = useTemplateRef('viewport')
const track = useTemplateRef('track')
const hasLeftOverflow = ref(false)
const hasRightOverflow = ref(false)
let resizeObserver

function measureOverflow() {
  const { scrollWidth, clientWidth, scrollLeft } = viewport.value
  const scrollRange = scrollWidth - clientWidth
  hasLeftOverflow.value = scrollRange > 1 && scrollLeft > 1
  hasRightOverflow.value = scrollRange > 1 && scrollLeft < scrollRange - 1
}

onMounted(() => {
  measureOverflow()
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(measureOverflow)
  resizeObserver.observe(viewport.value)
  resizeObserver.observe(track.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
.scroll-fade {
  position: absolute;
  inset-block: 0;
  width: 1.75rem;
  pointer-events: none;
  transition: opacity var(--motion-feedback);
}

.scroll-fade--left {
  left: 0;
  background: linear-gradient(to right, var(--scroll-fade-background, var(--ui-panel)), transparent);
}

.scroll-fade--right {
  right: 0;
  background: linear-gradient(to left, var(--scroll-fade-background, var(--ui-panel)), transparent);
}
</style>
