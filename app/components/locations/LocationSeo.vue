<script setup lang="ts">
import type { LocationSeoContent } from '~/content/location-seo/types'

defineProps<{
  content: LocationSeoContent
}>()
</script>

<template>
  <div class="location-seo">
    <section class="location-seo__intro">
      <div class="container location-seo__intro-inner">
        <h1 class="location-seo__title">
          {{ content.introTitle }}
        </h1>
        <div class="location-seo__intro-copy">
          <p
            v-for="paragraph in content.introParagraphs"
            :key="paragraph"
          >
            {{ paragraph }}
          </p>
        </div>
      </div>
    </section>

    <section
      v-for="section in content.sections"
      :key="section.title"
      class="location-seo__section"
    >
      <template v-if="section.kind === 'media-cards'">
        <div class="container location-seo__media">
          <img
            class="location-seo__media-image"
            :src="section.image"
            :alt="section.imageAlt"
            width="960"
            height="540"
          >
          <div class="location-seo__media-copy">
            <h2 class="location-seo__title">{{ section.title }}</h2>
            <p class="location-seo__lead">{{ section.lead }}</p>
          </div>
        </div>
        <div class="container location-seo__inner">
          <div class="location-seo__cards">
            <LocationsLocationSeoCard
              v-for="card in section.cards"
              :key="card.title"
              :card="card"
            />
          </div>
        </div>
      </template>

      <div
        v-else-if="section.kind === 'split-table'"
        class="container location-seo__inner"
      >
        <div class="location-seo__split">
          <h2 class="location-seo__title">{{ section.title }}</h2>
          <div class="location-seo__intro-copy">
            <p
              v-for="paragraph in section.paragraphs"
              :key="paragraph"
              class="location-seo__lead"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
        <div class="location-seo__table-wrap">
          <table
            class="location-seo__table"
            :class="{ 'location-seo__table--price': section.emphasizeSecond }"
          >
            <thead>
              <tr>
                <th
                  v-for="header in section.headers"
                  :key="header"
                >
                  {{ header }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in section.rows"
                :key="row[0]"
              >
                <td
                  v-for="(cell, cellIndex) in row"
                  :key="`${row[0]}-${cellIndex}`"
                >
                  {{ cell }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p
          v-if="section.after"
          class="location-seo__lead"
        >
          {{ section.after }}
        </p>
      </div>

      <div
        v-else-if="section.kind === 'split-list'"
        class="container location-seo__inner"
      >
        <div class="location-seo__split">
          <h2 class="location-seo__title">{{ section.title }}</h2>
          <div class="location-seo__intro-copy">
            <p
              v-for="paragraph in section.paragraphs"
              :key="paragraph"
              class="location-seo__lead"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
        <ol class="location-seo__list location-seo__list--wide">
          <li
            v-for="item in section.numbered"
            :key="item"
          >
            {{ item }}
          </li>
        </ol>
        <p
          v-if="section.after"
          class="location-seo__lead"
        >
          {{ section.after }}
        </p>
      </div>

      <div
        v-else-if="section.kind === 'split-cards'"
        class="container location-seo__inner"
      >
        <div class="location-seo__split">
          <h2 class="location-seo__title">{{ section.title }}</h2>
          <div class="location-seo__intro-copy">
            <p
              v-for="paragraph in section.paragraphs"
              :key="paragraph"
              class="location-seo__lead"
            >
              {{ paragraph }}
            </p>
          </div>
        </div>
        <div class="location-seo__cards">
          <LocationsLocationSeoCard
            v-for="card in section.cards"
            :key="card.title"
            :card="card"
          />
        </div>
      </div>
    </section>

    <BasesFaqBlock :items="content.faq" />
  </div>
</template>

<style scoped>
.location-seo {
  background: #f0efec;
}

.location-seo__intro {
  padding-block: 56px 24px;
}

.location-seo__intro-inner.container {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 32px 64px;
  width: min(100% - 32px, 1240px);
}

.location-seo__intro-copy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-seo__intro-copy p,
.location-seo__lead,
.location-seo :deep(.location-seo__card-text),
.location-seo :deep(.location-seo__note),
.location-seo :deep(.location-seo__list),
.location-seo__list {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
  color: var(--wh-black-text);
}

.location-seo__section {
  padding-block: 48px;
  border-top: 1px solid rgb(28 33 28 / 14%);
}

.location-seo__inner.container,
.location-seo__media.container {
  width: min(100% - 32px, 1240px);
}

.location-seo__inner {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.location-seo__split {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(0, 1.2fr);
  align-items: start;
  gap: 28px 64px;
}

.location-seo__media {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(260px, 1fr);
  align-items: center;
  gap: 32px 48px;
  margin-bottom: 32px;
}

.location-seo__media-image {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 8px;
}

.location-seo__media-copy {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-seo__title {
  margin: 0;
  font-family: "UNCAGE", sans-serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1.15;
  letter-spacing: 0;
  text-transform: uppercase;
  color: var(--wh-black-text);
}

.location-seo__intro .location-seo__title {
  font-size: 32px;
}

.location-seo__cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px 40px;
}

.location-seo :deep(.location-seo__card) {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.location-seo :deep(.location-seo__card-title) {
  margin: 0;
  font-family: "Inter", sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  color: var(--wh-black-text);
}

.location-seo :deep(.location-seo__card-text),
.location-seo :deep(.location-seo__list),
.location-seo :deep(.location-seo__note),
.location-seo__list {
  color: rgb(28 33 28 / 78%);
}

.location-seo :deep(.location-seo__list),
.location-seo__list {
  padding-left: 20px;
}

.location-seo :deep(.location-seo__list li + li),
.location-seo__list li + li {
  margin-top: 6px;
}

.location-seo :deep(.location-seo__note) {
  font-style: italic;
}

.location-seo__table-wrap {
  overflow-x: auto;
  border: 1px solid rgb(28 33 28 / 12%);
  border-radius: 8px;
  background: var(--wh-white);
}

.location-seo__table {
  width: 100%;
  border-collapse: collapse;
  font-family: "Inter", sans-serif;
  font-size: 15px;
  line-height: 1.4;
}

.location-seo__table th,
.location-seo__table td {
  padding: 12px 14px;
  text-align: left;
  vertical-align: top;
  border-bottom: 1px solid rgb(28 33 28 / 10%);
}

.location-seo__table th {
  background: var(--wh-green);
  font-weight: 600;
  color: var(--wh-white);
  white-space: nowrap;
}

.location-seo__table tbody tr:last-child td {
  border-bottom: none;
}

.location-seo__table--price td:nth-child(2) {
  white-space: nowrap;
  font-weight: 600;
}

@media (--wh-tablet) {
  .location-seo__intro {
    padding-block: 40px 16px;
  }

  .location-seo__intro-inner.container,
  .location-seo__split,
  .location-seo__media,
  .location-seo__cards {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .location-seo__section {
    padding-block: 36px;
  }

  .location-seo__title,
  .location-seo__intro .location-seo__title {
    font-size: 24px;
  }
}

@media (--wh-mobile) {
  .location-seo__intro {
    padding-block: 32px 12px;
  }
}
</style>
