<script setup lang="ts">
const props = withDefaults(defineProps<{
  src: string
  alt?: string
}>(), {
  alt: '',
})

const root = ref<HTMLImageElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  const element = root.value

  if (!element || !props.src) {
    return
  }

  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) {
      return
    }

    visible.value = true
    observer?.disconnect()
    observer = null
  }, {
    rootMargin: '240px 0px',
  })

  observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const currentSrc = computed(() => (visible.value ? props.src : undefined))
</script>

<template>
  <img
    ref="root"
    :src="currentSrc"
    :alt="alt"
    decoding="async"
  >
</template>
