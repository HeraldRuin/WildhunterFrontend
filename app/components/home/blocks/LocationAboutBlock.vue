<script setup lang="ts">
import { formatLocationInPrepositional } from '~/utils/location'

const props = withDefaults(defineProps<{
  locationName?: string
  title?: string
}>(), {
  locationName: '',
  title: undefined,
})

const heading = computed(() => {
  if (props.title) {
    return props.title
  }

  const region = formatLocationInPrepositional(props.locationName)

  return region
    ? `Об охоте в ${region}`
    : 'Об охоте'
})

const paragraphs = [
  'Мы рады приветствовать вас на нашем сайте, созданном для объединения охотников и владельцев охотничьих хозяйств по всей России. На платформе wild-hunter.ru вы можете: Планировать индивидуальные и групповые охоты с учётом ваших предпочтений. Бронировать проживание, питание и дополнительные услуги напрямую у охотхозяйств. Выбирать регионы и сезоны охоты, а также виды животных для добычи. Устанавливать прямые контакты с охотхозяйствами без посредников и дополнительных комиссий. Для охотхозяйств мы предлагаем: Эффективный канал для привлечения новых клиентов и увеличения загрузки базы. Полную автоматизацию процесса бронирования и организации охотничьих туров. Возможность приёма платежей через наши офисы в Москве и онлайн-системы.',
  'Мы рады приветствовать вас на нашем сайте, созданном для объединения охотников и владельцев охотничьих хозяйств по всей России. На платформе wild-hunter.ru вы можете: Планировать индивидуальные и групповые охоты с учётом ваших предпочтений. Бронировать проживание, питание и дополнительные услуги напрямую у охотхозяйств. Выбирать регионы и сезоны охоты, а также виды животных для добычи. Устанавливать прямые контакты с охотхозяйствами без посредников и дополнительных комиссий. Для охотхозяйств мы предлагаем: Эффективный канал для привлечения новых клиентов и увеличения загрузки базы. Полную автоматизацию процесса бронирования и организации охотничьих туров. Возможность приёма платежей через наши офисы в Москве и онлайн-системы.',
]
</script>

<template>
  <section class="location-about">
    <div class="container location-about__inner">
      <h2 class="location-about__title">
        {{ heading }}
      </h2>

      <div class="location-about__content">
        <p
          v-for="(text, index) in paragraphs"
          :key="index"
          class="location-about__text"
        >
          {{ text }}
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.location-about {
  background: var(--wh-green);
  padding: 80px 0;
}

.location-about__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.location-about__title {
  margin: 0;
  max-width: 900px;
  font-family: "UNCAGE", sans-serif;
  font-size: 40px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.03em;
  text-align: center;
  text-transform: uppercase;
  color: var(--wh-white);
}

.location-about__content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: min(100%, 920px);
}

.location-about__text {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 130%;
  letter-spacing: -0.02em;
  color: rgba(255, 255, 255, 0.92);
}

@media (--wh-tablet) {
  .location-about {
    padding: 64px 0;
  }

  .location-about__title {
    font-size: 32px;
  }
}

@media (--wh-mobile) {
  .location-about {
    padding: 48px 0;
  }

  .location-about__inner {
    gap: 28px;
  }

  .location-about__title {
    font-size: 24px;
    letter-spacing: 0.04em;
  }

  .location-about__text {
    font-size: 16px;
  }
}
</style>
