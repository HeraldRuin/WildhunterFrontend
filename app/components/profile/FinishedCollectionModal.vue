<script setup lang="ts">
import type { UserSearchItem } from '~/api/user'
import type { BookingHistoryItem, BookingInvitationParticipant } from '~/types/booking'
import { READ_ONLY_COLLECTION_STATUSES } from '~/utils/bookingHistory'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
  replaced: [
    payload: { oldHunterId: number, hunter: UserSearchItem },
    done: () => void,
  ]
  removed: [hunterId: number, done: () => void]
}>()

const { user } = useAuth()

function isReadOnlyCollectionStatus(status?: string) {
  return Boolean(status && READ_ONLY_COLLECTION_STATUSES.has(status))
}

const { bookings: bookingsApi, user: userApi } = useApi()
const notifications = useNotifications()
const { open: openConfirmModal } = useConfirmModal()
const isOpen = computed(() => Boolean(props.booking))
const replacingInvitationId = ref<number | null>(null)
const replacementQuery = ref('')
const selectedHunter = ref<UserSearchItem | null>(null)
const searchResults = ref<UserSearchItem[]>([])
const isSearching = ref(false)
const isReplacing = ref(false)
const removingHunterId = ref<number | null>(null)
const hasSearched = ref(false)
const searchError = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | undefined
let searchRequestId = 0

useBodyScrollLock(isOpen)

watch(() => props.booking, () => {
  replacingInvitationId.value = null
  replacementQuery.value = ''
  selectedHunter.value = null
  resetHunterSearch()
})

onUnmounted(resetHunterSearch)

function isCurrentUser(hunterId: number) {
  return Number(hunterId) === Number(user.value?.id)
}

function prepaymentStatusLabel(invitation: BookingInvitationParticipant) {
  if (invitation.prepaymentPaid) return 'Оплачено'
  if (invitation.prepaymentPaidStatus === 'unpaid') return 'Не оплачено'
  return 'Ожидается оплата'
}

function prepaymentStatusClass(invitation: BookingInvitationParticipant) {
  if (invitation.prepaymentPaid) {
    return 'finished-collection-modal__badge--payment-paid'
  }

  if (invitation.prepaymentPaidStatus === 'unpaid') {
    return 'finished-collection-modal__badge--payment-unpaid'
  }

  return 'finished-collection-modal__badge--payment-pending'
}

function startReplacing(invitationId: number) {
  replacingInvitationId.value = invitationId
  replacementQuery.value = ''
  selectedHunter.value = null
  resetHunterSearch()
}

function stopReplacing() {
  replacingInvitationId.value = null
  replacementQuery.value = ''
  selectedHunter.value = null
  resetHunterSearch()
}

function resetHunterSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = undefined
  }

  searchRequestId += 1
  searchResults.value = []
  isSearching.value = false
  hasSearched.value = false
  searchError.value = ''
}

function hunterName(hunter: UserSearchItem) {
  return [hunter.first_name, hunter.last_name].filter(Boolean).join(' ') || 'Имя не указано'
}

function hunterNickname(hunter: UserSearchItem) {
  return hunter.nik || hunter.user_name || 'ник не задан'
}

function hunterInputLabel(hunter: UserSearchItem) {
  return hunter.nik || hunter.user_name || hunterName(hunter)
}

function handleReplacementInput() {
  const query = replacementQuery.value.trim()
  selectedHunter.value = null
  resetHunterSearch()

  if (!query) return

  searchTimeout = setTimeout(() => {
    void searchHunters(query)
  }, 300)
}

function selectHunter(hunter: UserSearchItem) {
  selectedHunter.value = hunter
  replacementQuery.value = hunterInputLabel(hunter)
  resetHunterSearch()
}

async function searchHunters(query: string) {
  const bookingId = props.booking?.id
  if (!bookingId) return

  const requestId = ++searchRequestId
  isSearching.value = true

  try {
    const response = await userApi.searchReplacementHunters(query, bookingId)
    if (requestId !== searchRequestId) return

    if (!response.success || !('data' in response)) {
      searchError.value = response.message || 'Не удалось найти охотников'
      return
    }

    const data = response.data
    searchResults.value = Array.isArray(data)
      ? data
      : data.items ?? data.data ?? []
    hasSearched.value = true
  }
  catch (error) {
    if (requestId !== searchRequestId) return

    const data = (error as { data?: { message?: string } }).data
    searchError.value = data?.message || 'Не удалось найти охотников'
  }
  finally {
    if (requestId === searchRequestId) {
      isSearching.value = false
    }
  }
}

async function replaceHunter(oldHunterId: number) {
  const bookingCode = props.booking?.code
  const hunterId = selectedHunter.value?.id
  if (!bookingCode || !hunterId || isReplacing.value) return

  isReplacing.value = true

  try {
    const response = await bookingsApi.replaceHunter(bookingCode, oldHunterId, hunterId)

    if (response.success) {
      await new Promise<void>((resolve) => {
        emit('replaced', {
          oldHunterId,
          hunter: selectedHunter.value!,
        }, resolve)
      })
      notifications.success(response.message || 'Охотник заменён')
      return
    }

    notifications.error(response.message || 'Не удалось заменить охотника')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось заменить охотника')
  }
  finally {
    isReplacing.value = false
  }
}

async function removeHunter(hunterId: number) {
  const bookingCode = props.booking?.code
  if (!bookingCode || removingHunterId.value !== null) return

  removingHunterId.value = hunterId

  try {
    const response = await bookingsApi.removeHunter(bookingCode, hunterId)

    if (response.success) {
      await new Promise<void>((resolve) => {
        emit('removed', hunterId, resolve)
      })
      notifications.success(response.message || 'Охотник удалён')
      return
    }

    notifications.error(response.message || 'Не удалось удалить охотника')
  }
  catch (error) {
    const data = (error as { data?: { message?: string } }).data
    notifications.error(data?.message || 'Не удалось удалить охотника')
  }
  finally {
    removingHunterId.value = null
  }
}

function requestHunterDeletion(hunterId: number) {
  openConfirmModal({
    title: 'Вы уверены, что хотите удалить охотника?',
    confirmLabel: 'Удалить',
    onConfirm: () => removeHunter(hunterId),
  })
}

function close() {
  emit('close')
}

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
    <Transition name="finished-collection-modal">
      <div
        v-if="booking"
        class="finished-collection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="finished-collection-modal-title"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="finished-collection-modal__card">
          <CommonModalCloseButton @click="close" />

          <h2 id="finished-collection-modal-title" class="finished-collection-modal__title">
            Сбор для брони #{{ booking.number }}
          </h2>

          <div class="finished-collection-modal__success">
            Сбор завершен
          </div>

          <section>
            <h3 class="finished-collection-modal__subtitle">
              Приглашенные охотники
            </h3>

            <div
              v-for="invitation in booking.collectionInvitations"
              :key="invitation.invitationId"
              class="finished-collection-modal__participant"
              :class="{
                'finished-collection-modal__participant--loading':
                  (isReplacing && replacingInvitationId === invitation.invitationId)
                  || removingHunterId === invitation.hunterId,
              }"
            >
              <div class="finished-collection-modal__participant-main">
                <div class="finished-collection-modal__participant-header">
                  <span
                    v-if="isCurrentUser(invitation.hunterId)"
                    class="finished-collection-modal__badge finished-collection-modal__badge--self"
                  >
                    Вы
                  </span>
                  <strong>{{ invitation.name }}</strong>
                  <span
                    v-if="invitation.isAccepted"
                    class="finished-collection-modal__badge finished-collection-modal__badge--accepted"
                  >
                    Приглашение принято
                  </span>
                  <span
                    class="finished-collection-modal__badge"
                    :class="prepaymentStatusClass(invitation)"
                  >
                    {{ prepaymentStatusLabel(invitation) }}
                  </span>
                </div>

                <span>
                  ID: {{ invitation.hunterId }}
                  ({{ invitation.userName || 'ник не задан' }})
                </span>
                <span v-if="invitation.email">{{ invitation.email }}</span>
              </div>

              <div
                v-if="replacingInvitationId === invitation.invitationId"
                class="finished-collection-modal__replacement"
              >
                <div class="finished-collection-modal__replacement-search">
                  <input
                    v-model="replacementQuery"
                    type="text"
                    placeholder="Ник / Фамилия / email / ID охотника"
                    autocomplete="off"
                    @input="handleReplacementInput"
                  >

                  <div
                    v-if="replacementQuery.trim() && (isSearching || searchError || hasSearched)"
                    class="finished-collection-modal__search-results"
                  >
                    <div v-if="isSearching" class="finished-collection-modal__search-message">
                      Поиск…
                    </div>
                    <div
                      v-else-if="searchError"
                      class="finished-collection-modal__search-message finished-collection-modal__search-message--error"
                    >
                      {{ searchError }}
                    </div>
                    <div
                      v-else-if="!searchResults.length"
                      class="finished-collection-modal__search-message"
                    >
                      Ничего не найдено
                    </div>
                    <button
                      v-for="hunter in searchResults"
                      v-else
                      :key="hunter.id"
                      type="button"
                      class="finished-collection-modal__search-result"
                      @click="selectHunter(hunter)"
                    >
                      <strong>ID: {{ hunter.id }}</strong>
                      (ник {{ hunterNickname(hunter) }})
                      <strong>{{ hunterName(hunter) }}</strong>
                      <span v-if="hunter.email">{{ hunter.email }}</span>
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  class="finished-collection-modal__save"
                  :disabled="!selectedHunter || isReplacing"
                  @click="replaceHunter(invitation.hunterId)"
                >
                  Сохранить
                </button>
                <button type="button" class="finished-collection-modal__cancel" @click="stopReplacing">
                  Отмена
                </button>
              </div>

              <div
                v-else-if="booking.isMasterHunter
                  && !isCurrentUser(invitation.hunterId)
                  && !isReadOnlyCollectionStatus(booking.status.code)"
                class="finished-collection-modal__actions"
              >
                <button type="button" @click="startReplacing(invitation.invitationId)">
                  Заменить
                </button>
                <button
                  type="button"
                  class="finished-collection-modal__delete"
                  @click="requestHunterDeletion(invitation.hunterId)"
                >
                  Удалить
                </button>
              </div>

              <div
                v-if="(isReplacing && replacingInvitationId === invitation.invitationId)
                  || removingHunterId === invitation.hunterId"
                class="finished-collection-modal__loading"
              >
                <CommonSpinner
                  size="md"
                  :label="removingHunterId === invitation.hunterId
                    ? 'Удаление охотника'
                    : 'Замена охотника'"
                />
              </div>
            </div>

            <p
              v-if="!booking.collectionInvitations?.length"
              class="finished-collection-modal__empty"
            >
              Нет приглашённых охотников
            </p>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.finished-collection-modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(17, 24, 39, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.finished-collection-modal__card {
  position: relative;
  width: min(100%, 1000px);
  padding: 20px 24px 28px;
  border: 1px solid var(--wh-gray-200);
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.finished-collection-modal__title {
  margin: 0 -24px 14px;
  padding: 0 24px 18px;
  border-bottom: 1px solid var(--wh-gray-200);
  color: var(--wh-gray-900);
  font-size: 1.1rem;
  font-weight: 500;
}

.finished-collection-modal__success {
  margin-bottom: 20px;
  padding: 14px 18px;
  border: 1px solid #bfe3c8;
  border-radius: 4px;
  background: #d9f0df;
  color: #236b35;
  font-size: 0.85rem;
  font-weight: 600;
}

.finished-collection-modal__subtitle {
  margin: 0 0 8px;
  color: var(--wh-gray-900);
  font-size: 0.95rem;
  font-weight: 500;
}

.finished-collection-modal__participant {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 8px 0;
  color: var(--wh-gray-600);
  font-size: 0.75rem;
}

.finished-collection-modal__participant--loading {
  min-height: 64px;
}

.finished-collection-modal__loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  pointer-events: all;
}

.finished-collection-modal__participant-main {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.finished-collection-modal__participant-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--wh-gray-900);
}

.finished-collection-modal__badge {
  padding: 3px 8px;
  border-radius: 3px;
  color: var(--wh-white);
  font-size: 0.68rem;
  font-weight: 600;
  line-height: 1.2;
}

.finished-collection-modal__badge--self {
  min-width: 44px;
  background: #25a447;
  text-align: center;
}

.finished-collection-modal__badge--accepted {
  background: var(--wh-gray-600);
}

.finished-collection-modal__badge--payment-pending {
  background: #f4c533;
}

.finished-collection-modal__badge--payment-unpaid {
  background: #dc3545;
}

.finished-collection-modal__badge--payment-paid {
  background: #25a447;
}

.finished-collection-modal__actions {
  display: flex;
  gap: 18px;
}

.finished-collection-modal__actions button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #4aa3d9;
  font: inherit;
  cursor: pointer;
}

.finished-collection-modal__actions .finished-collection-modal__delete {
  padding: 7px 16px;
  border-radius: 999px;
  background: #dc3545;
  color: var(--wh-white);
}

.finished-collection-modal__actions .finished-collection-modal__delete:hover {
  background: #c82333;
}

.finished-collection-modal__replacement {
  display: flex;
  flex: 0 1 440px;
  align-items: flex-start;
  gap: 7px;
}

.finished-collection-modal__replacement-search {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
}

.finished-collection-modal__replacement input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--wh-gray-300);
  color: var(--wh-gray-900);
  font: inherit;
  outline: none;
}

.finished-collection-modal__replacement input:focus {
  border-color: var(--wh-green);
}

.finished-collection-modal__replacement > button {
  padding: 7px 10px;
  border: 0;
  border-radius: 2px;
  color: var(--wh-white);
  font: inherit;
  cursor: pointer;
}

.finished-collection-modal__replacement > button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.finished-collection-modal__save {
  background: #2eae4f;
}

.finished-collection-modal__cancel {
  background: var(--wh-gray-600);
}

.finished-collection-modal__search-results {
  position: absolute;
  top: calc(100% + 2px);
  right: 0;
  left: 0;
  z-index: 10;
  max-height: 230px;
  border: 1px solid var(--wh-gray-300);
  background: var(--wh-white);
  overflow-y: auto;
}

.finished-collection-modal__search-result {
  display: block;
  width: 100%;
  padding: 9px 8px;
  border: 0;
  border-bottom: 1px solid var(--wh-gray-200);
  border-radius: 0;
  background: var(--wh-white);
  color: var(--wh-gray-900);
  text-align: left;
  cursor: pointer;
}

.finished-collection-modal__search-result:last-child {
  border-bottom: 0;
}

.finished-collection-modal__search-result:hover {
  background: var(--wh-gray-100);
}

.finished-collection-modal__search-result span {
  display: block;
  margin-top: 4px;
  color: var(--wh-gray-600);
}

.finished-collection-modal__search-message {
  padding: 10px;
  color: var(--wh-gray-600);
}

.finished-collection-modal__search-message--error {
  color: var(--wh-field-error);
}

.finished-collection-modal__empty {
  margin: 0;
  padding: 18px;
  color: var(--wh-gray-600);
  text-align: center;
}

.finished-collection-modal-enter-active,
.finished-collection-modal-leave-active {
  transition: opacity 0.2s ease;
}

.finished-collection-modal-enter-from,
.finished-collection-modal-leave-to {
  opacity: 0;
}

@media (--wh-mobile) {
  .finished-collection-modal {
    padding: 12px;
  }

  .finished-collection-modal__card {
    padding: 18px;
  }

  .finished-collection-modal__title {
    margin-right: -18px;
    margin-left: -18px;
    padding-left: 18px;
  }

  .finished-collection-modal__participant {
    align-items: flex-start;
    flex-direction: column;
  }

  .finished-collection-modal__replacement {
    width: 100%;
    flex-basis: auto;
    flex-wrap: wrap;
    padding: 10px;
  }

  .finished-collection-modal__replacement-search {
    width: 100%;
  }
}
</style>
