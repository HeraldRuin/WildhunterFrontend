<script setup lang="ts">
const columns = [
  'Мы рады приветствовать вас на нашем сайте, созданном для объединения охотников и владельцев охотничьих хозяйств по всей России. На платформе wild-hunter.ru вы можете: Планировать индивидуальные и групповые охоты с учётом ваших предпочтений. Бронировать проживание, питание и дополнительные услуги напрямую у охотхозяйств. Выбирать регионы и сезоны охоты, а также виды животных для добычи. Устанавливать прямые контакты с охотхозяйствами без посредников и дополнительных комиссий. Для охотхозяйств мы предлагаем: Эффективный канал для привлечения новых клиентов и увеличения загрузки базы. Полную автоматизацию процесса бронирования и организации охотничьих туров. Возможность приёма платежей через наши офисы в Москве и онлайн-системы.',
  'Wild Hunter — это также сообщество настоящих охотников, объединенных общей страстью. Мы предлагаем уникальные инструменты для организации охоты, делая процесс более удобным и эффективным. Присоединяйтесь к нам и станьте частью новой эры охоты в России. Мы предоставляем охотникам инструменты для самостоятельной организации охоты, включая выбор охотничьих угодий, согласование условий и управление участниками. Это позволяет создавать мероприятия, полностью соответствующие предпочтениям и требованиям охотников. Платформа обеспечивает полную прозрачность финансовых операций, связанных с организацией охоты. Все расходы и платежи фиксируются в системе, что позволяет участникам видеть распределение средств и избегать недоразумений.',
]
</script>

<template>
  <section class="project-description">
    <div class="container">
      <div class="project-description__frame">
        <h2 class="project-description__title">Описание проекта</h2>

        <div class="project-description__grid">
          <p
            v-for="(text, index) in columns"
            :key="index"
            class="project-description__text"
          >
            {{ text }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.project-description {
  padding-block: 8px 0;
  background: #52714f;
}

.project-description__frame {
  padding: clamp(28px, 4vw, 40px);
}

.project-description__title {
  margin: 0 auto clamp(28px, 4vw, 36px);
  max-width: 455px;
  font-family: 'UNCAGE', 'Manrope', system-ui, sans-serif;
  font-size: 44px;
  font-weight: 400;
  line-height: 1.1;
  letter-spacing: -0.05em;
  text-align: center;
  color: #ffffff;
}

.project-description__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(24px, 4vw, 48px);
}

.project-description__text {
  margin: 0;
  max-width: 592px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.05em;
  color: #ffffff;
}

@media (--wh-tablet) {
  .project-description__grid {
    grid-template-columns: 1fr;
    gap: 24px;
    max-width: 640px;
    margin-inline: auto;
  }
}
</style>
