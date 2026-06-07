import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { content } from './data/content'
import daoFoundationData from './data/foundations/dao-de-jing.json'
import sunziFoundationData from './data/foundations/sunzi.json'
import zhouyiFoundationData from './data/foundations/zhouyi.json'
import daoIntroData from './data/book-pages/dao-de-jing/intro.json'
import daoSummaryData from './data/book-pages/dao-de-jing/summary.json'
import sunziIntroData from './data/book-pages/sunzi/intro.json'
import sunziSummaryData from './data/book-pages/sunzi/summary.json'
import sunziStoriesData from './data/book-pages/sunzi/stories.json'
import zhouyiIntroData from './data/book-pages/zhouyi/intro.json'
import zhouyiSummaryData from './data/book-pages/zhouyi/summary.json'
import zhouyiLayerIndexData from './data/zhouyi-layers/index.json'
import type {
  Book,
  BookApplicationSummary,
  BookHistoricalStories,
  BookId,
  BookFoundation,
  BookIntro,
  Chapter,
  ChapterContent,
  Concept,
  FoundationSection,
  LogicPracticeNote,
  ZhouyiLayerDetail,
  ZhouyiLayerIndex,
  ZhouyiLayerItem,
} from './data/types'

type View = 'outline' | 'concepts' | 'practice' | 'search'
type BookPage = 'guide' | 'intro' | 'summary' | 'stories' | 'layers'
type RouteState = {
  view: View
  bookId: BookId
  chapterId: string | null
  bookPage: BookPage
  zhouyiLayerId: string
}

const navItems: Array<{ id: View; label: string }> = [
  { id: 'outline', label: '书籍大纲' },
  { id: 'concepts', label: '模型索引' },
  { id: 'practice', label: '观察训练' },
  { id: 'search', label: '搜索' },
]

const observationSteps = [
  {
    title: '事实',
    body: '先写发生了什么，只写可核对的动作、时间、对象和结果。',
    prompt: '例：需求改了两次，接口晚一天，交付延期半天。',
  },
  {
    title: '标签',
    body: '把别人给的评价拆出来，不急着信。',
    prompt: '例：“执行力差”“旺铺”“机会来了”“这个人不靠谱”。',
  },
  {
    title: '力量',
    body: '看谁在推动，谁在承接，谁在阻挡，力量往哪里流。',
    prompt: '例：老板催进度，客户改口，后端权限卡住。',
  },
  {
    title: '资源',
    body: '把钱、时间、信息、权限、注意力、信任放到台面上。',
    prompt: '例：预算够不够，信息准不准，谁能拍板。',
  },
  {
    title: '时位',
    body: '判断这件事处在起点、推进、受压、成熟、过满，还是收尾。',
    prompt: '例：刚有苗头不宜重押，已经过满就要收力。',
  },
  {
    title: '边界',
    body: '找继续走下去会卡住、后悔、失控的地方。',
    prompt: '例：现金流、团队体力、关系底线、公开承诺。',
  },
]

const practiceLenses = [
  {
    book: '道德经',
    title: '低阻力镜头',
    focus: '看流向、内耗、反转。',
    questions: ['我是不是被一个标签带走了？', '哪里越用力越卡？', '减少哪个动作，事情反而更顺？'],
  },
  {
    book: '孙子兵法',
    title: '竞争镜头',
    focus: '看信息、成本、虚实。',
    questions: ['谁掌握了更准的信息？', '这一步真正消耗什么资源？', '有没有低损耗路径，不必正面硬碰？'],
  },
  {
    book: '周易',
    title: '变化镜头',
    focus: '看阶段、位置、风险。',
    questions: ['现在像哪一层台阶：苗头、推进、受压、成熟、过头？', '动作和位置匹配吗？', '继续往前会顺、悔、吝，还是凶？'],
  },
]

const practiceScenes = [
  {
    title: '同事延期',
    fact: '群里说“他执行力差”，但复盘发现需求改口、接口延迟、权限没给。',
    observe: '先去掉标签，看流程断点在哪里，再判断责任。',
  },
  {
    title: '想租店铺',
    fact: '中介说“成熟旺铺”，但租金高、同街竞争多，附近办公楼还没交付。',
    observe: '把旺铺拆成苗头和边界，判断趋势能不能覆盖成本。',
  },
  {
    title: '项目突然加速',
    fact: '老板要求两周上线，团队情绪兴奋，但测试、客服、供应都没准备好。',
    observe: '看这是势能还是冒进：资源没跟上时，快就是风险。',
  },
  {
    title: '关系开始变冷',
    fact: '对方回复变慢，不再主动约时间，但关键事情仍然配合。',
    observe: '不要马上贴“不在乎”标签，先看信号强弱、阶段变化和可验证事实。',
  },
]

const outputTemplate = [
  '事实：发生了什么，不加评价。',
  '标签：我或别人给它起了什么名字。',
  '道德经：哪里有阻力，能减掉什么多余动作。',
  '孙子：信息、成本、资源和对手状态是否清楚。',
  '周易：现在处在哪个阶段，继续走的风险是什么。',
  '判断：下一步是动、守、等、退，还是先补信息。',
]

const defaultBook = content.books[0]
const foundationsByBook: Record<BookId, BookFoundation> = {
  'dao-de-jing': daoFoundationData as BookFoundation,
  sunzi: sunziFoundationData as BookFoundation,
  zhouyi: zhouyiFoundationData as BookFoundation,
}
const introsByBook: Record<BookId, BookIntro> = {
  'dao-de-jing': daoIntroData as BookIntro,
  sunzi: sunziIntroData as BookIntro,
  zhouyi: zhouyiIntroData as BookIntro,
}
const summariesByBook: Record<BookId, BookApplicationSummary> = {
  'dao-de-jing': daoSummaryData as BookApplicationSummary,
  sunzi: sunziSummaryData as BookApplicationSummary,
  zhouyi: zhouyiSummaryData as BookApplicationSummary,
}
const storiesByBook: Partial<Record<BookId, BookHistoricalStories>> = {
  sunzi: sunziStoriesData as BookHistoricalStories,
}
const zhouyiLayerIndex = zhouyiLayerIndexData as ZhouyiLayerIndex

interface KeywordNote {
  term: string
  meaning: string
}

interface StudySegment {
  original: string
  plain: string
  versionNote?: string
  keywords: KeywordNote[]
  prompt?: string
  logic?: string
  reality?: string
  practice?: string[]
  status?: 'draft' | 'manual'
}

const chapterModules = import.meta.glob<ChapterContent>('./data/chapters/*/*.json', {
  import: 'default',
})
const zhouyiLayerModules = import.meta.glob<ZhouyiLayerDetail>('./data/zhouyi-layers/details/*.json', {
  import: 'default',
})

function App() {
  const initialRoute = parseRoute()
  const [view, setView] = useState<View>(initialRoute.view)
  const [topbarCollapsed, setTopbarCollapsed] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [selectedBookId, setSelectedBookId] = useState<BookId>(initialRoute.bookId)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(initialRoute.chapterId)
  const [selectedBookPage, setSelectedBookPage] = useState<BookPage>(initialRoute.bookPage)
  const [selectedZhouyiLayerId, setSelectedZhouyiLayerId] = useState(initialRoute.zhouyiLayerId)
  const [query, setQuery] = useState('')

  useEffect(() => {
    const applyRoute = () => {
      const nextRoute = parseRoute()
      setView(nextRoute.view)
      setSelectedBookId(nextRoute.bookId)
      setSelectedChapterId(nextRoute.chapterId)
      setSelectedBookPage(nextRoute.bookPage)
      setSelectedZhouyiLayerId(nextRoute.zhouyiLayerId)
    }

    applyRoute()
    window.addEventListener('popstate', applyRoute)
    return () => window.removeEventListener('popstate', applyRoute)
  }, [])

  const selectedBook = content.books.find((book) => book.id === selectedBookId) ?? content.books[0]
  const selectedChapter = selectedChapterId
    ? selectedBook.chapters.find((chapter) => chapter.id === selectedChapterId) ?? selectedBook.chapters[0]
    : null

  function chooseBook(book: Book) {
    setSelectedBookId(book.id)
    setSelectedChapterId(null)
    setSelectedBookPage('guide')
    setView('outline')
    setMobileSidebarOpen(false)
    pushRoute('outline', book.id, null, 'guide')
  }

  function chooseBookPage(book: Book, page: BookPage) {
    setSelectedBookId(book.id)
    setSelectedChapterId(null)
    setSelectedBookPage(page)
    setView('outline')
    setMobileSidebarOpen(false)
    pushRoute('outline', book.id, null, page, selectedZhouyiLayerId)
  }

  function chooseZhouyiLayer(layerId: string) {
    setSelectedBookId('zhouyi')
    setSelectedChapterId(null)
    setSelectedBookPage('layers')
    setSelectedZhouyiLayerId(layerId)
    setView('outline')
    setMobileSidebarOpen(false)
    pushRoute('outline', 'zhouyi', null, 'layers', layerId)
  }

  function chooseChapter(book: Book, chapter: Chapter) {
    setSelectedBookId(book.id)
    setSelectedChapterId(chapter.id)
    setSelectedBookPage('guide')
    setView('outline')
    setMobileSidebarOpen(false)
    pushRoute('outline', book.id, chapter.id)
  }

  function chooseView(nextView: View) {
    setView(nextView)
    setMobileSidebarOpen(false)
    pushRoute(nextView, selectedBook.id, selectedChapter?.id ?? null, selectedBookPage, selectedZhouyiLayerId)
  }

  function openMobileSidebar() {
    setSidebarCollapsed(false)
    setMobileSidebarOpen(true)
  }

  const shellClassName = [
    topbarCollapsed ? 'app-shell topbar-collapsed' : 'app-shell',
    mobileSidebarOpen ? 'mobile-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ')
  const workspaceClassName = [
    sidebarCollapsed ? 'workspace sidebar-collapsed' : 'workspace',
    mobileSidebarOpen ? 'mobile-sidebar-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <main className={shellClassName}>
      <header className={topbarCollapsed ? 'topbar collapsed' : 'topbar'}>
        <div className="brand-block">
          <button
            aria-label="打开书籍菜单"
            className="mobile-menu-button"
            onClick={openMobileSidebar}
            type="button"
          >
            ☰
          </button>
          <span className="seal">玄</span>
          <div className="brand-copy">
            <p className="eyebrow">三书世界</p>
            <h1>经典不是背诵材料，是观察现实的模型来源。</h1>
          </div>
        </div>
        {!topbarCollapsed && (
          <nav className="main-nav" aria-label="主导航">
            {navItems.map((item) => (
              <button
                className={view === item.id ? 'nav-button active' : 'nav-button'}
                key={item.id}
                onClick={() => chooseView(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </nav>
        )}
        <button
          aria-label={topbarCollapsed ? '展开顶部导航' : '收起顶部导航'}
          className="topbar-toggle"
          onClick={() => setTopbarCollapsed((collapsed) => !collapsed)}
          type="button"
        >
          {topbarCollapsed ? '展开' : '收起'}
        </button>
      </header>

      <section className={workspaceClassName}>
        <BookRail
          books={content.books}
          collapsed={sidebarCollapsed}
          selectedBook={selectedBook}
          selectedChapter={selectedChapter}
          selectedBookPage={selectedBookPage}
          selectedZhouyiLayerId={selectedZhouyiLayerId}
          onBookSelect={chooseBook}
          onBookPageSelect={chooseBookPage}
          onZhouyiLayerSelect={chooseZhouyiLayer}
          onChapterSelect={chooseChapter}
          onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
        />
        {mobileSidebarOpen && (
          <button
            aria-label="关闭书籍菜单"
            className="sidebar-scrim"
            onClick={() => setMobileSidebarOpen(false)}
            type="button"
          />
        )}
        <div className="main-panel">
          {view === 'outline' && selectedChapter && (
            <Reader book={selectedBook} chapter={selectedChapter} onChapterSelect={chooseChapter} />
          )}
          {view === 'outline' && !selectedChapter && (
            <>
              {selectedBookPage === 'guide' && (
                <BookFoundationOverview
                  book={selectedBook}
                  foundation={foundationsByBook[selectedBook.id]}
                  onChapterSelect={chooseChapter}
                />
              )}
              {selectedBookPage === 'intro' && <BookIntroOverview book={selectedBook} intro={introsByBook[selectedBook.id]} />}
              {selectedBookPage === 'summary' && (
                <BookApplicationSummaryPage book={selectedBook} summary={summariesByBook[selectedBook.id]} />
              )}
              {selectedBookPage === 'stories' && storiesByBook[selectedBook.id] && (
                <BookHistoricalStoriesPage book={selectedBook} stories={storiesByBook[selectedBook.id]} />
              )}
              {selectedBookPage === 'layers' && selectedBook.id === 'zhouyi' && (
                <ZhouyiLayersPage
                  book={selectedBook}
                  layerIndex={zhouyiLayerIndex}
                  selectedLayerId={selectedZhouyiLayerId}
                  onChapterSelect={chooseChapter}
                />
              )}
            </>
          )}

          {view === 'concepts' && (
            <ConceptIndex concepts={content.concepts} onChapterSelect={chooseChapter} books={content.books} />
          )}

          {view === 'practice' && <PracticePanel />}

          {view === 'search' && (
            <SearchPanel
              books={content.books}
              concepts={content.concepts}
              query={query}
              onChange={setQuery}
              onChapterSelect={chooseChapter}
            />
          )}
        </div>
      </section>
    </main>
  )
}

interface BookRailProps {
  books: Book[]
  collapsed: boolean
  selectedBook: Book
  selectedChapter: Chapter | null
  selectedBookPage: BookPage
  selectedZhouyiLayerId: string
  onBookSelect: (book: Book) => void
  onBookPageSelect: (book: Book, page: BookPage) => void
  onZhouyiLayerSelect: (layerId: string) => void
  onChapterSelect: (book: Book, chapter: Chapter) => void
  onToggle: () => void
}

function BookRail({
  books,
  collapsed,
  selectedBook,
  selectedChapter,
  selectedBookPage,
  selectedZhouyiLayerId,
  onBookSelect,
  onBookPageSelect,
  onZhouyiLayerSelect,
  onChapterSelect,
  onToggle,
}: BookRailProps) {
  const collapsedPageLabel =
    selectedBookPage === 'intro'
      ? '介'
      : selectedBookPage === 'summary'
        ? '用'
        : selectedBookPage === 'stories'
          ? '典'
          : selectedBookPage === 'layers'
            ? '层'
            : '读'
  const stories = storiesByBook[selectedBook.id]
  const hasZhouyiLayers = selectedBook.id === 'zhouyi'

  return (
    <aside className={collapsed ? 'book-rail collapsed' : 'book-rail'} aria-label="书籍大纲">
      {collapsed && (
        <div className="rail-toolbar rail-toolbar-collapsed">
          <button
            aria-label="展开左侧菜单"
            className="collapse-button"
            onClick={onToggle}
            title="展开菜单"
            type="button"
          >
            ☰
          </button>
        </div>
      )}

      {collapsed && (
        <div className="collapsed-rail-label" aria-hidden="true">
          <span>{selectedBook.title.slice(0, 1)}</span>
          <small>{selectedChapter?.symbol ?? collapsedPageLabel}</small>
        </div>
      )}

      {!collapsed && (
        <>
          <div className="book-tabs-shell">
            <div className="book-tabs" role="list">
              {books.map((book) => (
                <button
                  className={book.id === selectedBook.id ? 'book-tab active' : 'book-tab'}
                  key={book.id}
                  onClick={() => onBookSelect(book)}
                  type="button"
                >
                  <span>{book.stage}</span>
                  <strong>{book.title}</strong>
                </button>
              ))}
            </div>
            <button
              aria-label="折叠左侧菜单"
              className="collapse-button"
              onClick={onToggle}
              title="折叠菜单"
              type="button"
            >
              ‹
            </button>
          </div>

      <div className="book-summary">
        <p className="eyebrow">{selectedBook.outlineLabel}</p>
        <h2>{selectedBook.subtitle}</h2>
        <p>{selectedBook.goal}</p>
        <div className="book-page-nav" aria-label="书籍页面">
          <button
            className={!selectedChapter && selectedBookPage === 'guide' ? 'book-page-button active' : 'book-page-button'}
            onClick={() => onBookPageSelect(selectedBook, 'guide')}
            type="button"
          >
            <span>导读</span>
            <small>基础读法</small>
          </button>
          <button
            className={!selectedChapter && selectedBookPage === 'intro' ? 'book-page-button active' : 'book-page-button'}
            onClick={() => onBookPageSelect(selectedBook, 'intro')}
            type="button"
          >
            <span>简介</span>
            <small>目录结构</small>
          </button>
          <button
            className={!selectedChapter && selectedBookPage === 'summary' ? 'book-page-button active' : 'book-page-button'}
            onClick={() => onBookPageSelect(selectedBook, 'summary')}
            type="button"
          >
            <span>应用总结</span>
            <small>现实判断</small>
          </button>
          {stories && (
            <button
              className={!selectedChapter && selectedBookPage === 'stories' ? 'book-page-button active' : 'book-page-button'}
              onClick={() => onBookPageSelect(selectedBook, 'stories')}
              type="button"
            >
              <span>历史案例</span>
              <small>典故拆解</small>
            </button>
          )}
          {hasZhouyiLayers && (
            <>
              <button
                className={!selectedChapter && selectedBookPage === 'layers' ? 'book-page-button active' : 'book-page-button'}
                onClick={() => onBookPageSelect(selectedBook, 'layers')}
                type="button"
              >
                <span>三层体系</span>
                <small>原文易传术数</small>
              </button>
              <div className="book-layer-nav" aria-label="周易三层菜单">
                {zhouyiLayerIndex.layers.map((layer) => (
                  <button
                    className={
                      !selectedChapter && selectedBookPage === 'layers' && selectedZhouyiLayerId === layer.id
                        ? 'active'
                        : ''
                    }
                    key={layer.id}
                    onClick={() => onZhouyiLayerSelect(layer.id)}
                    type="button"
                  >
                    <span>{layer.routeLabel}</span>
                    <small>{layer.itemCount} 项</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <details className="chapter-list-panel" open>
        <summary>章节列表</summary>
        <div className="chapter-list">
          {selectedBook.sections.map((section) => (
            <section className="chapter-section" key={section.title}>
              <h3>{section.title}</h3>
              <div className="chapter-buttons">
                {section.chapterIds.map((chapterId) => {
                  const chapter = selectedBook.chapters.find((item) => item.id === chapterId)
                  if (!chapter) return null

                  return (
                    <button
                      className={chapter.id === selectedChapter?.id ? 'chapter-button active' : 'chapter-button'}
                      key={chapter.id}
                      onClick={() => onChapterSelect(selectedBook, chapter)}
                      type="button"
                    >
                      <span className="chapter-symbol">{chapter.symbol}</span>
                      <span className="chapter-button-copy">
                        <strong>{chapter.title}</strong>
                        <small className="chapter-one-line">{chapter.oneLineSummary}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </details>
        </>
      )}
    </aside>
  )
}

interface ReaderProps {
  book: Book
  chapter: Chapter
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function Reader({ book, chapter, onChapterSelect }: ReaderProps) {
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null)
  const [chapterLoadError, setChapterLoadError] = useState('')
  const chapterIndex = book.chapters.findIndex((item) => item.id === chapter.id)
  const previousChapter = chapterIndex > 0 ? book.chapters[chapterIndex - 1] : undefined
  const nextChapter = chapterIndex >= 0 && chapterIndex < book.chapters.length - 1 ? book.chapters[chapterIndex + 1] : undefined
  const studySegments = chapterContent ? getStudySegments(chapterContent) : []

  useEffect(() => {
    let cancelled = false
    setChapterContent(null)
    setChapterLoadError('')

    loadChapterContent(book.id, chapter.id)
      .then((content) => {
        if (!cancelled) {
          setChapterContent(content)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setChapterLoadError(error instanceof Error ? error.message : '章节加载失败')
        }
      })

    return () => {
      cancelled = true
    }
  }, [book.id, chapter.id])

  return (
    <article className="reader">
      <div className="reader-top">
        <div className="reader-header">
          <div className="reader-title">
            <p className="eyebrow">{`${book.title} / ${chapter.sectionTitle}`}</p>
            <h2>{chapter.title}</h2>
          </div>
          <div className="tag-row" aria-label="模型标签">
            {chapter.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
          <div className="chapter-nav" aria-label="章节切换">
            <button
              disabled={!previousChapter}
              onClick={() => previousChapter && onChapterSelect(book, previousChapter)}
              type="button"
            >
              上一章
            </button>
            <button
              disabled={!nextChapter}
              onClick={() => nextChapter && onChapterSelect(book, nextChapter)}
              type="button"
            >
              下一章
            </button>
          </div>
        </div>
      </div>

      <section className="reader-section">
        {chapterLoadError && <p className="empty-state">{chapterLoadError}</p>}
        {!chapterContent && !chapterLoadError && <p className="empty-state">章节内容加载中...</p>}
        {chapterContent && (
          <div className="study-grid">
            {studySegments.map((segment, index) => (
              <section className="study-row" key={`${chapter.id}-${index}`}>
                <div className="original-panel">
                  <span className="row-index">{String(index + 1).padStart(2, '0')}</span>
                  <p>{formatOriginalForReading(segment.original)}</p>
                </div>
                <div className="plain-panel">
                  <div className="plain-translation">
                    <strong>白话</strong>
                    <p>{segment.plain}</p>
                    {segment.versionNote && <small className="version-note">{`校勘：${segment.versionNote}`}</small>}
                  </div>
                  {segment.keywords.length > 0 && (
                    <dl className="keyword-list">
                      {segment.keywords.map((keyword) => (
                        <div key={keyword.term}>
                          <dt>{keyword.term}</dt>
                          <dd>{keyword.meaning}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {segment.logic && (
                    <div className="model-note">
                      <strong>逻辑模型</strong>
                      <p>{renderMarkedText(segment.logic)}</p>
                    </div>
                  )}
                  {segment.reality && (
                    <div className="example-note">
                      <strong>现实例子</strong>
                      <p>{renderMarkedText(segment.reality)}</p>
                    </div>
                  )}
                  {segment.practice && segment.practice.length > 0 && (
                    <div className="hint-note">
                      <strong>总结</strong>
                      <p>{renderMarkedText(segment.practice[0])}</p>
                    </div>
                  )}
                  {!segment.reality && !segment.practice?.length && segment.prompt && (
                    <div className="prompt-note">{segment.prompt}</div>
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>
    </article>
  )
}

interface BookFoundationOverviewProps {
  book: Book
  foundation: BookFoundation
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function BookFoundationOverview({ book, foundation, onChapterSelect }: BookFoundationOverviewProps) {
  const firstChapter = book.chapters[0]

  return (
    <section className="single-view foundation-overview">
      <div className="section-heading">
        <p className="eyebrow">书籍导读</p>
        <h2>{book.title}导读</h2>
      </div>
      <BookFoundationPanel foundation={foundation} bookTitle={book.title} />
      <div className="foundation-next">
        <p>导读先搭框架，章节再精读；后面不容易读散。</p>
        <button onClick={() => onChapterSelect(book, firstChapter)} type="button">
          开始阅读：{firstChapter.title}
        </button>
      </div>
    </section>
  )
}

interface BookIntroOverviewProps {
  book: Book
  intro: BookIntro
}

function BookIntroOverview({ book, intro }: BookIntroOverviewProps) {
  return (
    <section className="single-view book-page-view">
      <div className="section-heading">
        <p className="eyebrow">{book.title}</p>
        <h2>{intro.title}</h2>
      </div>

      <div className="book-page-lead">
        <strong>{intro.subtitle}</strong>
        <p>{intro.lead}</p>
      </div>

      <section className="book-page-section" aria-label="书籍结构">
        <h3>怎么分</h3>
        <div className="part-grid">
          {intro.parts.map((part) => (
            <article className="part-card" key={part.title}>
              <h4>{part.title}</h4>
              <p>{part.summary}</p>
              <small>{part.why}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="book-page-section" aria-label="读法抓手">
        <h3>抓住什么</h3>
        <div className="model-strip">
          {intro.structureNotes.map((note) => (
            <article key={note.title}>
              <strong>{note.title}</strong>
              <p>{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="book-page-section reading-steps" aria-label="阅读顺序">
        <span className="eyebrow">阅读顺序</span>
        <ol>
          {intro.readingPath.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </section>
  )
}

interface BookApplicationSummaryPageProps {
  book: Book
  summary: BookApplicationSummary
}

function BookApplicationSummaryPage({ book, summary }: BookApplicationSummaryPageProps) {
  return (
    <section className="single-view book-page-view">
      <div className="section-heading">
        <p className="eyebrow">{book.title}</p>
        <h2>{summary.title}</h2>
      </div>

      <div className="book-page-lead">
        <strong>{summary.subtitle}</strong>
        <p>{summary.lead}</p>
      </div>

      <section className="book-page-section" aria-label="应用模型">
        <h3>怎么用</h3>
        <div className="model-strip">
          {summary.models.map((model) => (
            <article key={model.title}>
              <strong>{model.title}</strong>
              <p>{model.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="book-page-section" aria-label="现实案例">
        <h3>现实例子</h3>
        <div className="case-list">
          {summary.cases.map((item) => (
            <article className="case-card" key={item.title}>
              <h4>{item.title}</h4>
              <dl>
                <div>
                  <dt>问题</dt>
                  <dd>{item.problem}</dd>
                </div>
                <div>
                  <dt>事实</dt>
                  <dd>{item.facts.join('；')}</dd>
                </div>
                <div>
                  <dt>模型</dt>
                  <dd>{item.model}</dd>
                </div>
                <div>
                  <dt>分析</dt>
                  <dd>{item.analysis}</dd>
                </div>
                <div>
                  <dt>建议</dt>
                  <dd>{item.advice}</dd>
                </div>
                <div>
                  <dt>复盘</dt>
                  <dd>{item.review}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="book-page-section reading-steps" aria-label="练习方式">
        <span className="eyebrow">练习方式</span>
        <ol>
          {summary.practice.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </section>
  )
}

interface BookHistoricalStoriesPageProps {
  book: Book
  stories: BookHistoricalStories
}

function BookHistoricalStoriesPage({ book, stories }: BookHistoricalStoriesPageProps) {
  return (
    <section className="single-view book-page-view">
      <div className="section-heading">
        <p className="eyebrow">{book.title}</p>
        <h2>{stories.title}</h2>
      </div>

      <div className="book-page-lead">
        <strong>{stories.subtitle}</strong>
        <p>{stories.lead}</p>
      </div>

      <section className="book-page-section" aria-label="历史案例">
        <h3>案例拆解</h3>
        <div className="case-list">
          {stories.cases.map((item) => (
            <article className="case-card story-card" key={item.title}>
              <div className="story-card-header">
                <div>
                  <span className="eyebrow">{item.period}</span>
                  <h4>{item.title}</h4>
                </div>
                <div className="result-tags">
                  {item.modelTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <dl>
                <div>
                  <dt>背景</dt>
                  <dd>{item.background}</dd>
                </div>
                <div>
                  <dt>起因</dt>
                  <dd>{item.trigger}</dd>
                </div>
                <div>
                  <dt>过程</dt>
                  <dd>{item.process}</dd>
                </div>
                <div>
                  <dt>结果</dt>
                  <dd>{item.result}</dd>
                </div>
                <div>
                  <dt>兵法</dt>
                  <dd>{item.principle}</dd>
                </div>
                <div>
                  <dt>问题</dt>
                  <dd>{item.executionProblems.join('；')}</dd>
                </div>
                <div>
                  <dt>现实</dt>
                  <dd>{item.modernUse}</dd>
                </div>
                <div>
                  <dt>复盘</dt>
                  <dd>{item.reviewQuestions.join('；')}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

interface ZhouyiLayersPageProps {
  book: Book
  layerIndex: ZhouyiLayerIndex
  selectedLayerId: string
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function ZhouyiLayersPage({ book, layerIndex, selectedLayerId, onChapterSelect }: ZhouyiLayersPageProps) {
  const [layerDetail, setLayerDetail] = useState<ZhouyiLayerDetail | null>(null)
  const [layerLoadError, setLayerLoadError] = useState('')
  const selectedLayer = layerIndex.layers.find((layer) => layer.id === selectedLayerId) ?? layerIndex.layers[0]

  useEffect(() => {
    let cancelled = false
    setLayerDetail(null)
    setLayerLoadError('')

    loadZhouyiLayerDetail(selectedLayerId)
      .then((detail) => {
        if (!cancelled) {
          setLayerDetail(detail)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLayerLoadError(error instanceof Error ? error.message : '三层内容加载失败')
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedLayerId])

  return (
    <section className="single-view book-page-view zhouyi-layers-view">
      <div className="section-heading layer-page-heading">
        <p className="eyebrow">周易分层阅读</p>
        <div className="layer-heading-main">
          <h2>{layerIndex.title}</h2>
          <p className="layer-heading-note">
            <strong>先分层，再深入。</strong>
            {layerIndex.lead}
          </p>
        </div>
      </div>

      {selectedLayer && (
        <section className="book-page-section layer-scope" aria-label="当前层级说明">
          <h3>{selectedLayer.subtitle}</h3>
          <p>{selectedLayer.scope}</p>
        </section>
      )}

      {layerLoadError && <p className="empty-state">{layerLoadError}</p>}
      {!layerDetail && !layerLoadError && <p className="empty-state">三层内容加载中...</p>}
      {layerDetail && (
        <div className="layer-detail">
          <div className="book-page-lead">
            <strong>{layerDetail.subtitle}</strong>
            <p>{layerDetail.lead}</p>
            <small>{layerDetail.sourceNote}</small>
          </div>

          {layerDetail.sections.map((section) => (
            <section className="book-page-section layer-section" key={section.id}>
              <div className="layer-section-heading">
                <h3>{section.title}</h3>
                <p>{section.summary}</p>
              </div>
              <div className="layer-item-list">
                {section.items.map((item) => (
                  <ZhouyiLayerCard
                    book={book}
                    item={item}
                    key={item.id}
                    onChapterSelect={onChapterSelect}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

interface ZhouyiLayerCardProps {
  book: Book
  item: ZhouyiLayerItem
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function ZhouyiLayerCard({ book, item, onChapterSelect }: ZhouyiLayerCardProps) {
  const linkedChapter = item.chapterId ? book.chapters.find((chapter) => chapter.id === item.chapterId) : null
  const sourceParts = item.sourceParts
  const hasSourceParts =
    sourceParts &&
    [sourceParts.guaCi, sourceParts.yaoCi, sourceParts.tuan, sourceParts.xiang, sourceParts.wenYan].some(
      (part) => part && part.length > 0,
    )

  return (
    <article className="case-card layer-card">
      <div className="layer-card-header">
        <div>
          <h4>{item.title}</h4>
          <p>{item.subtitle}</p>
        </div>
        {linkedChapter && (
          <button onClick={() => onChapterSelect(book, linkedChapter)} type="button">
            进入章节
          </button>
        )}
      </div>

      {hasSourceParts && <ZhouyiSourcePartSummary sourceParts={sourceParts} />}

      <dl>
        {item.original && (
          <div>
            <dt>原文</dt>
            <dd>{item.original}</dd>
          </div>
        )}
        <div>
          <dt>白话</dt>
          <dd>{item.plain}</dd>
        </div>
        {item.keywords.length > 0 && (
          <div>
            <dt>关键词</dt>
            <dd>
              <span className="inline-keywords">
                {item.keywords.map((keyword) => (
                  <span key={keyword.term}>
                    <strong>{keyword.term}</strong>
                    {keyword.note}
                  </span>
                ))}
              </span>
            </dd>
          </div>
        )}
        <div>
          <dt>逻辑</dt>
          <dd>{item.logic}</dd>
        </div>
        <div>
          <dt>现实</dt>
          <dd>{item.reality}</dd>
        </div>
        <div>
          <dt>应用</dt>
          <dd>{item.application}</dd>
        </div>
        <div>
          <dt>复盘</dt>
          <dd>{item.reviewQuestions.join('；')}</dd>
        </div>
      </dl>
    </article>
  )
}

function ZhouyiSourcePartSummary({ sourceParts }: { sourceParts: NonNullable<ZhouyiLayerItem['sourceParts']> }) {
  const parts = [
    ['卦辞', sourceParts.guaCi],
    ['爻辞', sourceParts.yaoCi],
    ['彖', sourceParts.tuan],
    ['象', sourceParts.xiang],
    ['文言', sourceParts.wenYan],
  ].filter(([, lines]) => Array.isArray(lines) && lines.length > 0) as Array<[string, string[]]>

  return (
    <div className="source-part-grid" aria-label="原文结构">
      {parts.map(([label, lines]) => (
        <div key={label}>
          <strong>{label}</strong>
          <span>{lines.length} 段</span>
          <small>{lines[0]}</small>
        </div>
      ))}
    </div>
  )
}

interface BookFoundationPanelProps {
  foundation: BookFoundation
  bookTitle: string
}

function BookFoundationPanel({ foundation, bookTitle }: BookFoundationPanelProps) {
  return (
    <details className="foundation-panel" open>
      <summary>
        <span className="eyebrow">{bookTitle}</span>
        <strong>{foundation.title}</strong>
      </summary>
      <div className="foundation-body">
        <p className="foundation-lead">{foundation.lead}</p>

        <div className="foundation-grid">
          {foundation.sections.map((section) => (
            <FoundationCard key={section.id} section={section} />
          ))}
        </div>

        {foundation.lineLadder && foundation.lineLadder.length > 0 && (
          <section className="line-ladder" aria-label={foundation.lineLadderLabel ?? '基础结构'}>
            <div>
              <span className="eyebrow">{foundation.lineLadderLabel ?? '基础结构'}</span>
              <h3>{foundation.lineLadderTitle ?? '先看结构，再读正文。'}</h3>
            </div>
            <div className="line-ladder-grid">
              {foundation.lineLadder.map((stage, index) => (
                <article key={stage.position}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{stage.position}</strong>
                  <em>{stage.image}</em>
                  <p>{stage.meaning}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="reading-steps" aria-label={`${bookTitle}阅读步骤`}>
          <span className="eyebrow">{foundation.readingLabel ?? '阅读顺序'}</span>
          <ol>
            {foundation.readingSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
    </details>
  )
}

interface FoundationCardProps {
  section: FoundationSection
}

function FoundationCard({ section }: FoundationCardProps) {
  return (
    <article className="foundation-card">
      <h3>{section.title}</h3>
      <p>{section.summary}</p>
      <ul>
        {section.points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
      <div className="foundation-example">
        <strong>直观例子</strong>
        <p>{section.example}</p>
      </div>
    </article>
  )
}

interface ConceptIndexProps {
  concepts: Concept[]
  books: Book[]
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function ConceptIndex({ concepts, books, onChapterSelect }: ConceptIndexProps) {
  return (
    <section className="single-view">
      <div className="section-heading">
        <p className="eyebrow">从章节笔记自动聚合</p>
        <h2>模型来自章节</h2>
      </div>
      <div className="concept-grid">
        {concepts.map((concept) => (
          <article className="concept-card" key={concept.id}>
            <div className="concept-card-header">
              <h3>{concept.title}</h3>
              <span>{concept.chapterRefs.length} 处</span>
            </div>
            <p>{concept.summary}</p>
            <div className="ref-list">
              {concept.chapterRefs.slice(0, 8).map((ref) => {
                const book = books.find((item) => item.id === ref.bookId)
                const chapter = book?.chapters.find((item) => item.id === ref.chapterId)
                if (!book || !chapter) return null

                return (
                  <button key={`${ref.bookId}-${ref.chapterId}`} onClick={() => onChapterSelect(book, chapter)} type="button">
                    <span className="ref-title">{ref.bookTitle} · {ref.chapterTitle}</span>
                    <small className="chapter-one-line">{chapter.oneLineSummary}</small>
                  </button>
                )
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PracticePanel() {
  return (
    <section className="single-view practice-view">
      <div className="section-heading">
        <p className="eyebrow">把经典变成现实观察工具</p>
        <h2>观察步骤：事实 → 标签 → 力量 → 资源 → 时位 → 边界</h2>
      </div>

      <div className="practice-board">
        <section className="practice-path" aria-label="观察步骤">
          {observationSteps.map((step, index) => (
            <article className="practice-step" key={step.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
                <small>{step.prompt}</small>
              </div>
            </article>
          ))}
        </section>

        <aside className="practice-template" aria-label="一次观察输出">
          <p className="eyebrow">一次观察的输出</p>
          <h3>最后只要写出一段清楚判断。</h3>
          <ol>
            {outputTemplate.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </aside>
      </div>

      <section className="lens-section" aria-label="三书镜头">
        <div className="section-subhead">
          <p className="eyebrow">三书镜头</p>
          <h3>同一件事，用三种问题扫一遍。</h3>
        </div>
        <div className="lens-grid">
          {practiceLenses.map((lens) => (
            <article className="lens-card" key={lens.book}>
              <span>{lens.book}</span>
              <h3>{lens.title}</h3>
              <p>{lens.focus}</p>
              <ul>
                {lens.questions.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="scene-section" aria-label="现实场景练习">
        <div className="section-subhead">
          <p className="eyebrow">现实场景练习</p>
          <h3>不要急着找玄妙答案，先把局面拆干净。</h3>
        </div>
        <div className="scene-grid">
          {practiceScenes.map((scene) => (
            <article className="scene-card" key={scene.title}>
              <h3>{scene.title}</h3>
              <p>{scene.fact}</p>
              <strong>{scene.observe}</strong>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

interface SearchPanelProps {
  books: Book[]
  concepts: Concept[]
  query: string
  onChange: (value: string) => void
  onChapterSelect: (book: Book, chapter: Chapter) => void
}

function SearchPanel({ books, concepts, query, onChange, onChapterSelect }: SearchPanelProps) {
  const [bookFilter, setBookFilter] = useState<BookId | 'all'>('all')
  const normalizedQuery = normalizeSearchText(query)
  const quickTerms = concepts.slice(0, 12).map((concept) => concept.title)

  const filteredBooks = useMemo(
    () => (bookFilter === 'all' ? books : books.filter((book) => book.id === bookFilter)),
    [bookFilter, books],
  )

  const results = useMemo(() => {
    if (!normalizedQuery) return []

    return filteredBooks
      .flatMap((book) =>
        book.chapters
          .map((chapter) => ({
            book,
            chapter,
            score: scoreChapter(book, chapter, normalizedQuery),
          }))
          .filter((result) => result.score > 0),
      )
      .sort((a, b) => b.score - a.score || a.chapter.order - b.chapter.order)
  }, [filteredBooks, normalizedQuery])

  const resultCounts = books.map((book) => ({
    book,
    count: normalizedQuery
      ? book.chapters.filter((chapter) => scoreChapter(book, chapter, normalizedQuery) > 0).length
      : book.chapters.length,
  }))
  const allResultCount = resultCounts.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="single-view search-view">
      <div className="section-heading">
        <p className="eyebrow">本地索引</p>
        <h2>搜索章节</h2>
      </div>

      <div className="search-panel">
        <div className="search-primary-row">
          <label className="search-box">
            <span>搜索关键词</span>
            <input
              onChange={(event) => onChange(event.target.value)}
              placeholder="例如：顺势、信息差、标签、旺铺、收尾、风险"
              value={query}
            />
          </label>

          <div className="search-filters" aria-label="书籍筛选">
            <button className={bookFilter === 'all' ? 'active' : ''} onClick={() => setBookFilter('all')} type="button">
              <span>全部</span>
              <small>{allResultCount}</small>
            </button>
            {resultCounts.map(({ book, count }) => (
              <button
                className={bookFilter === book.id ? 'active' : ''}
                key={book.id}
                onClick={() => setBookFilter(book.id)}
                type="button"
              >
                <span>{book.title}</span>
                <small>{count}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="quick-search" aria-label="二级搜索条件">
          <span>模型标签</span>
          <div>
            {quickTerms.map((term) => (
              <button key={term} onClick={() => onChange(term)} type="button">
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="search-summary">
        {normalizedQuery ? (
          <p>
            找到 <strong>{results.length}</strong> 个章节，关键词：<mark>{query.trim()}</mark>
          </p>
        ) : (
          <p>先输入现实关键词，或点一个模型标签开始。</p>
        )}
      </div>

      <div className="search-results">
        {query.trim() && results.length === 0 && <p className="empty-state">没有匹配结果，换一个模型词试试。</p>}
        {results.map(({ book, chapter }) => (
          <button className="result-item" key={`${book.id}-${chapter.id}`} onClick={() => onChapterSelect(book, chapter)} type="button">
            <div className="result-heading">
              <span>{book.title}</span>
              <strong>{highlightText(chapter.title, query)}</strong>
              <small>{chapter.sectionTitle}</small>
            </div>
            <p className="result-one-line">{highlightText(chapter.oneLineSummary, query)}</p>
            <p className="result-excerpt">{highlightText(chapter.keyExcerpt, query)}</p>
            <div className="result-tags">
              {chapter.tags.map((tag) => (
                <span key={tag}>{highlightText(tag, query)}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function scoreChapter(book: Book, chapter: Chapter, query: string) {
  const fields: Array<[string, number]> = [
    [book.title, 4],
    [chapter.title, 10],
    [chapter.oneLineSummary, 8],
    [chapter.keyExcerpt, 5],
    [chapter.sectionTitle, 3],
    [chapter.tags.join(' '), 7],
  ]

  return fields.reduce((score, [field, weight]) => {
    const normalizedField = normalizeSearchText(field)
    if (!normalizedField) return score
    if (normalizedField === query) return score + weight * 3
    if (normalizedField.includes(query)) return score + weight
    return score
  }, 0)
}

function highlightText(text: string, query: string) {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = trimmedQuery.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index === -1) return text

  return (
    <>
      {text.slice(0, index)}
      <mark className="search-hit">{text.slice(index, index + trimmedQuery.length)}</mark>
      {text.slice(index + trimmedQuery.length)}
    </>
  )
}

async function loadChapterContent(bookId: BookId, chapterId: string) {
  const modulePath = `./data/chapters/${bookId}/${chapterId}.json`
  const load = chapterModules[modulePath]
  if (!load) {
    throw new Error(`找不到章节内容：${bookId}/${chapterId}`)
  }

  return load()
}

async function loadZhouyiLayerDetail(layerId: string) {
  const modulePath = `./data/zhouyi-layers/details/${layerId}.json`
  const load = zhouyiLayerModules[modulePath]
  if (!load) {
    throw new Error(`找不到周易层级内容：${layerId}`)
  }

  return load()
}

function getStudySegments(chapter: ChapterContent): StudySegment[] {
  const translatedChapter = chapter.translation
  const logicChapter = chapter.logic

  if (translatedChapter) {
    return translatedChapter.items.map((item, index) => {
      const matchingLogic = findLogicNote(
        logicChapter?.notes ?? [],
        item.original,
        index,
        translatedChapter.items.length,
      )

      return {
        original: item.original,
        plain: item.plain,
        versionNote: index === 0 ? translatedChapter.versionNote : '',
        keywords: item.keywords.map((keyword) => ({
          term: keyword.term,
          meaning: keyword.note,
        })),
        logic: matchingLogic?.logic,
        reality: matchingLogic?.reality,
        practice: matchingLogic?.practice,
        status: 'manual',
      }
    })
  }

  return splitOriginalText(chapter.originalText).map((original) => ({
    original,
    plain: '本段还没有人工白话。先不要急着套模型：逐字读原文，标出看不懂的词，再查注本确认意思。',
    keywords: [],
    prompt: '浅层：找关键词。中层：看前后关系。深层：等人工校注后，再做现实映射。',
    status: 'draft',
  }))
}

function findLogicNote(notes: LogicPracticeNote[], original: string, index: number, translatedItemCount: number) {
  const normalizedOriginal = normalizeClassicalText(original)
  const exactMatch = notes.find((note) => normalizeClassicalText(note.segment) === normalizedOriginal)
  if (exactMatch) return exactMatch

  const partialMatch = notes.find((note) => {
    const normalizedSegment = normalizeClassicalText(note.segment)
    return normalizedSegment.includes(normalizedOriginal) || normalizedOriginal.includes(normalizedSegment)
  })

  if (partialMatch) return partialMatch

  return notes.length === translatedItemCount ? notes[index] : undefined
}

function normalizeClassicalText(value: string) {
  return value
    .replace(/[，。；：、！？“”‘’《》\s]/g, '')
    .replace(/兩/g, '两')
    .replace(/異/g, '异')
}

function splitOriginalText(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length > 1 && lines.length <= 18) {
    return lines
  }

  return [text.replace(/\n+/g, ' ').trim()].filter(Boolean)
}

function formatOriginalForReading(text: string) {
  const normalized = text.replace(/\n+/g, ' ').trim()
  if (normalized.length <= 72) {
    return normalized
  }

  return normalized.replace(/。/g, '。\n').replace(/\n$/, '')
}

function renderMarkedText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <mark className="inline-key" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </mark>
      )
    }

    return part
  })
}

function parseRoute() {
  const segments = window.location.pathname
    .split('/')
    .map((segment) => decodeURIComponent(segment))
    .filter(Boolean)

  const firstSegment = segments[0]
  if (firstSegment === 'concepts') {
    return makeRouteState('concepts')
  }

  if (firstSegment === 'practice') {
    return makeRouteState('practice')
  }

  if (firstSegment === 'search') {
    return makeRouteState('search')
  }

  const book = content.books.find((item) => item.id === firstSegment) ?? defaultBook
  if (segments[1] === 'intro') {
    return makeRouteState('outline', book.id, null, 'intro')
  }

  if (segments[1] === 'summary') {
    return makeRouteState('outline', book.id, null, 'summary')
  }

  if (segments[1] === 'stories' && storiesByBook[book.id]) {
    return makeRouteState('outline', book.id, null, 'stories')
  }

  if (segments[1] === 'layers' && book.id === 'zhouyi') {
    const layerId = zhouyiLayerIndex.layers.some((layer) => layer.id === segments[2])
      ? segments[2]
      : zhouyiLayerIndex.layers[0]?.id
    return makeRouteState('outline', book.id, null, 'layers', layerId)
  }

  const chapter = book.chapters.find((item) => item.id === segments[1]) ?? null
  return makeRouteState('outline', book.id, chapter?.id ?? null, 'guide')
}

function makeRouteState(
  view: View,
  bookId: BookId = defaultBook.id,
  chapterId: string | null = null,
  bookPage: BookPage = 'guide',
  zhouyiLayerId: string = zhouyiLayerIndex.layers[0]?.id ?? 'source',
): RouteState {
  return {
    view,
    bookId,
    chapterId,
    bookPage,
    zhouyiLayerId,
  }
}

function pushRoute(
  view: View,
  bookId: BookId,
  chapterId: string | null,
  bookPage: BookPage = 'guide',
  zhouyiLayerId: string = zhouyiLayerIndex.layers[0]?.id ?? 'source',
) {
  const nextPath =
    view === 'outline'
      ? chapterId
        ? `/${bookId}/${chapterId}`
        : bookPage === 'layers' && bookId === 'zhouyi'
          ? `/${bookId}/layers/${zhouyiLayerId}`
          : bookPage === 'guide'
            ? `/${bookId}`
            : `/${bookId}/${bookPage}`
      : `/${view}`
  if (window.location.pathname !== nextPath) {
    window.history.pushState(null, '', nextPath)
  }
}

export default App
