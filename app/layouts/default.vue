<template>
  <div class="layout">
    <LayoutAppHeader />
    <main class="layout__main">
      <slot />
    </main>
    <LayoutAppFooter />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout__main {
  flex: 1;
}
</style>
