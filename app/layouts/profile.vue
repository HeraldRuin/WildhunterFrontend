<template>
  <div class="profile-layout">
    <ProfileSidebar />
    <div class="profile-layout__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.profile-layout {
  min-height: 100vh;
  background: var(--wh-gray-100);
}

.profile-layout__content {
  margin-left: 280px;
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  background: var(--wh-gray-100);
}

@media (max-width: 900px) {
  .profile-layout__content {
    margin-left: 0;
    max-height: none;
  }
}
</style>
