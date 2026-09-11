import { chtoVzyatNaOkhotuSpisokContent } from '~/content/blog/chto-vzyat-na-okhotu-spisok'
import { kakStatOkhotnikomPolnoeRukovodstvoContent } from '~/content/blog/kak-stat-okhotnikom-polnoe-rukovodstvo'
import { kogdaNachinaetsyaOkhotnichiySezon2026Content } from '~/content/blog/kogda-nachinaetsya-okhotnichiy-sezon-2026'
import { kogdaZakanchivaetsyaSezonOkhoty2026Content } from '~/content/blog/kogda-zakanchivaetsya-sezon-okhoty-2026'

export type BlogPost = {
  slug: string
  title: string
  pageTitle?: string
  date: string
  image: string
  content?: string
  /** Заголовок и дата уже внутри HTML-контента (не дублировать сверху) */
  embeddedHeader?: boolean
}

export const blogPosts: BlogPost[] = [
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
    date: '10.06.2026 г.',
    image: '/images/blog/chto-vzyat-na-okhotu.jpg',
    content: chtoVzyatNaOkhotuSpisokContent,
    embeddedHeader: true,
  },
  {
    slug: 'kogda-nachinaetsya-okhotnichiy-sezon-2026-goda-v-rossii',
    title: 'Когда начинается охотничий сезон 2026 года в России',
    date: '06.06.2026 г.',
    image: '/images/blog/kogda-nachinaetsya.jpg',
    content: kogdaNachinaetsyaOkhotnichiySezon2026Content,
  },
  {
    slug: 'kak-stat-okhotnikom-polnoe-rukovodstvo',
    title: 'Как стать охотником: полное руководство',
    pageTitle: 'Как стать охотником: полное руководство',
    date: '02.06.2026 г.',
    image: '/images/blog/kak-stat-okhotnikom.jpg',
    content: kakStatOkhotnikomPolnoeRukovodstvoContent,
    embeddedHeader: true,
  },
  {
    slug: 'okhota-na-kosulyu-pravila-sposoby-sekrety',
    title: 'Охота на косулю: правила, способы, секреты',
    date: '29.05.2026 г.',
    image: '/images/blog/okhota-na-kosulyu.jpg',
  },
  {
    slug: 'okhota-na-losya-sposoby-sekrety-taktika',
    title: 'Охота на лося: способы, секреты, тактика',
    date: '25.05.2026 г.',
    image: '/images/blog/okhota-na-losya.jpg',
  },
  {
    slug: 'ohotnichii-tury',
    title: 'Охотничьи туры в России',
    date: '19.05.2026 г.',
    image: '/images/blog/ohotnichii-tury.jpg',
  },
]

export function getBlogPost(slug: string) {
  return blogPosts.find(post => post.slug === slug)
}
