<script setup lang="ts">
const socials = [
  {
    label: 'Telegram',
    href: 'https://t.me/wild_hunter_ru',
    color: '#2AABEE',
  },
  {
    label: 'VK',
    href: 'https://vk.ru/wild_hunter_ru',
    color: '#0077FF',
  },
  {
    label: 'WhatsApp',
    href: 'https://wa.me/74994509596',
    color: '#25D366',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@wh_online',
    color: '#FF0000',
  },
  {
    label: 'Email',
    href: 'mailto:wh.online@yandex.ru',
    color: '#1c211c',
  },
] as const
</script>

<template>
  <div class="app-social-links">
    <a
      v-for="social in socials"
      :key="social.label"
      class="app-social-links__item"
      :href="social.href"
      :aria-label="social.label"
      :style="{ '--social-color': social.color }"
      target="_blank"
      rel="noopener noreferrer nofollow"
    >
      <svg
        v-if="social.label === 'Telegram'"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M1.19434 10.1345C5.85934 8.12369 8.9693 6.7979 10.5243 6.15739C14.9693 4.3284 15.8918 4.01074 16.4943 4.0001C16.6268 3.99788 16.9218 4.03029 17.1143 4.18441C17.2743 4.3143 17.3193 4.48995 17.3418 4.61315C17.3618 4.73635 17.3893 5.01715 17.3668 5.23634C17.1268 7.73998 16.0843 13.8155 15.5543 16.6197C15.3318 17.8063 14.8893 18.2041 14.4618 18.2429C13.5318 18.3275 12.8268 17.6353 11.9268 17.0517C10.5193 16.1381 9.72432 15.5695 8.35682 14.6782C6.77682 13.648 7.80179 13.0817 8.70179 12.1565C8.93679 11.9143 13.0318 8.22932 13.1093 7.89509C13.1193 7.85328 13.1293 7.69742 13.0343 7.61529C12.9418 7.53291 12.8042 7.56111 12.7042 7.58337C12.5617 7.61504 10.3142 9.08655 5.95423 11.9976C5.31673 12.4316 4.73925 12.6431 4.21925 12.632C3.64925 12.6198 2.54932 12.3123 1.73182 12.0496C0.73182 11.7272 -0.0657192 11.5568 0.00428084 11.0093C0.0392808 10.7243 0.436844 10.4326 1.19434 10.1345Z"
        />
      </svg>
      <svg
        v-else-if="social.label === 'VK'"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M11.0158 17C4.25958 17 0.160951 12.1161 0 4H3.42207C3.52875 9.96227 6.1311 12.4886 8.12708 13.0083V4H11.406V9.1452C13.3308 8.9229 15.3455 6.58284 16.023 4H19.2514C18.7339 7.17565 16.5405 9.51571 14.9909 10.481C16.5424 11.262 19.0371 13.3047 20 17H16.4525C15.7039 14.5303 13.868 12.6173 11.4079 12.3569V17H11.0158Z"
        />
      </svg>
      <svg
        v-else-if="social.label === 'WhatsApp'"
        viewBox="0 0 16 16"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M13.608 2.325A7.88 7.88 0 0 0 7.998 0C3.625 0 .067 3.556.065 7.928c0 1.397.365 2.76 1.06 3.964L0 16l4.204-1.102a7.928 7.928 0 0 0 3.79.965h.004c4.37 0 7.93-3.557 7.93-7.93a7.88 7.88 0 0 0-2.32-5.608zm-5.61 12.2h-.003a6.583 6.583 0 0 1-3.355-.92l-.24-.143-2.496.654.666-2.43-.157-.25a6.573 6.573 0 0 1-1.007-3.508A6.6 6.6 0 0 1 8 1.338a6.55 6.55 0 0 1 4.66 1.934 6.55 6.55 0 0 1 1.93 4.662 6.6 6.6 0 0 1-6.592 6.59zm2.26-5.58c-.18-.068-.313-.1-.445.098s-.512.644-.627.777c-.116.132-.23.148-.43.05-.198-.1-.836-.31-1.593-.984-.59-.525-.987-1.174-1.102-1.373-.115-.198-.012-.305.087-.404.09-.09.2-.232.298-.348.1-.116.132-.198.198-.33.066-.133.033-.248-.017-.348-.05-.1-.446-1.074-.61-1.47-.162-.387-.325-.334-.447-.34a7.945 7.945 0 0 0-.38-.007.728.728 0 0 0-.53.247c-.18.2-.692.678-.692 1.653s.71 1.917.81 2.05c.098.132 1.396 2.133 3.384 2.99.473.205.842.327 1.13.418.474.15.906.13 1.248.08.38-.058 1.172-.48 1.338-.943.165-.463.165-.86.115-.942-.05-.083-.182-.133-.38-.232-.198-.1-1.172-.578-1.354-.644z"
        />
      </svg>
      <svg
        v-else-if="social.label === 'YouTube'"
        viewBox="0 0 32 23"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M31.68 4.96s-.313-2.252-1.272-3.244C29.19.413 27.828.406 27.202.33 22.724 0 16.007 0 16.007 0h-.014S9.276 0 4.798.33c-.626.077-1.99.083-3.207 1.386C.633 2.708.32 4.96.32 4.96S0 7.61 0 10.255v2.48c0 2.648.32 5.293.32 5.293s.312 2.254 1.27 3.246c1.22 1.303 2.818 1.262 3.53 1.398C7.68 22.923 16 23 16 23s6.724-.01 11.202-.34c.625-.078 1.99-.084 3.206-1.387.96-.992 1.272-3.246 1.272-3.246s.32-2.645.32-5.292v-2.48c0-2.647-.32-5.294-.32-5.294z"
        />
        <path
          fill="#fff"
          d="M12.696 15.74V6.554l8.645 4.61-8.644 4.578z"
        />
      </svg>
      <svg
        v-else
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fill-rule="evenodd"
          d="M17 3C18.6569 3 20 4.34315 20 6V14C20 15.6569 18.6569 17 17 17H3C1.34315 17 0 15.6569 0 14V6C0 4.34315 1.34315 3 3 3H17ZM10 9L3 5V7L10 11L17 7V5L10 9Z"
        />
      </svg>
    </a>
  </div>
</template>

<style scoped>
.app-social-links {
  display: flex;
  flex-shrink: 0;
  flex-wrap: nowrap;
  gap: 12px;
}

.app-social-links__item {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--social-color, var(--wh-black-text));
  border-radius: 50%;
  background: var(--wh-white);
  color: var(--social-color, var(--wh-black-text));
  transition: opacity 0.15s ease;
}

.app-social-links__item:hover {
  opacity: 0.7;
}

.app-social-links__item svg {
  display: block;
  width: 20px;
  height: 20px;
  overflow: visible;
}
</style>
