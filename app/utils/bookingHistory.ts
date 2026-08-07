import type { BookingHistoryActionDto, BookingHistoryItemDto } from '~/types/api'
import type {
  BookingAction,
  BookingActionId,
  BookingActionVariant,
  BookingHistoryItem,
  BookingType,
} from '~/types/booking'
import { formatDisplayDate, parseBirthdayDate } from '~/utils/date'

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

function formatRemainingTimer(endAt: string | null | undefined) {
  if (!endAt) return undefined

  const end = new Date(endAt).getTime()
  if (Number.isNaN(end)) return undefined

  const diffMs = end - Date.now()
  if (diffMs <= 0) return '0 мин'

  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, '0')} мин`
  }

  return `${minutes} мин`
}

function mapType(type: string): BookingType {
  if (type === 'hotel' || type === 'hotel_animal' || type === 'animal') {
    return type
  }

  return 'hotel'
}

function mapActions(actions: BookingHistoryActionDto[]): {
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
      label: action.label,
      variant: ACTION_VARIANT_MAP[action.code] ?? 'success',
    })
  }

  return { actions: mapped, paymentAction }
}

function buildStatus(item: BookingHistoryItemDto) {
  const status = item.status
  const collection = item.collection
  const result: BookingHistoryItem['status'] = {
    label: item.status_label || item.status_for_user || item.status,
  }

  if (status === 'collection') {
    result.timer = formatRemainingTimer(collection.collection_end_at)
      || (item.hotel?.collection_timer_hours
        ? `${item.hotel.collection_timer_hours} ч`
        : undefined)
    if (collection.total_needed > 0) {
      result.collected = `Собрано ${collection.accepted_count}/${collection.total_needed}`
    }
  }

  if (status === 'prepayment_collection') {
    result.timer = formatRemainingTimer(collection.paid_end_at)
      || (item.hotel?.paid_timer_hours ? `${item.hotel.paid_timer_hours} ч` : undefined)
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
    }
    if (status === 'bed_collection') {
      result.subStatus = 'Предоплата собрана'
      result.timer = formatRemainingTimer(collection.beds_end_at)
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

export function mapBookingHistoryItem(item: BookingHistoryItemDto): BookingHistoryItem {
  const type = mapType(item.type)
  const { actions, paymentAction } = mapActions(item.available_actions || [])
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

  return {
    id: item.id,
    code: item.code,
    number: String(item.booking_number ?? item.id),
    date: formatHistoryDate(item.created_at),
    baseName: item.hotel?.title || '—',
    type,
    typeLabel: item.type_text || item.type,
    accommodation,
    hunt,
    status: buildStatus(item),
    paymentAction,
    actions,
    isInvitation: Boolean(item.is_invited),
  }
}
