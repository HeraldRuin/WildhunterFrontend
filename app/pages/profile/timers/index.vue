<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Таймеры — WH',
})

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Настройка таймеров' },
]

const { setProfileHeader } = useProfileHeader()

setProfileHeader({
  breadcrumbs,
  title: 'Таймеры',
})

const timers = [
  {
    type: 'collection',
    sectionTitle: 'Таймер сбора',
    hint: 'Установите размер таймера сбора в часах (например: 24)',
  },
  {
    type: 'beds',
    sectionTitle: 'Таймер койко-мест',
    hint: 'Установите размер таймера койко-мест в часах (например: 24)',
  },
  {
    type: 'prepayment',
    sectionTitle: 'Таймер предоплаты',
    hint: 'Установите размер таймера предоплаты в часах (например: 24)',
  },
] as const
</script>

<template>
  <div class="profile-page">
    <ProfilePageBreadcrumbs />

    <div class="timers-page__grid">
      <ProfileTimerSettingsForm
        v-for="timer in timers"
        :key="timer.type"
        :type="timer.type"
        :section-title="timer.sectionTitle"
        :hint="timer.hint"
      />
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  height: 100%;
  max-height: 100%;
  width: 100%;
  padding: 20px 40px 16px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  overflow: hidden;
}

.timers-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 460px));
  align-content: start;
  gap: 20px;
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
}

@media (--wh-tablet) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 12px 8px 32px;
  }

  .timers-page__grid {
    grid-template-columns: 1fr;
    flex: none;
    overflow: visible;
  }
}

@media (--wh-mobile) {
  .profile-page {
    height: auto;
    max-height: none;
    overflow: visible;
    padding: 16px 20px 32px;
  }
}
</style>
