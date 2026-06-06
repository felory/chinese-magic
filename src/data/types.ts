export type BookId = 'dao-de-jing' | 'sunzi' | 'zhouyi'

export interface ChapterRef {
  bookId: BookId
  bookTitle: string
  chapterId: string
  chapterTitle: string
}

export interface Concept {
  id: string
  title: string
  summary: string
  chapterRefs: ChapterRef[]
}

export interface Chapter {
  id: string
  bookId: BookId
  order: number
  sectionTitle: string
  title: string
  symbol: string
  keyExcerpt: string
  oneLineSummary: string
  tags: string[]
  sourceUrl: string
}

export interface TranslationKeyword {
  term: string
  note: string
}

export interface TranslationNoteItem {
  original: string
  plain: string
  keywords: TranslationKeyword[]
}

export interface ChapterTranslationNotes {
  chapterId: string
  title: string
  versionNote: string
  items: TranslationNoteItem[]
}

export interface LogicPracticeNote {
  segment: string
  logic: string
  reality: string
  practice: [string]
}

export interface ChapterLogicNotes {
  chapterId: string
  notes: LogicPracticeNote[]
}

export interface FoundationSection {
  id: string
  title: string
  summary: string
  points: string[]
  example: string
}

export interface FoundationLineStage {
  position: string
  image: string
  meaning: string
}

export interface BookFoundation {
  bookId: BookId
  title: string
  subtitle: string
  lead: string
  sections: FoundationSection[]
  lineLadder?: FoundationLineStage[]
  lineLadderLabel?: string
  lineLadderTitle?: string
  readingLabel?: string
  readingSteps: string[]
}

export interface BookIntroPart {
  title: string
  summary: string
  why: string
}

export interface BookStructureNote {
  title: string
  body: string
}

export interface BookIntro {
  bookId: BookId
  title: string
  subtitle: string
  lead: string
  parts: BookIntroPart[]
  structureNotes: BookStructureNote[]
  readingPath: string[]
}

export interface BookApplicationModel {
  title: string
  body: string
}

export interface BookApplicationCase {
  title: string
  problem: string
  facts: string[]
  model: string
  analysis: string
  advice: string
  review: string
}

export interface BookApplicationSummary {
  bookId: BookId
  title: string
  subtitle: string
  lead: string
  models: BookApplicationModel[]
  cases: BookApplicationCase[]
  practice: string[]
}

export interface BookHistoricalStory {
  title: string
  period: string
  modelTags: string[]
  background: string
  trigger: string
  process: string
  result: string
  principle: string
  executionProblems: string[]
  modernUse: string
  reviewQuestions: string[]
}

export interface BookHistoricalStories {
  bookId: BookId
  title: string
  subtitle: string
  lead: string
  cases: BookHistoricalStory[]
}

export interface ZhouyiLayerIndexItem {
  id: string
  order: number
  title: string
  subtitle: string
  scope: string
  routeLabel: string
  source: string
  sectionCount: number
  itemCount: number
}

export interface ZhouyiLayerIndex {
  bookId: 'zhouyi'
  title: string
  lead: string
  layers: ZhouyiLayerIndexItem[]
}

export interface ZhouyiLayerKeyword {
  term: string
  note: string
}

export interface ZhouyiSourceParts {
  guaCi?: string[]
  yaoCi?: string[]
  tuan?: string[]
  xiang?: string[]
  wenYan?: string[]
}

export interface ZhouyiLayerItem {
  id: string
  title: string
  subtitle: string
  original?: string
  plain: string
  keywords: ZhouyiLayerKeyword[]
  logic: string
  reality: string
  application: string
  reviewQuestions: string[]
  chapterId?: string
  sourceParts?: ZhouyiSourceParts
}

export interface ZhouyiLayerSection {
  id: string
  title: string
  summary: string
  items: ZhouyiLayerItem[]
}

export interface ZhouyiLayerDetail {
  bookId: 'zhouyi'
  layerId: string
  title: string
  subtitle: string
  lead: string
  sourceNote: string
  sections: ZhouyiLayerSection[]
}

export interface ChapterContent extends Chapter {
  originalText: string
  plainSummary: string
  logicNotes: string[]
  realityMappings: string[]
  practicePrompt: string
  translation: ChapterTranslationNotes | null
  logic: ChapterLogicNotes | null
}

export interface BookSection {
  title: string
  chapterIds: string[]
}

export interface Book {
  id: BookId
  title: string
  subtitle: string
  sourceName: string
  sourceUrl: string
  license: string
  outlineLabel: string
  stage: string
  goal: string
  chapterCount: number
  sections: BookSection[]
  chapters: Chapter[]
}

export interface PracticePlan {
  weekday: string
  weekend: string
  monthly: Array<{
    month: number
    bookId: BookId
    title: string
    focus: string[]
  }>
}

export interface ContentPayload {
  generatedAt: string
  books: Book[]
  concepts: Concept[]
  practice: PracticePlan
}
