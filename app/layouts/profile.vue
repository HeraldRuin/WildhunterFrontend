<template>
  <div class="profile-layout">
    <ProfileSidebar />
    <div class="profile-layout__content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const { loadProfile } = useProfile()

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-layout {
  --profile-sidebar-width: 340px;
  --profile-sidebar-gap: 16px;

  min-height: 100vh;
  background: var(--wh-gray-100);
}

.profile-layout__content {
  margin-left: calc(var(--profile-sidebar-width) + var(--profile-sidebar-gap) * 2);
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background: var(--wh-gray-100);
}

@media (--wh-tablet) {
  .profile-layout {
    display: flex;
    flex-direction: column;
    gap: var(--profile-sidebar-gap);
    padding: var(--profile-sidebar-gap);
    box-sizing: border-box;
  }

  .profile-layout__content {
    margin-left: 0;
    min-height: 0;
    max-height: none;
    overflow: visible;
  }
}

@media (--wh-mobile) {
  .profile-layout__content {
    border-radius: var(--wh-radius-lg);
    background: var(--wh-white);
  }
}
</style>
