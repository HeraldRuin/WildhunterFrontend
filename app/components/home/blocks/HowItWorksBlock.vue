<script setup lang="ts">
const steps = [
  {
    number: 1,
    text: 'Выбираете охоту\nи собираете смету',
  },
  {
    number: 2,
    text: 'Видите прозрачный\nитог и условия',
  },
  {
    number: 3,
    text: 'Бронируете (предоплата)',
  },
  {
    number: 4,
    text: 'Получаете подтверждение',
  },
  {
    number: 5,
    text: 'Приезжаете на охоту',
  },
]
</script>

<template>
  <section class="how-it-works">
    <div class="container how-it-works__inner">
      <h2 class="how-it-works__title">Как это работает</h2>

      <div class="how-it-works__flow">
        <div
          v-for="(step, index) in steps"
          :key="step.number"
          class="how-it-works__step-col"
        >
          <div class="how-it-works__badge-track">
            <span
              class="how-it-works__badge"
              :class="{ 'how-it-works__badge--lower': index % 2 === 1 }"
            >
              шаг {{ step.number }}
            </span>

            <div
              v-if="index < steps.length - 1"
              class="how-it-works__connector"
              :class="index % 2 === 0 ? 'how-it-works__connector--down' : 'how-it-works__connector--up'"
              aria-hidden="true"
            >
              <div class="how-it-works__connector-desktop">
                <svg class="how-it-works__line" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" y1="1" x2="100" y2="1" pathLength="100" stroke="currentColor" stroke-width="2" stroke-dasharray="18 8" vector-effect="non-scaling-stroke" />
                </svg>
                <svg class="how-it-works__arrow" width="8" height="10" viewBox="0 0 8 10" aria-hidden="true">
                  <path d="M1 1l5 4-5 4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <svg class="how-it-works__line" viewBox="0 0 100 2" preserveAspectRatio="none" aria-hidden="true">
                  <line x1="0" y1="1" x2="100" y2="1" pathLength="100" stroke="currentColor" stroke-width="2" stroke-dasharray="18 8" vector-effect="non-scaling-stroke" />
                </svg>
              </div>

              <svg
                class="how-it-works__connector-line how-it-works__connector-line--tablet"
                viewBox="0 0 100 130"
                preserveAspectRatio="none"
              >
                <line
                  :x1="0"
                  :y1="index % 2 === 0 ? 19 : 111"
                  :x2="100"
                  :y2="index % 2 === 0 ? 111 : 19"
                />
              </svg>

              <svg
                class="how-it-works__connector-line how-it-works__connector-line--mobile"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <line x1="50" y1="0" x2="50" y2="100" />
              </svg>
            </div>
          </div>

          <p
            class="how-it-works__text"
            :class="{ 'how-it-works__text--lower': index % 2 === 1 }"
          >
            {{ step.text }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.how-it-works {
  padding-block: 48px 64px;
  background: var(--wh-white);
}

.how-it-works__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 48px;
}

.how-it-works__title {
  margin: 0;
  font-family: UNCAGE, serif;
  font-weight: 400;
  font-style: normal;
  font-size: 44px;
  line-height: 110%;
  text-transform: uppercase;
  text-align: center;
  color: var(--wh-gray-900);
}

.how-it-works__flow {
  display: flex;
  width: 140%;
  max-width: calc(100vw - 32px);
}

.how-it-works__step-col {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: visible;
}

.how-it-works__badge-track {
  position: relative;
  display: flex;
  justify-content: center;
  width: 100%;
  height: 40px;
  overflow: visible;
}

.how-it-works__badge {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--wh-green);
  color: var(--wh-white);

  font-family: Inter, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 120%;
  letter-spacing: -0.9px;

  white-space: nowrap;
}

.how-it-works__connector {
  position: absolute;
  top: 50%;
  left: calc(50% + 40px);
  z-index: 0;
  width: calc(100% - 80px);
  color: var(--wh-orange-500);
  pointer-events: none;
  transform: translateY(-50%);
}

.how-it-works__connector-desktop {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.how-it-works__line {
  flex: 1;
  min-width: 0;
  height: 2px;
  overflow: visible;
}

.how-it-works__line line {
  vector-effect: non-scaling-stroke;
}

.how-it-works__arrow {
  flex-shrink: 0;
}

.how-it-works__connector-line {
  display: none;
  width: 100%;
  height: 100%;
}

.how-it-works__connector-line line {
  stroke: currentColor;
  stroke-width: 2;
  stroke-dasharray: 5 5;
  vector-effect: non-scaling-stroke;
}

.how-it-works__text {
  margin: 10px 0 0;
  max-width: 227px;
  margin-inline: auto;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.05em;
  text-align: center;
  white-space: pre-line;
  color: var(--wh-gray-900);
}

@media (--wh-tablet) {
  .how-it-works__flow {
    width: 100%;
  }

  .how-it-works__step-col {
    padding-bottom: 72px;
  }

  .how-it-works__badge-track {
    height: 130px;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
  }

  .how-it-works__badge {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }

  .how-it-works__badge--lower {
    top: auto;
    bottom: 0;
    margin-top: 0;
    transform: translateX(-50%);
  }

  .how-it-works__connector {
    top: 0;
    left: calc(50% + 44px);
    width: calc(100% - 88px);
    height: 130px;
    transform: none;
  }

  .how-it-works__connector-desktop {
    display: none;
  }

  .how-it-works__connector-line--tablet {
    display: block;
  }

  .how-it-works__text {
    position: absolute;
    top: 50px;
    left: 50%;
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding-inline: 4px;
    font-size: 16px;
    transform: translateX(-50%);
    overflow-wrap: break-word;
  }

  .how-it-works__text--lower {
    top: 140px;
  }
}

@media (--wh-mobile) {
  .how-it-works {
    padding-block: 24px 32px;
  }

  .how-it-works__inner {
    gap: 32px;
  }

  .how-it-works__flow {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .how-it-works__step-col {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
    flex: none;
    width: min(100%, 345px);
    height: 84px;
    min-height: 84px;
    padding: 16px;
    border: none;
    border-radius: 12px;
    background: var(--wh-white);
    box-shadow: 0 0 4px 0 #00000026;
    overflow: hidden;
  }

  .how-it-works__badge-track {
    width: auto;
    height: auto;
    flex-shrink: 0;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
  }

  .how-it-works__badge {
    position: static;
    transform: none;
    align-self: auto;
    min-width: 72px;
    padding: 8px 14px;
    border-radius: 12px;
    font-size: 0.875rem;
  }

  .how-it-works__badge--lower {
    top: auto;
    bottom: auto;
    transform: none;
    align-self: auto;
    margin-top: 0;
  }

  .how-it-works__connector {
    display: none;
  }

  .how-it-works__text {
    position: static;
    flex: 1;
    min-width: 0;
    max-width: none;
    margin: 0;
    padding: 0;
    font-size: 18px;
    line-height: 1.25;
    text-align: left;
    transform: none;
  }

  .how-it-works__text--lower {
    top: auto;
  }
}
</style>
