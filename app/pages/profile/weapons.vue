<script setup lang="ts">
definePageMeta({
  layout: 'profile',
  middleware: 'auth',
})

import type { UserWeapon, WeaponOption } from '~/types/user'
import { formatApiDate, formatBirthdayDate, parseBirthdayDate } from '~/utils/date'
import { createEmptyWeapon } from '~/utils/user'
import {
  readUserWeaponsCache,
  readUserWeaponsCountCache,
  readHunterBilletCache,
  writeHunterBilletCache,
  writeUserWeaponsCache,
} from '~/utils/userWeaponsCache'
import {
  isValidHunterDocumentNumber,
} from '~/utils/hunterDocuments'

type WeaponField =
  | 'hunter_billet_number'
  | 'hunter_license_number'
  | 'hunter_license_date'
  | 'weapon_type_id'
  | 'caliber_id'

const { profile, pending, error, loadProfile, patchCachedProfile } = useProfile()
const { user } = useAuth()
const { isBaseAdmin } = useUserRole()
const { weapons: weaponsApi } = useApi()
const notifications = useNotifications()

// Если роль уже известна (из сессии) — сразу на штатную 404
if (import.meta.client && isBaseAdmin.value) {
  window.location.replace('/404')
}

useHead({
  title: 'Лицензия на оружие — WH',
})




const pulseUnsavedSave = ref(false)
const pulseNotificationId = ref<string | null>(null)
const weaponTypes = ref<WeaponOption[]>([])
const weaponTypesLoading = ref(false)
const weaponTypesError = ref('')
const calibers = ref<WeaponOption[]>([])
const calibersLoading = ref(false)
const calibersError = ref('')
const weapons = ref<UserWeapon[]>([])
const userWeaponsLoading = ref(false)
const userWeaponsError = ref('')
const cachedWeaponsCount = ref(0)

/** Свёрнутые блоки с названием; данные ещё грузятся — вместо шеврона спиннер */
const showWeaponPlaceholders = computed(() =>
  userWeaponsLoading.value
  && weapons.value.length === 0
  && cachedWeaponsCount.value > 0,
)

type WeaponCardView =
  | { key: string, index: number, loading: true }
  | { key: string, index: number, loading: false, weapon: UserWeapon }

const weaponCards = computed<WeaponCardView[]>(() => {
  // Ключ по индексу — одни и те же блоки, без leave/enter анимации при подгрузке
  if (weapons.value.length > 0) {
    return weapons.value.map((weapon, index) => ({
      key: `slot-${index}`,
      index,
      loading: false as const,
      weapon,
    }))
  }

  if (showWeaponPlaceholders.value) {
    return Array.from({ length: cachedWeaponsCount.value }, (_, index) => ({
      key: `slot-${index}`,
      index,
      loading: true as const,
    }))
  }

  return []
})

/** Левая колонка: 1, 2… — раскрытие #1 просто опускает #2, без перескока к #3 */
const weaponCardColumns = computed(() => {
  const cards = weaponCards.value
  const leftCount = Math.ceil(cards.length / 2)

  return [cards.slice(0, leftCount), cards.slice(leftCount)] as const
})

function currentUserId() {
  return user.value?.id ?? profile.value?.id ?? null
}

function persistWeaponsCache(list: UserWeapon[]) {
  const userId = currentUserId()

  if (!userId) {
    return
  }

  writeUserWeaponsCache(userId, list)
  cachedWeaponsCount.value = list.filter(weapon => !weapon.isNew).length
}

function applyWeaponsList(list: UserWeapon[]) {
  weapons.value = list
  persistWeaponsCache(list)

  try {
    rememberWeaponSnapshots(list)
  } catch {
    weaponSnapshots.value = {}
  }
}

function hydrateWeaponsFromCache() {
  const userId = currentUserId()

  if (!userId) {
    return false
  }

  const cached = readUserWeaponsCache(userId)

  if (!cached) {
    cachedWeaponsCount.value = readUserWeaponsCountCache(userId)
    return false
  }

  weapons.value = cached
  cachedWeaponsCount.value = cached.length

  try {
    rememberWeaponSnapshots(cached)
  } catch {
    weaponSnapshots.value = {}
  }

  return true
}

function deferTask(ms: number) {
  return new Promise<void>((resolve) => {
    if (!import.meta.client) {
      resolve()
      return
    }

    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    }).requestIdleCallback

    if (typeof idle === 'function') {
      idle(() => resolve(), { timeout: ms })
      return
    }

    window.setTimeout(() => resolve(), ms)
  })
}
const openLicenseDateIndex = ref<number | null>(null)
const licenseDate = ref<Date | null>(null)
const licenseActivePart = ref<'start' | 'end' | null>('start')
const licenseDateFieldRefs = new Map<number, HTMLElement>()
const fieldErrors = ref<Record<string, string[]>>({})
const submitError = ref('')
const savingWeaponIndex = ref<number | null>(null)
const savingWeaponOverlayIndex = ref<number | null>(null)
const reloadWeaponsAfterSaving = ref(false)
const confirmDeleteIndex = ref<number | null>(null)
const expandedWeaponKeys = ref<string[]>([])
const weaponSnapshots = ref<Record<number, string>>({})
const hunterBilletSnapshot = ref('')
const savingHunterBillet = ref(false)

const isHunterBilletDirty = computed(() => {
  const current = profile.value?.hunter_billet_number.trim() ?? ''
  return current !== hunterBilletSnapshot.value
})

const hasHunterBilletValue = computed(() =>
  isValidHunterDocumentNumber(profile.value?.hunter_billet_number ?? '', 'billet'),
)

const showHunterBilletAction = computed(() =>
  isHunterBilletDirty.value && hasHunterBilletValue.value,
)

const hunterBilletActionLabel = computed(() =>
  hunterBilletSnapshot.value ? 'Обновить' : 'Сохранить',
)

const breadcrumbs = [
  { label: 'Главная', to: '/' },
  { label: 'Лицензия на оружие' },
]

async function loadWeaponTypes() {
  weaponTypesLoading.value = true
  weaponTypesError.value = ''

  try {
    weaponTypes.value = await weaponsApi.getWeaponTypeOptions()
  } catch {
    weaponTypes.value = []
    weaponTypesError.value = 'Не удалось загрузить типы оружия'
  } finally {
    weaponTypesLoading.value = false
  }
}

async function loadCalibers() {
  calibersLoading.value = true
  calibersError.value = ''

  try {
    calibers.value = await weaponsApi.getCaliberOptions()
  } catch {
    calibers.value = []
    calibersError.value = 'Не удалось загрузить калибры'
  } finally {
    calibersLoading.value = false
  }
}

async function loadUserWeapons(options: { force?: boolean, silent?: boolean } = {}) {
  if (!options.silent) {
    userWeaponsLoading.value = true
  }

  userWeaponsError.value = ''

  try {
    if (!profile.value) {
      await loadProfile()
    }

    if (!profile.value) {
      return
    }

    // Обычный заход — только кэш, без /user/weapons
    if (!options.force && hydrateWeaponsFromCache()) {
      return
    }

    const { weapons: list, hunterBilletNumber } = await weaponsApi.getUserWeaponsBundle()
    applyWeaponsList(list)

    if (hunterBilletNumber) {
      applyHunterBilletFromApi(hunterBilletNumber)
    } else {
      hydrateHunterBilletFromCache()
    }
  } catch {
    if (!options.silent) {
      if (!weapons.value.length) {
        weapons.value = []
        weaponSnapshots.value = {}
      }
      userWeaponsError.value = 'Не удалось загрузить лицензии на оружие'
    }
  } finally {
    if (!options.silent) {
      userWeaponsLoading.value = false
    }
  }
}

function ensureWeaponDictionaries() {
  if (!weaponTypes.value.length && !weaponTypesLoading.value) {
    void loadWeaponTypes()
  }

  if (!calibers.value.length && !calibersLoading.value) {
    void loadCalibers()
  }
}

function syncHunterBilletSnapshot() {
  hunterBilletSnapshot.value = profile.value?.hunter_billet_number.trim() ?? ''
}

function applyHunterBilletFromApi(value: string) {
  const trimmed = value.trim()

  if (!profile.value) {
    return
  }

  const userId = currentUserId()

  if (userId && trimmed) {
    writeHunterBilletCache(userId, trimmed)
  }

  patchCachedProfile({ hunter_billet_number: trimmed })
  syncHunterBilletSnapshot()
}

function hydrateHunterBilletFromCache() {
  const userId = currentUserId()

  if (!userId || !profile.value || profile.value.hunter_billet_number.trim()) {
    return
  }

  const cached = readHunterBilletCache(userId)

  if (!cached) {
    return
  }

  patchCachedProfile({ hunter_billet_number: cached })
}

async function ensureHunterBilletLoaded() {
  hydrateHunterBilletFromCache()

  if (profile.value?.hunter_billet_number.trim()) {
    return
  }

  await loadUserWeapons({ force: true, silent: true })
  hydrateHunterBilletFromCache()
}

async function refreshHunterBilletOnPageEnter() {
  hydrateHunterBilletFromCache()

  if (profile.value?.hunter_billet_number.trim()) {
    syncHunterBilletSnapshot()
    return
  }

  await ensureHunterBilletLoaded()
  syncHunterBilletSnapshot()
}

async function bootWeaponsPage() {
  await loadProfile()
  await refreshHunterBilletOnPageEnter()

  // Есть полный кэш списка — сразу показываем, но номер билета всё равно подтягиваем при необходимости
  if (hydrateWeaponsFromCache()) {
    await ensureHunterBilletLoaded()
    syncHunterBilletSnapshot()
    userWeaponsLoading.value = false
    await deferTask(240)
    ensureWeaponDictionaries()
    return
  }

  // Только старое число блоков — плейсхолдеры, один запрос для заполнения кэша
  cachedWeaponsCount.value = currentUserId()
    ? readUserWeaponsCountCache(currentUserId()!)
    : 0

  if (cachedWeaponsCount.value > 0) {
    userWeaponsLoading.value = true
  }

  await loadUserWeapons({ force: true })
  syncHunterBilletSnapshot()
  await deferTask(240)
  ensureWeaponDictionaries()
}

function addWeaponRow() {
  weapons.value.push(createEmptyWeapon())
}

function snapshotWeapon(weapon: UserWeapon) {
  return JSON.stringify({
    hunter_license_number: weapon.hunter_license_number.trim(),
    hunter_license_date: resolveLicenseDateForApi(weapon.hunter_license_date),
    weapon_type_id: String(weapon.weapon_type_id),
    caliber: String(weapon.caliber),
  })
}

function rememberWeaponSnapshots(weapons: UserWeapon[]) {
  const next: Record<number, string> = {}

  for (const weapon of weapons) {
    if (weapon.id != null && !weapon.isNew) {
      next[weapon.id] = snapshotWeapon(weapon)
    }
  }

  weaponSnapshots.value = next
}

function isWeaponDirty(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || weapon.id == null || isNewWeapon(weapon)) {
    return false
  }

  const snapshot = weaponSnapshots.value[weapon.id]

  if (!snapshot) {
    return false
  }

  return snapshot !== snapshotWeapon(weapon)
}

function showWeaponFieldErrors(weapon: UserWeapon, index: number) {
  return isNewWeapon(weapon) || isWeaponDirty(index)
}

function buildWeaponPayload(weapon: UserWeapon) {
  return {
    hunter_license_number: weapon.hunter_license_number.trim(),
    hunter_license_date: resolveLicenseDateForApi(weapon.hunter_license_date),
    weapon_type_id: weapon.weapon_type_id ? Number(weapon.weapon_type_id) : null,
    caliber_id: weapon.caliber ? Number(weapon.caliber) : null,
  }
}

function setLicenseDateFieldRef(index: number, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLElement) {
    licenseDateFieldRefs.set(index, el)
    return
  }

  licenseDateFieldRefs.delete(index)
}

function displayLicenseDate(value: string) {
  const parsed = parseBirthdayDate(value)
  return parsed ? formatBirthdayDate(parsed) : value
}

function toggleLicenseDateCalendar(index: number) {
  const weapon = weapons.value[index]

  if (!weapon) {
    return
  }

  if (openLicenseDateIndex.value === index) {
    openLicenseDateIndex.value = null
    return
  }

  openLicenseDateIndex.value = index
  licenseDate.value = parseBirthdayDate(weapon.hunter_license_date)
  licenseActivePart.value = 'start'
}

function onLicenseDateSelect(index: number, date: Date) {
  const weapon = weapons.value[index]

  if (!weapon) {
    return
  }

  licenseDate.value = date
  weapon.hunter_license_date = formatBirthdayDate(date)
  clearFieldError('hunter_license_date')
  openLicenseDateIndex.value = null
}

function getFieldError(field: WeaponField) {
  return fieldErrors.value[field]?.[0] || ''
}

function clearFieldError(field: WeaponField) {
  if (!fieldErrors.value[field]) {
    return
  }

  const nextErrors = { ...fieldErrors.value }
  delete nextErrors[field]
  fieldErrors.value = nextErrors
}

function getApiErrorPayload(source: unknown) {
  if (!source || typeof source !== 'object') {
    return null
  }

  const payload = source as {
    success?: boolean
    message?: string
    errors?: Record<string, string[]> | unknown[]
    error_code?: string
    code?: string
  }

  if (
    payload.success === false
    || payload.message
    || payload.error_code
    || payload.code
    || payload.errors
  ) {
    return payload
  }

  const nestedData = (source as { data?: unknown }).data

  if (nestedData && nestedData !== source) {
    return getApiErrorPayload(nestedData)
  }

  return null
}

function applyValidationErrors(data: unknown) {
  const response = getApiErrorPayload(data)

  if (!response) {
    return false
  }

  const normalized: Record<string, string[]> = {}
  const rawErrors = response.errors

  if (rawErrors && !Array.isArray(rawErrors)) {
    Object.assign(normalized, rawErrors)
  }

  if (Object.keys(normalized).length > 0) {
    fieldErrors.value = normalized
    submitError.value = ''
    return true
  }

  if (response.message) {
    fieldErrors.value = {}
    submitError.value = response.message
    return true
  }

  return false
}

function resolveLicenseDateForApi(value: string) {
  const parsed = parseBirthdayDate(value)
  return parsed ? formatApiDate(parsed) : value.trim()
}

function handleLicenseDateDocumentClick(event: MouseEvent) {
  const index = openLicenseDateIndex.value

  if (index == null) {
    return
  }

  const field = licenseDateFieldRefs.get(index)

  if (!field?.contains(event.target as Node)) {
    openLicenseDateIndex.value = null
  }
}

onMounted(async () => {
  await loadProfile()

  // Жёсткий уход на штатную 404 — без createError/navigateTo (они давали 500)
  if (isBaseAdmin.value) {
    window.location.replace('/404')
    return
  }

  void bootWeaponsPage()
  document.addEventListener('click', handleLicenseDateDocumentClick)
})

onActivated(() => {
  if (isBaseAdmin.value) {
    return
  }

  void refreshHunterBilletOnPageEnter()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleLicenseDateDocumentClick)
})


function stopSavePulse() {
  pulseUnsavedSave.value = false
  pulseNotificationId.value = null
}

watch(
  () => notifications.notifications.value,
  (list) => {
    if (!pulseNotificationId.value) {
      return
    }

    const stillOpen = list.some(item => item.id === pulseNotificationId.value)

    if (!stillOpen) {
      stopSavePulse()
    }
  },
)

function requestDeleteWeapon(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || savingWeaponIndex.value != null) {
    return
  }

  // Новая несохранённая строка — убираем сразу
  if (isNewWeapon(weapon)) {
    weapons.value.splice(index, 1)
    persistWeaponsCache(weapons.value)
    confirmDeleteIndex.value = null
    return
  }

  confirmDeleteIndex.value = index
}

function cancelDeleteConfirm() {
  confirmDeleteIndex.value = null
}

function beginWeaponSaving(index: number) {
  if (openLicenseDateIndex.value === index) {
    openLicenseDateIndex.value = null
  }

  savingWeaponIndex.value = index
  savingWeaponOverlayIndex.value = index
}

function finishWeaponSavingOverlay() {
  savingWeaponOverlayIndex.value = null
}

function clearWeaponSavingState() {
  savingWeaponIndex.value = null

  if (reloadWeaponsAfterSaving.value) {
    reloadWeaponsAfterSaving.value = false
    void loadUserWeapons({ force: true, silent: true })
  }
}

function markWeaponsReloadAfterSaving() {
  reloadWeaponsAfterSaving.value = true
}

async function confirmDeleteWeapon(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || weapon.id == null || savingWeaponIndex.value != null) {
    return
  }

  beginWeaponSaving(index)
  submitError.value = ''

  try {
    const response = await weaponsApi.deleteUserWeapon(weapon.id)

    if ('success' in response && response.success) {
      confirmDeleteIndex.value = null
      notifications.success('Лицензия на оружие удалена')
      markWeaponsReloadAfterSaving()
      return
    }

    submitError.value = ('message' in response && response.message)
      || 'Не удалось удалить оружие'
  } catch {
    submitError.value = 'Не удалось удалить оружие'
  } finally {
    finishWeaponSavingOverlay()
  }
}

async function saveWeapon(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || savingWeaponIndex.value != null) {
    return
  }

  beginWeaponSaving(index)
  stopSavePulse()

  try {
    const response = await weaponsApi.saveUserWeapon(buildWeaponPayload(weapon))

    if ('success' in response && response.success) {
      fieldErrors.value = {}
      submitError.value = ''
      notifications.success('Лицензия на оружие сохранена')
      markWeaponsReloadAfterSaving()
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось сохранить оружие'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось сохранить оружие'
    }
  } finally {
    finishWeaponSavingOverlay()
  }
}

async function updateWeapon(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || weapon.id == null || savingWeaponIndex.value != null) {
    return
  }

  beginWeaponSaving(index)

  try {
    const response = await weaponsApi.updateUserWeapon(weapon.id, buildWeaponPayload(weapon))

    if ('success' in response && response.success) {
      fieldErrors.value = {}
      submitError.value = ''
      notifications.success('Лицензия на оружие обновлена')
      markWeaponsReloadAfterSaving()
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = 'Не удалось обновить оружие'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = 'Не удалось обновить оружие'
    }
  } finally {
    finishWeaponSavingOverlay()
  }
}

function weaponKey(weapon: { id: number | null }, index: number) {
  return weapon.id != null ? `id-${weapon.id}` : `new-${index}`
}

function isWeaponExpanded(index: number) {
  const weapon = weapons.value[index]

  if (!weapon) {
    return false
  }

  if (isNewWeapon(weapon)) {
    return true
  }

  return expandedWeaponKeys.value.includes(weaponKey(weapon, index))
}

function toggleWeapon(index: number) {
  const weapon = weapons.value[index]

  if (!weapon || isNewWeapon(weapon)) {
    return
  }

  const key = weaponKey(weapon, index)

  if (expandedWeaponKeys.value.includes(key)) {
    expandedWeaponKeys.value = expandedWeaponKeys.value.filter(item => item !== key)
    if (openLicenseDateIndex.value === index) {
      openLicenseDateIndex.value = null
    }
    if (confirmDeleteIndex.value === index) {
      confirmDeleteIndex.value = null
    }
    return
  }

  confirmDeleteIndex.value = null
  ensureWeaponDictionaries()
  expandedWeaponKeys.value = [...expandedWeaponKeys.value, key]
}

function handleAddWeapon() {
  if (hasNewWeapon.value) {
    pulseUnsavedSave.value = true
    pulseNotificationId.value = notifications.warning(
      'Сначала сохраните или отмените текущую лицензию',
      'Нельзя добавить ещё одно оружие',
    )
    return
  }

  stopSavePulse()
  fieldErrors.value = {}
  submitError.value = ''
  ensureWeaponDictionaries()
  addWeaponRow()

  nextTick(() => {
    const cards = document.querySelectorAll('.profile-weapon')
    const last = cards[cards.length - 1] as HTMLElement | undefined
    last?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function handleCancelNewWeapon() {
  for (let index = weapons.value.length - 1; index >= 0; index -= 1) {
    const weapon = weapons.value[index]

    if (weapon && isNewWeapon(weapon)) {
      weapons.value.splice(index, 1)
      fieldErrors.value = {}
      submitError.value = ''
      stopSavePulse()
      return
    }
  }
}

async function saveHunterBillet() {
  if (!profile.value || savingHunterBillet.value || !showHunterBilletAction.value) {
    return
  }

  savingHunterBillet.value = true

  const wasUpdate = Boolean(hunterBilletSnapshot.value)
  const trimmed = profile.value.hunter_billet_number.trim()

  try {
    // Билет сохраняется через POST /user/weapons (можно только hunter_billet_number)
    const response = await weaponsApi.saveUserWeapon({
      hunter_billet_number: trimmed,
    })

    if ('success' in response && response.success) {
      clearFieldError('hunter_billet_number')
      submitError.value = ''
      // Сначала фиксируем в профиле и localStorage — GET может вернуть пусто (старый API / кэш auth)
      applyHunterBilletFromApi(trimmed)
      await loadUserWeapons({ force: true, silent: true })
      if (!profile.value?.hunter_billet_number.trim()) {
        applyHunterBilletFromApi(trimmed)
      }

      notifications.success(
        wasUpdate
          ? 'Номер охотничьего билета обновлён'
          : 'Номер охотничьего билета сохранён',
      )
      return
    }

    if (!applyValidationErrors(response)) {
      submitError.value = wasUpdate
        ? 'Не удалось обновить номер охотничьего билета'
        : 'Не удалось сохранить номер охотничьего билета'
    }
  } catch (error) {
    const data = (error as { data?: unknown }).data

    if (!applyValidationErrors(data)) {
      submitError.value = wasUpdate
        ? 'Не удалось обновить номер охотничьего билета'
        : 'Не удалось сохранить номер охотничьего билета'
    }
  } finally {
    savingHunterBillet.value = false
  }
}

function onHunterBilletKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter') {
    return
  }

  event.preventDefault()
  void saveHunterBillet()
}

function isNewWeapon(weapon: { id: number | null, isNew?: boolean }) {
  return Boolean(weapon.isNew)
}

const hasNewWeapon = computed(() =>
  weapons.value.some(weapon => isNewWeapon(weapon)),
)
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <AppBreadcrumbs :items="breadcrumbs" />

      <ProfileNotificationsBell />
    </header>

    <CommonPageTitle divider>Лицензия на оружие</CommonPageTitle>

    <p
      v-if="error && !profile"
      class="profile-page__status profile-page__status--error"
    >
      {{ error }}
    </p>

    <form
      v-else-if="profile || pending || userWeaponsLoading || cachedWeaponsCount > 0"
      class="weapons-form"
      :aria-busy="userWeaponsLoading || undefined"
      @submit.prevent
    >
      <div class="weapons-form__body">
        <div class="weapons-form__billet">
          <div
            v-if="profile"
            class="weapons-form__billet-row"
          >
            <CommonFormField
              id="hunter-billet"
              label="Номер охот. билета"
              placeholder="Например, А-12345678"
              no-margin
              document-number-kind="billet"
              v-model="profile.hunter_billet_number"
              :error="getFieldError('hunter_billet_number')"
              :disabled="savingHunterBillet"
              @update:model-value="clearFieldError('hunter_billet_number')"
              @keydown="onHunterBilletKeydown"
            />
            <CommonSpinner
              v-if="savingHunterBillet"
              class="weapons-form__billet-spinner"
              variant="ring"
              :size="18"
              :label="hunterBilletSnapshot ? 'Обновление номера билета' : 'Сохранение номера билета'"
            />
            <button
              v-else-if="showHunterBilletAction"
              type="button"
              class="weapons-form__billet-action"
              @click="saveHunterBillet"
            >
              {{ hunterBilletActionLabel }}
            </button>
          </div>
          <CommonFormField
            v-else
            label="Номер охот. билета"
            placeholder="Введите номер охотничьего билета"
            no-margin
            model-value=""
            readonly
          />
        </div>

        <p
          v-if="userWeaponsError && !weaponCards.length"
          class="profile-page__status profile-page__status--error"
        >
          {{ userWeaponsError }}
        </p>

        <div
          v-else-if="weaponCards.length"
          class="weapons-form__list"
          :aria-busy="showWeaponPlaceholders || undefined"
          aria-label="Лицензии на оружие"
        >
          <div
            v-for="(column, columnIndex) in weaponCardColumns"
            :key="`weapon-col-${columnIndex}`"
            class="weapons-form__column"
          >
          <article
            v-for="card in column"
            :key="card.key"
            class="profile-weapon"
            :class="{
              'profile-weapon--placeholder': card.loading,
              'profile-weapon--expanded': !card.loading && isWeaponExpanded(card.index),
              'profile-weapon--date-open': !card.loading && openLicenseDateIndex === card.index,
              'profile-weapon--saving': !card.loading && savingWeaponIndex === card.index,
            }"
          >
            <div
              v-if="card.loading"
              class="profile-weapon__toggle"
            >
              <h2 class="profile-weapon__title">Лицензия #{{ card.index + 1 }}</h2>
              <CommonSpinner
                class="profile-weapon__spinner"
                variant="ring"
                :size="16"
                :label="card.index === 0 ? 'Загрузка лицензий' : ''"
              />
            </div>

            <button
              v-else
              type="button"
              class="profile-weapon__toggle"
              :aria-expanded="isWeaponExpanded(card.index)"
              @click="toggleWeapon(card.index)"
            >
              <h2 class="profile-weapon__title">Лицензия #{{ card.index + 1 }}</h2>
              <svg
                class="profile-weapon__chevron"
                viewBox="0 0 12 8"
                aria-hidden="true"
              >
                <path
                  d="M1 2 6 6.5 11 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>

            <Transition v-if="!card.loading" name="weapon-content">
              <div v-if="isWeaponExpanded(card.index)" class="profile-weapon__content">
              <div
                :ref="(el) => setLicenseDateFieldRef(card.index, el)"
                class="profile-weapon__date-block"
              >
                <div class="profile-weapon__row">
                  <CommonFormField
                    label="Номер"
                    placeholder="Например, РК 12345678"
                    document-number-kind="license"
                    no-margin
                    :model-value="card.weapon.hunter_license_number"
                    :error="showWeaponFieldErrors(card.weapon, card.index) ? getFieldError('hunter_license_number') : ''"
                    @update:model-value="card.weapon.hunter_license_number = $event; clearFieldError('hunter_license_number')"
                  />
                  <CommonFormField
                    label="Дата"
                    placeholder="дд.мм.гггг"
                    no-margin
                    cursor-pointer
                    :model-value="displayLicenseDate(card.weapon.hunter_license_date)"
                    :error="showWeaponFieldErrors(card.weapon, card.index) ? getFieldError('hunter_license_date') : ''"
                    :open="openLicenseDateIndex === card.index"
                    readonly
                    @click.stop="toggleLicenseDateCalendar(card.index)"
                  >
                    <template #trailing>
                      <button
                        type="button"
                        class="profile-weapon__calendar-icon"
                        aria-label="Открыть календарь"
                        @click.stop="toggleLicenseDateCalendar(card.index)"
                      >
                        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                          <rect x="2.25" y="3.75" width="15.5" height="14" rx="1.75" stroke="currentColor" stroke-width="1.5" />
                          <path d="M2.25 8.25h15.5" stroke="currentColor" stroke-width="1.5" />
                          <path d="M6.5 2.25v3.25M13.5 2.25v3.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                        </svg>
                      </button>
                    </template>
                  </CommonFormField>
                </div>

                <div
                  v-if="openLicenseDateIndex === card.index"
                  class="profile-weapon__date-panel"
                  @click.stop
                >
                  <HomeHeroSearchDatePicker
                    v-model:start="licenseDate"
                    v-model:active-part="licenseActivePart"
                    mode="single"
                    @select="onLicenseDateSelect(card.index, $event)"
                  />
                </div>
              </div>

              <CommonSelectField
                v-model="card.weapon.weapon_type_id"
                label="Тип оружия"
                placeholder="Добавить оружие"
                :options="weaponTypes"
                :disabled="weaponTypesLoading || !weaponTypes.length"
                :error="showWeaponFieldErrors(card.weapon, card.index)
                  ? (getFieldError('weapon_type_id') || weaponTypesError)
                  : ''"
                @update:model-value="clearFieldError('weapon_type_id')"
              />

              <CommonSelectField
                v-model="card.weapon.caliber"
                label="Калибр"
                placeholder="Добавить калибр"
                :options="calibers"
                :disabled="calibersLoading || !calibers.length"
                :error="showWeaponFieldErrors(card.weapon, card.index)
                  ? (getFieldError('caliber_id') || calibersError)
                  : ''"
                @update:model-value="clearFieldError('caliber_id')"
              />

              <p
                v-if="showWeaponFieldErrors(card.weapon, card.index) && submitError"
                class="profile-weapon__submit-error"
              >
                {{ submitError }}
              </p>

              <div class="profile-weapon__footer">
                <button
                  v-if="isNewWeapon(card.weapon)"
                  type="button"
                  class="profile-weapon__action"
                  :class="{ 'profile-weapon__action--pulse': pulseUnsavedSave }"
                  :disabled="savingWeaponIndex === card.index"
                  @click="saveWeapon(card.index)"
                >
                  Сохранить
                </button>
                <template v-else-if="confirmDeleteIndex === card.index">
                  <span class="profile-weapon__confirm-text">Удалить лицензию?</span>
                  <button
                    type="button"
                    class="profile-weapon__action"
                    :disabled="savingWeaponIndex === card.index"
                    @click="confirmDeleteWeapon(card.index)"
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    class="profile-weapon__confirm-cancel"
                    :disabled="savingWeaponIndex === card.index"
                    @click="cancelDeleteConfirm"
                  >
                    Отмена
                  </button>
                </template>
                <template v-else>
                  <button
                    v-if="isWeaponDirty(card.index)"
                    type="button"
                    class="profile-weapon__action"
                    :disabled="savingWeaponIndex === card.index"
                    @click="updateWeapon(card.index)"
                  >
                    Обновить
                  </button>
                  <button
                    type="button"
                    class="profile-weapon__action profile-weapon__action--delete"
                    :disabled="savingWeaponIndex === card.index"
                    @click="requestDeleteWeapon(card.index)"
                  >
                    Удалить
                  </button>
                </template>
              </div>

              <Transition name="weapon-saving-fade" @after-leave="clearWeaponSavingState">
                <div
                  v-if="savingWeaponOverlayIndex === card.index"
                  class="profile-weapon__saving-overlay"
                  aria-hidden="true"
                >
                  <CommonSpinner
                    variant="ring"
                    :size="28"
                    label="Сохранение лицензии"
                  />
                </div>
              </Transition>
              </div>
            </Transition>
          </article>
          </div>
        </div>

        <p
          v-if="!userWeaponsLoading && !weapons.length && !hasNewWeapon"
          class="weapons-form__empty"
        >
          Вы еще не добавили ни одной лицензии
        </p>

        <div class="weapons-form__add-wrap">
          <div class="weapons-form__add-actions">
            <CommonSaveButton
              type="button"
              :disabled="userWeaponsLoading"
              @click="handleAddWeapon"
            >
              Добавить оружие
            </CommonSaveButton>
            <button
              v-if="!userWeaponsLoading && hasNewWeapon"
              type="button"
              class="weapons-form__cancel"
              @click="handleCancelNewWeapon"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.profile-page {
  padding: 20px 40px 16px;
  font-family: 'Inter', 'Manrope', system-ui, sans-serif;
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 896px;
  max-width: 100%;
  height: 31px;
  margin-bottom: 20px;
  padding: 0;
  box-sizing: border-box;
  overflow: visible;
}

.profile-page__status {
  margin: 0;
  color: var(--wh-gray-600);
}

.profile-page__status--error {
  color: var(--wh-field-error);
}

.weapons-form {
  width: 896px;
  max-width: 100%;
}

.weapons-form__body {
  width: 100%;
  max-width: 896px;
}

.weapons-form__billet {
  width: 896px;
  max-width: 100%;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);
  box-sizing: border-box;
}

.weapons-form__billet-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  width: 100%;
}

.weapons-form__billet-row :deep(.form-field) {
  /* Как одна карточка лицензии в двухколоночной сетке */
  flex: 0 0 calc((100% - 12px) / 2);
  width: calc((100% - 12px) / 2);
  max-width: calc((100% - 12px) / 2);
  min-width: 0;
}

.weapons-form__billet-action {
  flex-shrink: 0;
  margin-bottom: 14px;
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.weapons-form__billet-action:hover {
  color: var(--wh-orange-600);
}

.weapons-form__billet-spinner {
  flex-shrink: 0;
  margin-bottom: 14px;
  margin-left: 8px;
}

.weapons-form__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
  margin-bottom: 24px;
}

.weapons-form__column {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.profile-weapon--placeholder {
  pointer-events: none;
}

.profile-weapon--placeholder .profile-weapon__toggle {
  cursor: default;
}

.profile-weapon__spinner {
  flex-shrink: 0;
}

.weapon-list-enter-active,
.weapon-list-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.weapon-list-enter-from,
.weapon-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.weapon-list-move {
  transition: transform 0.35s ease;
}

.profile-weapon {
  position: relative;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--wh-field-border);
  border-radius: 12px;
  background: var(--wh-white);
  box-sizing: border-box;
  overflow: visible;
  transition: border-color 0.15s ease;
}

.profile-weapon--expanded {
  border-color: var(--wh-field-border-active);
}

.profile-weapon--saving {
  pointer-events: none;
  user-select: none;
}

.profile-weapon__saving-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0 0 12px 12px;
  pointer-events: none;
  background: rgba(255, 255, 255, 0.5);
  will-change: opacity;
}

.weapon-saving-fade-enter-active {
  transition: opacity 0.2s ease;
}

.weapon-saving-fade-leave-active {
  transition: opacity 0.4s ease;
}

.weapon-saving-fade-enter-from,
.weapon-saving-fade-leave-to {
  opacity: 0;
}

.profile-weapon--date-open {
  z-index: 40;
}

.profile-weapon__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.profile-weapon__title {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 120%;
  color: var(--wh-gray-900);
}

.profile-weapon__chevron {
  flex-shrink: 0;
  width: 12px;
  height: 8px;
  color: #1c211c;
  transition: transform 0.2s ease;
}

.profile-weapon--expanded .profile-weapon__chevron {
  transform: rotate(180deg);
}

.profile-weapon__content {
  position: relative;
  padding: 0 20px 20px;
}

.weapon-content-enter-active,
.weapon-content-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}

.weapon-content-enter-from,
.weapon-content-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .weapon-list-enter-active,
  .weapon-list-leave-active,
  .weapon-list-move,
  .weapon-content-enter-active,
  .weapon-content-leave-active,
  .profile-weapon__chevron {
    transition: none;
  }
}

.profile-weapon__submit-error {
  margin: 0 0 8px;
  font-family: "Inter", "Manrope", system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1.35;
  color: var(--wh-field-error);
}

.profile-weapon__footer {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.profile-weapon__confirm-text {
  color: var(--wh-gray-900);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 500;
  line-height: 120%;
}

.profile-weapon__confirm-cancel {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.profile-weapon__confirm-cancel:hover:not(:disabled) {
  color: var(--wh-orange-600);
}

.profile-weapon__confirm-cancel:disabled {
  opacity: 0.7;
  cursor: default;
}

.profile-weapon__action {
  padding: 0;
  border: none;
  background: none;
  color: var(--wh-orange-text);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 120%;
  cursor: pointer;
  transition: color 0.15s ease;
}

.profile-weapon__action:hover:not(:disabled) {
  color: var(--wh-orange-600);
}

.profile-weapon__action--delete {
  padding: 7px 16px;
  border-radius: 999px;
  background: #dc3545;
  color: var(--wh-white);
}

.profile-weapon__action--delete:hover:not(:disabled) {
  background: #c82333;
  color: var(--wh-white);
}

.profile-weapon__action:disabled {
  opacity: 0.7;
  cursor: default;
}

.profile-weapon__action--pulse {
  animation: profile-weapon-save-pulse 1.6s ease-in-out infinite;
}

.profile-weapon__action--pulse:hover {
  animation: none;
}

@keyframes profile-weapon-save-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.06);
  }
}

@media (prefers-reduced-motion: reduce) {
  .profile-weapon__action--pulse {
    animation: none;
  }
}

.profile-weapon__date-block {
  position: relative;
  z-index: 1;
  margin-bottom: 16px;
}

.profile-weapon--date-open .profile-weapon__date-block {
  z-index: 60;
}

.profile-weapon__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.profile-weapon__calendar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--wh-gray-400);
  cursor: pointer;
}

.profile-weapon__calendar-icon:disabled {
  cursor: default;
  opacity: 0.6;
}

.profile-weapon__calendar-icon svg {
  display: block;
  width: 20px;
  height: 20px;
}

.profile-weapon__date-panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 60;
  width: 100%;
  padding: 18px 20px;
  border: 1px solid var(--wh-gray);
  border-radius: 0;
  background: var(--wh-white);
  box-shadow: 0 12px 28px rgb(28 33 28 / 12%);
  box-sizing: border-box;
}

.weapons-form__empty {
  margin: 0 0 16px;
  width: 100%;
  color: var(--wh-gray-600);
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 130%;
  text-align: center;
  white-space: nowrap;
}

.weapons-form__add-wrap {
  width: 100%;
  max-width: 520px;
  margin-top: 0;
  box-sizing: border-box;
}

.weapons-form__add-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.weapons-form__cancel {
  padding: 0;
  border: none;
  background: none;
  color: #dc3545;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s ease;
}

.weapons-form__cancel:hover {
  color: #c82333;
}

@media (--wh-tablet) {
  .profile-page {
    padding: 12px 8px 32px;
  }

  .profile-page__header {
    width: 100%;
  }
}

@media (--wh-mobile) {
  .profile-page__header {
    height: auto;
    min-height: 31px;
    padding: 0;
    background: transparent;
    border-radius: 0;
  }

  .weapons-form__list {
    grid-template-columns: 1fr;
  }

  .weapons-form__billet-row :deep(.form-field) {
    flex: 1 1 auto;
    width: 100%;
    max-width: none;
  }

  .profile-weapon__row {
    grid-template-columns: 1fr;
  }

  .weapons-form__add-wrap :deep(.save-button) {
    width: 346px;
    min-width: 346px;
  }
}
</style>
