<script setup lang="ts">
withDefaults(defineProps<{
  /** Нижняя разделительная линия под заголовком */
  divider?: boolean
}>(), {
  divider: false,
})
</script>

<template>
  <h1
    class="page-title"
    :class="{ 'page-title--divider': divider }"
  >
    <slot />
  </h1>
</template>

<style scoped>
.page-title {
  margin: 0 0 24px;
  font-family: "UNCAGE", sans-serif;
  font-weight: 400;
  font-size: 32px;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-transform: uppercase;
  color: var(--wh-gray-900);
}

.page-title--divider {
  width: 896px;
  max-width: 100%;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

@media (--wh-tablet) {
  .page-title {
    font-size: 28px;
  }

  .page-title--divider {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .page-title {
    font-size: 24px;
  }
}
</style>
