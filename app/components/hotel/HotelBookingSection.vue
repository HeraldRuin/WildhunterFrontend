<script setup lang="ts">
const props = withDefaults(defineProps<{
  /** Ширина всего блока, например `100%`, `90%`, `720px` */
  width?: string
  /** Ширина внутренних форм (поля и кнопка) */
  blocksWidth?: string
}>(), {
  width: '90%',
  blocksWidth: '100%',
})

const emit = defineEmits<{
  book: []
}>()

const route = useRoute()

const sectionStyle = computed(() => ({
  width: props.width,
  '--hotel-booking-blocks-width': props.blocksWidth,
}))

const confirmationPath = computed(() => {
  const location = String(route.params.location || '')
  const slug = String(route.params.slug || '')

  if (!location || !slug) {
    return '/'
  }

  return `/hotel/${location}/${slug}/confirmation`
})

function handleBook() {
  emit('book')
  void navigateTo(confirmationPath.value)
}
</script>

<template>
  <section class="hotel-booking-section" :style="sectionStyle">
    <div class="hotel-booking-section__card">
      <div class="hotel-booking-section__blocks">
        <HotelDatesGuests />
        <HotelAnimalsSearch />
      </div>

      <HotelRoomSelection />

      <button
        type="button"
        class="hotel-booking-section__book"
        @click="handleBook"
      >
        Забронировать сейчас
      </button>
    </div>
  </section>
</template>

<style scoped>
.hotel-booking-section {
  max-width: 100%;
  margin-inline: auto;
}

.hotel-booking-section__card {
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
  padding: 24px;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-white);
}

.hotel-booking-section__blocks {
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.hotel-booking-section__book {
  display: flex;
  align-items: center;
  justify-content: center;
  width: min(100%, var(--hotel-booking-blocks-width, 100%));
  height: 81px;
  margin-inline: auto;
  padding: 0 24px;
  border: none;
  border-radius: var(--wh-radius-lg);
  background: var(--wh-green);
  color: var(--wh-white);
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.15s ease, transform 0.15s ease;
}

.hotel-booking-section__book:hover {
  background: color-mix(in srgb, var(--wh-green) 78%, white);
  transform: translateY(-1px);
}

@media (--wh-tablet) {
  .hotel-booking-section {
    width: 100% !important;
  }

  .hotel-booking-section__card {
    padding: 20px 12px;
    gap: 24px;
  }

  .hotel-booking-section__blocks {
    gap: 48px;
  }
}

@media (--wh-mobile) {
  .hotel-booking-section {
    width: 100% !important;
  }

  .hotel-booking-section__card {
    padding: 16px 12px;
    gap: 20px;
    border-radius: var(--wh-radius-lg);
  }

  .hotel-booking-section__blocks {
    gap: 32px;
  }
}
</style>
