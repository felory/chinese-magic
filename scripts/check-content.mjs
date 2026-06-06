import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const contentPath = path.join(root, 'data', 'generated', 'content.json')
const manualChapterDir = path.join(root, 'data', 'manual', 'chapters')
const manualFoundationDir = path.join(root, 'data', 'manual', 'foundations')
const manualBookPageDir = path.join(root, 'data', 'manual', 'book-pages')
const manualZhouyiLayerDir = path.join(root, 'data', 'manual', 'zhouyi-layers')
const srcChapterDir = path.join(root, 'src', 'data', 'chapters')
const srcBookPageDir = path.join(root, 'src', 'data', 'book-pages')
const srcZhouyiLayerDir = path.join(root, 'src', 'data', 'zhouyi-layers')

const expectedCounts = {
  'dao-de-jing': 81,
  sunzi: 13,
  zhouyi: 64,
}

const expectedTotal = Object.values(expectedCounts).reduce((sum, count) => sum + count, 0)

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeClassicalText(value) {
  return String(value ?? '')
    .replace(/[，。；：、！？“”‘’《》\s]/g, '')
    .replace(/兩/g, '两')
    .replace(/潛/g, '潜')
    .replace(/終/g, '终')
}

async function readJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await readJsonFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath)
    }
  }

  return files
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

const payload = JSON.parse(await readFile(contentPath, 'utf8'))
const manualFiles = await readJsonFiles(manualChapterDir)
const expectedManualPaths = new Set()

assert(manualFiles.length === expectedTotal, `manual chapter count is ${manualFiles.length}, expected ${expectedTotal}`)

for (const book of payload.books) {
  assert(book.chapters.length === expectedCounts[book.id], `${book.title} parsed ${book.chapters.length} chapters`)

  for (const chapter of book.chapters) {
    const manualPath = path.join(manualChapterDir, book.id, `${chapter.id}.json`)
    const srcChapterPath = path.join(srcChapterDir, book.id, `${chapter.id}.json`)
    const manual = await readJson(manualPath)
    const srcChapter = await readJson(srcChapterPath)
    const manualItems = manual.translation?.items ?? []
    const manualNotes = manual.logic?.notes ?? []

    expectedManualPaths.add(manualPath)

    assert(chapter.originalText?.length > 10, `${book.title} ${chapter.title} missing original text`)
    assert(chapter.plainSummary?.length > 20, `${book.title} ${chapter.title} missing plain summary`)
    assert(chapter.oneLineSummary?.length > 8, `${book.title} ${chapter.title} missing one-line summary`)
    assert(chapter.logicNotes?.length >= 3, `${book.title} ${chapter.title} missing logic notes`)
    assert(chapter.realityMappings?.length >= 2, `${book.title} ${chapter.title} missing reality mappings`)
    assert(chapter.practicePrompt?.length > 20, `${book.title} ${chapter.title} missing practice prompt`)
    assert(chapter.tags?.length > 0, `${book.title} ${chapter.title} missing tags`)
    if (book.id === 'zhouyi') {
      assert(!/[繫系]辞|說卦|说卦|序卦|杂卦/.test(chapter.originalText), `${chapter.title} includes appendix text`)
    }

    assert(manual.chapterId === chapter.id, `${manualPath} chapterId does not match catalog`)
    assert(manual.oneLineSummary === chapter.oneLineSummary, `${manualPath} oneLineSummary not copied to catalog`)
    assert(manualItems.length > 0, `${manualPath} missing manual translation items`)
    assert(manualNotes.length > 0, `${manualPath} missing manual logic notes`)
    assert(manualItems.length === manualNotes.length, `${manualPath} manual translation and logic are not aligned`)
    assert(srcChapter.translation?.items?.length === manualItems.length, `${srcChapterPath} missing generated translation`)
    assert(srcChapter.logic?.notes?.length === manualNotes.length, `${srcChapterPath} missing generated logic`)
    assert(srcChapter.oneLineSummary === manual.oneLineSummary, `${srcChapterPath} oneLineSummary not generated`)
  }
}

assert(payload.concepts.length >= 8, 'concept index is too small')

for (const bookId of Object.keys(expectedCounts)) {
  const foundation = JSON.parse(await readFile(path.join(manualFoundationDir, `${bookId}.json`), 'utf8'))
  assert(foundation.bookId === bookId, `${bookId} foundation missing matching bookId`)
  assert(foundation.title?.length > 10, `${bookId} foundation missing title`)
  assert(foundation.lead?.length > 50, `${bookId} foundation missing lead`)
  assert(foundation.sections?.length >= 6, `${bookId} foundation needs core sections`)
  assert(foundation.readingSteps?.length >= 5, `${bookId} foundation needs reading steps`)

  if (bookId === 'zhouyi') {
    assert(foundation.lineLadder?.length === 6, 'zhouyi foundation needs six line stages')
  }

  for (const [index, section] of foundation.sections.entries()) {
    assert(section.title?.trim(), `${bookId} foundation section ${index + 1} missing title`)
    assert(section.summary?.trim(), `${bookId} foundation section ${index + 1} missing summary`)
    assert(section.points?.length >= 3, `${bookId} foundation section ${index + 1} needs points`)
    assert(section.example?.trim(), `${bookId} foundation section ${index + 1} missing example`)
  }

  const intro = await readJson(path.join(manualBookPageDir, bookId, 'intro.json'))
  const summary = await readJson(path.join(manualBookPageDir, bookId, 'summary.json'))
  const generatedIntro = await readJson(path.join(srcBookPageDir, bookId, 'intro.json'))
  const generatedSummary = await readJson(path.join(srcBookPageDir, bookId, 'summary.json'))

  assert(intro.bookId === bookId, `${bookId} intro missing matching bookId`)
  assert(intro.title?.trim(), `${bookId} intro missing title`)
  assert(intro.lead?.length > 30, `${bookId} intro missing lead`)
  assert(intro.parts?.length >= 2, `${bookId} intro needs parts`)
  assert(intro.structureNotes?.length >= 3, `${bookId} intro needs structure notes`)
  assert(intro.readingPath?.length >= 3, `${bookId} intro needs reading path`)
  assert(generatedIntro.title === intro.title, `${bookId} intro not generated`)

  assert(summary.bookId === bookId, `${bookId} summary missing matching bookId`)
  assert(summary.title?.trim(), `${bookId} summary missing title`)
  assert(summary.lead?.length > 30, `${bookId} summary missing lead`)
  assert(summary.models?.length >= 3, `${bookId} summary needs models`)
  assert(summary.cases?.length >= 2, `${bookId} summary needs cases`)
  assert(summary.practice?.length >= 3, `${bookId} summary needs practice`)
  assert(generatedSummary.title === summary.title, `${bookId} summary not generated`)

  for (const [index, part] of intro.parts.entries()) {
    assert(part.title?.trim(), `${bookId} intro part ${index + 1} missing title`)
    assert(part.summary?.trim(), `${bookId} intro part ${index + 1} missing summary`)
    assert(part.why?.trim(), `${bookId} intro part ${index + 1} missing why`)
  }

  for (const [index, item] of summary.cases.entries()) {
    assert(item.title?.trim(), `${bookId} summary case ${index + 1} missing title`)
    assert(item.problem?.trim(), `${bookId} summary case ${index + 1} missing problem`)
    assert(item.facts?.length >= 3, `${bookId} summary case ${index + 1} needs facts`)
    assert(item.model?.trim(), `${bookId} summary case ${index + 1} missing model`)
    assert(item.analysis?.trim(), `${bookId} summary case ${index + 1} missing analysis`)
    assert(item.advice?.trim(), `${bookId} summary case ${index + 1} missing advice`)
    assert(item.review?.trim(), `${bookId} summary case ${index + 1} missing review`)
  }

  if (bookId === 'sunzi') {
    const stories = await readJson(path.join(manualBookPageDir, bookId, 'stories.json'))
    const generatedStories = await readJson(path.join(srcBookPageDir, bookId, 'stories.json'))

    assert(stories.bookId === bookId, 'sunzi stories missing matching bookId')
    assert(stories.title?.trim(), 'sunzi stories missing title')
    assert(stories.lead?.length > 30, 'sunzi stories missing lead')
    assert(stories.cases?.length >= 4, 'sunzi stories needs historical cases')
    assert(generatedStories.title === stories.title, 'sunzi stories not generated')

    for (const [index, item] of stories.cases.entries()) {
      assert(item.title?.trim(), `sunzi story ${index + 1} missing title`)
      assert(item.background?.trim(), `sunzi story ${index + 1} missing background`)
      assert(item.trigger?.trim(), `sunzi story ${index + 1} missing trigger`)
      assert(item.process?.trim(), `sunzi story ${index + 1} missing process`)
      assert(item.result?.trim(), `sunzi story ${index + 1} missing result`)
      assert(item.principle?.trim(), `sunzi story ${index + 1} missing principle`)
      assert(item.executionProblems?.length >= 3, `sunzi story ${index + 1} needs execution problems`)
      assert(item.modernUse?.trim(), `sunzi story ${index + 1} missing modern use`)
      assert(item.reviewQuestions?.length >= 3, `sunzi story ${index + 1} needs review questions`)
    }
  }
}

const zhouyiLayerIndex = await readJson(path.join(srcZhouyiLayerDir, 'index.json'))
assert(zhouyiLayerIndex.bookId === 'zhouyi', 'zhouyi layer index missing bookId')
assert(zhouyiLayerIndex.layers?.length === 3, 'zhouyi layer index must have three layers')

const requiredLayerIds = ['source', 'yizhuan', 'later-tools']
for (const layerId of requiredLayerIds) {
  assert(
    zhouyiLayerIndex.layers.some((layer) => layer.id === layerId),
    `zhouyi layer index missing ${layerId}`,
  )
}

const zhouyiSourceLayer = await readJson(path.join(srcZhouyiLayerDir, 'details', 'source.json'))
assert(zhouyiSourceLayer.sections?.length === 2, 'zhouyi source layer should split upper/lower canon')
const sourceHexagrams = zhouyiSourceLayer.sections.flatMap((section) => section.items ?? [])
assert(sourceHexagrams.length === 64, `zhouyi source layer has ${sourceHexagrams.length} hexagrams`)
for (const item of sourceHexagrams) {
  assert(item.chapterId?.startsWith('zhouyi-'), `${item.title} missing chapterId`)
  assert(item.sourceParts?.guaCi?.length >= 1, `${item.title} missing guaCi`)
  assert(item.sourceParts?.yaoCi?.length >= 6, `${item.title} missing yaoCi`)
  assert(item.sourceParts?.tuan?.length >= 1, `${item.title} missing tuan`)
  assert(item.sourceParts?.xiang?.length >= 1, `${item.title} missing xiang`)
  assert(item.plain?.trim(), `${item.title} missing source plain note`)
  assert(item.logic?.trim(), `${item.title} missing source logic note`)
}

const zhouyiYizhuanLayer = await readJson(path.join(srcZhouyiLayerDir, 'details', 'yizhuan.json'))
const yizhuanSectionIds = new Set((zhouyiYizhuanLayer.sections ?? []).map((section) => section.id))
for (const sectionId of ['xici-shang', 'xici-xia', 'shuogua', 'xugua', 'zagua']) {
  assert(yizhuanSectionIds.has(sectionId), `yizhuan layer missing ${sectionId}`)
}
const yizhuanItems = zhouyiYizhuanLayer.sections.flatMap((section) => section.items ?? [])
assert(yizhuanItems.length >= 37, `yizhuan layer parsed ${yizhuanItems.length} items`)
const manualYizhuanLayer = await readJson(path.join(manualZhouyiLayerDir, 'yizhuan.json'))
const manualYizhuanItems = manualYizhuanLayer.sections.flatMap((section) => section.items ?? [])
const manualYizhuanIds = new Set(manualYizhuanItems.map((item) => item.id))
const forbiddenYizhuanPhrases = [/主要讲/, /用这段看现实/, /拿一个正在发生的事来练/, /总说明书/]

assert(manualYizhuanLayer.bookId === 'zhouyi', 'manual yizhuan layer missing bookId')
assert(manualYizhuanLayer.layerId === 'yizhuan', 'manual yizhuan layer missing layerId')
assert(manualYizhuanItems.length === yizhuanItems.length, 'manual yizhuan layer must cover every parsed item')
for (const item of yizhuanItems) {
  assert(manualYizhuanIds.has(item.id), `manual yizhuan layer missing ${item.id}`)
  assert(item.original?.length > 20, `${item.title} missing original`)
  assert(item.plain?.length > 20, `${item.title} missing plain`)
  assert(item.logic?.length > 20, `${item.title} missing logic`)
  assert(item.reality?.length > 20, `${item.title} missing reality`)
  assert(item.application?.length > 20, `${item.title} missing application`)
  assert(item.reviewQuestions?.length >= 3, `${item.title} needs review questions`)

  for (const phrase of forbiddenYizhuanPhrases) {
    assert(!phrase.test(item.plain), `${item.title} plain still contains template phrase ${phrase}`)
    assert(!phrase.test(item.logic), `${item.title} logic still contains template phrase ${phrase}`)
    assert(!phrase.test(item.application), `${item.title} application still contains template phrase ${phrase}`)
  }
}
assert(
  new Set(yizhuanItems.map((item) => item.logic)).size >= Math.floor(yizhuanItems.length * 0.8),
  'yizhuan logic notes are too repetitive',
)

const zhouyiLaterToolsLayer = await readJson(path.join(srcZhouyiLayerDir, 'details', 'later-tools.json'))
const laterToolItems = zhouyiLaterToolsLayer.sections.flatMap((section) => section.items ?? [])
assert(laterToolItems.length >= 8, 'later-tools layer needs core术数 topics')
for (const topic of ['五行', '天干地支', '纳甲', '六亲', '世应', '六爻', '梅花易数', '风水', '命理']) {
  assert(
    laterToolItems.some((item) => item.title.includes(topic)),
    `later-tools layer missing ${topic}`,
  )
}

for (const manualPath of manualFiles) {
  assert(expectedManualPaths.has(manualPath), `${manualPath} is not referenced by the catalog`)
  const manual = await readJson(manualPath)
  const items = manual.translation?.items ?? []
  const notes = manual.logic?.notes ?? []

  if (!items.length && !notes.length) continue

  assert(manual.chapterId, `${manualPath} missing chapterId`)
  assert(manual.oneLineSummary?.trim(), `${manualPath} missing oneLineSummary`)

  for (const [index, item] of items.entries()) {
    assert(item.original?.trim(), `${manualPath} translation item ${index + 1} missing original`)
    assert(item.plain?.trim(), `${manualPath} translation item ${index + 1} missing plain`)
    assert(Array.isArray(item.keywords), `${manualPath} translation item ${index + 1} keywords must be an array`)
  }

  for (const [index, note] of notes.entries()) {
    assert(note.segment?.trim(), `${manualPath} logic note ${index + 1} missing segment`)
    assert(note.logic?.trim(), `${manualPath} logic note ${index + 1} missing logic`)
    assert(note.reality?.trim(), `${manualPath} logic note ${index + 1} missing reality`)
    assert(
      Array.isArray(note.practice) && note.practice.length === 1 && note.practice[0]?.trim(),
      `${manualPath} logic note ${index + 1} practice must contain one summary`,
    )
  }

  if (items.length && notes.length) {
    assert(
      items.length === notes.length,
      `${manualPath} translation items (${items.length}) and logic notes (${notes.length}) are not aligned`,
    )

    for (const [index, item] of items.entries()) {
      assert(
        normalizeClassicalText(item.original) === normalizeClassicalText(notes[index].segment),
        `${manualPath} item ${index + 1} translation original and logic segment do not match`,
      )
    }
  }
}

console.log('content check passed')
