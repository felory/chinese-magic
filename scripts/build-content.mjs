import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(root, 'data', 'raw')
const authoritativeDir = path.join(rawDir, 'authoritative')
const generatedDir = path.join(root, 'data', 'generated')
const generatedZhouyiLayerDir = path.join(generatedDir, 'zhouyi-layers')
const srcDataDir = path.join(root, 'src', 'data')
const manualChapterDir = path.join(root, 'data', 'manual', 'chapters')
const manualFoundationDir = path.join(root, 'data', 'manual', 'foundations')
const manualBookPageDir = path.join(root, 'data', 'manual', 'book-pages')
const manualZhouyiLayerDir = path.join(root, 'data', 'manual', 'zhouyi-layers')
const srcFoundationDir = path.join(srcDataDir, 'foundations')
const srcBookPageDir = path.join(srcDataDir, 'book-pages')
const srcChapterDir = path.join(srcDataDir, 'chapters')
const srcZhouyiLayerDir = path.join(srcDataDir, 'zhouyi-layers')

const chineseNumbers = [
  '零',
  '一',
  '二',
  '三',
  '四',
  '五',
  '六',
  '七',
  '八',
  '九',
  '十',
  '十一',
  '十二',
  '十三',
  '十四',
  '十五',
  '十六',
  '十七',
  '十八',
  '十九',
  '二十',
  '二十一',
  '二十二',
  '二十三',
  '二十四',
  '二十五',
  '二十六',
  '二十七',
  '二十八',
  '二十九',
  '三十',
  '三十一',
  '三十二',
  '三十三',
  '三十四',
  '三十五',
  '三十六',
  '三十七',
  '三十八',
  '三十九',
  '四十',
  '四十一',
  '四十二',
  '四十三',
  '四十四',
  '四十五',
  '四十六',
  '四十七',
  '四十八',
  '四十九',
  '五十',
  '五十一',
  '五十二',
  '五十三',
  '五十四',
  '五十五',
  '五十六',
  '五十七',
  '五十八',
  '五十九',
  '六十',
  '六十一',
  '六十二',
  '六十三',
  '六十四',
  '六十五',
  '六十六',
  '六十七',
  '六十八',
  '六十九',
  '七十',
  '七十一',
  '七十二',
  '七十三',
  '七十四',
  '七十五',
  '七十六',
  '七十七',
  '七十八',
  '七十九',
  '八十',
  '八十一',
]

const simpleMap = new Map(
  Object.entries({
    萬: '万',
    與: '与',
    無: '无',
    為: '为',
    爲: '为',
    國: '国',
    軍: '军',
    將: '将',
    勝: '胜',
    敗: '败',
    戰: '战',
    體: '体',
    觀: '观',
    聖: '圣',
    見: '见',
    復: '复',
    盜: '盗',
    貴: '贵',
    實: '实',
    虛: '虚',
    強: '强',
    弱: '弱',
    亂: '乱',
    樂: '乐',
    知: '知',
    智: '智',
    長: '长',
    短: '短',
    聲: '声',
    後: '后',
    辭: '辞',
    母: '母',
    眾: '众',
    門: '门',
    滿: '满',
    湛: '湛',
    誰: '谁',
    橐: '橐',
    籥: '籥',
    數: '数',
    綿: '绵',
    勤: '勤',
    久: '久',
    領: '领',
    營: '营',
    衛: '卫',
    致: '致',
    塵: '尘',
    銳: '锐',
    紛: '纷',
    光: '光',
    淵: '渊',
    愛: '爱',
    憂: '忧',
    榮: '荣',
    辱: '辱',
    驚: '惊',
    患: '患',
    臨: '临',
    識: '识',
    達: '达',
    濟: '济',
    謀: '谋',
    計: '计',
    陰: '阴',
    陽: '阳',
    遠: '远',
    險: '险',
    廣: '广',
    狹: '狭',
    聽: '听',
    權: '权',
    詭: '诡',
    誘: '诱',
    親: '亲',
    爭: '争',
    離: '离',
    傳: '传',
    廟: '庙',
    算: '算',
    費: '费',
    賓: '宾',
    車: '车',
    內: '内',
    糧: '粮',
    貨: '货',
    諸: '诸',
    徵: '征',
    盡: '尽',
    運: '运',
    輸: '输',
    貧: '贫',
    賣: '卖',
    竭: '竭',
    財: '财',
    頓: '顿',
    擒: '擒',
    輔: '辅',
    進: '进',
    退: '退',
    政: '政',
    惑: '惑',
    疑: '疑',
    貽: '殆',
    攻: '攻',
    守: '守',
    形: '形',
    測: '测',
    勢: '势',
    節: '节',
    變: '变',
    迂: '迂',
    直: '直',
    雜: '杂',
    繫: '系',
    說: '说',
    經: '经',
    練: '练',
    賞: '赏',
    罰: '罚',
    間: '间',
    業: '业',
    學: '学',
    問: '问',
    辯: '辨',
    寬: '宽',
    誠: '诚',
    時: '时',
    龍: '龙',
    飛: '飞',
    鄉: '乡',
    歸: '归',
    過: '过',
    損: '损',
    益: '益',
    謙: '谦',
    隨: '随',
    蠱: '蛊',
    賁: '贲',
    剝: '剥',
    頤: '颐',
    恆: '恒',
    遯: '遁',
    壯: '壮',
    晉: '晋',
    睽: '睽',
    蹇: '蹇',
    夬: '夬',
    姤: '姤',
    萃: '萃',
    渙: '涣',
    孚: '孚',
    兌: '兑',
    巽: '巽',
    艮: '艮',
    乾: '乾',
    坤: '坤',
    亨: '亨',
    貞: '贞',
    厲: '厉',
    咎: '咎',
    悔: '悔',
    吝: '吝',
    羣: '群',
    資: '资',
    雲: '云',
    統: '统',
    寧: '宁',
    彖: '彖',
    象: '象',
    書: '书',
    孫: '孙',
    極: '极',
    參: '参',
    警: '警',
    讓: '让',
    對: '对',
    讀: '读',
    條: '条',
    開: '开',
    閉: '闭',
    網: '网',
    續: '续',
    源: '源',
    類: '类',
    篇: '篇',
    卦: '卦',
    釋: '释',
    義: '义',
  }),
)

const phaseByBook = {
  'dao-de-jing': {
    stage: '第1个月',
    goal: '建立底层世界观，降低内耗，学会顺势与借力。',
  },
  sunzi: {
    stage: '第2个月',
    goal: '理解现实竞争，把兵法当作信息、资源、节奏和人性的运行手册。',
  },
  zhouyi: {
    stage: '第3个月',
    goal: '学习变化与周期，先训练变化思维，不从算命起卦入门。',
  },
}

const tagRules = [
  ['顺势', /道|自然|无为|因|势|时|利|天/],
  ['降低内耗', /不争|少|欲|静|虚|柔|弱|守|辱|患/],
  ['人性', /民|欲|利|怒|赏|罚|信|仁|勇|严|争|亲/],
  ['系统规律', /天下|天地|万物|国|军|形|法|地|位|类/],
  ['信息差', /知|察|间|虚|实|形|计|谋|诡|示|候/],
  ['博弈', /攻|守|胜|败|战|敌|兵|争|权|利|谋/],
  ['资源', /粮|费|财|车|众|用|食|国|补|赏/],
  ['节奏', /速|久|进|退|动|待|先|后|时|行/],
  ['阴阳', /阴|阳|乾|坤|刚|柔|天地|日月/],
  ['变化', /变|复|反|终|始|极|过|损|益|革|解|未济|既济/],
  ['时位', /初|二|三|四|五|上|位|时|中|下|上/],
  ['风险边界', /危|厉|咎|悔|吝|凶|险|困|蹇/],
]

const bookMeta = {
  'dao-de-jing': {
    id: 'dao-de-jing',
    title: '道德经',
    subtitle: '底层世界观：顺势、反转、低内耗',
    sourceName: 'Project Gutenberg #7337',
    sourceUrl: 'https://www.gutenberg.org/ebooks/7337',
    license: 'Project Gutenberg License',
    outlineLabel: '道经 1-37 / 德经 38-81',
  },
  sunzi: {
    id: 'sunzi',
    title: '孙子兵法',
    subtitle: '现实竞争手册：信息差、资源、节奏',
    sourceName: 'Project Gutenberg #23864',
    sourceUrl: 'https://www.gutenberg.org/ebooks/23864',
    license: 'Project Gutenberg License',
    outlineLabel: '十三篇',
  },
  zhouyi: {
    id: 'zhouyi',
    title: '周易',
    subtitle: '变化思维：阴阳、时位、周期',
    sourceName: 'Project Gutenberg #25501',
    sourceUrl: 'https://www.gutenberg.org/ebooks/25501',
    license: 'Project Gutenberg License',
    outlineLabel: '上经 30 卦 / 下经 34 卦',
  },
}

const sunziTitles = [
  '始计第一',
  '作战第二',
  '谋攻第三',
  '军形第四',
  '兵势第五',
  '虚实第六',
  '军争第七',
  '九变第八',
  '行军第九',
  '地形第十',
  '九地第十一',
  '火攻第十二',
  '用间第十三',
]

const hexagramSymbols = [
  '䷀',
  '䷁',
  '䷂',
  '䷃',
  '䷄',
  '䷅',
  '䷆',
  '䷇',
  '䷈',
  '䷉',
  '䷊',
  '䷋',
  '䷌',
  '䷍',
  '䷎',
  '䷏',
  '䷐',
  '䷑',
  '䷒',
  '䷓',
  '䷔',
  '䷕',
  '䷖',
  '䷗',
  '䷘',
  '䷙',
  '䷚',
  '䷛',
  '䷜',
  '䷝',
  '䷞',
  '䷟',
  '䷠',
  '䷡',
  '䷢',
  '䷣',
  '䷤',
  '䷥',
  '䷦',
  '䷧',
  '䷨',
  '䷩',
  '䷪',
  '䷫',
  '䷬',
  '䷭',
  '䷮',
  '䷯',
  '䷰',
  '䷱',
  '䷲',
  '䷳',
  '䷴',
  '䷵',
  '䷶',
  '䷷',
  '䷸',
  '䷹',
  '䷺',
  '䷻',
  '䷼',
  '䷽',
  '䷾',
  '䷿',
]

const zhouyiLayerMeta = [
  {
    id: 'source',
    order: 1,
    title: '周易原文层',
    subtitle: '64卦、卦辞、爻辞、彖、象、文言。',
    scope: '先看每一卦的局面结构，别急着接五行和命理。',
    routeLabel: '原文层',
    source: 'Project Gutenberg #25501',
  },
  {
    id: 'yizhuan',
    order: 2,
    title: '易传总论层',
    subtitle: '系辞上、系辞下、说卦、序卦、杂卦。',
    scope: '补上《周易》为什么看象、看爻、看变化、看卦序。',
    routeLabel: '易传',
    source: 'Project Gutenberg #25501',
  },
  {
    id: 'later-tools',
    order: 3,
    title: '后世术数入门层',
    subtitle: '五行、天干地支、纳甲、六亲、世应、六爻、梅花易数、风水命理。',
    scope: '这是后来的工具箱，和《周易》有关，但不要混进64卦原文。',
    routeLabel: '术数',
    source: 'local notes',
  },
]

const yizhuanGroupMeta = {
  系辞上传: {
    id: 'xici-shang',
    title: '系辞上',
    summary: '讲《易》的总原理：天地、阴阳、象、爻、吉凶和变化。',
  },
  系辞下传: {
    id: 'xici-xia',
    title: '系辞下',
    summary: '讲《易》怎样进入人事、器物、制度和具体判断。',
  },
  说卦传: {
    id: 'shuogua',
    title: '说卦',
    summary: '讲八卦各自像什么：天、地、雷、风、水、火、山、泽，以及身体、动物、方位。',
  },
  序卦传: {
    id: 'xugua',
    title: '序卦',
    summary: '讲64卦为什么按这个顺序接下去，像一条从天地到人事的变化链。',
  },
  杂卦传: {
    id: 'zagua',
    title: '杂卦',
    summary: '用短句对照卦性，帮你快速抓每卦的相反、互补和核心味道。',
  },
}

function toSimple(text) {
  return [...text].map((char) => simpleMap.get(char) ?? char).join('')
}

function stripGutenberg(text, title) {
  const startMarker = `*** START OF THE PROJECT GUTENBERG EBOOK ${title} ***`
  const endMarker = `*** END OF THE PROJECT GUTENBERG EBOOK ${title} ***`
  const start = text.indexOf(startMarker)
  const end = text.indexOf(endMarker)
  const body = text.slice(start >= 0 ? start + startMarker.length : 0, end >= 0 ? end : text.length)
  return body
    .replace(/\r/g, '')
    .replace(/\uFEFF/g, '')
    .replace(/Produced by .+/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeText(text) {
  return toSimple(text)
    .replace(/﹔/g, '；')
    .replace(/「|」/g, '')
    .replace(/-{([^}]+)}-/g, '$1')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function chapterId(prefix, order) {
  return `${prefix}-${String(order).padStart(2, '0')}`
}

function inferTags(text, title) {
  const target = `${title}\n${text}`
  const tags = tagRules.filter(([, pattern]) => pattern.test(target)).map(([tag]) => tag)
  return tags.length > 0 ? tags.slice(0, 5) : ['观察', '模型']
}

function firstSentence(text) {
  const compact = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
  const match = compact.match(/^(.{8,80}?[。！？；])/)
  return match ? match[1] : compact.slice(0, 80)
}

function keyExcerpt(text) {
  return firstSentence(text).replace(/\s+/g, '')
}

function makeNotes(bookId, title, text, tags, order) {
  const { goal } = phaseByBook[bookId]
  const excerpt = keyExcerpt(text)
  const tagLead = tags.slice(0, 3).join('、')

  const plainByBook = {
    'dao-de-jing': `这一章可以先当作世界运行方式的提示来读：${excerpt}。它提醒你先看清力量流向，再决定是否出手，核心落在${tagLead}。`,
    sunzi: `这一篇不要只当战争条文看，而要当现实竞争里的判断流程：${excerpt}。它训练的是${tagLead}，先算条件，再谈行动。`,
    zhouyi: `这一卦先当作一种状态模型来读：${excerpt}。重点不是预测，而是识别当下处在什么阶段，以及${tagLead}如何变化。`,
  }

  const realityByBook = {
    'dao-de-jing': `放到生活里，先观察自己是否在用意志硬扛系统阻力：情绪、关系、工作流程、欲望刺激，哪一个正在制造内耗。`,
    sunzi: `放到现实竞争里，先问信息、资源、时机和对手状态是否清楚；条件不足时硬冲，往往只是把成本暴露出来。`,
    zhouyi: `放到现实里，把一件事看成阶段变化：萌芽、推进、受阻、过盛、转折。策略要跟位置变化，而不是固定一招。`,
  }

  return {
    plainSummary: plainByBook[bookId],
    logicNotes: [
      `原文抓手：${excerpt}`,
      `理解路径：先还原本章在原书大纲里的位置，再抽取${tagLead}这些可复用模型。`,
      `训练目标：${goal}`,
    ],
    realityMappings: [
      realityByBook[bookId],
      `本章可用于复盘一个最近发生的真实场景：你看到的表象是什么，背后的结构、节奏或位置是什么。`,
    ],
    practicePrompt:
      order % 7 === 0
        ? `周末复盘：把这一周的一个案例放进「${title}」里，看它体现了哪些标签：${tagLead}。`
        : `平日 10-20 分钟：读完「${title}」后，记录今天一个与「${tagLead}」有关的观察。`,
  }
}

function parseDao(text) {
  const body = normalizeText(stripGutenberg(text, '道德經'))
    .replace(/老子《道德经》 第一~四十章/g, '')
    .replace(/老子《道德经》 第四十一~八十一章/g, '')
    .replace(/老子道经|老子德经/g, '')
    .trim()

  const regex = /第([一二三四五六七八九十]+)章/g
  const matches = [...body.matchAll(regex)]
  return matches.map((match, index) => {
    const order = chineseNumbers.indexOf(match[1])
    const start = match.index + match[0].length
    const end = matches[index + 1]?.index ?? body.length
    const originalText = body.slice(start, end).trim()
    const title = `第${order}章`
    const sectionTitle = order <= 37 ? '道经' : '德经'
    const tags = inferTags(originalText, title)
    return {
      id: chapterId('ddj', order),
      bookId: 'dao-de-jing',
      order,
      sectionTitle,
      title,
      symbol: order <= 37 ? '道' : '德',
      originalText,
      keyExcerpt: keyExcerpt(originalText),
      tags,
      sourceUrl: 'https://www.gutenberg.org/ebooks/7337',
      ...makeNotes('dao-de-jing', title, originalText, tags, order),
    }
  })
}

function parseSunzi(text) {
  const body = normalizeText(stripGutenberg(text, '孫子兵法'))
  const matches = sunziTitles
    .map((title) => ({ title, index: body.indexOf(title) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index)

  return matches.map((match, index) => {
    const order = index + 1
    const start = match.index + match.title.length
    const end = matches[index + 1]?.index ?? body.length
    const originalText = body.slice(start, end).trim()
    const tags = inferTags(originalText, match.title)
    return {
      id: chapterId('sunzi', order),
      bookId: 'sunzi',
      order,
      sectionTitle: '十三篇',
      title: match.title,
      symbol: String(order).padStart(2, '0'),
      originalText,
      keyExcerpt: keyExcerpt(originalText),
      tags,
      sourceUrl: 'https://www.gutenberg.org/ebooks/23864',
      ...makeNotes('sunzi', match.title, originalText, tags, order),
    }
  })
}

function parseZhouyi(text) {
  const body = normalizeText(stripGutenberg(text, '易經'))
  const appendixStart = body.search(/《易[經经][﹒·．.]?(?:繫辞|系辞|說卦|说卦|序卦|杂卦)/)
  const mainBody = appendixStart === -1 ? body : body.slice(0, appendixStart)
  const regex = /第\s*([一二三四五六七八九十]+)\s*卦/g
  const matches = [...mainBody.matchAll(regex)]

  return matches.map((match, index) => {
    const order = index + 1
    const start = match.index + match[0].length
    const end = matches[index + 1]?.index ?? mainBody.length
    const chunk = mainBody.slice(start, end).trim()
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean)
    const firstLine = lines[0] ?? `第${order}卦`
    const firstLineNameMatch = firstLine.match(/^([^：]{1,8})：/)
    const name = firstLineNameMatch ? firstLineNameMatch[1] : firstLine
    const originalText = (firstLineNameMatch ? lines : lines.slice(1)).join('\n').trim()
    const title = `${hexagramSymbols[index]} ${toSimple(name)}`
    const tags = inferTags(originalText, title)
    return {
      id: chapterId('zhouyi', order),
      bookId: 'zhouyi',
      order,
      sectionTitle: order <= 30 ? '上经' : '下经',
      title,
      symbol: hexagramSymbols[index],
      originalText,
      keyExcerpt: keyExcerpt(originalText),
      tags,
      sourceUrl: 'https://www.gutenberg.org/ebooks/25501',
      ...makeNotes('zhouyi', title, originalText, tags, order),
    }
  })
}

async function readPreferredSource(authoritativeFilename, fallbackFilename) {
  const authoritativePath = path.join(authoritativeDir, authoritativeFilename)
  try {
    await access(authoritativePath)
    return readFile(authoritativePath, 'utf8')
  } catch {
    return readFile(path.join(rawDir, fallbackFilename), 'utf8')
  }
}

async function readManualChapter(bookId, chapterId) {
  const manualPath = path.join(manualChapterDir, bookId, `${chapterId}.json`)
  try {
    return JSON.parse(await readFile(manualPath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function readManualFoundation(id) {
  const foundationPath = path.join(manualFoundationDir, `${id}.json`)
  try {
    return JSON.parse(await readFile(foundationPath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function readManualBookPage(bookId, pageName) {
  const pagePath = path.join(manualBookPageDir, bookId, `${pageName}.json`)
  try {
    return JSON.parse(await readFile(pagePath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

async function readManualZhouyiLayer(layerId) {
  const layerPath = path.join(manualZhouyiLayerDir, `${layerId}.json`)
  try {
    return JSON.parse(await readFile(layerPath, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

function makeChapterMeta(chapter) {
  return {
    id: chapter.id,
    bookId: chapter.bookId,
    order: chapter.order,
    sectionTitle: chapter.sectionTitle,
    title: chapter.title,
    symbol: chapter.symbol,
    keyExcerpt: chapter.keyExcerpt,
    oneLineSummary: chapter.oneLineSummary,
    tags: chapter.tags,
    sourceUrl: chapter.sourceUrl,
  }
}

function makeBook(id, chapters) {
  const meta = bookMeta[id]
  const sections = [...new Set(chapters.map((chapter) => chapter.sectionTitle))].map((title) => ({
    title,
    chapterIds: chapters.filter((chapter) => chapter.sectionTitle === title).map((chapter) => chapter.id),
  }))

  return {
    ...meta,
    ...phaseByBook[id],
    chapterCount: chapters.length,
    sections,
    chapters,
  }
}

function makeBookIndex(book) {
  return {
    ...book,
    chapters: book.chapters.map(makeChapterMeta),
  }
}

function cleanOneLineSummary(value) {
  let summary = String(value ?? '')
    .replace(/\*\*/g, '')
    .replace(/`/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([，。；：、！？])/g, '$1')
    .trim()

  let previous = ''
  while (summary !== previous) {
    previous = summary
    summary = summary.replace(/([\u3400-\u9fff])\s+([\u3400-\u9fff])/g, '$1$2')
  }

  return summary
}

async function attachManualSummaries(books) {
  const manualCache = new Map()

  for (const book of books) {
    for (const chapter of book.chapters) {
      const manual = await readManualChapter(book.id, chapter.id)
      manualCache.set(`${book.id}/${chapter.id}`, manual)
      chapter.oneLineSummary =
        cleanOneLineSummary(manual?.oneLineSummary) ||
        cleanOneLineSummary(manual?.logic?.notes?.[0]?.practice?.[0]) ||
        firstSentence(chapter.plainSummary)
    }
  }

  return manualCache
}

function buildConcepts(books) {
  const conceptMap = new Map()
  for (const book of books) {
    for (const chapter of book.chapters) {
      for (const tag of chapter.tags) {
        if (!conceptMap.has(tag)) {
          conceptMap.set(tag, {
            id: tag,
            title: tag,
            summary: conceptSummary(tag),
            chapterRefs: [],
          })
        }

        conceptMap.get(tag).chapterRefs.push({
          bookId: book.id,
          bookTitle: book.title,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
        })
      }
    }
  }

  return [...conceptMap.values()].sort((a, b) => b.chapterRefs.length - a.chapterRefs.length)
}

function conceptSummary(tag) {
  const summaries = {
    顺势: '先看力量流向、环境条件和阻力结构，再决定怎样借力行动。',
    降低内耗: '减少被欲望、情绪和无效对抗牵引，把精力留给关键行动。',
    人性: '观察人如何被利害、恐惧、身份、奖惩和关系驱动。',
    系统规律: '把个人事件放回更大的结构里看：制度、资源、位置、反馈。',
    信息差: '谁更早、更准地知道真实状态，谁就少付试错成本。',
    博弈: '行动不是孤立选择，而是在对手、规则和反馈中的相互塑形。',
    资源: '判断补给、时间、注意力和组织能力，而不是只看愿望。',
    节奏: '同一件事在不同时机含义不同；慢、快、进、退都要看条件。',
    阴阳: '对立力量并不静止，它们互相依存、互相转化。',
    变化: '事情会经历阶段，极端状态常常孕育反向变化。',
    时位: '位置决定策略；同样的行为，放在不同阶段会产生不同后果。',
    风险边界: '识别凶、悔、吝、危这些信号，知道什么时候不该硬推。',
  }

  return summaries[tag] ?? '从章节中抽出的横向模型，可回到原文验证其出处。'
}

function splitZhouyiSourceParts(chapter) {
  const lines = chapter.originalText.split('\n').map((line) => line.trim()).filter(Boolean)
  const parts = {
    guaCi: [],
    yaoCi: [],
    tuan: [],
    xiang: [],
    wenYan: [],
  }
  let current = 'guaCi'

  for (const line of lines) {
    if (line.startsWith('文言曰：')) {
      current = 'wenYan'
      parts.wenYan.push(line)
      continue
    }

    if (line.startsWith('彖曰：')) {
      current = 'tuan'
      parts.tuan.push(line)
      continue
    }

    if (line.startsWith('象曰：')) {
      current = 'xiang'
      parts.xiang.push(line)
      continue
    }

    if (/^(初九|初六|九二|六二|九三|六三|九四|六四|九五|六五|上九|上六|用九|用六)：/.test(line)) {
      parts.yaoCi.push(line)
      continue
    }

    parts[current].push(line)
  }

  return parts
}

function buildZhouyiSourceLayer(zhouyiChapters) {
  const makeItem = (chapter) => {
    const parts = splitZhouyiSourceParts(chapter)
    const partNames = [
      parts.guaCi.length ? `卦辞 ${parts.guaCi.length}` : '',
      parts.yaoCi.length ? `爻辞 ${parts.yaoCi.length}` : '',
      parts.tuan.length ? `彖 ${parts.tuan.length}` : '',
      parts.xiang.length ? `象 ${parts.xiang.length}` : '',
      parts.wenYan.length ? `文言 ${parts.wenYan.length}` : '',
    ].filter(Boolean)

    return {
      id: chapter.id,
      chapterId: chapter.id,
      title: chapter.title,
      subtitle: chapter.oneLineSummary,
      original: chapter.keyExcerpt,
      plain: `先把它当成一个局面看：${chapter.oneLineSummary}`,
      keywords: [
        { term: '卦辞', note: '整卦的总判断。' },
        { term: '爻辞', note: '六个阶段各自的判断。' },
        { term: '彖 / 象', note: '彖解释判断理由，象给出行动取法。' },
      ],
      logic: `这一卦的原文材料包括 ${partNames.join('、')}。读法是先看总判断，再看六爻怎么一步步变，最后用彖和象校正理解。`,
      reality: '像看一个项目档案：先看项目总状态，再看每个阶段的风险记录，最后看复盘说明。',
      application: '进入章节页做逐段精读；这一层只负责把原文结构拆清楚。',
      reviewQuestions: ['卦辞给出的总局面是什么？', '六爻从下到上怎么变化？', '彖和象有没有改变你对原文的理解？'],
      sourceParts: parts,
    }
  }

  return {
    bookId: 'zhouyi',
    layerId: 'source',
    title: '周易原文层',
    subtitle: '64卦、卦辞、爻辞、彖、象、文言分开看。',
    lead: '这一层只处理《周易》经文和随卦出现的彖、象、文言。先练会看一卦的局面，不把后世五行、干支和命理塞进来。',
    sourceNote: '来自 Project Gutenberg #25501。这里按本地解析结果拆分结构，逐段白话和逻辑精读仍在各卦章节页中。',
    sections: [
      {
        id: 'upper-canon',
        title: '上经 30卦',
        summary: '从乾坤开始，先看天地开局、基础秩序、险阻、关系和大结构。',
        items: zhouyiChapters.filter((chapter) => chapter.order <= 30).map(makeItem),
      },
      {
        id: 'lower-canon',
        title: '下经 34卦',
        summary: '从咸恒开始，进入关系、家庭、组织、进退、改革、完成和未完成。',
        items: zhouyiChapters.filter((chapter) => chapter.order > 30).map(makeItem),
      },
    ],
  }
}

function parseYizhuanAppendices(text) {
  const body = normalizeText(stripGutenberg(text, '易經'))
  const appendixStart = body.search(/《易[經经][﹒·．.]?(?:系辞|说卦|序卦|杂卦)/)
  if (appendixStart === -1) return []

  const appendixBody = body.slice(appendixStart)
  const markerRegex = /《易[經经][﹒·．.]?(系辞上传|系辞下传|说卦传|序卦传|杂卦传)》(?:\s*第([一二三四五六七八九十]+)章)?/g
  const markers = [...appendixBody.matchAll(markerRegex)]

  return markers.flatMap((match, index) => {
    const groupKey = match[1]
    const chapterNumber = match[2] ?? ''
    const groupMeta = yizhuanGroupMeta[groupKey]

    if (!groupMeta) return []
    if (!chapterNumber && groupKey !== '序卦传' && groupKey !== '杂卦传') return []

    const order = chapterNumber ? chineseNumbers.indexOf(chapterNumber) : 1
    const start = match.index + match[0].length
    const end = markers[index + 1]?.index ?? appendixBody.length
    const original = appendixBody.slice(start, end).trim()
    const title = chapterNumber ? `${groupMeta.title} 第${order}章` : groupMeta.title

    return [
      {
        groupId: groupMeta.id,
        groupTitle: groupMeta.title,
        groupSummary: groupMeta.summary,
        order,
        title,
        original,
      },
    ]
  })
}

function inferYizhuanTopic(text) {
  if (/大衍|蓍|策|四十有九|十有八变|數|数/.test(text)) return '数和占筮流程'
  if (/受之|终焉/.test(text)) return '卦序变化链'
  if (/爻|彖|象|辞|吉凶|悔吝|无咎/.test(text)) return '卦爻辞和风险判断'
  if (/八卦|乾|坤|震|巽|坎|离|艮|兑|天地定位|山泽|雷风|水火/.test(text)) return '八卦象法'
  if (/刚柔|阴阳|一阴一阳|昼夜/.test(text)) return '阴阳刚柔'
  if (/器|舟|耒|市|书契|制度|圣人/.test(text)) return '象到器用'
  if (/言|行|枢机|密|盗|荣辱/.test(text)) return '言行和人事风险'
  return '变化总论'
}

function makeYizhuanKeywords(text, topic) {
  const candidates = [
    ['阴阳', '两股相反又互相需要的力量。', /阴|阳/],
    ['刚柔', '推动和承接的两种状态。', /刚|柔/],
    ['象', '用可见图像抓住局面。', /象/],
    ['爻', '一卦里的阶段位置。', /爻/],
    ['彖', '解释整卦判断理由。', /彖/],
    ['吉凶悔吝', '顺、险、后悔、卡住这些风险标签。', /吉|凶|悔|吝/],
    ['八卦', '乾坤震巽坎离艮兑八个基础图像。', /八卦|乾|坤|震|巽|坎|离|艮|兑/],
    ['大衍', '古人演算筮法的一套数字流程。', /大衍|蓍|策/],
    ['卦序', '64卦前后相接的变化顺序。', /受之|序|终焉/],
  ]

  const matched = candidates
    .filter(([, , pattern]) => pattern.test(text))
    .map(([term, note]) => ({ term, note }))

  if (matched.length > 0) return matched.slice(0, 4)

  return [{ term: topic, note: '这段先抓这个入口。' }]
}

function makeYizhuanItem(entry, index) {
  const topic = inferYizhuanTopic(entry.original)
  const groupPlain = {
    'xici-shang': '先把卦、象、爻、辞当成观察工具，看它们怎样帮助人判断变化。',
    'xici-xia': '把变化放回人事和制度里，看什么时候动、什么时候守、怎样落成做法。',
    shuogua: '把八卦当图像索引，用自然、身体、方位和关系来记住不同力量。',
    xugua: '看64卦怎样前后相接：一个状态会把事情推到下一个状态。',
    zagua: '用短句对照每卦气质，先抓差别，再回到章节细读。',
  }

  const realityByTopic = {
    '数和占筮流程': '像做一次复杂评估：不是随口判断，而是先把步骤固定，减少情绪插手。',
    八卦象法: '像用图标看天气：雷、风、水、火不是迷信词，而是帮你快速抓力量状态。',
    卦序变化链: '像项目生命周期：起步之后会混乱，混乱后要学习，学习后要等待资源。',
    阴阳刚柔: '像发动机和底盘：一个输出力，一个承载力，缺一个都跑不稳。',
    卦爻辞和风险判断: '像风险看板：吉凶悔吝不是吓人，是告诉你这一步可能顺、险、悔、卡。',
    象到器用: '像把自然原理变成工具：看见水会流，就发明舟楫；看见交易需要秩序，就建市场。',
    言行和人事风险: '像团队沟通：一句话能聚人，也能泄密、招怨、引发误判。',
    变化总论: '像看一条河：水一直动，关键是看它在哪里转弯、哪里受阻、哪里能通。',
  }

  return {
    id: `${entry.groupId}-${String(entry.order).padStart(2, '0')}`,
    title: entry.title,
    subtitle: topic,
    original: entry.original,
    plain: `${topic}是这一节的入口。${groupPlain[entry.groupId]}`,
    keywords: makeYizhuanKeywords(entry.original, topic),
    logic: `先把局面拆成图像、位置、变化和风险，再决定该动、守、等、退。`,
    reality: realityByTopic[topic] ?? realityByTopic.变化总论,
    application: `选一件正在发生的事：先写事实，再找图像，最后判断下一步会推向哪里。`,
    reviewQuestions: ['我有没有先看结构，而不是先下结论？', '这一段提醒我看哪类信号？', '如果判断错了，最可能漏掉什么条件？'],
    sourceOrder: index + 1,
  }
}

function mergeYizhuanManualLayer(generatedLayer, manualLayer) {
  if (!manualLayer) return generatedLayer

  const manualSections = new Map((manualLayer.sections ?? []).map((section) => [section.id, section]))
  const manualItems = new Map(
    (manualLayer.sections ?? [])
      .flatMap((section) => section.items ?? [])
      .map((item) => [item.id, item]),
  )

  return {
    ...generatedLayer,
    title: manualLayer.title ?? generatedLayer.title,
    subtitle: manualLayer.subtitle ?? generatedLayer.subtitle,
    lead: manualLayer.lead ?? generatedLayer.lead,
    sourceNote: manualLayer.sourceNote ?? generatedLayer.sourceNote,
    sections: generatedLayer.sections.map((section) => {
      const manualSection = manualSections.get(section.id)

      return {
        ...section,
        title: manualSection?.title ?? section.title,
        summary: manualSection?.summary ?? section.summary,
        items: section.items.map((item) => {
          const manualItem = manualItems.get(item.id)
          if (!manualItem) return item

          return {
            ...item,
            subtitle: manualItem.subtitle ?? item.subtitle,
            plain: manualItem.plain ?? item.plain,
            keywords: manualItem.keywords ?? item.keywords,
            logic: manualItem.logic ?? item.logic,
            reality: manualItem.reality ?? item.reality,
            application: manualItem.application ?? item.application,
            reviewQuestions: manualItem.reviewQuestions ?? item.reviewQuestions,
          }
        }),
      }
    }),
  }
}

function buildYizhuanLayer(text) {
  const entries = parseYizhuanAppendices(text)
  const groups = [...new Map(entries.map((entry) => [entry.groupId, entry])).values()]

  return {
    bookId: 'zhouyi',
    layerId: 'yizhuan',
    title: '易传总论层',
    subtitle: '先读64卦，再用易传补上“为什么这样看”。',
    lead: '这一层不是另起一套玄学，而是在解释《周易》的读法：象怎么来，爻怎么看，吉凶悔吝是什么，八卦和卦序为什么有意义。',
    sourceNote: '来自 Project Gutenberg #25501 的系辞上、系辞下、说卦、序卦、杂卦。本页按篇章拆分，给初学者先搭阅读框架。',
    sections: groups.map((group) => ({
      id: group.groupId,
      title: group.groupTitle,
      summary: group.groupSummary,
      items: entries
        .filter((entry) => entry.groupId === group.groupId)
        .map((entry, index) => makeYizhuanItem(entry, index)),
    })),
  }
}

function buildZhouyiLayerIndex(layerDetails) {
  const counts = new Map(
    layerDetails.map((detail) => [
      detail.layerId,
      {
        sectionCount: detail.sections.length,
        itemCount: detail.sections.reduce((sum, section) => sum + section.items.length, 0),
      },
    ]),
  )

  return {
    bookId: 'zhouyi',
    title: '周易三层体系',
    lead: '先读64卦，练会看局面；再读易传，补上为什么这样看；最后再学五行干支等术数工具。',
    layers: zhouyiLayerMeta.map((layer) => ({
      ...layer,
      ...counts.get(layer.id),
    })),
  }
}

async function buildZhouyiLayers(rawText, zhouyiChapters) {
  const laterTools = await readManualZhouyiLayer('later-tools')
  const manualYizhuan = await readManualZhouyiLayer('yizhuan')
  const yizhuan = mergeYizhuanManualLayer(buildYizhuanLayer(rawText), manualYizhuan)
  const details = [buildZhouyiSourceLayer(zhouyiChapters), yizhuan]

  if (laterTools) details.push(laterTools)

  return {
    index: buildZhouyiLayerIndex(details),
    details,
  }
}

async function main() {
  await mkdir(generatedDir, { recursive: true })
  await rm(generatedZhouyiLayerDir, { recursive: true, force: true })
  await mkdir(generatedZhouyiLayerDir, { recursive: true })
  await mkdir(srcDataDir, { recursive: true })
  await rm(srcChapterDir, { recursive: true, force: true })
  await mkdir(srcChapterDir, { recursive: true })
  await mkdir(srcFoundationDir, { recursive: true })
  await rm(srcBookPageDir, { recursive: true, force: true })
  await mkdir(srcBookPageDir, { recursive: true })
  await rm(srcZhouyiLayerDir, { recursive: true, force: true })
  await mkdir(srcZhouyiLayerDir, { recursive: true })

  const dao = parseDao(await readPreferredSource('dao-de-jing.txt', 'dao-de-jing-gutenberg.txt'))
  const sunzi = parseSunzi(await readPreferredSource('sunzi.txt', 'sunzi-gutenberg.txt'))
  const yijingText = await readPreferredSource('yijing.txt', 'zhouyi-gutenberg.txt')
  const zhouyi = parseZhouyi(yijingText)
  const books = [makeBook('dao-de-jing', dao), makeBook('sunzi', sunzi), makeBook('zhouyi', zhouyi)]
  const manualCache = await attachManualSummaries(books)
  const indexBooks = books.map(makeBookIndex)
  const concepts = buildConcepts(books)
  const zhouyiLayers = await buildZhouyiLayers(yijingText, zhouyi)
  const foundations = await Promise.all(
    books.map(async (book) => [book.id, await readManualFoundation(book.id)]),
  )
  const bookPages = await Promise.all(
    books.map(async (book) => [
      book.id,
      {
        intro: await readManualBookPage(book.id, 'intro'),
        summary: await readManualBookPage(book.id, 'summary'),
        stories: await readManualBookPage(book.id, 'stories'),
      },
    ]),
  )

  const payload = {
    generatedAt: new Date().toISOString(),
    books,
    concepts,
    practice: {
      weekday: '平日 10-20 分钟：读一小段原文，看一条白话理解，记一个现实观察。',
      weekend: '周末 60-90 分钟：复盘本周案例，把观察归入书本章节和模型标签。',
      monthly: [
        {
          month: 1,
          bookId: 'dao-de-jing',
          title: '建立底层世界观',
          focus: ['降低内耗', '顺势', '系统规律', '借力'],
        },
        {
          month: 2,
          bookId: 'sunzi',
          title: '理解现实竞争',
          focus: ['信息差', '博弈', '节奏', '资源', '时机'],
        },
        {
          month: 3,
          bookId: 'zhouyi',
          title: '学习变化与周期',
          focus: ['阴阳', '变化', '时位', '风险边界'],
        },
      ],
    },
  }

  const indexPayload = {
    ...payload,
    books: indexBooks,
  }

  for (const book of books) {
    const bookChapterDir = path.join(srcChapterDir, book.id)
    await mkdir(bookChapterDir, { recursive: true })

    for (const chapter of book.chapters) {
      const manual = manualCache.get(`${book.id}/${chapter.id}`)
      const chapterContent = {
        ...chapter,
        translation: manual?.translation ?? null,
        logic: manual?.logic ?? null,
      }

      await writeFile(
        path.join(bookChapterDir, `${chapter.id}.json`),
        `${JSON.stringify(chapterContent, null, 2)}\n`,
        'utf8',
      )
    }
  }

  for (const [bookId, foundation] of foundations) {
    if (!foundation) continue
    await writeFile(
      path.join(srcFoundationDir, `${bookId}.json`),
      `${JSON.stringify(foundation, null, 2)}\n`,
      'utf8',
    )
  }

  for (const [bookId, pages] of bookPages) {
    const bookPageOutputDir = path.join(srcBookPageDir, bookId)
    await mkdir(bookPageOutputDir, { recursive: true })

    for (const [pageName, page] of Object.entries(pages)) {
      if (!page) continue
      await writeFile(
        path.join(bookPageOutputDir, `${pageName}.json`),
        `${JSON.stringify(page, null, 2)}\n`,
        'utf8',
      )
    }
  }

  await writeFile(
    path.join(srcZhouyiLayerDir, 'index.json'),
    `${JSON.stringify(zhouyiLayers.index, null, 2)}\n`,
    'utf8',
  )
  await writeFile(
    path.join(generatedZhouyiLayerDir, 'index.json'),
    `${JSON.stringify(zhouyiLayers.index, null, 2)}\n`,
    'utf8',
  )

  const zhouyiLayerDetailsDir = path.join(srcZhouyiLayerDir, 'details')
  const generatedZhouyiLayerDetailsDir = path.join(generatedZhouyiLayerDir, 'details')
  await mkdir(zhouyiLayerDetailsDir, { recursive: true })
  await mkdir(generatedZhouyiLayerDetailsDir, { recursive: true })
  for (const detail of zhouyiLayers.details) {
    await writeFile(
      path.join(zhouyiLayerDetailsDir, `${detail.layerId}.json`),
      `${JSON.stringify(detail, null, 2)}\n`,
      'utf8',
    )
    await writeFile(
      path.join(generatedZhouyiLayerDetailsDir, `${detail.layerId}.json`),
      `${JSON.stringify(detail, null, 2)}\n`,
      'utf8',
    )
  }

  await writeFile(path.join(generatedDir, 'content.json'), JSON.stringify(payload, null, 2), 'utf8')
  await writeFile(path.join(generatedDir, 'content-index.json'), JSON.stringify(indexPayload, null, 2), 'utf8')
  await writeFile(
    path.join(srcDataDir, 'content.ts'),
    `import type { ContentPayload } from './types'\n\nexport const content = ${JSON.stringify(
      indexPayload,
      null,
      2,
    )} satisfies ContentPayload\n`,
    'utf8',
  )

  console.log(`built ${dao.length} dao chapters, ${sunzi.length} sunzi chapters, ${zhouyi.length} zhouyi hexagrams`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
