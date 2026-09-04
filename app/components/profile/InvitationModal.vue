<script setup lang="ts">
import type { BookingHistoryItem, BookingInvitationParticipant } from '~/types/booking'
import type { ProfileUser } from '~/types/user'
import { formatMemberSince, normalizeUserProfile } from '~/utils/user'

const props = defineProps<{
  booking: BookingHistoryItem | null
}>()

const emit = defineEmits<{
  close: []
}>()

const { user: userApi } = useApi()
const config = useRuntimeConfig()
const uploadsOrigin = new URL(config.public.apiBase as string).origin

const isOpen = computed(() => Boolean(props.booking))

const participants = computed(() => props.booking?.collectionInvitations ?? [])

const showPaymentStatus = computed(() => {
  return props.booking?.status.code !== 'collection'
})

const selectedParticipant = ref<BookingInvitationParticipant | null>(null)
const selectedProfile = ref<ProfileUser | null>(null)
const isLoadingProfile = ref(false)
const profileError = ref('')
let profileRequestId = 0

useBodyScrollLock(isOpen)

watch(
  () => props.booking,
  () => {
    clearSelectedUser()
  },
)

function clearSelectedUser() {
  profileRequestId += 1
  selectedParticipant.value = null
  selectedProfile.value = null
  isLoadingProfile.value = false
  profileError.value = ''
}

function close() {
  clearSelectedUser()
  emit('close')
}

function handleBackdropClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    close()
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return

  if (selectedParticipant.value) {
    clearSelectedUser()
    return
  }

  close()
}

function invitationStatusLabel(invitation: BookingInvitationParticipant) {
  if (invitation.isDeclined) return 'Отклонено'
  if (invitation.isAccepted) return 'Приглашение принято'
  return 'Ожидает подтверждения'
}

function invitationStatusClass(invitation: BookingInvitationParticipant) {
  if (invitation.isDeclined) return 'invitation-modal__badge--declined'
  if (invitation.isAccepted) return 'invitation-modal__badge--accepted'
  return 'invitation-modal__badge--pending'
}

function prepaymentStatusLabel(invitation: BookingInvitationParticipant) {
  if (invitation.prepaymentPaid) return 'Оплачено'
  if (invitation.prepaymentPaidStatus === 'unpaid') return 'Не оплачено'
  return 'Ожидается оплата'
}

function profileFullName(profile: ProfileUser) {
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Имя не указано'
}

async function openUserDetails(participant: BookingInvitationParticipant) {
  if (!participant.hunterId) return

  selectedParticipant.value = participant
  selectedProfile.value = null
  profileError.value = ''
  isLoadingProfile.value = true

  const requestId = ++profileRequestId

  try {
    const response = await userApi.getUser(participant.hunterId)

    if (requestId !== profileRequestId) return

    if (!response.success) {
      profileError.value = response.message || 'Не удалось загрузить данные пользователя'
      return
    }

    selectedProfile.value = normalizeUserProfile(response.data, uploadsOrigin)
  }
  catch (error) {
    if (requestId !== profileRequestId) return

    const data = (error as { data?: { message?: string } }).data
    profileError.value = data?.message || 'Не удалось загрузить данные пользователя'
  }
  finally {
    if (requestId === profileRequestId) {
      isLoadingProfile.value = false
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="invitation-modal">
      <div
        v-if="booking"
        class="invitation-modal"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="selectedParticipant ? 'invitation-modal-user-title' : 'invitation-modal-title'"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="invitation-modal__card">
          <CommonModalCloseButton
            :label="selectedParticipant ? 'Назад' : 'Закрыть'"
            :aria-label="selectedParticipant ? 'Назад' : 'Закрыть'"
            @click="selectedParticipant ? clearSelectedUser() : close()"
          />

          <template v-if="!selectedParticipant">
            <h2 id="invitation-modal-title" class="invitation-modal__title">
              Открыт сбор для охотников
            </h2>

            <section class="invitation-modal__participants">
              <h3 class="invitation-modal__subtitle">
                Приглашенные охотники
              </h3>

              <div
                v-for="(participant, index) in participants"
                :key="participant.invitationId || participant.hunterId || index"
                class="invitation-modal__slot-row"
              >
                <span class="invitation-modal__field-number">{{ index + 1 }}</span>

                <div class="invitation-modal__participant">
                  <div class="invitation-modal__participant-line">
                    <button
                      type="button"
                      class="invitation-modal__participant-name"
                      @click="openUserDetails(participant)"
                    >
                      {{ participant.name || 'Охотник' }}
                    </button>
                    <span
                      v-if="participant.email"
                      class="invitation-modal__participant-email"
                    >
                      <svg
                        class="invitation-modal__participant-email-icon"
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="3.5"
                          width="12"
                          height="9"
                          rx="1"
                          stroke="currentColor"
                          stroke-width="1.2"
                        />
                        <path
                          d="M2.5 4.5 8 9l5.5-4.5"
                          stroke="currentColor"
                          stroke-width="1.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      {{ participant.email }}
                    </span>
                  </div>

                  <div class="invitation-modal__participant-statuses">
                    <span
                      class="invitation-modal__badge"
                      :class="invitationStatusClass(participant)"
                    >
                      <svg
                        v-if="participant.isAccepted"
                        class="invitation-modal__badge-icon"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      {{ invitationStatusLabel(participant) }}
                    </span>
                    <span
                      v-if="showPaymentStatus"
                      class="invitation-modal__payment"
                    >
                      {{ prepaymentStatusLabel(participant) }}
                    </span>
                  </div>
                </div>
              </div>

              <p
                v-if="!participants.length"
                class="invitation-modal__empty"
              >
                Нет приглашённых охотников
              </p>
            </section>
          </template>

          <section
            v-else
            class="invitation-modal__user"
          >
            <h2 id="invitation-modal-user-title" class="invitation-modal__user-title">
              Информация о пользователе
            </h2>

            <div
              v-if="isLoadingProfile"
              class="invitation-modal__user-loading"
            >
              <CommonSpinner variant="ring" size="md" label="Загрузка пользователя" />
            </div>

            <p
              v-else-if="profileError"
              class="invitation-modal__user-error"
            >
              {{ profileError }}
            </p>

            <div
              v-else-if="selectedProfile"
              class="invitation-modal__user-card"
            >
              <div class="invitation-modal__user-top">
                <div
                  class="invitation-modal__user-avatar"
                  aria-hidden="true"
                >
                  <img
                    v-if="selectedProfile.avatar"
                    :src="selectedProfile.avatar"
                    alt=""
                    class="invitation-modal__user-avatar-image"
                  >
                  <span v-else>
                    {{ profileFullName(selectedProfile).charAt(0).toUpperCase() || '?' }}
                  </span>
                </div>

                <div class="invitation-modal__user-summary">
                  <div class="invitation-modal__user-name">
                    {{ profileFullName(selectedProfile) }}
                  </div>
                  <div
                    v-if="selectedParticipant?.userName || selectedProfile.user_name"
                    class="invitation-modal__user-nickname"
                  >
                    Ник:
                    <span class="invitation-modal__user-nickname-value">
                      @{{ selectedParticipant?.userName ?? selectedProfile.user_name }}
                    </span>
                  </div>
                </div>
              </div>

              <dl class="invitation-modal__user-fields">
                <div
                  v-if="selectedProfile.email"
                  class="invitation-modal__user-field"
                >
                  <dt>Email</dt>
                  <dd>{{ selectedProfile.email }}</dd>
                </div>
                <div
                  v-if="selectedProfile.phone"
                  class="invitation-modal__user-field"
                >
                  <dt>Телефон</dt>
                  <dd>{{ selectedProfile.phone }}</dd>
                </div>
                <div
                  v-if="selectedProfile.birthday"
                  class="invitation-modal__user-field"
                >
                  <dt>Дата рождения</dt>
                  <dd>{{ selectedProfile.birthday }}</dd>
                </div>
                <div
                  v-if="selectedProfile.hunter_billet_number"
                  class="invitation-modal__user-field"
                >
                  <dt>Охотничий билет</dt>
                  <dd>{{ selectedProfile.hunter_billet_number }}</dd>
                </div>
                <div
                  v-if="selectedProfile.created_at"
                  class="invitation-modal__user-field"
                >
                  <dt>На сайте с</dt>
                  <dd>{{ formatMemberSince(selectedProfile.created_at) }}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.invitation-modal {
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

.invitation-modal__card {
  position: relative;
  width: min(100%, 780px);
  padding: 0 20px 20px;
  border-radius: var(--wh-radius);
  background: var(--wh-white);
  box-shadow: var(--wh-shadow);
}

.invitation-modal__title {
  margin: 0 -20px 28px;
  padding: 18px 52px 18px 20px;
  color: var(--wh-gray-900);
  font-size: 1rem;
  font-weight: 600;
}

.invitation-modal__subtitle {
  margin: 0 0 12px;
  color: var(--wh-gray-900);
  font-size: 0.9rem;
  font-weight: 500;
}

.invitation-modal__participants {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-modal__slot-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  column-gap: 10px;
  align-items: start;
}

.invitation-modal__field-number {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: 10px;
  border: 1px solid var(--wh-field-border);
  border-radius: 6px;
  color: var(--wh-black-text);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1;
  text-align: center;
}

.invitation-modal__participant {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--wh-gray-100);
}

.invitation-modal__participant-line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
}

.invitation-modal__participant-name {
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.3;
  color: var(--wh-gray-900);
  text-align: left;
  cursor: pointer;
  transition: color 0.15s ease;
}

.invitation-modal__participant-name:hover {
  color: var(--wh-orange-500);
}

.invitation-modal__participant-email {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  font-size: 0.75rem;
  line-height: 1.3;
  color: var(--wh-gray-600);
}

.invitation-modal__participant-email-icon {
  flex-shrink: 0;
}

.invitation-modal__participant-statuses {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 10px;
  flex-shrink: 0;
  margin-left: auto;
}

.invitation-modal__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: fit-content;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  color: var(--wh-white);
}

.invitation-modal__badge-icon {
  flex-shrink: 0;
}

.invitation-modal__badge--accepted {
  background: var(--wh-green);
}

.invitation-modal__badge--pending {
  background: var(--wh-gray-600);
}

.invitation-modal__badge--declined {
  background: var(--wh-field-error);
}

.invitation-modal__payment {
  color: var(--wh-gray-700);
  font-size: 0.78rem;
  line-height: 1.2;
  white-space: nowrap;
}

.invitation-modal__empty {
  margin: 0;
  padding: 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 6px;
  color: var(--wh-gray-600);
  font-size: 0.88rem;
  text-align: center;
}

.invitation-modal__user {
  padding-top: 18px;
}

.invitation-modal__user-title {
  margin: 0 0 18px;
  padding-right: 96px;
  color: var(--wh-gray-900);
  font-size: 1rem;
  font-weight: 600;
}

.invitation-modal__user-loading,
.invitation-modal__user-error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 160px;
  padding: 20px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
  color: var(--wh-gray-600);
  font-size: 0.9rem;
  text-align: center;
}

.invitation-modal__user-error {
  color: var(--wh-field-error);
}

.invitation-modal__user-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px;
  border: 1px solid var(--wh-gray-200);
  border-radius: 8px;
}

.invitation-modal__user-top {
  display: flex;
  align-items: center;
  gap: 14px;
}

.invitation-modal__user-avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--wh-gray-200);
  color: var(--wh-gray-700);
  font-size: 1.4rem;
  font-weight: 700;
}

.invitation-modal__user-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.invitation-modal__user-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.invitation-modal__user-name {
  color: var(--wh-gray-900);
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
}

.invitation-modal__user-nickname {
  color: var(--wh-gray-600);
  font-size: 0.88rem;
  line-height: 1.3;
}

.invitation-modal__user-nickname-value {
  color: var(--wh-gray-900);
}

.invitation-modal__user-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.invitation-modal__user-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--wh-gray-100);
}

.invitation-modal__user-field dt {
  color: var(--wh-gray-600);
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.2;
}

.invitation-modal__user-field dd {
  margin: 0;
  color: var(--wh-gray-900);
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.invitation-modal-enter-active,
.invitation-modal-leave-active {
  transition: opacity 0.2s ease;
}

.invitation-modal-enter-from,
.invitation-modal-leave-to {
  opacity: 0;
}

@media (--wh-mobile) {
  .invitation-modal {
    padding: 12px;
  }

  .invitation-modal__user-fields {
    grid-template-columns: 1fr;
  }
}
</style>
