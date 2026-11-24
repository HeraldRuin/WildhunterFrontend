/**
 * Тело статьи, которое присылает бэкенд в поле blocks.
 * Фронт выводит блоки сверху вниз в пришедшем порядке.
 * Заголовок страницы, дата и обложка карточки остаются отдельными полями статьи
 * и рисуются над этим списком.
 *
 * Куда попадает каждое поле:
 * - paragraph.text — обычный абзац
 * - aside.text — врезка на сером фоне
 * - heading.text — заголовок; variant задаёт размер и место
 * - title.text — заголовок внутри колонки, если он не выведен над статьёй
 * - date.text — дата внутри колонки
 * - image.src / image.alt — картинка; variant задаёт размер и место
 * - list.items — пункты списка; ordered рисует нумерацию
 * - table.headers — шапка таблицы, table.rows — строки ячеек
 * - lead.title / lead.date — левая колонка лида, lead.blocks — правая
 * - split.media — левая колонка, split.text — правая; reverse меняет их местами
 * - steps.columns — колонки шагов, в каждой свои блоки сверху вниз
 * - cards.items — карточки сетки, в каждой свои блоки
 * - cta.title — текст слева от кнопки регистрации
 * - join.title / join.text — текст слева от иконок соцсетей
 * - text.content — готовый HTML, вставляется как есть
 * - faq.title / faq.lead — шапка блока вопросов; если их нет, шаблон ставит значения по умолчанию
 * - faq.items.question — строка вопроса, faq.items.answer — текст ответа
 *
 * В текстовых полях можно передать ссылку: <a href="/bases/">текст</a>
 */

export type BlogHeadingVariant =
  | 'display'
  | 'compact'
  | 'section'
  | 'subsection'
  | 'minor'

export type BlogImageVariant =
  | 'hero'
  | 'links'
  | 'portrait'
  | 'wide'
  | 'sign'
  | 'step'

export type BlogFlowBlock =
  | { type: 'paragraph', text: string }
  | { type: 'aside', text: string }
  | { type: 'heading', variant: BlogHeadingVariant, text: string }
  | { type: 'title', text: string }
  | { type: 'date', text: string }
  | {
    type: 'image'
    variant: BlogImageVariant
    src: string
    alt: string
    width?: number
    height?: number
  }
  | { type: 'list', ordered?: boolean, items: string[] }
  | { type: 'table', headers: string[], rows: string[][] }
  | { type: 'lead', title: string, date: string, blocks: BlogFlowBlock[] }
  | {
    type: 'split'
    reverse?: boolean
    sign?: boolean
    media: BlogFlowBlock[]
    text: BlogFlowBlock[]
  }
  | { type: 'steps', columns: BlogFlowBlock[][] }
  | { type: 'cards', items: BlogFlowBlock[][] }
  | { type: 'cta', title: string, button?: string }
  | { type: 'join', title?: string, text?: string }
  | { type: 'text', content: string }
  | {
    type: 'faq'
    title?: string
    lead?: string
    items: { question: string, answer: string }[]
  }
