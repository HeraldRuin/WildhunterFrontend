import type { BookingHistoryActionDto, BookingHistoryItemDto } from '~/types/api'
import type {
  BookingAction,
  BookingActionId,
  BookingActionVariant,
  BookingHistoryItem,
  BookingType,
} from '~/types/booking'
import { formatDisplayDate, parseBirthdayDate } from '~/utils/date'
import { getHotelPath } from '~/utils/hotel'

const ACTION_ID_MAP: Record<string, BookingActionId> = {
  cancel: 'cancel_booking',
  confirm: 'confirm_booking',
  open_collection: 'open_collection',
  start_collection: 'start_collection',
  open_invitation: 'open_invitation',
  select_place: 'select_seat',
  add_services: 'add_services',
  prepayment: 'prepayment',
  calculating: 'calculating',
}

const ACTION_VARIANT_MAP: Record<string, BookingActionVariant> = {
  cancel: 'danger',
  confirm: 'success',
  open_collection: 'success',
  start_collection: 'success',
  open_invitation: 'primary',
  select_place: 'success',
  add_services: 'success',
  prepayment: 'primary',
}

function formatHistoryDate(value: string | null | undefined) {
  if (!value) return ''

  const parsed = parseBirthdayDate(value)
  return parsed ? formatDisplayDate(parsed) : value
}

function formatRemainingTimer(endAt: string | null | undefined, now: number) {
  if (!endAt) return undefined

  const end = new Date(endAt).getTime()
  if (Number.isNaN(end)) return undefined

  const diffMs = end - now
  if (diffMs <= 0) return '00 мин 00 сек'

  const totalSeconds = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, '0')} мин ${String(seconds).padStart(2, '0')} сек`
  }

  return `${minutes} мин ${String(seconds).padStart(2, '0')} сек`
}

function mapType(type: string): BookingType {
  if (type === 'hotel' || type === 'hotel_animal' || type === 'animal') {
    return type
  }

  return 'hotel'
}

function mapActions(
  actions: BookingHistoryActionDto[],
  status: string,
  isAcceptedInvitation = false,
): {
  actions: BookingAction[]
  paymentAction?: string
} {
  const mapped: BookingAction[] = []
  let paymentAction: string | undefined

  for (const action of actions) {
    if (action.code === 'calculating') {
      paymentAction = action.label || 'Калькуляция'
      continue
    }

    mapped.push({
      id: ACTION_ID_MAP[action.code],
      label:
        action.code === 'open_collection' || action.code === 'start_collection'
          ? (isAcceptedInvitation || status === 'prepayment_collection'
              ? 'Сбор охотников'
              : 'Собрать охотников')
          : action.label,
      variant: ACTION_VARIANT_MAP[action.code] ?? 'success',
    })
  }

  return { actions: mapped, paymentAction }
}

function buildStatus(item: BookingHistoryItemDto, now: number) {
  const status = item.status
  const collection = item.collection
  const result: BookingHistoryItem['status'] = {
    code: status,
    label: item.status_label || item.status_for_user || item.status,
  }

  if (status === 'collection') {
    result.timerEndAt = collection.collection_end_at || undefined
    result.timerHours = item.hotel?.collection_timer_hours || undefined
    result.timer = formatRemainingTimer(collection.collection_end_at, now)
      || (item.hotel?.collection_timer_hours
        ? `${item.hotel.collection_timer_hours} ч`
        : undefined)
    if (collection.total_needed > 0) {
      result.collected = `Собрано ${collection.accepted_count}/${collection.total_needed}`
    }
  }

  if (status === 'prepayment_collection') {
    result.subStatus = 'Сбор завершен'
    result.timerHours = item.hotel?.paid_timer_hours || undefined
    result.timer = collection.paid_end_at
      ? formatRemainingTimer(collection.paid_end_at, now) || '00 мин 00 сек'
      : '00 мин 00 сек'
    if (collection.accepted_count > 0) {
      result.paid = `Оплачено ${collection.paid_count}/${collection.accepted_count}`
    }
    if (collection.total_needed > 0) {
      result.collected = `Собрано ${collection.accepted_count}/${collection.total_needed}`
    }
  }

  if (status === 'finish_prepayment' || status === 'bed_collection' || status === 'finish_bed_collection') {
    if (status === 'finish_prepayment') {
      result.subStatus = 'Сбор завершён'
      result.timer = '00 мин 00 сек'
    }
    if (status === 'bed_collection') {
      result.subStatus = 'Предоплата собрана'
      result.timer = formatRemainingTimer(collection.beds_end_at, now)
        || (item.hotel?.bed_timer_hours ? `${item.hotel.bed_timer_hours} ч` : undefined)
    }
    if (collection.total_needed > 0) {
      result.collected = `Собрано ${collection.accepted_count}/${collection.total_needed}`
    }
    if (collection.accepted_count > 0) {
      result.paid = `Оплачено ${collection.paid_count}/${collection.accepted_count}`
    }
  }

  if (status === 'finished_collection' && collection.total_needed > 0) {
    result.collected = `Собрано ${collection.accepted_count}/${collection.total_needed}`
  }

  return result
}

export function mapBookingHistoryItem(
  item: BookingHistoryItemDto,
  fallback?: {
    hotelSlug?: string | null
    locationSlug?: string | null
  },
  now = Date.now(),
): BookingHistoryItem {
  const type = mapType(item.type)
  const { actions, paymentAction } = mapActions(
    item.available_actions || [],
    item.status,
    Boolean(item.is_invited && item.invitation_accepted),
  )
  const details = item.details
  const rooms = details.rooms || []

  const accommodation = type === 'animal'
    ? undefined
    : {
        checkIn: formatHistoryDate(details.start_date),
        checkOut: formatHistoryDate(details.end_date),
        nights: details.duration_days || 0,
        guests: details.total_guests || 0,
        roomsTotal: rooms.reduce((sum, room) => sum + (room.number || 0), 0) || rooms.length,
        rooms: rooms.map(room => ({
          name: room.title || 'Номер',
          capacity: room.adults || 0,
          quantity: room.number || 0,
          pricePerDay: room.price || 0,
        })),
      }

  const hunt = type === 'hotel'
    ? undefined
    : details.animal || details.start_date_animal
      ? {
          date: formatHistoryDate(details.start_date_animal),
          animal: details.animal?.title || '—',
          hunters: Number(details.total_hunting) || 0,
        }
      : undefined

  const hotelSlug = String(
    item.hotel?.slug || fallback?.hotelSlug || '',
  ).trim()
  const locationSlug = String(
    item.hotel?.location?.slug
    || item.location?.slug
    || fallback?.locationSlug
    || '',
  ).trim()
  const customerName = [
    item.creator?.first_name,
    item.creator?.last_name,
  ].filter(Boolean).join(' ')
    || item.creator?.user_name
    || item.creator?.email
    || '—'

  return {
    id: item.id,
    code: item.code,
    number: String(item.booking_number ?? item.id),
    date: formatHistoryDate(item.created_at),
    baseName: item.hotel?.title || '—',
    baseUrl: hotelSlug && locationSlug
      ? getHotelPath(locationSlug, hotelSlug)
      : undefined,
    customerName,
    type,
    typeLabel: item.type_text || item.type,
    accommodation,
    hunt,
    status: buildStatus(item, now),
    paymentAction,
    actions,
    isMasterHunter: Boolean(item.is_master_hunter),
    isInvitation: Boolean(item.is_invited),
    invitationAccepted: Boolean(item.invitation_accepted),
    invitationAcceptedAt: item.invitation_accepted_at || undefined,
    collectionInvitations: (item.collection.invitations || []).map(invitation => ({
      invitationId: invitation.invitation_id,
      hunterId: invitation.hunter_id,
      userName: invitation.user_name || undefined,
      name: invitation.name,
      email: invitation.email || undefined,
      status: invitation.status,
      isAccepted: invitation.is_accepted,
      prepaymentPaid: Boolean(invitation.prepayment_paid),
      prepaymentPaidStatus: invitation.prepayment_paid_status || undefined,
    })),
    collectionUrl: item.invitation_url || undefined,
  }
}
