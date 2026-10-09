import { chtoTakoeZagonnayaOkhotaContent } from '~/content/blog/chto-takoe-zagonnaya-okhota'
import { chtoVzyatNaOkhotuSpisokContent } from '~/content/blog/chto-vzyat-na-okhotu-spisok'
import { kakoeOruzhieVybratNovichkuContent } from '~/content/blog/kakoe-oruzhie-vybrat-novichku'
import { kakStatOkhotnikomPolnoeRukovodstvoContent } from '~/content/blog/kak-stat-okhotnikom-polnoe-rukovodstvo'
import { kogdaNachinaetsyaOkhotnichiySezon2026Content } from '~/content/blog/kogda-nachinaetsya-okhotnichiy-sezon-2026'
import { kogdaZakanchivaetsyaSezonOkhoty2026Content } from '~/content/blog/kogda-zakanchivaetsya-sezon-okhoty-2026'
import { kudaPoekhatNaOkhotuContent } from '~/content/blog/kuda-poekhat-na-okhotu'
import { okhotaNaKosulyuPravilaSposobySekretyContent } from '~/content/blog/okhota-na-kosulyu-pravila-sposoby-sekrety'
import { ohotnichiiTuryContent } from '~/content/blog/ohotnichii-tury'
import { okhotaNaLosyaSposobySekretyTaktikaContent } from '~/content/blog/okhota-na-losya-sposoby-sekrety-taktika'

export type BlogPost = {
  slug: string
  title: string
  pageTitle?: string
  /** Заголовок вкладки браузера */
  seoTitle?: string
  /** meta description */
  description?: string
  date: string
  image: string
  content?: string
  /** Заголовок и дата уже внутри HTML-контента (не дублировать сверху) */
  embeddedHeader?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'chto-takoe-zagonnaya-okhota',
    title: 'Что такое загонная охота',
    pageTitle: 'Что такое загонная охота: руководство по тактике и безопасности',
    seoTitle: 'Что такое загонная охота | wild-hunter.ru',
    description: 'Как проходит загонная охота ✔️ Участники, этапы проведения, правила безопасности ✔️ Объекты охоты и сезонность в России',
    date: '04.07.2026 г.',
    image: '/images/blog/okhota-na-losya-zagon.jpg',
    content: chtoTakoeZagonnayaOkhotaContent,
  },
  {
    slug: 'kakoe-oruzhie-vybrat-novichku-dlya-okhoty',
    title: 'Какое оружие выбрать новичку для охоты',
    pageTitle: 'Какое оружие выбрать новичку для охоты: полное руководство по выбору первого ружья',
    seoTitle: 'Какое оружие выбрать новичку для охоты | wild-hunter.ru',
    description: 'Ключевые критерии выбора первого ружья ✔️ Топ проверенных моделей ружей ✔️ Законодательные ограничения для начинающего охотника в РФ',
    date: '28.06.2026 г.',
    image: '/images/blog/chto-vzyat-na-okhotu-gear.jpg',
    content: kakoeOruzhieVybratNovichkuContent,
  },
  {
    slug: 'kuda-poekhat-na-okhotu',
    title: 'Куда поехать на охоту в России',
    pageTitle: 'Куда поехать на охоту в России: лучшие места, базы и сезоны',
    seoTitle: 'Куда поехать на охоту | wild-hunter.ru',
    description: 'ТОП регионов для охоты в России ✔️ Критерии выбора места для охоты ✔️ Популярные виды охоты и их сезонность',
    date: '22.06.2026 г.',
    image: '/images/hunting-farms-hunter.webp',
    content: kudaPoekhatNaOkhotuContent,
  },
  {
    slug: 'kogda-zakanchivaetsya-sezon-okhoty-v-2026-godu-v-rossii-aktualnye-daty-po-regionam-i-vidam',
    title: 'Когда заканчивается сезон охоты в 2026 году в России',
    pageTitle: 'Когда заканчивается сезон охоты в 2026 году в России: актуальные даты по регионам и видам',
    date: '16.06.2026 г.',
    image: '/images/blog/kogda-zakanchivaetsya.jpg',
    content: kogdaZakanchivaetsyaSezonOkhoty2026Content,
  },
  {
    slug: 'chto-vzyat-na-okhotu-spisok',
    title: 'Что взять на охоту',
    pageTitle: 'Что взять на охоту: полный список',
    seoTitle: 'Что взять на охоту — список | wild-hunter.ru',
    description: 'Что нужно взять на охоту: чек-лист бывалого охотника ✔️ Обязательные документы ✔️ Основное снаряжение ✔️ Одежда, навигация, безопасность',
    date: '10.06.2026 г.',
    image: '/images/blog/chto-vzyat-na-okhotu.jpg',
    content: chtoVzyatNaOkhotuSpisokContent,
    embeddedHeader: true,
  },
  {
    slug: 'kogda-nachinaetsya-okhotnichiy-sezon-2026-goda-v-rossii',
    title: 'Когда начинается охотничий сезон 2026 года в России',
    seoTitle: 'Когда начинается охотничий сезон - 2026 | wild-hunter.ru',
    description: 'Ориентировочные даты начала охотничьего сезона в России в 2026 году ✔️ Когда появятся официальные документы об открытии сезона ✔️ Как не пропустить важную информацию',
    date: '06.06.2026 г.',
    image: '/images/blog/kogda-nachinaetsya.jpg',
    content: kogdaNachinaetsyaOkhotnichiySezon2026Content,
  },
  {
    slug: 'kak-stat-okhotnikom-polnoe-rukovodstvo',
    title: 'Как стать охотником: полное руководство',
    pageTitle: 'Как стать охотником: полное руководство',
    seoTitle: 'Как стать охотником | wild-hunter.ru',
    description: 'Пошаговое руководство для начинающего охотника ✔️ Что необходимо знать, где учиться ✔️ Как получить охотничий билет и разрешение ✔️ Как первый раз пойти на охоту',
    date: '02.06.2026 г.',
    image: '/images/blog/kak-stat-okhotnikom.jpg',
    content: kakStatOkhotnikomPolnoeRukovodstvoContent,
    embeddedHeader: true,
  },
  {
    slug: 'okhota-na-kosulyu-pravila-sposoby-sekrety',
    title: 'Охота на косулю: правила, способы, секреты',
    seoTitle: 'Охота на косулю — как охотиться на косулю | wild-hunter.ru',
    description: 'Охота на косулю с подхода, с манком ✔️ Сроки и правила ✔️ Оружие, снаряжение, тактика, типичные ошибки',
    date: '29.05.2026 г.',
    image: '/images/blog/okhota-na-kosulyu.jpg',
    content: okhotaNaKosulyuPravilaSposobySekretyContent,
  },
  {
    slug: 'okhota-na-losya-sposoby-sekrety-taktika',
    title: 'Охота на лося: способы, секреты, тактика',
    seoTitle: 'Охота на лося — с подхода, загоном, с засидки | wild-hunter.ru',
    description: 'Охота на лося: как и когда охотиться ✔️ Правила, способы, секреты охоты ✔️ Какое оружие выбрать ✔️ Сезоны и законодательные требования',
    date: '25.05.2026 г.',
    image: '/images/blog/okhota-na-losya.jpg',
    content: okhotaNaLosyaSposobySekretyTaktikaContent,
    embeddedHeader: true,
  },
  {
    slug: 'ohotnichii-tury',
    title: 'Охотничьи туры в России',
    date: '19.05.2026 г.',
    image: '/images/blog/ohotnichii-tury.jpg',
    content: ohotnichiiTuryContent,
    embeddedHeader: true,
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find(post => post.slug === slug)
}
