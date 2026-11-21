<template>
  <div ref="viewport" class="@container relative min-w-0 overflow-hidden">
    <div ref="track" class="flex w-max items-center gap-1">
      <ServiceIcon
        v-for="(service, index) in services"
        :key="service.PrimaryIdentifier || index"
        :service="service"
        class="h-5 max-w-[100cqw] shrink-0 whitespace-nowrap rounded-md px-1.5 text-[0.72rem] font-bold leading-5 sm:h-6 sm:px-2 sm:text-sm [&_span.w-full]:truncate"
        :class="{ 'invisible order-last': index >= visibleCount }"
      />
      <span
        v-if="hiddenCount > 0"
        :class="badgeClass"
        :aria-label="`${hiddenCount} more services`"
      >+{{ hiddenCount }}</span>
    </div>

    <div ref="badgeSizes" class="invisible absolute inset-s-0 top-0 flex w-max" aria-hidden="true">
      <span v-for="digits in digitCount(services.length)" :key="digits" :class="badgeClass">
        +{{ '0'.repeat(digits) }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import ServiceIcon from '@/components/ServiceIcon.vue'

const props = defineProps({
  services: { type: Array, required: true }
})

const badgeClass = 'inline-flex h-5 shrink-0 items-center rounded-md bg-slate-100 px-1.5 text-[0.72rem] font-bold tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:h-6 sm:px-2 sm:text-sm'
const viewport = useTemplateRef('viewport')
const track = useTemplateRef('track')
const badgeSizes = useTemplateRef('badgeSizes')
const visibleCount = ref(0)
const hiddenCount = computed(() => props.services.length - visibleCount.value)
let resizeObserver

function digitCount(count) {
  return String(count).length
}

function fitServices() {
  if (!viewport.value) return

  const availableWidth = viewport.value.getBoundingClientRect().width
  const gap = parseFloat(getComputedStyle(track.value).columnGap)
  const pills = Array.from(track.value.children).slice(0, props.services.length)
  const badgeWidths = Array.from(badgeSizes.value.children, badge => badge.getBoundingClientRect().width)
  let count = 0
  let width = 0

  for (const [index, pill] of pills.entries()) {
    width += (index > 0 ? gap : 0) + pill.getBoundingClientRect().width
    if (width > availableWidth) break

    const remaining = pills.length - index - 1
    const badgeWidth = remaining > 0 ? gap + badgeWidths[digitCount(remaining) - 1] : 0
    if (width + badgeWidth <= availableWidth) count = index + 1
  }

  visibleCount.value = count
}

watch(() => props.services, fitServices, { flush: 'post' })

onMounted(() => {
  fitServices()
  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(fitServices)
  resizeObserver.observe(viewport.value)
  resizeObserver.observe(track.value)
  resizeObserver.observe(badgeSizes.value)
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>
