<script setup lang="ts">
import type { UserSearchItem } from '~/api/user'
import type { BookingHistoryItem } from '~/types/booking'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const isOpen = computed(() => Boolean(props.booking))
const { user: userApi, bookings: bookingsApi } = useApi()
const notifications = useNotifications()
const query = ref('')
const users = ref<UserSearchItem[]>([])
const selectedUserId = ref<number | null>(null)
const isSearching = ref(false)
const searchError = ref('')
const submitError = ref('')
const isSaving = ref(false)
let searchRequestId = 0
let skipNextSearch = false

useBodyScrollLock(isOpen)

function resetSearch() {
  skipNextSearch = false
  query.value = ''
  users.value = []
  selectedUserId.value = null
  searchError.value = ''
  submitError.value = ''
  isSearching.value = false
  isSaving.value = false
  searchRequestId += 1
}

function close() {
  emit('close')
}

function userName(user: UserSearchItem) {
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Имя не указано'
}

function userNickname(user: UserSearchItem) {
  return user.nik || user.user_name || 'ник не задан'
}

function handleQueryInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  input.value = digits
  query.value = digits
}

function selectUser(user: UserSearchItem) {
  selectedUserId.value = user.id
  submitError.value = ''
  const userId = String(user.id)

  if (query.value !== userId) {
    skipNextSearch = true
    query.value = userId
  }
}

function responseErrorMessage(response: {
  message?: string
  errors?: Record<string, string[]>
}) {
  return response.errors?.user_id?.[0]
    || response.message
    || 'Не удалось изменить заказчика'
}

async function saveCustomer() {
  if (!props.booking || selectedUserId.value === null || isSaving.value) {
    submitError.value = 'Выберите заказчика'
    return
  }

  submitError.value = ''
  isSaving.value = true

  try {
    const response = await bookingsApi.changeUser(props.booking.code, selectedUserId.value)

    if (!response.success) {
      submitError.value = responseErrorMessage(response)
      return
    }

    notifications.success(response.message || 'Заказчик успешно изменён')
    emit('saved')
    close()
  }
  catch (error) {
    const data = (error as {
      data?: {
        message?: string
        errors?: Record<string, string[]>
      }
    }).data

    submitError.value = responseErrorMessage(data ?? {})
  }
  finally {
    isSaving.value = false
  }
}

watch(
  () => props.booking,
  () => {
    resetSearch()
  },
)

watch(query, async (value) => {
  if (skipNextSearch) {
    skipNextSearch = false
    return
  }

  const normalizedQuery = value.trim()
  const requestId = ++searchRequestId

  users.value = []
  if (normalizedQuery !== String(selectedUserId.value ?? '')) {
    selectedUserId.value = null
  }
  searchError.value = ''

  if (!normalizedQuery) {
    isSearching.value = false
    return
  }

  const bookingId = props.booking?.id
  if (!bookingId) {
    return
  }

  isSearching.value = true

  try {
    const response = await userApi.searchUsers(normalizedQuery, bookingId)
    if (requestId !== searchRequestId) return

    if (!response.success || !('data' in response)) {
      searchError.value = response.message || 'Не удалось найти пользователей'
      return
    }

    const data = response.data
    users.value = Array.isArray(data)
      ? data
      : data.items ?? data.data ?? []
  }
  catch (error) {
    if (requestId !== searchRequestId) return

    const data = (error as { data?: { message?: string } }).data
    searchError.value = data?.message || 'Не удалось найти пользователей'
  }
  finally {
    if (requestId === searchRequestId) {
      isSearching.value = false
    }
  }
})

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close()
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="customer-modal">
      <div
        v-if="booking"
        class="customer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="customer-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="customer-modal-title" class="customer-modal__title">
            Найти нового заказчика по ID:
          </h2>

          <form class="customer-modal__form" @submit.prevent="saveCustomer">
            <input
              :value="query"
              type="text"
              inputmode="numeric"
              class="customer-modal__input"
              placeholder="Введите ID пользователя"
              aria-label="ID пользователя"
              @input="handleQueryInput"
            >

            <div v-if="isSearching" class="customer-modal__message">
              Поиск…
            </div>
            <div v-else-if="searchError" class="customer-modal__message customer-modal__message--error">
              {{ searchError }}
            </div>
            <div v-else-if="query.trim() && !users.length" class="customer-modal__message">
              Пользователи не найдены
            </div>

            <div v-if="users.length" class="customer-modal__results">
              <div
                v-for="user in users"
                :key="user.id"
                class="customer-modal__result"
              >
                <div class="customer-modal__user">
                  ID: {{ user.id }}
                  <span class="customer-modal__nickname">{{ userNickname(user) }}</span>
                  (ник)
                  <strong>{{ userName(user) }}</strong>
                </div>
                <button
                  v-if="selectedUserId !== user.id"
                  type="button"
                  class="btn btn--primary customer-modal__select"
                  @click="selectUser(user)"
                >
                  Выбрать
                </button>
                <span v-else class="customer-modal__selected-dot" aria-label="Выбрано" />
              </div>
            </div>

            <CommonSaveButton
              type="submit"
              class="customer-modal__save"
              width="160px"
              mobile-width="100%"
              :disabled="selectedUserId === null"
              :loading="isSaving"
            >
              Сохранить
            </CommonSaveButton>

            <div v-if="submitError" class="customer-modal__message customer-modal__message--error">
              {{ submitError }}
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.customer-modal {
  position: fixed;
  inset: 0;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  isolation: isolate;
}

.customer-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: rgba(17, 24, 39, 0.45);
}

.customer-modal__card {
  position: relative;
  width: min(100%, 760px);
  max-height: calc(100vh - 48px);
  padding: 20px 24px 18px;
  overflow-y: auto;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.customer-modal__title {
  margin: 0 40px 10px 0;
  color: var(--wh-gray-900);
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.4;
}

.customer-modal__form {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}

.customer-modal__input {
  width: 100%;
  height: 36px;
  margin: 8px 0;
  padding: 0 14px;
  border: 1px solid var(--wh-gray-400);
  background: var(--wh-white);
  color: var(--wh-gray-900);
  font: inherit;
  outline: none;
}

.customer-modal__input:focus {
  border-color: var(--wh-field-border-active);
}

.customer-modal__message {
  width: 100%;
  color: var(--wh-gray-600);
  font-size: 0.9rem;
}

.customer-modal__message--error {
  color: var(--wh-field-error);
}

.customer-modal__results {
  width: 100%;
  border: 1px solid var(--wh-gray-300);
}

.customer-modal__result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 52px;
  padding: 7px 10px;
  background: var(--wh-white);
}

.customer-modal__result + .customer-modal__result {
  border-top: 1px solid var(--wh-gray-300);
}

.customer-modal__user {
  color: var(--wh-gray-900);
  font-size: 0.88rem;
}

.customer-modal__nickname {
  font-weight: 600;
}

.customer-modal__select {
  flex-shrink: 0;
  padding: 8px 14px;
  background: var(--wh-green);
  font-size: 0.82rem;
}

.customer-modal__select:hover {
  background: var(--wh-green);
}

.customer-modal__selected-dot {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  margin-right: 18px;
  border-radius: 50%;
  background: var(--wh-orange-500);
}

.customer-modal-enter-active,
.customer-modal-leave-active {
  transition: opacity 0.2s ease;
}

.customer-modal-enter-from,
.customer-modal-leave-to {
  opacity: 0;
}
</style>
