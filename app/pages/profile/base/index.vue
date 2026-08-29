<script setup lang="ts">
import type { ManagedHotel } from '~/api/hotels'
import type { BaseHotelItem } from '~/components/profile/BaseHotelCard.vue'

definePageMeta({
  layout: 'profile',
  middleware: 'baseadmin',
})

useHead({
  title: 'Управление базой — WH',
})

const { hotels: hotelsApi } = useApi()

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Параметры' },
  { label: 'Управление базой' },
]

const hotels = ref<BaseHotelItem[]>([])
const isLoading = ref(true)
const loadError = ref('')

const hotelsCount = computed(() => hotels.value.length)

function formatUpdatedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', '')
}

function mapToBaseHotelItem(hotel: ManagedHotel): BaseHotelItem {
  return {
    id: hotel.id,
    title: hotel.title,
    image: hotel.image_url,
    location: hotel.location?.name ?? '',
    price: Number(hotel.price) || 0,
    status: hotel.status === 'publish' ? 'publish' : 'draft',
    updatedAt: formatUpdatedAt(hotel.updated_at),
  }
}

function extractErrorMessage(source: unknown, fallback: string) {
  if (!source || typeof source !== 'object') {
    return fallback
  }

  const payload = source as {
    success?: boolean
    message?: string
    data?: unknown
  }

  if (payload.message) {
    return payload.message
  }

  if (payload.data && payload.data !== source) {
    return extractErrorMessage(payload.data, fallback)
  }

  return fallback
}

function onHotelDeleted(id: number) {
  hotels.value = hotels.value.filter(hotel => hotel.id !== id)
}

async function loadHotels() {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await hotelsApi.getManage()

    if ('success' in response && response.success) {
      hotels.value = (response.data ?? []).map(mapToBaseHotelItem)
      return
    }

    loadError.value = extractErrorMessage(response, 'Не удалось загрузить базы')
  }
  catch (error) {
    const data = (error as { data?: unknown }).data
    loadError.value = extractErrorMessage(data, 'Не удалось загрузить базы')
  }
  finally {
    isLoading.value = false
  }
}

function addBase() {
  void navigateTo('/profile/base/new')
}

onMounted(() => {
  void loadHotels()
})
</script>

<template>
  <div class="profile-page">
    <div class="base-manage">
      <header class="profile-page__header">
        <AppBreadcrumbs :items="breadcrumbs" />

        <ProfileNotificationsBell />
      </header>

      <div class="base-manage__toolbar">
        <CommonPageTitle>Управление базой</CommonPageTitle>

        <button
          type="button"
          class="base-manage__btn base-manage__btn--success"
          @click="addBase"
        >
          + Добавить базу
        </button>
      </div>

      <p v-if="loadError" class="base-hotels__status base-hotels__status--error">
        {{ loadError }}
      </p>

      <p v-else-if="isLoading" class="base-hotels__status">
        Загрузка...
      </p>

      <div v-else-if="hotelsCount > 0" class="base-hotels">
        <div class="base-hotels__list">
        <ProfileBaseHotelCard
          v-for="hotel in hotels"
          :key="hotel.id"
          :item="hotel"
          @deleted="onHotelDeleted"
        />
        </div>
      </div>

      <p v-else class="base-hotels__empty">Нет отелей</p>
    </div>

    <CommonConfirmModal />
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  padding: 20px 40px 16px;
  padding-left: 20px;
  box-sizing: border-box;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.base-manage {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 1100px;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.base-manage__toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  margin-bottom: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.base-manage__toolbar :deep(.page-title) {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.base-manage__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-shrink: 0;
  margin-top: 6px;
  padding: 7px 16px;
  border: 1.5px solid transparent;
  border-radius: 999px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  box-sizing: border-box;
  transition: opacity 0.15s ease, background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.base-manage__btn--success {
  border-color: var(--wh-green);
  background: var(--wh-green);
  color: var(--wh-white);
}

.base-hotels,
.base-hotels__list {
  width: 100%;
  max-width: 100%;
}

.base-hotels__list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.base-hotels__status,
.base-hotels__empty {
  margin: 0;
  color: rgba(0, 0, 0, 0.55);
  font-size: 16px;
}

.base-hotels__status--error {
  color: #dc3545;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }
}

@media (--wh-mobile) {
  .profile-page {
    padding: 16px 20px 32px;
  }

  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }
}
</style>
