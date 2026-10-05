export interface LocationSeoCard {
  title: string
  text?: string
  bullets?: string[]
  numbered?: string[]
  note?: string
}

export interface LocationSeoFaqItem {
  id: number
  question: string
  lead: string
  schemaText: string
}

interface MediaCardsSection {
  kind: 'media-cards'
  image: string
  imageAlt: string
  title: string
  lead: string
  cards: LocationSeoCard[]
}

interface SplitTableSection {
  kind: 'split-table'
  title: string
  paragraphs: string[]
  headers: string[]
  rows: string[][]
  emphasizeSecond?: boolean
  after?: string
}

interface SplitCardsSection {
  kind: 'split-cards'
  title: string
  paragraphs: string[]
  cards: LocationSeoCard[]
}

interface SplitListSection {
  kind: 'split-list'
  title: string
  paragraphs: string[]
  numbered: string[]
  after?: string
}

export type LocationSeoSection =
  | MediaCardsSection
  | SplitTableSection
  | SplitCardsSection
  | SplitListSection

export interface LocationSeoContent {
  title: string
  description: string
  introTitle: string
  introParagraphs: string[]
  sections: LocationSeoSection[]
  faq: LocationSeoFaqItem[]
}
