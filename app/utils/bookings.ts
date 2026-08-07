import type { BookingHistoryItem } from '~/types/booking'

export const MOCK_MY_BOOKINGS: BookingHistoryItem[] = [
  {
    id: 1,
    code: 'mock-1',
    number: '222',
    date: '03.03.26',
    baseName: 'Хромой кабан 2',
    baseUrl: '/hotel/1',
    type: 'hotel',
    typeLabel: 'Проживание',
    accommodation: {
      checkIn: '03.03.26',
      checkOut: '06.03.26',
      nights: 3,
      guests: 1,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    status: {
      label: 'Обработка',
    },
    actions: [
      { id: 'cancel_booking', label: 'Отменить бронь', variant: 'danger' },
    ],
  },
  {
    id: 2,
    code: 'mock-2',
    number: '222',
    date: '03.03.26',
    baseName: 'Хромой кабан 2',
    baseUrl: '/hotel/1',
    type: 'hotel_animal',
    typeLabel: 'Проживание Охота',
    accommodation: {
      checkIn: '03.03.26',
      checkOut: '06.03.26',
      nights: 3,
      guests: 1,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    hunt: {
      date: '04.03.26',
      animal: 'Кабан',
      hunters: 1,
    },
    status: {
      label: 'Сбор охотников',
      timer: '47 ч 12 мин',
      collected: 'Собрано 1/3',
    },
    actions: [
      { id: 'open_collection', label: 'Сбор', variant: 'success' },
      { id: 'cancel_booking', label: 'Отменить бронь', variant: 'danger' },
    ],
  },
  {
    id: 3,
    code: 'mock-3',
    number: '222',
    date: '03.03.26',
    baseName: 'Хромой кабан 2',
    baseUrl: '/hotel/1',
    type: 'hotel_animal',
    typeLabel: 'Проживание Охота',
    accommodation: {
      checkIn: '03.03.26',
      checkOut: '06.03.26',
      nights: 3,
      guests: 2,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    hunt: {
      date: '04.03.26',
      animal: 'Кабан',
      hunters: 2,
    },
    status: {
      label: 'Предоплата собрана',
      subStatus: 'Сбор завершён',
      collected: 'Собрано 2/2',
      paid: 'Оплачено 2/2',
    },
    paymentAction: 'Калькуляция',
    actions: [
      { id: 'select_seat', label: 'Выбрать место', variant: 'success' },
      { id: 'add_services', label: 'Добавить услуги', variant: 'success' },
    ],
  },
  {
    id: 4,
    code: 'mock-4',
    number: '222',
    date: '03.03.26',
    baseName: 'Хромой кабан 2',
    baseUrl: '/hotel/1',
    type: 'hotel_animal',
    typeLabel: 'Проживание Охота',
    accommodation: {
      checkIn: '03.03.26',
      checkOut: '06.03.26',
      nights: 3,
      guests: 2,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    hunt: {
      date: '04.03.26',
      animal: 'Кабан',
      hunters: 2,
    },
    status: {
      label: 'Распределение мест',
      subStatus: 'Предоплата собрана',
      collected: 'Собрано 2/2',
      paid: 'Оплачено 2/2',
    },
    paymentAction: 'Калькуляция',
    actions: [
      { id: 'select_seat', label: 'Выбрать место', variant: 'success' },
      { id: 'add_services', label: 'Добавить услуги', variant: 'success' },
    ],
  },
]

export const MOCK_INVITATION_BOOKINGS: BookingHistoryItem[] = [
  {
    id: 101,
    code: 'mock-101',
    number: '198',
    date: '28.02.26',
    baseName: 'Охотбаза «Сосновый бор»',
    baseUrl: '/hotel/2',
    type: 'hotel_animal',
    typeLabel: 'Проживание Охота',
    accommodation: {
      checkIn: '15.03.26',
      checkOut: '18.03.26',
      nights: 3,
      guests: 4,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    hunt: {
      date: '16.03.26',
      animal: 'Лось',
      hunters: 4,
    },
    status: {
      label: 'Приглашение',
      subStatus: 'Ожидает ответа',
    },
    actions: [
      { id: 'open_invitation', label: 'Открыть приглашение', variant: 'primary' },
    ],
    isInvitation: true,
  },
  {
    id: 102,
    code: 'mock-102',
    number: '175',
    date: '20.02.26',
    baseName: 'Хромой кабан 2',
    baseUrl: '/hotel/1',
    type: 'hotel',
    typeLabel: 'Проживание',
    accommodation: {
      checkIn: '10.03.26',
      checkOut: '13.03.26',
      nights: 3,
      guests: 3,
      roomsTotal: 1,
      rooms: [
        {
          name: 'Коттедж «Прованс»',
          capacity: 8,
          quantity: 1,
          pricePerDay: 69000,
        },
      ],
    },
    status: {
      label: 'Сбор охотников',
      timer: '12 ч 45 мин',
      collected: 'Собрано 2/3',
    },
    actions: [
      { id: 'open_collection', label: 'Открыть сбор', variant: 'success' },
    ],
    isInvitation: true,
  },
]

export function getBookingsByTab(tab: 'my' | 'invitations'): BookingHistoryItem[] {
  return tab === 'invitations' ? MOCK_INVITATION_BOOKINGS : MOCK_MY_BOOKINGS
}
