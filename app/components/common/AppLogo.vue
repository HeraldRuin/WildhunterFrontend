<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number
  width?: number
  height?: number
  alt?: string
}>(), {
  size: 72,
  alt: 'WH',
})

const logoWidth = computed(() => `${props.width ?? props.size}px`)
const logoHeight = computed(() => `${props.height ?? props.size}px`)
</script>

<template>
  <img
    src="/images/logo.png"
    :alt="alt"
    class="app-logo"
    :style="{ width: logoWidth, height: logoHeight }"
  >
</template>

<style scoped>
.app-logo {
  object-fit: contain;
}
</style>
