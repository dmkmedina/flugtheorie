// ============================================================================
// Flugtheorie — Swiss Paragliding Theory Trainer
// ============================================================================

// ---- State & persistence ----------------------------------------------------
const LS_KEY = 'flugtheorie-state-v2';

const DEFAULT_STATE = {
  view: 'dashboard',                    // current view
  theme: 'auto',                        // 'light' | 'dark' | 'auto'
  legacyOpen: false,                    // Legacy nav group expanded?

  cards: {},                            // per-card: { box, reviews, lastSeen, lastResult }
  // flashcards UI
  fc: { category: 'all', mode: 'flashcards', index: 0, shuffle: false, query: '' },
  // mock exam
  exam: {
    active: false,
    startedAt: 0,
    durationSec: 90 * 60,
    cards: [],                          // ids
    answers: [],                        // user answer indexes (null = skipped)
    choices: [],                        // per-question choices arrays
    flagged: [],                        // set of indexes
    current: 0,
    history: []                         // past exam summaries
  },
  // SHV official-pool exam
  shvExam: {
    active: false,
    mode: 'exam',                       // 'exam' | 'study' | 'review' (review = post-exam review)
    startedAt: 0,
    durationSec: 90 * 60,
    qids: [],                           // question ids drawn from window.SHV_QUESTIONS
    answers: [],                        // selected option indexes (null = skipped)
    flagged: [],
    current: 0,
    setup: { topic: 'all', subcategory: 'all', count: 100 },
    history: []
  },
  // SHV browse view (no exam — explore the pool by topic + subcategory)
  shvBrowse: {
    topic: null,                        // null = pick first available on render
    expandedSubs: {},                   // { '<topic>::<subcat-id>': true }
    expandedQs: {},                     // { '<topic>_<qid>': true }
    query: ''
  },
  // Quick 10 — ten random questions drawn from the SHV pool, with a shuffle button
  quick: { qids: [], answers: {} },
  // guide
  guide: { partId: null, chapterId: null },
  // slide decks (Freewings)
  slides: { deckId: null, page: 1 },
  // videos (Freewings)
  videos: { deckId: null, openId: null, lang: 'en' },
  // workbook
  workbook: {
    bookId: null,
    chapterId: null,
    completed: {},      // {chapterId: {readAt, quizScore, quizTotal, quizAnswers:{cardId: pickedIdx}}}
    quizActive: false,  // true when in the quiz panel of the current chapter
    quizIdx: 0,         // current question within the quiz
    quizChoices: {}     // {cardId: [4 strings]} cached for current chapter
  }
};

let state = loadState();
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return JSON.parse(JSON.stringify(DEFAULT_STATE));
    const parsed = JSON.parse(raw);
    // merge defaults defensively
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      ...parsed,
      fc: { ...DEFAULT_STATE.fc, ...(parsed.fc || {}) },
      exam: { ...DEFAULT_STATE.exam, ...(parsed.exam || {}) },
      shvExam: { ...DEFAULT_STATE.shvExam, ...(parsed.shvExam || {}), setup: { ...DEFAULT_STATE.shvExam.setup, ...((parsed.shvExam && parsed.shvExam.setup) || {}) } },
      shvBrowse: { ...DEFAULT_STATE.shvBrowse, ...(parsed.shvBrowse || {}) },
      quick: { ...DEFAULT_STATE.quick, ...(parsed.quick || {}) },
      guide: { ...DEFAULT_STATE.guide, ...(parsed.guide || {}) },
      slides: { ...DEFAULT_STATE.slides, ...(parsed.slides || {}) },
      videos: { ...DEFAULT_STATE.videos, ...(parsed.videos || {}) },
      workbook: { ...DEFAULT_STATE.workbook, ...(parsed.workbook || {}), completed: { ...(parsed.workbook && parsed.workbook.completed || {}) } }
    };
  } catch { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }
}
function saveState() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
}

// ---- Data accessors ---------------------------------------------------------
const CATEGORIES = ['Legislation', 'Equipment', 'Meteorology', 'Flight Practice', 'Aerodynamics'];
const CATEGORY_META = {
  'Legislation':     { color: '#3b82f6', icon: '⚖️', short: 'Law' },
  'Equipment':       { color: '#f59e0b', icon: '🪂', short: 'Equip' },
  'Meteorology':     { color: '#06b6d4', icon: '🌦️', short: 'Meteo' },
  'Flight Practice': { color: '#10b981', icon: '🪂', short: 'Prac' },
  'Aerodynamics':    { color: '#a855f7', icon: '📐', short: 'Aero' }
};

const PART_TO_CATEGORY = {
  part1: 'Aerodynamics',
  part2: 'Meteorology',
  part3: 'Legislation',
  part4: 'Equipment',
  part5: 'Flight Practice'
};

// ============================================================================
// i18n — UI strings. The data layer (questions, enrichments, workbook) carries
// its own German copies; this dictionary is for chrome (nav, headers, labels,
// buttons) that's not embedded in any data file.
// ============================================================================
const STRINGS = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.quickquiz': 'Quick 10',
    'nav.workbook': 'Workbook',
    'nav.shv-exam': 'SHV Practice',
    'nav.shv-browse': 'SHV Browse',
    'nav.guide': 'Study Guide',
    'nav.slides': 'Slide Decks',
    'nav.videos': 'Videos (EN subs)',
    'nav.cheatsheet': 'Cheat Sheet',
    'nav.tips': 'Tips',
    'nav.legacy': 'Legacy',
    'nav.flashcards': 'Flashcards',
    'nav.quiz': 'Quiz',
    'nav.exam': 'Mock Exam',
    'sidebar.study': 'Study',

    'page.dashboard.h1': 'Welcome to Flugtheorie 🪂',
    'page.quickquiz.h1': '🎲 Quick 10',
    'quick.intro': 'Ten questions pulled at random from the full SHV pool. Tap an answer to check it — then shuffle for a fresh ten.',
    'quick.shuffle': 'Shuffle questions',
    'page.shv-exam.h1': '🎯 SHV Practice Exam',
    'page.shv-browse.h1': '🗂️ SHV Browse',
    'page.workbook.h1': 'Workbook',
    'page.slides.h1': 'Slide Decks',
    'page.videos.h1': 'Video lessons',
    'page.cheatsheet.h1': 'Cheat Sheet',
    'page.tips.h1': 'Exam Tips & Strategy',

    'enrich.why': '💡 Why',
    'enrich.diagrams': '📐 Diagrams',
    'enrich.listen': '📺 Listen to the instructor',
    'enrich.slides': '🎬 Slides',
    'enrich.readmore': '📖 Read more',

    'shv.pickTopic': 'Pick a topic.',
    'shv.searchPlaceholder': 'Search {topic} questions and answers…',
    'shv.correctAnswer': 'Correct answer',
    'shv.referenceFigure': 'Reference figure',
    'shv.expandAll': 'Expand all subtopics',
    'shv.collapseAll': 'Collapse all',

    'btn.start': 'Start',
    'btn.cancel': 'Cancel',
    'btn.next': 'Next',
    'btn.previous': 'Previous',
    'btn.finish': 'Finish',
    'btn.continue': 'Continue',
    'btn.review': 'Review',
    'btn.retry': 'Try again',
    'btn.close': 'Close',

    'lang.toggle.de': '🇩🇪 Deutsch',
    'lang.toggle.en': '🇬🇧 English',
    'theme.auto': '🖥 Auto theme',
    'theme.light': '☀️ Light',
    'theme.dark': '🌙 Dark',
  },
  de: {
    'nav.dashboard': 'Übersicht',
    'nav.quickquiz': '10 Fragen',
    'nav.workbook': 'Arbeitsbuch',
    'nav.shv-exam': 'SHV-Prüfung',
    'nav.shv-browse': 'SHV-Übersicht',
    'nav.guide': 'Studienführer',
    'nav.slides': 'Folien',
    'nav.videos': 'Videos (DE-Untertitel)',
    'nav.cheatsheet': 'Spickzettel',
    'nav.tips': 'Tipps',
    'nav.legacy': 'Archiv',
    'nav.flashcards': 'Lernkarten',
    'nav.quiz': 'Quiz',
    'nav.exam': 'Probeprüfung',
    'sidebar.study': 'Lernen',

    'page.dashboard.h1': 'Willkommen bei Flugtheorie 🪂',
    'page.quickquiz.h1': '🎲 10 Fragen',
    'quick.intro': 'Zehn zufällig aus dem gesamten SHV-Pool gezogene Fragen. Tippe auf eine Antwort, um sie zu prüfen — dann für zehn neue mischen.',
    'quick.shuffle': 'Fragen mischen',
    'page.shv-exam.h1': '🎯 SHV-Übungsprüfung',
    'page.shv-browse.h1': '🗂️ SHV-Übersicht',
    'page.workbook.h1': 'Arbeitsbuch',
    'page.slides.h1': 'Folien',
    'page.videos.h1': 'Videolektionen',
    'page.cheatsheet.h1': 'Spickzettel',
    'page.tips.h1': 'Prüfungstipps & Strategie',

    'enrich.why': '💡 Warum',
    'enrich.diagrams': '📐 Diagramme',
    'enrich.listen': '📺 Hör dem Instruktor zu',
    'enrich.slides': '🎬 Folien',
    'enrich.readmore': '📖 Mehr dazu',

    'shv.pickTopic': 'Wähle ein Fachgebiet.',
    'shv.searchPlaceholder': '{topic} – Fragen und Antworten durchsuchen…',
    'shv.correctAnswer': 'Richtige Antwort',
    'shv.referenceFigure': 'Bezugsabbildung',
    'shv.expandAll': 'Alle Unterthemen ausklappen',
    'shv.collapseAll': 'Alle einklappen',

    'btn.start': 'Starten',
    'btn.cancel': 'Abbrechen',
    'btn.next': 'Weiter',
    'btn.previous': 'Zurück',
    'btn.finish': 'Beenden',
    'btn.continue': 'Weiter',
    'btn.review': 'Überprüfen',
    'btn.retry': 'Nochmals versuchen',
    'btn.close': 'Schliessen',

    'lang.toggle.de': '🇩🇪 Deutsch',
    'lang.toggle.en': '🇬🇧 English',
    'theme.auto': '🖥 Auto-Design',
    'theme.light': '☀️ Hell',
    'theme.dark': '🌙 Dunkel',
  },
};
function t(key, vars) {
  const lang = (typeof state !== 'undefined' && state && state.lang) || 'en';
  let s = (STRINGS[lang] && STRINGS[lang][key]) || (STRINGS.en && STRINGS.en[key]) || key;
  if (vars) for (const k of Object.keys(vars)) s = s.replace('{' + k + '}', vars[k]);
  return s;
}

function getCards() { return window.CARDS || []; }
function getSHVQuestions() {
  if (state.lang === 'de' && window.SHV_QUESTIONS_DE && window.SHV_QUESTIONS_DE.questions) {
    const de = window.SHV_QUESTIONS_DE.questions;
    if (Object.keys(de).length) return de;
  }
  const pool = window.SHV_QUESTIONS && window.SHV_QUESTIONS.questions;
  return pool && Object.keys(pool).length ? pool : null;
}
function hasGermanSHV() {
  return !!(window.SHV_QUESTIONS_DE && window.SHV_QUESTIONS_DE.questions && Object.keys(window.SHV_QUESTIONS_DE.questions).length);
}
function getSHVTopics() {
  const t = (window.SHV_QUESTIONS && window.SHV_QUESTIONS.topics) || {};
  return Object.keys(t).sort();
}
function getSHVQuestionsByTopic() {
  const pool = getSHVQuestions() || {};
  const byTopic = {};
  for (const q of Object.values(pool)) {
    (byTopic[q.topic] = byTopic[q.topic] || []).push(q);
  }
  return byTopic;
}
function getSHVEnrichments() {
  if (state.lang === 'de' && window.SHV_ENRICHMENTS_DE && window.SHV_ENRICHMENTS_DE.enrichments) {
    return window.SHV_ENRICHMENTS_DE.enrichments;
  }
  return (window.SHV_ENRICHMENTS && window.SHV_ENRICHMENTS.enrichments) || {};
}
function getSHVEnrichmentFor(qid) {
  // qid may be a number OR a compound "Topic_<num>" string.
  const e = getSHVEnrichments();
  return e[qid] || e[String(qid)] || null;
}
function getSHVSubcategories() {
  if (state.lang === 'de' && window.SHV_ENRICHMENTS_DE && window.SHV_ENRICHMENTS_DE.subcategories) {
    return window.SHV_ENRICHMENTS_DE.subcategories;
  }
  return (window.SHV_ENRICHMENTS && window.SHV_ENRICHMENTS.subcategories) || {};
}
function getSHVSubcategoriesForTopic(topic) {
  return getSHVSubcategories()[topic] || [];
}
function getSHVSubcategoryFor(qid) {
  const e = getSHVEnrichmentFor(qid);
  if (!e || !e.subcategory) return null;
  const subs = getSHVSubcategoriesForTopic(e.topic);
  return subs.find(s => s.id === e.subcategory) || { id: e.subcategory, title: e.subcategory };
}
function getGuide() {
  if (state.lang === 'de' && window.GUIDE_DE && window.GUIDE_DE.parts && window.GUIDE_DE.parts.length) {
    return window.GUIDE_DE;
  }
  return window.GUIDE || { parts: [] };
}
function getTipsMd() {
  if (state.lang === 'de' && window.TIPS_MD_DE) return window.TIPS_MD_DE;
  return window.TIPS_MD || '';
}
function getDecks() { return (window.DECKS && window.DECKS.decks) || []; }
function getVideoManifest() { return window.VIDEO_MANIFEST || { decks: [] }; }
function getVideoDecks() { return getVideoManifest().decks || []; }
function getAllVideos() { return getVideoDecks().flatMap(d => d.videos || []); }
function getVideoById(id) { return getAllVideos().find(v => v.id === id) || null; }
function getVideoDeck(deckId) { return getVideoDecks().find(d => d.id === deckId) || null; }
function getDiagrams() { return (window.DIAGRAMS && window.DIAGRAMS.diagrams) || []; }
function getWorkbook() {
  if (state.lang === 'de' && window.WORKBOOK_DE && window.WORKBOOK_DE.books && window.WORKBOOK_DE.books.length) {
    return window.WORKBOOK_DE.books;
  }
  return (window.WORKBOOK && window.WORKBOOK.books) || [];
}
function hasGermanWorkbook() {
  return !!(window.WORKBOOK_DE && window.WORKBOOK_DE.books && window.WORKBOOK_DE.books.length);
}
function getBookById(id) { return getWorkbook().find(b => b.id === id); }
function getChapterById(bookId, chapterId) {
  const b = getBookById(bookId);
  return b && b.chapters.find(c => c.id === chapterId);
}
function getDeckById(id) { return getDecks().find(d => d.id === id); }
function getDeckByCategory(cat) { return getDecks().find(d => d.category === cat); }
function deckSlideCount(d) { return (d.slides || d.pages || []).length; }
function deckSlides(d) {
  // Back-compat shim: support both new {slides:[{page,...}]} and old {pages:[N,...]}
  if (Array.isArray(d.slides)) return d.slides;
  return (d.pages || []).map(p => ({ page: p, de_title: '', de_body: '', en_title: '', en_body: '' }));
}
function slideUrl(deck, page) {
  const num = String(page).padStart(3, '0');
  return `${deck.path}/page-${num}.jpg`;
}

function cardsForCategory(cat) {
  if (cat === 'all') return getCards();
  return getCards().filter(c => c.category === cat);
}
function getCardById(id) {
  return getCards().find(c => c.id === id);
}

function cardProgress(id) {
  return state.cards[id] || { box: 0, reviews: 0, right: 0, wrong: 0, lastSeen: 0 };
}
function totalProgressFor(cat) {
  const list = cardsForCategory(cat);
  let mastered = 0, seen = 0;
  list.forEach(c => {
    const p = state.cards[c.id];
    if (p) {
      seen++;
      if (p.box >= 3) mastered++;
    }
  });
  return { total: list.length, seen, mastered };
}

// ---- Spaced repetition (simple Leitner) -------------------------------------
// Boxes: 0 (new/again) → 4 (mastered). Each correct answer moves up; wrong resets.
function recordSrs(cardId, grade) {
  // grade: 'again' | 'hard' | 'good' | 'easy'
  const p = state.cards[cardId] || { box: 0, reviews: 0, right: 0, wrong: 0, lastSeen: 0 };
  p.reviews++;
  p.lastSeen = Date.now();
  p.lastResult = grade;
  switch (grade) {
    case 'again': p.box = 0; p.wrong++; break;
    case 'hard':  p.box = Math.max(0, p.box); p.right++; break;
    case 'good':  p.box = Math.min(4, p.box + 1); p.right++; break;
    case 'easy':  p.box = Math.min(4, p.box + 2); p.right++; break;
  }
  state.cards[cardId] = p;
  saveState();
}

// ---- Markdown rendering (simple) --------------------------------------------
function renderMarkdown(md) {
  if (!md) return '';
  // Very small markdown subset
  let html = md.replace(/\r/g, '');
  // escape HTML
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // code spans
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  // links [text](url)
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  // strong **
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // em *
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>');
  // headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // lists
  const lines = html.split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    if (/^\s*-\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + line.replace(/^\s*-\s+/, '') + '</li>');
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line);
    }
  }
  if (inList) out.push('</ul>');
  html = out.join('\n');
  // paragraphs (split blank lines)
  html = html.split(/\n\n+/).map(b => {
    if (b.startsWith('<h') || b.startsWith('<ul') || b.startsWith('<li') || !b.trim()) return b;
    return '<p>' + b.replace(/\n/g, ' ') + '</p>';
  }).join('\n');
  return html;
}

// ---- Helpers ----------------------------------------------------------------
function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
}
function shuffle(arr) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function pickN(arr, n, excludeId) {
  const pool = arr.filter(c => c.id !== excludeId);
  return shuffle(pool).slice(0, n);
}
// Get plausible MC distractors for a card.  Uses the curated list from
// window.DISTRACTORS when present, falling back to random other-answers.
function distractorsFor(card, n = 3) {
  const curated = window.DISTRACTORS && window.DISTRACTORS[card.id];
  if (Array.isArray(curated) && curated.length >= n) {
    return shuffle(curated.slice()).slice(0, n);
  }
  return pickN(cardsForCategory(card.category), n, card.id).map(c => c.a_en);
}
function fmtTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function normalizeText(s) {
  return (s || '').toLowerCase()
    .replace(/[äöüß]/g, m => ({ä:'ae',ö:'oe',ü:'ue',ß:'ss'}[m]))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function gradeFreeText(user, correct) {
  const u = normalizeText(user);
  const c = normalizeText(correct);
  if (!u) return { kind: 'bad', pct: 0 };
  if (u === c) return { kind: 'good', pct: 100 };
  const uWords = new Set(u.split(' ').filter(w => w.length >= 3));
  const cWords = new Set(c.split(' ').filter(w => w.length >= 3));
  if (cWords.size === 0) {
    return u.includes(c) || c.includes(u) ? { kind: 'good', pct: 100 } : { kind: 'bad', pct: 0 };
  }
  let hits = 0;
  cWords.forEach(w => { if (uWords.has(w)) hits++; });
  const pct = Math.round(100 * hits / cWords.size);
  if (pct >= 70) return { kind: 'good', pct };
  if (pct >= 40) return { kind: 'warn', pct };
  return { kind: 'bad', pct };
}

// Cross-link "Question NNN" references inside guide text → flashcard ID lookup
function findCardByQuestionNumber(partId, questionNumber) {
  const cat = PART_TO_CATEGORY[partId];
  if (!cat) return null;
  return getCards().find(c => c.category === cat && c.original_id === questionNumber);
}

// ---- Theme ------------------------------------------------------------------
function applyTheme() {
  const root = document.documentElement;
  if (state.theme === 'dark') root.setAttribute('data-theme', 'dark');
  else if (state.theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');
}

// ---- Routing ----------------------------------------------------------------
const VIEWS = ['dashboard', 'quickquiz', 'flashcards', 'workbook', 'quiz', 'exam', 'shv-exam', 'shv-browse', 'guide', 'slides', 'videos', 'cheatsheet', 'tips'];
function navigate(view) {
  if (!VIEWS.includes(view)) view = 'dashboard';
  if (state.view !== view) {
    state.view = view;
    saveState();
  }
  render();
  // close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-backdrop').classList.remove('show');
  window.scrollTo(0, 0);
}

// ============================================================================
// VIEW: Dashboard
// ============================================================================
function renderDashboard() {
  // Numbers used in section descriptions — counts of what's inside.
  const books = getWorkbook();
  const wbChapters = books.reduce((a, b) => a + (b.chapters?.length || 0), 0);
  const shvPool = getSHVQuestions() || {};
  const shvTotal = Object.keys(shvPool).length;
  const shvTopics = Object.keys(getSHVQuestionsByTopic()).length;
  const subcats = Object.values(getSHVSubcategories() || {}).reduce((a, s) => a + s.length, 0);
  const enrichedCount = Object.values(getSHVEnrichments() || {}).filter(e => e.explanation).length;
  const enrichedPct = shvTotal > 0 ? Math.round(100 * enrichedCount / shvTotal) : 0;
  const guide = getGuide();
  const guideChapters = (guide.parts || []).reduce((a, p) => a + (p.chapters?.length || 0), 0);
  const guideParts = (guide.parts || []).length;
  const guideDiagrams = getDiagrams().length;
  const videos = getAllVideos();
  const videoHours = videos.reduce((a, v) => a + (v.duration_seconds || 0), 0) / 3600;
  const enSubs = videos.filter(v => v.has_en_vtt).length;
  const deSubs = videos.filter(v => v.has_de_vtt).length;
  const decks = getDecks();
  const totalSlides = decks.reduce((a, d) => a + (d.slides?.length || 0), 0);
  const shvImageCount = Object.values(shvPool).filter(q => q.has_image).length;

  const isDE = state.lang === 'de';
  const sections = isDE ? [
    {
      id: 'shv-exam',
      icon: '🎯',
      title: 'SHV-Übungsprüfung',
      tagline: 'Die echte Prüfung absolvieren — unter Prüfungsbedingungen oder entspannt zum Üben.',
      bullets: [
        `<strong>${shvTotal}</strong> Fragen aus dem offiziellen SHV-E-Learning-Pool zu ${shvTopics} Themen`,
        'Zeitmodus simuliert die echte 90-minütige Prüfung · Lernmodus zeigt Antworten und Erklärungen direkt an',
        'Auswertung nach Unterthema nach jedem Versuch — so weisst du, woran du arbeiten musst',
      ],
      cta: 'Übung starten',
      primary: true,
    },
    {
      id: 'shv-browse',
      icon: '🗂️',
      title: 'SHV-Übersicht',
      tagline: 'Jede Frage erkunden, ohne eine Prüfung zu starten.',
      bullets: [
        `Baumansicht aller <strong>${shvTotal}</strong> Fragen, gegliedert in ${subcats} Unterthemen`,
        'Jede Frage aufklappbar mit richtiger Antwort, Erklärung, verwandten Lernführer-/Arbeitsbuch-Kapiteln, Videoclips, Diagrammen und Folien',
        'Volltextsuche über Fragetexte und Antworten',
      ],
      cta: 'Übersicht öffnen',
    },
    {
      id: 'workbook',
      icon: '📒',
      title: 'Arbeitsbuch',
      tagline: 'Strukturiertes Lernen Kapitel für Kapitel mit Quizzen.',
      bullets: [
        `<strong>${wbChapters}</strong> Kapitel in ${books.length} Büchern${hasGermanWorkbook() ? ' (EN + DE)' : ''}`,
        'Jedes Kapitel kombiniert Fliesstext, Hinweise, Definitionen, Tabellen und ein Quiz am Ende',
        'Abgeglichen mit den Videotranskripten von Free Wings und Air Active',
      ],
      cta: 'Arbeitsbuch öffnen',
    },
    {
      id: 'guide',
      icon: '📚',
      title: 'Studienführer',
      tagline: 'Fliesstext-Kommentar zur Theorieprüfung — auf Deutsch und Englisch.',
      bullets: [
        `<strong>${guideChapters}</strong> Kapitel in ${guideParts} Teilen (Aerodynamik · Meteo · Recht · Ausrüstung · Flugtechnik)`,
        `${guideDiagrams} eigens erstellte SVG-Diagramme, einzelnen Kapiteln zugeordnet`,
        'Querverweise auf Fragenummern für schnelles Nachschlagen',
      ],
      cta: 'Studienführer öffnen',
    },
    {
      id: 'videos',
      icon: '📺',
      title: 'Videolektionen',
      tagline: 'Schau den Instruktoren mit Untertiteln über die Schulter.',
      bullets: [
        `<strong>${videos.length}</strong> Videos · insgesamt rund ${videoHours.toFixed(1)} Stunden von Free Wings und Air Active`,
        `Zweisprachige Untertitel (${enSubs} EN, ${deSubs} DE) — direkt im Player umschaltbar`,
        'Klick auf eine Transkript-Zeile springt das Video an diese Stelle',
      ],
      cta: 'Videos öffnen',
    },
    {
      id: 'slides',
      icon: '🎬',
      title: 'Foliensätze',
      tagline: 'Die originalen Instruktorenfolien, parallel zum Durchblättern.',
      bullets: [
        `<strong>${totalSlides}</strong> Folien in ${decks.length} Foliensätzen`,
        'EN- und DE-Begleittext im Folienbetrachter nebeneinander',
        'Verlinkt aus der SHV-Übersicht und dem Lernmodus, sobald eine Frage zu einer Folie passt',
      ],
      cta: 'Folien öffnen',
    },
    {
      id: 'cheatsheet',
      icon: '⚡',
      title: 'Spickzettel',
      tagline: 'Hochverdichtete Einzelseite mit den Zahlen, die sitzen müssen.',
      bullets: [
        'ISA-Atmosphäre · Wolkenabstand-Tabelle · Föhn-Grenzwerte · Regeln zu Luftraumklassen',
        'Bestehensgrenzen für das Brevet · wichtige Schweiz-spezifische Werte',
        'Gedacht für die letzte Repetition am Vorabend der Prüfung',
      ],
      cta: 'Spickzettel öffnen',
    },
    {
      id: 'tips',
      icon: '💡',
      title: 'Lerntipps',
      tagline: 'Wie der Stoff wirklich hängenbleibt.',
      bullets: [
        'Rhythmus für verteiltes Lernen (Spaced Repetition) und wie du damit den SHV-Pool angehst',
        'Strategie für den Prüfungstag (Überspringen/Markieren, Zeitbudget, typische Fallen)',
        'Quellen sind angegeben, damit du tiefer einsteigen kannst',
      ],
      cta: 'Tipps lesen',
    },
  ] : [
    {
      id: 'shv-exam',
      icon: '🎯',
      title: 'SHV Practice Exam',
      tagline: 'Take the real exam under realistic or no-pressure conditions.',
      bullets: [
        `<strong>${shvTotal}</strong> questions from the official SHV elearning pool across ${shvTopics} topics`,
        'Timed mode mimics the real 90-min exam · Study mode reveals answers and explanations inline',
        'Per-subtopic breakdown after every attempt so you know what to grind',
      ],
      cta: 'Start practice',
      primary: true,
    },
    {
      id: 'shv-browse',
      icon: '🗂️',
      title: 'SHV Browse',
      tagline: 'Explore every question without taking an exam.',
      bullets: [
        `Tree view of all <strong>${shvTotal}</strong> questions, grouped into ${subcats} subtopics`,
        'Expand any question to see the correct answer, explanation, related guide/workbook chapters, video clips, diagrams, and slides',
        'Search across question text and answers',
      ],
      cta: 'Open browser',
    },
    {
      id: 'workbook',
      icon: '📒',
      title: 'Workbook',
      tagline: 'Structured chapter-by-chapter learning with quizzes.',
      bullets: [
        `<strong>${wbChapters}</strong> chapters across ${books.length} books${hasGermanWorkbook() ? ' (EN + DE)' : ''}`,
        'Each chapter mixes prose, callouts, definitions, tables, and a quiz at the end',
        'Audited against the Free Wings + Air Active video transcripts',
      ],
      cta: 'Open workbook',
    },
    {
      id: 'guide',
      icon: '📚',
      title: 'Study Guide',
      tagline: 'Long-form prose for the theory exam — available in English and German.',
      bullets: [
        `<strong>${guideChapters}</strong> chapters across ${guideParts} parts (Aero · Meteo · Law · Equipment · Skills)`,
        `${guideDiagrams} custom SVG diagrams keyed to specific chapters`,
        'Cross-referenced with question numbers for fast lookup',
      ],
      cta: 'Open guide',
    },
    {
      id: 'videos',
      icon: '📺',
      title: 'Video Lessons',
      tagline: 'Watch the instructors explain it, with subtitles.',
      bullets: [
        `<strong>${videos.length}</strong> videos · ~${videoHours.toFixed(1)} hours total from Free Wings + Air Active`,
        `Bilingual subtitle tracks (${enSubs} EN, ${deSubs} DE) — toggle inside the player`,
        'Click any transcript line to jump the video to that moment',
      ],
      cta: 'Open videos',
    },
    {
      id: 'slides',
      icon: '🎬',
      title: 'Slide Decks',
      tagline: 'The original instructor decks, navigable side-by-side.',
      bullets: [
        `<strong>${totalSlides}</strong> slides across ${decks.length} decks`,
        'EN and DE captions side-by-side in the slide viewer',
        'Linked from SHV Browse and Study mode whenever a question maps to a slide',
      ],
      cta: 'Open slides',
    },
    {
      id: 'cheatsheet',
      icon: '⚡',
      title: 'Cheat Sheet',
      tagline: 'High-density single page of must-memorise numbers.',
      bullets: [
        'ISA atmosphere · cloud-clearance table · Föhn thresholds · airspace class rules',
        'Brevet exam pass marks · key Swiss-specific values',
        'Designed for last-minute review the night before',
      ],
      cta: 'Open cheat sheet',
    },
    {
      id: 'tips',
      icon: '💡',
      title: 'Study Tips',
      tagline: 'How to actually retain this stuff.',
      bullets: [
        'Spaced repetition cadence and how to use it with the SHV pool',
        'Exam-day strategy (skip/flag rules, time budget, common traps)',
        'Sources cited so you can dig further',
      ],
      cta: 'Read tips',
    },
  ];

  const langLine = isDE ? 'auf Deutsch' : 'in English';
  const enrichedNote = enrichedCount > 0
    ? (isDE
        ? `${enrichedCount} (${enrichedPct}%) eine ausführliche Erklärung und kuratierte Querverweise haben.`
        : `${enrichedCount} (${enrichedPct}%) carry a written explanation and curated cross-references.`)
    : '';
  const imageNote = shvImageCount > 0
    ? (isDE
        ? ` · ${shvImageCount} enthalten die Bezugsabbildung.`
        : ` · ${shvImageCount} include the reference figure.`)
    : '';

  const sectionsHtml = sections.map(s => `
    <div class="dashboard-section ${s.primary ? 'dashboard-section-primary' : ''}">
      <div class="dashboard-section-head">
        <div class="dashboard-section-icon">${s.icon}</div>
        <div>
          <div class="dashboard-section-title">${escapeHtml(s.title)}</div>
          <div class="dashboard-section-tagline">${escapeHtml(s.tagline)}</div>
        </div>
      </div>
      <ul class="dashboard-section-bullets">
        ${s.bullets.map(b => `<li>${b}</li>`).join('')}
      </ul>
      <button class="btn ${s.primary ? 'primary' : ''} small" data-nav="${s.id}">${escapeHtml(s.cta)} →</button>
    </div>
  `).join('');

  const subtitle = isDE
    ? `Lernwerkzeuge für die Theorieprüfung Gleitschirm SHV/FSVL — gerade ${langLine} dargestellt. Umschalten 🇬🇧/🇩🇪 in der Seitenleiste unten.`
    : `Study tools for the Swiss SHV/FSVL paragliding theory exam — currently rendering ${langLine}. Toggle 🇬🇧/🇩🇪 in the sidebar footer.`;
  const summary = isDE
    ? `Die App enthält <strong>${shvTotal}</strong> SHV-Prüfungsfragen${enrichedCount > 0 ? `, von denen ${enrichedNote}` : ''}${imageNote}
          Dazu kommen: ${wbChapters} Arbeitsbuch-Kapitel, ${guideChapters} Studienführer-Kapitel, ${videos.length} Videolektionen (~${videoHours.toFixed(1)} h) und ${totalSlides} Folien.`
    : `The app has <strong>${shvTotal}</strong> SHV exam questions${enrichedCount > 0 ? `, of which ${enrichedNote}` : ''}${imageNote}
          On top of that: ${wbChapters} workbook chapters, ${guideChapters} study-guide chapters, ${videos.length} video lessons (~${videoHours.toFixed(1)} h), and ${totalSlides} slides.`;
  return `
    <div class="page-header">
      <h1>${t('page.dashboard.h1')}</h1>
      <p class="page-subtitle">${subtitle}</p>
    </div>
    ${shvTotal > 0 ? `
      <div class="card dashboard-summary">
        <p style="margin:0; font-size:14px; line-height:1.5;">
          ${summary}
        </p>
      </div>
    ` : ''}
    <div class="dashboard-grid">${sectionsHtml}</div>
  `;
}

// ============================================================================
// VIEW: Flashcards (with SRS, MC, Type, Browse)
// ============================================================================
let _fcReveal = false;
let _fcQuiz = null;       // {choices, answer}
let _fcTypeFeedback = null;
let _fcDeck = null;       // computed deck (after shuffle + category)

function recomputeFcDeck() {
  const list = cardsForCategory(state.fc.category === 'all' ? 'all' : state.fc.category);
  if (state.fc.mode === 'review') {
    // Hardest cards first: box 0, then 1, then most-recent wrong
    const scored = list.map(c => {
      const p = state.cards[c.id];
      const box = p ? p.box : 0;
      const wrong = p ? p.wrong : 0;
      const recency = p ? (Date.now() - p.lastSeen) : Infinity;
      return { c, score: box * 1000 - wrong * 10 + Math.min(recency / (3600*1000), 100) };
    });
    scored.sort((a, b) => a.score - b.score);
    _fcDeck = scored.map(x => x.c);
  } else if (state.fc.shuffle) {
    _fcDeck = shuffle(list);
  } else {
    _fcDeck = [...list];
  }
}
function currentFcCard() {
  if (!_fcDeck) recomputeFcDeck();
  if (_fcDeck.length === 0) return null;
  if (state.fc.index >= _fcDeck.length) state.fc.index = 0;
  return _fcDeck[state.fc.index];
}
function setFcIndex(i) {
  if (!_fcDeck) recomputeFcDeck();
  const len = _fcDeck.length || 1;
  state.fc.index = (i + len) % len;
  saveState();
}

function renderFlashcards() {
  const cat = state.fc.category;
  const mode = state.fc.mode;
  const catList = cardsForCategory(cat === 'all' ? 'all' : cat);

  const subtabsHtml = `
    <div class="subtabs">
      <button class="subtab ${cat === 'all' ? 'active' : ''}" data-fc-cat="all">${state.lang === 'de' ? 'Alle' : 'All'} <span class="count">${getCards().length}</span></button>
      ${CATEGORIES.map(c => {
        const list = cardsForCategory(c);
        const m = CATEGORY_META[c];
        return `<button class="subtab ${cat === c ? 'active' : ''}" data-fc-cat="${c}">${m.icon} ${c} <span class="count">${list.length}</span></button>`;
      }).join('')}
    </div>`;

  const isDELang = state.lang === 'de';
  const modeBar = `
    <div class="controls-bar">
      <div class="left">
        <div class="pill-toggle">
          ${['flashcards','quiz','type','review','browse'].map(m => {
            const labelEn = { flashcards:'Flashcards', quiz:'Multiple choice', type:'Type answer', review:'Smart review', browse:'Browse' }[m];
            const labelDe = { flashcards:'Lernkarten', quiz:'Multiple Choice', type:'Antwort tippen', review:'Smart Review', browse:'Durchsuchen' }[m];
            return `<button class="pill ${mode === m ? 'active' : ''}" data-fc-mode="${m}">${isDELang ? labelDe : labelEn}</button>`;
          }).join('')}
        </div>
      </div>
      <div class="right">
        ${mode !== 'browse' && mode !== 'review' ? `
          <label class="toggle"><input type="checkbox" id="fc-shuffle" ${state.fc.shuffle ? 'checked' : ''}> ${isDELang ? 'Mischen' : 'Shuffle'}</label>
        ` : ''}
      </div>
    </div>
  `;

  let body = '';
  if (mode === 'browse') {
    body = renderBrowse(catList);
  } else if (mode === 'flashcards' || mode === 'review') {
    body = renderFlashcardMode(mode);
  } else if (mode === 'quiz') {
    body = renderFcQuiz();
  } else if (mode === 'type') {
    body = renderFcType();
  }

  const isDE = state.lang === 'de';
  return `
    <div class="page-header">
      <h1>${isDE ? 'Lernkarten' : 'Flashcards'}</h1>
      <p class="page-subtitle">${isDE
        ? `${getCards().length} Karten in ${CATEGORIES.length} Kategorien · 50 m vertikal, 100 m horizontal sitzen im Kopf 🌥️`
        : `${getCards().length} cards across ${CATEGORIES.length} categories · 50 m vertical, 100 m horizontal in your head 🌥️`}</p>
    </div>
    ${subtabsHtml}
    ${modeBar}
    ${body}
  `;
}

function renderFlashcardMode(mode) {
  const isDE = state.lang === 'de';
  const card = currentFcCard();
  if (!card) return `<div class="empty"><div class="emoji">🎉</div><div>${isDE ? 'Keine Karten in dieser Ansicht.' : 'No cards in this view.'}</div></div>`;
  const i = state.fc.index;
  const total = _fcDeck.length;
  const meta = CATEGORY_META[card.category];
  const prog = cardProgress(card.id);
  const boxLabel = isDE
    ? ['Neu', 'Lernen', 'Vertraut', 'Sicher', 'Gemeistert'][prog.box]
    : ['New', 'Learning', 'Familiar', 'Known', 'Mastered'][prog.box];
  const deck = getDeckByCategory(card.category);

  return `
    <div class="flashcard">
      <div class="fc-meta">
        <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${card.category}${mode === 'review' ? (isDE ? ' · Smart Review' : ' · Smart Review') : ''}</div>
        <div>${isDE ? 'Karte' : 'Card'} ${i + 1} / ${total} · <span class="badge ${prog.box >= 3 ? 'good' : prog.box >= 1 ? 'info' : ''}">${boxLabel}</span></div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">EN</span><span class="ct">${escapeHtml(card.q_en)}</span>
        <span class="q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.q_de)}</span></span>
      </div>
      ${_fcReveal ? `
        <div class="fc-answer">
          <span class="lang-tag">A</span><span class="ct">${escapeHtml(card.a_en)}</span>
          <span class="a-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.a_de)}</span></span>
        </div>
      ` : `<button class="reveal-btn" id="reveal-btn">${isDE ? 'Antwort zeigen' : 'Show answer'} · <span class="kbd" style="color:white; background:rgba(255,255,255,0.2); border-color:transparent;">Space</span></button>`}
      ${_fcReveal && deck ? `
        <div class="flashcard-slides-hint">
          <span>${isDE ? '🎬 Möchtest du eine bildliche Erklärung?' : '🎬 Want a visual explanation?'}</span>
          <button class="slides-link" data-open-deck="${deck.id}">${deck.icon} ${escapeHtml(deck.title)} ${isDE ? 'Foliensatz' : 'deck'} · ${deckSlideCount(deck)} ${isDE ? 'Folien' : 'slides'}</button>
        </div>
      ` : ''}
      ${_fcReveal ? `
        <div class="srs-controls">
          <button class="srs-btn srs-again" data-srs="again"><span class="srs-emoji">😵</span>${isDE ? 'Nochmal' : 'Again'}<span class="srs-sub">1</span></button>
          <button class="srs-btn srs-hard" data-srs="hard"><span class="srs-emoji">🤔</span>${isDE ? 'Schwer' : 'Hard'}<span class="srs-sub">2</span></button>
          <button class="srs-btn srs-good" data-srs="good"><span class="srs-emoji">👍</span>${isDE ? 'Gut' : 'Good'}<span class="srs-sub">3</span></button>
          <button class="srs-btn srs-easy" data-srs="easy"><span class="srs-emoji">🎯</span>${isDE ? 'Leicht' : 'Easy'}<span class="srs-sub">4</span></button>
        </div>
      ` : ''}
    </div>
    <div class="nav-controls">
      <button class="btn" id="prev-btn" ${i === 0 ? 'disabled' : ''}>${isDE ? '← Zurück' : '← Previous'}</button>
      <button class="btn primary" id="next-btn">${isDE ? 'Weiter →' : 'Next →'}</button>
    </div>
  `;
}

function renderFcQuiz() {
  const isDE = state.lang === 'de';
  const card = currentFcCard();
  if (!card) return `<div class="empty">${isDE ? 'Keine Karten.' : 'No cards.'}</div>`;
  if (!_fcQuiz || _fcQuiz.cardId !== card.id) {
    const distractors = distractorsFor(card);
    _fcQuiz = { cardId: card.id, choices: shuffle([card.a_en, ...distractors]), answer: null };
  }
  const i = state.fc.index;
  const total = _fcDeck.length;
  const meta = CATEGORY_META[card.category];
  const markers = ['A', 'B', 'C', 'D'];

  return `
    <div class="flashcard">
      <div class="fc-meta">
        <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${card.category}</div>
        <div>${isDE ? 'Frage' : 'Question'} ${i + 1} / ${total}</div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">EN</span><span class="ct">${escapeHtml(card.q_en)}</span>
        <span class="q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.q_de)}</span></span>
      </div>
      <div class="choices">
        ${_fcQuiz.choices.map((c, idx) => {
          let cls = 'choice';
          let icon = '';
          if (_fcQuiz.answer !== null) {
            if (c === card.a_en) { cls += ' correct'; icon = '✓'; }
            else if (idx === _fcQuiz.answer) { cls += ' incorrect'; icon = '✗'; }
          }
          return `<button class="${cls}" data-choice="${idx}" ${_fcQuiz.answer !== null ? 'disabled' : ''}>
            <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(c)}</span>${icon ? `<span class="check-icon">${icon}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
      ${_fcQuiz.answer !== null ? `
        <div class="fc-answer">
          <span class="lang-tag">${isDE ? 'DE Antwort' : 'DE Answer'}</span><span class="ct">${escapeHtml(card.a_de)}</span>
        </div>
      ` : ''}
    </div>
    <div class="nav-controls">
      <button class="btn" id="prev-btn" ${i === 0 ? 'disabled' : ''}>${isDE ? '← Zurück' : '← Previous'}</button>
      <button class="btn primary" id="next-btn">${isDE ? 'Weiter →' : 'Next →'}</button>
    </div>
  `;
}

function renderFcType() {
  const isDE = state.lang === 'de';
  const card = currentFcCard();
  if (!card) return `<div class="empty">${isDE ? 'Keine Karten.' : 'No cards.'}</div>`;
  const i = state.fc.index;
  const total = _fcDeck.length;
  const meta = CATEGORY_META[card.category];

  return `
    <div class="flashcard">
      <div class="fc-meta">
        <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${card.category}</div>
        <div>${isDE ? 'Karte' : 'Card'} ${i + 1} / ${total}</div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">EN</span><span class="ct">${escapeHtml(card.q_en)}</span>
        <span class="q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.q_de)}</span></span>
      </div>
      <textarea class="textarea" id="type-input" placeholder="${isDE ? 'Tippe deine Antwort in eigenen Worten (Deutsch oder Englisch)…' : 'Type your answer in your own words (English or German)…'}"></textarea>
      ${_fcTypeFeedback ? `
        <div class="feedback ${_fcTypeFeedback.kind}">
          ${_fcTypeFeedback.kind === 'good'
            ? (isDE ? `✓ Sieht gut aus (${_fcTypeFeedback.pct}% Schlüsselwort-Treffer)` : `✓ Looks right (${_fcTypeFeedback.pct}% keyword match)`)
            : _fcTypeFeedback.kind === 'warn'
            ? (isDE ? `~ Teilweise (${_fcTypeFeedback.pct}% Treffer) — schau dir die richtige Antwort unten an` : `~ Partial (${_fcTypeFeedback.pct}% match) — review correct answer below`)
            : (isDE ? `✗ Nicht ganz (${_fcTypeFeedback.pct}% Treffer) — siehe richtige Antwort unten` : `✗ Not quite (${_fcTypeFeedback.pct}% match) — see correct answer below`)}
        </div>
        <div class="fc-answer">
          <span class="lang-tag">A</span><span class="ct">${escapeHtml(card.a_en)}</span>
          <span class="a-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.a_de)}</span></span>
        </div>
      ` : `<button class="reveal-btn" id="check-btn">${isDE ? 'Antwort prüfen' : 'Check answer'}</button>`}
    </div>
    <div class="nav-controls">
      <button class="btn" id="prev-btn" ${i === 0 ? 'disabled' : ''}>${isDE ? '← Zurück' : '← Previous'}</button>
      <button class="btn primary" id="next-btn">${isDE ? 'Weiter →' : 'Next →'}</button>
    </div>
  `;
}

function renderBrowse(list) {
  const isDE = state.lang === 'de';
  const q = state.fc.query.trim().toLowerCase();
  const filtered = q ? list.filter(c =>
    c.q_en.toLowerCase().includes(q) ||
    c.q_de.toLowerCase().includes(q) ||
    c.a_en.toLowerCase().includes(q) ||
    c.a_de.toLowerCase().includes(q)
  ) : list;
  return `
    <input class="search-input" id="browse-q" type="search" placeholder="${isDE ? 'Deutsch oder Englisch durchsuchen…' : 'Search English or German…'}" value="${escapeHtml(state.fc.query)}" />
    <div class="muted" style="margin-bottom:12px; font-size:13px;">${isDE
      ? `Zeige <strong>${filtered.length}</strong> von ${list.length} Karten`
      : `Showing <strong>${filtered.length}</strong> of ${list.length} cards`}</div>
    <div id="browse-list">
      ${filtered.map(c => {
        const meta = CATEGORY_META[c.category];
        const p = cardProgress(c.id);
        const boxLabel = isDE
          ? ['Neu', 'Lernen', 'Vertraut', 'Sicher', 'Gemeistert'][p.box]
          : ['New', 'Learning', 'Familiar', 'Known', 'Mastered'][p.box];
        const badgeCls = p.box >= 3 ? 'good' : p.box >= 1 ? 'info' : '';
        return `
          <div class="browse-card">
            <div class="bc-meta">
              <span class="cat-dot" style="background:${meta.color}"></span>
              <span class="muted">${meta.icon} ${c.category}</span>
              <span class="bc-num">#${c.original_id}</span>
              ${p.reviews > 0 ? `<span class="badge ${badgeCls}">${boxLabel}</span>` : ''}
            </div>
            <div class="bc-q">${escapeHtml(c.q_en)}</div>
            <div class="bc-q-de">${escapeHtml(c.q_de)}</div>
            <div class="bc-a">${escapeHtml(c.a_en)}</div>
            <div class="bc-a-de">${escapeHtml(c.a_de)}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function attachFlashcardsEvents() {
  document.querySelectorAll('[data-fc-cat]').forEach(b => b.onclick = () => {
    state.fc.category = b.dataset.fcCat;
    state.fc.index = 0;
    _fcDeck = null;
    _fcReveal = false; _fcQuiz = null; _fcTypeFeedback = null;
    saveState();
    render();
  });
  document.querySelectorAll('[data-fc-mode]').forEach(b => b.onclick = () => {
    state.fc.mode = b.dataset.fcMode;
    state.fc.index = 0;
    _fcDeck = null;
    _fcReveal = false; _fcQuiz = null; _fcTypeFeedback = null;
    saveState();
    render();
  });
  const sh = document.getElementById('fc-shuffle');
  if (sh) sh.onchange = (e) => {
    state.fc.shuffle = e.target.checked;
    state.fc.index = 0;
    _fcDeck = null;
    saveState();
    render();
  };

  const reveal = document.getElementById('reveal-btn');
  if (reveal) reveal.onclick = () => { _fcReveal = true; render(); };

  document.querySelectorAll('[data-open-deck]').forEach(b => b.onclick = () => {
    state.slides.deckId = b.dataset.openDeck;
    state.slides.page = 1;
    saveState();
    navigate('slides');
  });
  document.querySelectorAll('[data-srs]').forEach(b => b.onclick = () => {
    const card = currentFcCard();
    if (!card) return;
    recordSrs(card.id, b.dataset.srs);
    _fcReveal = false;
    if (state.fc.mode === 'review') {
      _fcDeck = null;
      state.fc.index = 0;
      saveState();
    } else {
      setFcIndex(state.fc.index + 1);
    }
    render();
  });

  document.querySelectorAll('[data-choice]').forEach(b => b.onclick = () => {
    if (!_fcQuiz || _fcQuiz.answer !== null) return;
    const idx = parseInt(b.dataset.choice, 10);
    _fcQuiz.answer = idx;
    const card = getCardById(_fcQuiz.cardId);
    const correct = _fcQuiz.choices[idx] === card.a_en;
    recordSrs(card.id, correct ? 'good' : 'again');
    render();
  });

  const checkBtn = document.getElementById('check-btn');
  if (checkBtn) checkBtn.onclick = () => {
    const val = document.getElementById('type-input').value;
    const card = currentFcCard();
    _fcTypeFeedback = gradeFreeText(val, card.a_en);
    recordSrs(card.id, _fcTypeFeedback.kind === 'good' ? 'good' : _fcTypeFeedback.kind === 'warn' ? 'hard' : 'again');
    render();
  };

  const prev = document.getElementById('prev-btn');
  const next = document.getElementById('next-btn');
  if (prev) prev.onclick = () => { setFcIndex(state.fc.index - 1); _fcReveal = false; _fcQuiz = null; _fcTypeFeedback = null; render(); };
  if (next) next.onclick = () => { setFcIndex(state.fc.index + 1); _fcReveal = false; _fcQuiz = null; _fcTypeFeedback = null; render(); };

  const bq = document.getElementById('browse-q');
  if (bq) {
    bq.oninput = (e) => {
      state.fc.query = e.target.value;
      saveState();
      render();
      const inp = document.getElementById('browse-q');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(state.fc.query.length, state.fc.query.length);
      }
    };
  }
}

// ============================================================================
// VIEW: Quiz (focused MC drill with score)
// ============================================================================
let _quizCat = 'all';
let _quizQueue = null;
let _quizPos = 0;
let _quizChoices = null;
let _quizAnswer = null;
let _quizScore = { right: 0, wrong: 0 };

function renderQuiz() {
  if (!_quizQueue || _quizQueue._cat !== _quizCat) {
    const list = cardsForCategory(_quizCat === 'all' ? 'all' : _quizCat);
    _quizQueue = shuffle(list);
    _quizQueue._cat = _quizCat;
    _quizPos = 0;
    _quizChoices = null;
    _quizAnswer = null;
    _quizScore = { right: 0, wrong: 0 };
  }
  const card = _quizQueue[_quizPos];
  const isDE = state.lang === 'de';
  if (!card) {
    return `
      <div class="page-header"><h1>${isDE ? 'Quiz abgeschlossen' : 'Quiz complete'}</h1></div>
      <div class="card">
        <h2 class="card-title">${isDE ? 'Endstand' : 'Final score'}</h2>
        <p>${_quizScore.right}/${_quizScore.right + _quizScore.wrong} (${Math.round(100 * _quizScore.right / (_quizScore.right + _quizScore.wrong || 1))}%)</p>
        <div class="row" style="margin-top:14px;">
          <button class="btn primary" id="quiz-restart">${isDE ? 'Neustart' : 'Restart'}</button>
          <button class="btn" data-nav="dashboard">${isDE ? 'Übersicht' : 'Dashboard'}</button>
        </div>
      </div>
    `;
  }
  if (!_quizChoices || _quizChoices.cardId !== card.id) {
    const distractors = distractorsFor(card);
    _quizChoices = { cardId: card.id, list: shuffle([card.a_en, ...distractors]) };
    _quizAnswer = null;
  }
  const meta = CATEGORY_META[card.category];
  const markers = ['A', 'B', 'C', 'D'];
  return `
    <div class="page-header">
      <h1>Quiz</h1>
      <p class="page-subtitle">${isDE
        ? 'Übe dich mit zufälligen Multiple-Choice-Fragen. Dein Punktestand wird für diese Sitzung mitgezählt.'
        : 'Drill yourself with random multiple-choice questions. Tracks your score for this session.'}</p>
    </div>
    <div class="subtabs">
      <button class="subtab ${_quizCat === 'all' ? 'active' : ''}" data-quiz-cat="all">${isDE ? 'Alle' : 'All'} <span class="count">${getCards().length}</span></button>
      ${CATEGORIES.map(c => `<button class="subtab ${_quizCat === c ? 'active' : ''}" data-quiz-cat="${c}">${CATEGORY_META[c].icon} ${c} <span class="count">${cardsForCategory(c).length}</span></button>`).join('')}
    </div>
    <div class="controls-bar">
      <div class="left">
        <span class="badge good">✓ ${_quizScore.right}</span>
        <span class="badge bad">✗ ${_quizScore.wrong}</span>
        <span class="muted" style="font-size:12px;">${_quizPos + 1} / ${_quizQueue.length}</span>
      </div>
      <div class="right">
        <button class="btn ghost small" id="quiz-restart">${isDE ? 'Neustart' : 'Restart'}</button>
      </div>
    </div>
    <div class="flashcard">
      <div class="fc-meta">
        <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${card.category}</div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">EN</span><span class="ct">${escapeHtml(card.q_en)}</span>
        <span class="q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.q_de)}</span></span>
      </div>
      <div class="choices">
        ${_quizChoices.list.map((c, idx) => {
          let cls = 'choice';
          let icon = '';
          if (_quizAnswer !== null) {
            if (c === card.a_en) { cls += ' correct'; icon = '✓'; }
            else if (idx === _quizAnswer) { cls += ' incorrect'; icon = '✗'; }
          }
          return `<button class="${cls}" data-q-choice="${idx}" ${_quizAnswer !== null ? 'disabled' : ''}>
            <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(c)}</span>${icon ? `<span class="check-icon">${icon}</span>` : ''}
          </button>`;
        }).join('')}
      </div>
      ${_quizAnswer !== null ? `
        <div class="fc-answer">
          <span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.a_de)}</span>
        </div>
      ` : ''}
    </div>
    <div class="nav-controls">
      <button class="btn" id="quiz-skip">${isDE ? 'Überspringen ↷' : 'Skip ↷'}</button>
      <button class="btn primary" id="quiz-next">${_quizAnswer !== null ? (isDE ? 'Weiter →' : 'Next →') : (isDE ? 'Aufdecken' : 'Reveal')}</button>
    </div>
  `;
}

function attachQuizEvents() {
  document.querySelectorAll('[data-quiz-cat]').forEach(b => b.onclick = () => {
    _quizCat = b.dataset.quizCat;
    _quizQueue = null;
    render();
  });
  document.querySelectorAll('[data-q-choice]').forEach(b => b.onclick = () => {
    if (_quizAnswer !== null) return;
    const idx = parseInt(b.dataset.qChoice, 10);
    _quizAnswer = idx;
    const card = _quizQueue[_quizPos];
    const right = _quizChoices.list[idx] === card.a_en;
    if (right) _quizScore.right++; else _quizScore.wrong++;
    recordSrs(card.id, right ? 'good' : 'again');
    render();
  });
  const restart = document.getElementById('quiz-restart');
  if (restart) restart.onclick = () => { _quizQueue = null; render(); };
  const skip = document.getElementById('quiz-skip');
  if (skip) skip.onclick = () => { _quizPos++; _quizChoices = null; _quizAnswer = null; render(); };
  const nxt = document.getElementById('quiz-next');
  if (nxt) nxt.onclick = () => {
    if (_quizAnswer === null) {
      // reveal w/o picking
      _quizAnswer = -1;
      const card = _quizQueue[_quizPos];
      _quizScore.wrong++;
      recordSrs(card.id, 'again');
      render();
    } else {
      _quizPos++; _quizChoices = null; _quizAnswer = null; render();
    }
  };
}

// ============================================================================
// VIEW: Mock Exam (100 questions, 90 min, per-section grading)
// ============================================================================
let _examTimer = null;

function buildExamSet() {
  const ids = [];
  const choices = [];
  CATEGORIES.forEach(cat => {
    const list = shuffle(cardsForCategory(cat)).slice(0, 20);
    list.forEach(c => {
      ids.push(c.id);
      const distractors = distractorsFor(c);
      choices.push(shuffle([c.a_en, ...distractors]));
    });
  });
  // Shuffle question order
  const idxs = ids.map((_, i) => i);
  const shuffled = shuffle(idxs);
  return {
    cards: shuffled.map(i => ids[i]),
    choices: shuffled.map(i => choices[i])
  };
}

function startExam() {
  const built = buildExamSet();
  state.exam = {
    ...state.exam,
    active: true,
    startedAt: Date.now(),
    durationSec: 90 * 60,
    cards: built.cards,
    choices: built.choices,
    answers: new Array(built.cards.length).fill(null),
    flagged: [],
    current: 0
  };
  saveState();
  startExamTimer();
  render();
}

function startExamTimer() {
  if (_examTimer) clearInterval(_examTimer);
  _examTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.exam.startedAt) / 1000);
    const remaining = Math.max(0, state.exam.durationSec - elapsed);
    const t = document.getElementById('exam-timer');
    if (t) {
      t.textContent = fmtTime(remaining);
      t.classList.toggle('warning', remaining < 10 * 60);
      t.classList.toggle('critical', remaining < 60);
    }
    if (remaining <= 0) {
      stopExamTimer();
      finishExam();
    }
  }, 250);
}
function stopExamTimer() {
  if (_examTimer) { clearInterval(_examTimer); _examTimer = null; }
}

function finishExam() {
  stopExamTimer();
  const sections = {};
  CATEGORIES.forEach(c => { sections[c] = { total: 0, right: 0 }; });
  let totalRight = 0;
  state.exam.cards.forEach((cid, i) => {
    const card = getCardById(cid);
    if (!card) return;
    sections[card.category].total++;
    const ans = state.exam.answers[i];
    const correct = ans !== null && state.exam.choices[i][ans] === card.a_en;
    if (correct) { sections[card.category].right++; totalRight++; }
  });
  const passed = CATEGORIES.every(c => sections[c].right >= 16);
  const result = {
    finishedAt: Date.now(),
    duration: Math.floor((Date.now() - state.exam.startedAt) / 1000),
    totalRight,
    totalCount: state.exam.cards.length,
    scorePct: Math.round(100 * totalRight / state.exam.cards.length),
    passed,
    sections
  };
  state.exam.history.push(result);
  state.exam.active = false;
  state.exam.lastResult = result;
  saveState();
  render();
}

function renderExam() {
  if (!state.exam.active && state.exam.lastResult) {
    return renderExamResult(state.exam.lastResult);
  }
  if (!state.exam.active) {
    const isDE = state.lang === 'de';
    const last = state.exam.history[state.exam.history.length - 1];
    return `
      <div class="page-header">
        <h1>${isDE ? 'Probeprüfung' : 'Mock Exam'}</h1>
        <p class="page-subtitle">${isDE
          ? 'Simuliere die echte SHV/FSVL-Theorieprüfung: 100 Fragen aus allen 5 Fachgebieten, höchstens 90 Minuten, mindestens 80 % pro Fachgebiet zum Bestehen.'
          : 'Simulate the real SHV/FSVL theory exam: 100 questions across all 5 categories, 90 minutes max, 80% per section to pass.'}</p>
      </div>
      <div class="card elevated">
        <h2 class="card-title">${isDE ? 'Bereit zum Start?' : 'Ready to start?'}</h2>
        <ul class="checklist">
          ${isDE ? `
            <li><strong>100 Fragen</strong> — 20 zufällig gezogene aus jedem der 5 Fachgebiete.</li>
            <li><strong>90 Minuten</strong> — das sind im Schnitt 54 Sekunden pro Frage.</li>
            <li><strong>Bestanden: ≥16/20 in jedem Fachgebiet.</strong> Fällt auch nur ein Fachgebiet durch, ist die ganze Prüfung nicht bestanden.</li>
            <li>Du kannst Fragen markieren und später zu ihnen zurückkehren — über die Punktleiste oben.</li>
            <li>Nach dem Abgeben siehst du eine Auswertung pro Fachgebiet.</li>
          ` : `
            <li><strong>100 questions</strong> — 20 randomly drawn from each of the 5 categories.</li>
            <li><strong>90 minutes</strong> — that's 54 seconds per question on average.</li>
            <li><strong>Pass: ≥16/20 in every section.</strong> Missing even one section means you fail the exam.</li>
            <li>You can flag questions and return to them — use the question dots at the top.</li>
            <li>Once you submit you'll see a per-section breakdown.</li>
          `}
        </ul>
        <div class="row" style="margin-top:18px;">
          <button class="btn primary large" id="exam-start">${isDE ? '⏱️ Prüfung starten' : '⏱️ Start exam'}</button>
          ${last ? `<button class="btn" id="exam-view-last">${isDE ? 'Letztes Ergebnis ansehen' : 'View last result'}</button>` : ''}
        </div>
      </div>
      ${state.exam.history.length > 0 ? `
        <div class="card" style="margin-top:18px;">
          <h2 class="card-title">${isDE ? 'Vergangene Versuche' : 'Past attempts'}</h2>
          ${state.exam.history.slice(-5).reverse().map((r, i) => `
            <div class="exam-section-row" style="border-bottom:1px solid var(--border);">
              <div class="name">${new Date(r.finishedAt).toLocaleString()}</div>
              <div class="score">${r.totalRight}/${r.totalCount}</div>
              <div class="verdict ${r.passed ? 'pass' : 'fail'}">${r.passed ? (isDE ? '✓ Bestanden' : '✓ Passed') : (isDE ? '✗ Nicht bestanden' : '✗ Failed')}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  }
  // active exam
  const i = state.exam.current;
  const cardId = state.exam.cards[i];
  const card = getCardById(cardId);
  const choices = state.exam.choices[i];
  const answer = state.exam.answers[i];
  const meta = CATEGORY_META[card.category];
  const markers = ['A', 'B', 'C', 'D'];
  const elapsed = Math.floor((Date.now() - state.exam.startedAt) / 1000);
  const remaining = Math.max(0, state.exam.durationSec - elapsed);
  const answered = state.exam.answers.filter(a => a !== null).length;

  const isDE = state.lang === 'de';
  return `
    <div class="exam-header">
      <div>
        <strong>${isDE ? 'Probeprüfung' : 'Mock Exam'}</strong> · <span class="muted">${answered}/${state.exam.cards.length} ${isDE ? 'beantwortet' : 'answered'}</span>
      </div>
      <div class="exam-timer" id="exam-timer">${fmtTime(remaining)}</div>
    </div>
    <div class="exam-progress">
      ${state.exam.cards.map((_, idx) => {
        let cls = 'dot';
        if (idx === i) cls += ' current';
        else if (state.exam.answers[idx] !== null) cls += ' answered';
        if (state.exam.flagged.includes(idx)) cls += ' flagged';
        return `<button class="${cls}" data-exam-jump="${idx}">${idx + 1}</button>`;
      }).join('')}
    </div>
    <div class="flashcard">
      <div class="fc-meta">
        <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${card.category}</div>
        <div>
          <button class="btn small ${state.exam.flagged.includes(i) ? 'primary' : ''}" id="exam-flag">${state.exam.flagged.includes(i) ? (isDE ? '🚩 Markiert' : '🚩 Flagged') : (isDE ? '🚩 Markieren' : '🚩 Flag')}</button>
        </div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">Q ${i+1}</span><span class="ct">${escapeHtml(card.q_en)}</span>
        <span class="q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(card.q_de)}</span></span>
      </div>
      <div class="choices">
        ${choices.map((c, idx) => {
          const selected = answer === idx;
          return `<button class="choice ${selected ? 'correct' : ''}" data-exam-choice="${idx}" style="${selected ? 'background:var(--accent-soft); border-color:var(--accent); color:var(--accent);' : ''}">
            <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(c)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
    <div class="nav-controls">
      <button class="btn" id="exam-prev" ${i === 0 ? 'disabled' : ''}>${isDE ? '← Zurück' : '← Previous'}</button>
      ${i === state.exam.cards.length - 1
        ? `<button class="btn primary" id="exam-finish">${isDE ? 'Prüfung abschliessen' : 'Finish exam'}</button>`
        : `<button class="btn primary" id="exam-next">${isDE ? 'Weiter →' : 'Next →'}</button>`}
    </div>
    <div class="row" style="margin-top:14px; justify-content:center;">
      <button class="btn ghost danger small" id="exam-abort">${isDE ? 'Prüfung abbrechen' : 'Abort exam'}</button>
    </div>
  `;
}

function renderExamResult(r) {
  const isDE = state.lang === 'de';
  const dur = fmtTime(r.duration);
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference - circumference * r.scorePct / 100;
  return `
    <div class="page-header">
      <h1>${r.passed ? (isDE ? '🎉 Prüfung bestanden!' : '🎉 Exam passed!') : (isDE ? '✗ Prüfung nicht bestanden' : '✗ Exam not passed')}</h1>
      <p class="page-subtitle">${isDE
        ? `Beendet in ${dur}. Ergebnis: ${r.totalRight}/${r.totalCount} (${r.scorePct}%)`
        : `Finished in ${dur}. Score: ${r.totalRight}/${r.totalCount} (${r.scorePct}%)`}</p>
    </div>
    <div class="card elevated" style="display:flex; gap:24px; align-items:center; flex-wrap:wrap;">
      <div class="donut">
        <svg viewBox="0 0 140 140">
          <circle class="donut-bg" cx="70" cy="70" r="60"></circle>
          <circle class="donut-fg" cx="70" cy="70" r="60"
            stroke="${r.passed ? 'var(--good)' : 'var(--bad)'}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"></circle>
        </svg>
        <div class="donut-label">
          <div class="big" style="color:${r.passed ? 'var(--good)' : 'var(--bad)'}">${r.scorePct}%</div>
          <div class="small">${r.totalRight}/${r.totalCount}</div>
        </div>
      </div>
      <div style="flex:1; min-width:240px;">
        <h3 style="margin-top:0;">${isDE ? 'Auswertung pro Fachgebiet' : 'Per-section breakdown'}</h3>
        ${CATEGORIES.map(c => {
          const s = r.sections[c];
          const pass = s.right >= 16;
          return `
            <div class="exam-section-row">
              <div class="name">${CATEGORY_META[c].icon} ${c}</div>
              <div class="score">${s.right}/${s.total}</div>
              <div class="verdict ${pass ? 'pass' : 'fail'}">${pass ? '✓' : '✗'} ${pass ? (isDE ? 'Bestanden' : 'Pass') : (isDE ? 'Nicht bestanden' : 'Fail')}</div>
            </div>
          `;
        }).join('')}
        <div class="muted" style="font-size:12px; margin-top:10px;">${isDE ? 'Bestehensgrenze: ≥16/20 (80 %) in jedem Fachgebiet.' : 'Pass criteria: ≥16/20 (80%) in every section.'}</div>
      </div>
    </div>
    <div class="row" style="margin-top:18px;">
      <button class="btn primary" id="exam-new">${isDE ? '↻ Neue Prüfung' : '↻ New exam'}</button>
      <button class="btn" data-nav="flashcards">${isDE ? '📇 Schwache Themen üben' : '📇 Practice weak topics'}</button>
      <button class="btn ghost" id="exam-clear">${isDE ? 'Ergebnis löschen' : 'Clear result'}</button>
    </div>
  `;
}

function attachExamEvents() {
  const startBtn = document.getElementById('exam-start');
  if (startBtn) startBtn.onclick = () => { state.exam.lastResult = null; startExam(); };

  const viewLastBtn = document.getElementById('exam-view-last');
  if (viewLastBtn) viewLastBtn.onclick = () => {
    state.exam.lastResult = state.exam.history[state.exam.history.length - 1];
    render();
  };

  document.querySelectorAll('[data-exam-choice]').forEach(b => b.onclick = () => {
    const i = state.exam.current;
    state.exam.answers[i] = parseInt(b.dataset.examChoice, 10);
    saveState();
    render();
  });
  document.querySelectorAll('[data-exam-jump]').forEach(b => b.onclick = () => {
    state.exam.current = parseInt(b.dataset.examJump, 10);
    saveState();
    render();
  });
  const prev = document.getElementById('exam-prev');
  if (prev) prev.onclick = () => { state.exam.current--; saveState(); render(); };
  const next = document.getElementById('exam-next');
  if (next) next.onclick = () => { state.exam.current++; saveState(); render(); };
  const flag = document.getElementById('exam-flag');
  if (flag) flag.onclick = () => {
    const i = state.exam.current;
    const set = new Set(state.exam.flagged);
    if (set.has(i)) set.delete(i); else set.add(i);
    state.exam.flagged = [...set];
    saveState();
    render();
  };
  const fin = document.getElementById('exam-finish');
  if (fin) fin.onclick = () => {
    const isDE = state.lang === 'de';
    const unanswered = state.exam.answers.filter(a => a === null).length;
    const msg = unanswered > 0
      ? (isDE ? `Du hast ${unanswered} unbeantwortete Fragen. Trotzdem beenden?` : `You have ${unanswered} unanswered questions. Finish anyway?`)
      : (isDE ? 'Prüfung beenden und Ergebnis ansehen?' : 'Finish exam and see results?');
    if (confirm(msg)) finishExam();
  };
  const abort = document.getElementById('exam-abort');
  if (abort) abort.onclick = () => {
    if (confirm(state.lang === 'de' ? 'Aktuelle Prüfung abbrechen? Der Fortschritt geht verloren.' : 'Abort the current exam? Progress will be lost.')) {
      stopExamTimer();
      state.exam.active = false;
      state.exam.lastResult = null;
      saveState();
      render();
    }
  };
  const newBtn = document.getElementById('exam-new');
  if (newBtn) newBtn.onclick = () => { state.exam.lastResult = null; startExam(); };
  const clr = document.getElementById('exam-clear');
  if (clr) clr.onclick = () => { state.exam.lastResult = null; saveState(); render(); };
}

// ============================================================================
// VIEW: SHV Practice Exam (uses scraped official SHV elearning question pool)
// ============================================================================
let _shvExamTimer = null;

const SHV_TOPIC_META = {
  // English topic names (as scraped from the SHV elearning UI in EN mode)
  'Aerodynamics':     { color: '#a855f7', icon: '📐' },
  'Weather':          { color: '#06b6d4', icon: '⛅' },
  'Legislation':      { color: '#3b82f6', icon: '⚖️' },
  'Materials':        { color: '#f59e0b', icon: '🪂' },
  'Practical Flying': { color: '#10b981', icon: '🛫' },
  // German topic names (DE mode) — same colors + icons.
  'Fluglehre':        { color: '#a855f7', icon: '📐' },
  'Wetterkunde':      { color: '#06b6d4', icon: '⛅' },
  'Gesetzgebung':     { color: '#3b82f6', icon: '⚖️' },
  'Materialkunde':    { color: '#f59e0b', icon: '🪂' },
  'Flugpraxis':       { color: '#10b981', icon: '🛫' },
};
function shvTopicMeta(t) {
  return SHV_TOPIC_META[t] || { color: '#64748b', icon: '🎯' };
}

function buildSHVExamSet() {
  const byTopic = getSHVQuestionsByTopic();
  const setup = state.shvExam.setup;
  const requested = Math.max(5, Math.min(200, setup.count || 100));
  let pool = [];
  if (setup.topic && setup.topic !== 'all' && byTopic[setup.topic]) {
    pool = byTopic[setup.topic].slice();
    // Optional subcategory filter (only relevant when a specific topic is picked)
    if (setup.subcategory && setup.subcategory !== 'all') {
      pool = pool.filter(q => {
        const e = getSHVEnrichmentFor(`${q.topic}_${q.qid}`);
        return e && e.subcategory === setup.subcategory;
      });
    }
  } else {
    // 'all' — proportional draw mirroring the real-exam category mix
    const topics = Object.keys(byTopic);
    const perTopic = Math.max(1, Math.floor(requested / topics.length));
    for (const t of topics) {
      pool = pool.concat(shuffle(byTopic[t]).slice(0, perTopic));
    }
  }
  pool = shuffle(pool).slice(0, requested);
  return pool.map(q => `${q.topic}_${q.qid}`);
}

function startSHVExam(mode = 'exam') {
  const qids = buildSHVExamSet();
  if (qids.length === 0) return;
  // Exam mode: real-exam pace (~54s/question). Study mode: no timer.
  const durationSec = mode === 'study' ? 0 : Math.max(10 * 60, Math.round(qids.length * 54));
  state.shvExam = {
    ...state.shvExam,
    active: true,
    mode,
    startedAt: Date.now(),
    durationSec,
    qids,
    answers: new Array(qids.length).fill(null),
    flagged: [],
    current: 0,
    lastResult: null,
  };
  saveState();
  if (mode === 'exam') startSHVExamTimer();
  render();
}

function startSHVExamTimer() {
  if (_shvExamTimer) clearInterval(_shvExamTimer);
  _shvExamTimer = setInterval(() => {
    const elapsed = Math.floor((Date.now() - state.shvExam.startedAt) / 1000);
    const remaining = Math.max(0, state.shvExam.durationSec - elapsed);
    const t = document.getElementById('shv-exam-timer');
    if (t) {
      t.textContent = fmtTime(remaining);
      t.classList.toggle('warning', remaining < 10 * 60);
      t.classList.toggle('critical', remaining < 60);
    }
    if (remaining <= 0) {
      stopSHVExamTimer();
      finishSHVExam();
    }
  }, 250);
}
function stopSHVExamTimer() {
  if (_shvExamTimer) { clearInterval(_shvExamTimer); _shvExamTimer = null; }
}

function finishSHVExam() {
  stopSHVExamTimer();
  const pool = getSHVQuestions() || {};
  const sections = {};
  let totalRight = 0;
  const wrong = [];
  const subSections = {};  // by-subcategory breakdown
  state.shvExam.qids.forEach((qid, i) => {
    const q = pool[qid]; if (!q) return;
    const sec = sections[q.topic] = sections[q.topic] || { total: 0, right: 0 };
    sec.total++;
    const ans = state.shvExam.answers[i];
    const correct = ans === q.correct;
    if (correct) { sec.right++; totalRight++; }
    else { wrong.push({ qid, picked: ans }); }
    // Subcategory roll-up
    const subcat = getSHVSubcategoryFor(qid);
    if (subcat) {
      const key = `${q.topic}::${subcat.id}`;
      const ss = subSections[key] = subSections[key] || { topic: q.topic, id: subcat.id, title: subcat.title, total: 0, right: 0 };
      ss.total++;
      if (correct) ss.right++;
    }
  });
  // Real SHV: ≥ 75% per section to pass. Auto-relax to 60% on shorter practice
  // exams since per-section sample size is tiny.
  const minPct = state.shvExam.qids.length >= 60 ? 0.75 : 0.60;
  const passed = Object.values(sections).every(s => s.total === 0 || s.right / s.total >= minPct);
  const result = {
    finishedAt: Date.now(),
    duration: Math.floor((Date.now() - state.shvExam.startedAt) / 1000),
    totalRight,
    totalCount: state.shvExam.qids.length,
    scorePct: Math.round(100 * totalRight / state.shvExam.qids.length),
    passed,
    sections,
    subSections,
    wrong,
    pass_threshold_pct: Math.round(minPct * 100),
    setup: { ...state.shvExam.setup },
    mode: state.shvExam.mode,
  };
  state.shvExam.history.push(result);
  state.shvExam.active = false;
  state.shvExam.lastResult = result;
  saveState();
  render();
}

// ============================================================================
// VIEW: Quick 10 — ten random questions from the SHV pool, with a shuffle button
// ============================================================================
// Only questions we can actually grade: a known correct option and a real
// options array. The German pool in particular has gaps where the correct
// answer wasn't captured (correct === null), so those are filtered out.
function quickQuizPool() {
  const pool = getSHVQuestions() || {};
  return Object.keys(pool).filter(k => {
    const q = pool[k];
    return q && q.correct != null && Array.isArray(q.options) && q.options.length > 1;
  });
}

function drawQuickQuiz() {
  state.quick.qids = shuffle(quickQuizPool()).slice(0, 10);
  state.quick.answers = {};
  saveState();
}

// Guarantee a valid set of 10 for the *current* language pool. Switching EN↔DE
// swaps the whole pool (different keys), which invalidates any stored draw, so
// we redraw whenever a stored qid is missing from the active pool.
function ensureQuickQuiz() {
  const pool = getSHVQuestions() || {};
  const ok = Array.isArray(state.quick.qids) && state.quick.qids.length === 10
    && state.quick.qids.every(k => pool[k]);
  if (!ok) drawQuickQuiz();
}

function renderQuickQuiz() {
  const isDE = state.lang === 'de';
  const pool = getSHVQuestions();
  if (!pool) {
    return `<div class="empty"><div class="emoji">🎲</div><div>${isDE ? 'SHV-Fragenpool noch nicht geladen.' : 'SHV question pool not loaded yet.'}</div></div>`;
  }
  ensureQuickQuiz();
  const qids = state.quick.qids;
  const answers = state.quick.answers || {};
  const markers = ['A', 'B', 'C', 'D', 'E', 'F'];
  const answered = qids.filter((_, i) => answers[i] != null).length;
  const correct = qids.filter((k, i) => answers[i] != null && answers[i] === pool[k].correct).length;

  const shuffleBtn = id => `<button class="btn primary" id="${id}">🎲 ${escapeHtml(t('quick.shuffle'))}</button>`;

  const cards = qids.map((key, i) => {
    const q = pool[key];
    if (!q) return '';
    const meta = shvTopicMeta(q.topic);
    const picked = answers[i];
    const revealed = picked != null;
    const choices = q.options.map((opt, idx) => {
      let cls = '', style = '';
      if (revealed) {
        if (idx === q.correct) { cls = 'correct'; style = 'background:var(--good-soft);border-color:var(--good);color:var(--good);'; }
        else if (idx === picked) { cls = 'wrong'; style = 'background:var(--bad-soft);border-color:var(--bad);color:var(--bad);'; }
      }
      return `<button class="choice ${cls}" data-quick-q="${i}" data-quick-choice="${idx}" ${revealed ? 'disabled' : ''} style="${style}">
        <span class="marker">${markers[idx] || ''}</span><span class="ct">${escapeHtml(opt)}</span>
      </button>`;
    }).join('');
    const verdict = revealed
      ? (picked === q.correct ? `<span style="color:var(--good)">${isDE ? '✓ Richtig' : '✓ Correct'}</span>` : `<span style="color:var(--bad)">${isDE ? '✗ Falsch' : '✗ Wrong'}</span>`)
      : '';
    return `
      <div class="flashcard">
        <div class="fc-meta">
          <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${escapeHtml(q.topic)}</div>
          <div class="muted">${verdict}</div>
        </div>
        <div class="fc-question"><span class="lang-tag">Q ${i + 1}</span><span class="ct">${escapeHtml(q.text)}</span></div>
        ${q.has_image && q.image_path ? `<div class="shv-question-image"><img src="${escapeHtml(q.image_path)}" alt="" loading="lazy" /></div>` : ''}
        <div class="choices">${choices}</div>
      </div>`;
  }).join('');

  return `
    <div class="page-header"><h1>${t('page.quickquiz.h1')}</h1></div>
    <p class="muted" style="margin:-8px 0 16px;">${escapeHtml(t('quick.intro'))}</p>
    <div class="quick-bar">
      <div class="quick-score">${isDE ? 'Richtig' : 'Correct'}: <strong>${correct}</strong> · ${isDE ? 'Beantwortet' : 'Answered'}: <strong>${answered}/${qids.length}</strong></div>
      ${shuffleBtn('quick-shuffle')}
    </div>
    ${cards}
    <div class="row" style="justify-content:center; margin:18px 0 8px;">
      ${shuffleBtn('quick-shuffle-bottom')}
    </div>`;
}

function attachQuickQuizEvents() {
  document.querySelectorAll('[data-quick-choice]').forEach(b => b.onclick = () => {
    const i = parseInt(b.dataset.quickQ, 10);
    if (state.quick.answers[i] != null) return;  // lock each question after the first pick
    state.quick.answers[i] = parseInt(b.dataset.quickChoice, 10);
    saveState();
    render();
  });
  const reshuffle = () => { drawQuickQuiz(); render(); window.scrollTo(0, 0); };
  const top = document.getElementById('quick-shuffle');
  if (top) top.onclick = reshuffle;
  const bottom = document.getElementById('quick-shuffle-bottom');
  if (bottom) bottom.onclick = reshuffle;
}

function renderSHVExam() {
  const pool = getSHVQuestions();
  if (!pool) {
    return `<div class="empty"><div class="emoji">🎯</div><div>${state.lang === 'de' ? 'SHV-Fragenpool noch nicht geladen.' : 'SHV question pool not loaded yet.'}</div><div class="muted" style="margin-top:8px;">${state.lang === 'de' ? 'Führe' : 'Run'} <code>node scripts/shv_scrape.mjs</code> ${state.lang === 'de' ? 'aus und baue neu.' : 'and rebuild.'}</div></div>`;
  }
  if (state.shvExam.active) return renderSHVExamLive();
  if (state.shvExam.lastResult) return renderSHVExamResult(state.shvExam.lastResult);
  return renderSHVExamSetup();
}

function renderSHVExamSetup() {
  const byTopic = getSHVQuestionsByTopic();
  const topics = Object.keys(byTopic).sort();
  const totalQuestions = Object.values(byTopic).reduce((a, qs) => a + qs.length, 0);
  const setup = state.shvExam.setup;
  const last = state.shvExam.history[state.shvExam.history.length - 1];

  const topicOptions = ['all', ...topics].map(t => {
    const label = t === 'all' ? `All topics (${totalQuestions} questions)` : `${shvTopicMeta(t).icon} ${t} (${byTopic[t].length})`;
    return `<option value="${escapeHtml(t)}" ${setup.topic === t ? 'selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');

  // Subcategory filter — only shown when a specific topic is chosen
  let subcategoryFilter = '';
  if (setup.topic && setup.topic !== 'all') {
    const subs = getSHVSubcategoriesForTopic(setup.topic);
    if (subs.length > 0) {
      // Count questions per subcategory in this topic
      const counts = {};
      for (const q of byTopic[setup.topic] || []) {
        const e = getSHVEnrichmentFor(`${q.topic}_${q.qid}`);
        const sid = (e && e.subcategory) || 'unassigned';
        counts[sid] = (counts[sid] || 0) + 1;
      }
      const subOptions = ['all', ...subs.map(s => s.id)].map(sid => {
        if (sid === 'all') return `<option value="all" ${setup.subcategory === 'all' || !setup.subcategory ? 'selected' : ''}>${state.lang === 'de' ? `Alle Unterthemen (${byTopic[setup.topic].length})` : `All subtopics (${byTopic[setup.topic].length})`}</option>`;
        const s = subs.find(x => x.id === sid);
        const n = counts[sid] || 0;
        return `<option value="${escapeHtml(sid)}" ${setup.subcategory === sid ? 'selected' : ''}>${escapeHtml(s.title)} (${n})</option>`;
      }).join('');
      subcategoryFilter = `
        <div style="flex:1; min-width:220px;">
          <label class="muted" style="font-size:12px;">${state.lang === 'de' ? 'Unterthema' : 'Subtopic'}</label>
          <select id="shv-setup-subcategory" class="form-select" style="width:100%;">${subOptions}</select>
        </div>
      `;
    }
  }

  const isDE = state.lang === 'de';
  return `
    <div class="page-header">
      <h1>${t('page.shv-exam.h1')}</h1>
      <p class="page-subtitle">${isDE
        ? `Aus dem offiziellen SHV-E-Learning-Fragenpool · ${totalQuestions} Fragen in ${topics.length} ${topics.length === 1 ? 'Fachgebiet' : 'Fachgebieten'}.`
        : `Drawn from the official SHV elearning question pool · ${totalQuestions} questions across ${topics.length} topic${topics.length === 1 ? '' : 's'}.`}</p>
    </div>
    <div class="card elevated">
      <h2 class="card-title">${isDE ? 'Prüfung konfigurieren' : 'Configure your exam'}</h2>
      <div class="row" style="flex-wrap:wrap; gap:14px;">
        <div style="flex:1; min-width:240px;">
          <label class="muted" style="font-size:12px;">${isDE ? 'Fachgebiet' : 'Topic'}</label>
          <select id="shv-setup-topic" class="form-select" style="width:100%;">${topicOptions}</select>
        </div>
        ${subcategoryFilter}
        <div style="flex:1; min-width:180px;">
          <label class="muted" style="font-size:12px;">${isDE ? 'Anzahl Fragen' : 'Question count'}</label>
          <select id="shv-setup-count" class="form-select" style="width:100%;">
            ${[20, 30, 50, 75, 100].map(n => `<option value="${n}" ${setup.count === n ? 'selected' : ''}>${n} ${isDE ? 'Fragen' : 'questions'}</option>`).join('')}
          </select>
        </div>
      </div>
      <ul class="checklist" style="margin-top:16px;">
        ${isDE ? `
          <li><strong>Timer skaliert automatisch</strong> bei rund 54 Sekunden pro Frage (90 Minuten für 100 Fragen, rund 18 für 20).</li>
          <li><strong>Bestanden ab ${state.shvExam.setup.count >= 60 ? 75 : 60} %</strong> in jedem im Ziehungsumfang vertretenen Fachgebiet.</li>
          <li>Markiere Fragen und kehre über die Punktleiste oben zu ihnen zurück.</li>
          <li>Falsche Antworten zeigen im Ergebnis die korrekte Option.</li>
        ` : `
          <li><strong>Timer auto-scales</strong> at ~54 seconds per question (90 minutes for 100, ~18 for 20).</li>
          <li><strong>Pass ≥ ${state.shvExam.setup.count >= 60 ? 75 : 60} %</strong> in every topic represented in the draw.</li>
          <li>Flag questions and revisit them via the dot strip at the top.</li>
          <li>Wrong answers show the correct option on the result screen.</li>
        `}
      </ul>
      <div class="row" style="margin-top:18px; flex-wrap:wrap;">
        <button class="btn primary large" id="shv-exam-start">${isDE ? '⏱️ Prüfung auf Zeit' : '⏱️ Timed exam'}</button>
        <button class="btn large" id="shv-study-start" title="${isDE ? 'Kein Timer · Erklärungen und verwandte Inhalte direkt eingeblendet · freie Navigation' : 'No timer · explanations + related content shown inline · free navigation'}">${isDE ? '🎓 Lernmodus' : '🎓 Study mode'}</button>
        ${last ? `<button class="btn ghost" id="shv-exam-view-last">${isDE ? 'Letztes Ergebnis ansehen' : 'View last result'}</button>` : ''}
      </div>
      <div class="muted" style="font-size:12px; margin-top:10px;">
        ${isDE
          ? '<strong>Prüfung auf Zeit</strong>: realistische Bedingungen, Auswertung am Ende · <strong>Lernmodus</strong>: jede Frage wird direkt erklärt — mit Links zum Studienführer, Arbeitsbuch, Diagrammen, Videoclips und Folien.'
          : '<strong>Timed exam</strong>: realistic conditions, score breakdown at the end · <strong>Study mode</strong>: each question explained inline with links to the guide, workbook, diagrams, video clips, and slides.'}
      </div>
    </div>
    ${state.shvExam.history.length > 0 ? `
      <div class="card" style="margin-top:18px;">
        <h2 class="card-title">${isDE ? 'Vergangene Versuche' : 'Past attempts'}</h2>
        ${state.shvExam.history.slice(-5).reverse().map(r => `
          <div class="exam-section-row" style="border-bottom:1px solid var(--border);">
            <div class="name">${new Date(r.finishedAt).toLocaleString()} <span class="muted" style="font-size:11px;">· ${escapeHtml(r.setup?.topic || (isDE ? 'alle' : 'all'))}</span></div>
            <div class="score">${r.totalRight}/${r.totalCount} (${r.scorePct}%)</div>
            <div class="verdict ${r.passed ? 'pass' : 'fail'}">${r.passed ? (isDE ? '✓ Bestanden' : '✓ Passed') : (isDE ? '✗ Nicht bestanden' : '✗ Failed')}</div>
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

// Render a per-question enrichment card from window.SHV_ENRICHMENTS
function renderShvEnrichmentPanel(qid, q) {
  const e = getSHVEnrichmentFor(qid);
  if (!e) {
    const isDE = state.lang === 'de';
    return `<div class="shv-enrichment shv-enrichment-pending">
      <div class="shv-enrichment-pending-icon">📚</div>
      <div>
        <div style="font-weight:600;">${isDE ? 'Lernmaterial in Vorbereitung' : 'Study material in preparation'}</div>
        <div class="muted" style="font-size:12px; margin-top:4px;">${isDE ? 'Kuratierte Erklärungen und Links zum Studienführer, zu Transkripten, Diagrammen und Folien landen hier, sobald die Themen aufbereitet sind.' : 'Curated explanations and links to the guide, transcripts, diagrams, and slides land here as topics finish processing.'}</div>
      </div>
    </div>`;
  }

  const guide = getGuide();
  const decks = getDecks();
  const allDiagrams = getDiagrams();

  // Explanation block
  const explanationHtml = e.explanation ? `
    <div class="shv-enrichment-section">
      <div class="shv-enrichment-section-title">${t('enrich.why')}</div>
      <div class="shv-enrichment-text">${escapeHtml(e.explanation)}</div>
    </div>
  ` : '';

  // Guide chapter link
  const gc = e.guide_chapter;
  let guideHtml = '';
  if (gc && gc.id) {
    const part = guide.parts?.find(p => p.chapters?.some(c => c.id === gc.id));
    if (part) {
      guideHtml = `<a class="shv-enrichment-chip" data-shv-goto-guide="${gc.id}" data-shv-goto-part="${part.id}">
        <span class="shv-enrichment-chip-icon">📚</span>
        <span class="shv-enrichment-chip-text">${escapeHtml(gc.title || gc.id)}</span>
      </a>`;
    }
  }

  // Workbook chapter link
  const wc = e.workbook_chapter;
  let workbookHtml = '';
  if (wc && wc.id) {
    const book = getWorkbook().find(b => b.chapters?.some(c => c.id === wc.id));
    if (book) {
      workbookHtml = `<a class="shv-enrichment-chip" data-shv-goto-workbook="${wc.id}" data-shv-goto-book="${book.id}">
        <span class="shv-enrichment-chip-icon">📒</span>
        <span class="shv-enrichment-chip-text">${escapeHtml(wc.title || wc.id)}</span>
      </a>`;
    }
  }

  // Diagrams — render the SVGs inline (they're tiny)
  const diagramsHtml = (e.diagrams && e.diagrams.length)
    ? `<div class="shv-enrichment-section">
        <div class="shv-enrichment-section-title">${t('enrich.diagrams')}</div>
        <div class="shv-enrichment-diagrams">
          ${e.diagrams.map(d => {
            const dd = allDiagrams.find(x => x.id === d.id);
            if (!dd) return '';
            return `<figure class="shv-enrichment-diagram">
              <div class="shv-enrichment-diagram-svg">${dd.svg}</div>
              <figcaption>${escapeHtml(d.title || dd.title || '')}</figcaption>
            </figure>`;
          }).join('')}
        </div>
      </div>` : '';

  // Video clips with click-to-play
  const videoHtml = (e.video_clips && e.video_clips.length)
    ? `<div class="shv-enrichment-section">
        <div class="shv-enrichment-section-title">${t('enrich.listen')}</div>
        ${e.video_clips.map(vc => {
          const v = getVideoById(vc.video_id);
          if (!v) return '';
          return `<a class="shv-enrichment-clip" data-shv-play-clip="${vc.video_id}|${vc.t_start}|${vc.t_end || ''}">
            <div class="shv-enrichment-clip-ts">${v.deck_icon || '🎬'} ${escapeHtml(v.title)} · ${fmtClock(vc.t_start)}${vc.t_end ? '–' + fmtClock(vc.t_end) : ''}</div>
            ${vc.snippet ? `<div class="shv-enrichment-clip-snip">"${escapeHtml(vc.snippet)}"</div>` : ''}
          </a>`;
        }).join('')}
      </div>` : '';

  // Slide pages
  const slidesHtml = (e.slide_pages && e.slide_pages.length)
    ? `<div class="shv-enrichment-section">
        <div class="shv-enrichment-section-title">${t('enrich.slides')}</div>
        <div class="shv-enrichment-slides">
          ${e.slide_pages.map(sp => {
            const deck = decks.find(d => d.id === sp.deck_id);
            if (!deck) return '';
            return `<a class="shv-enrichment-slide" data-shv-open-slide="${sp.deck_id}|${sp.page}" title="${escapeHtml(deck.title)} · page ${sp.page}">
              <img src="${slideUrl(deck, sp.page)}" alt="" loading="lazy"/>
              <span>${deck.icon} ${sp.page}</span>
            </a>`;
          }).join('')}
        </div>
      </div>` : '';

  const chipsHtml = (guideHtml || workbookHtml) ? `
    <div class="shv-enrichment-section">
      <div class="shv-enrichment-section-title">${t('enrich.readmore')}</div>
      <div class="shv-enrichment-chips">${guideHtml}${workbookHtml}</div>
    </div>
  ` : '';

  return `<div class="shv-enrichment">
    ${explanationHtml}
    ${chipsHtml}
    ${videoHtml}
    ${diagramsHtml}
    ${slidesHtml}
  </div>`;
}

function renderSHVExamLive() {
  const isDE = state.lang === 'de';
  const pool = getSHVQuestions() || {};
  const i = state.shvExam.current;
  const qid = state.shvExam.qids[i];
  const q = pool[qid];
  if (!q) return `<div class="empty"><div>${isDE ? `Frage ${qid} fehlt im Pool.` : `Question ${qid} missing from pool.`}</div></div>`;
  const meta = shvTopicMeta(q.topic);
  const subcat = getSHVSubcategoryFor(qid);
  const markers = ['A', 'B', 'C', 'D'];
  const mode = state.shvExam.mode || 'exam';
  const isStudy = mode === 'study';
  const elapsed = Math.floor((Date.now() - state.shvExam.startedAt) / 1000);
  const remaining = Math.max(0, state.shvExam.durationSec - elapsed);
  const answered = state.shvExam.answers.filter(a => a !== null).length;
  const answer = state.shvExam.answers[i];

  // In study mode: once an answer is selected, the choice colours reveal
  // correct vs. wrong AND the enrichment panel appears below.
  const studyRevealed = isStudy && answer !== null;

  const headerHtml = isStudy
    ? `<div class="exam-header"><div><strong>🎓 ${isDE ? 'SHV-Lernmodus' : 'SHV Study Mode'}</strong> · <span class="muted">${isDE ? `Frage ${i + 1} von ${state.shvExam.qids.length}` : `Question ${i + 1} of ${state.shvExam.qids.length}`}</span></div></div>`
    : `<div class="exam-header">
        <div><strong>${isDE ? 'SHV-Übung' : 'SHV Practice'}</strong> · <span class="muted">${answered}/${state.shvExam.qids.length} ${isDE ? 'beantwortet' : 'answered'}</span></div>
        <div class="exam-timer" id="shv-exam-timer">${fmtTime(remaining)}</div>
      </div>`;

  return `
    ${headerHtml}
    <div class="exam-progress">
      ${state.shvExam.qids.map((_, idx) => {
        let cls = 'dot';
        if (idx === i) cls += ' current';
        else if (state.shvExam.answers[idx] !== null) cls += ' answered';
        if (state.shvExam.flagged.includes(idx)) cls += ' flagged';
        return `<button class="${cls}" data-shv-jump="${idx}">${idx + 1}</button>`;
      }).join('')}
    </div>
    <div class="flashcard">
      <div class="fc-meta">
        <div>
          <span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${escapeHtml(q.topic)}
          ${subcat ? `<span class="shv-subcat-tag" title="${escapeHtml(subcat.description || '')}">· ${escapeHtml(subcat.title)}</span>` : ''}
        </div>
        <div>
          ${!isStudy ? `<button class="btn small ${state.shvExam.flagged.includes(i) ? 'primary' : ''}" id="shv-exam-flag">${state.shvExam.flagged.includes(i) ? (isDE ? '🚩 Markiert' : '🚩 Flagged') : (isDE ? '🚩 Markieren' : '🚩 Flag')}</button>` : ''}
        </div>
      </div>
      <div class="fc-question">
        <span class="lang-tag">Q ${i + 1}</span><span class="ct">${escapeHtml(q.text)}</span>
      </div>
      ${q.has_image && q.image_path ? `<div class="shv-question-image"><img src="${escapeHtml(q.image_path)}" alt="" loading="lazy" /></div>` : ''}
      <div class="choices">
        ${q.options.map((opt, idx) => {
          const selected = answer === idx;
          // In study mode after answering, color the correct option green
          // and the user's wrong pick red (peek-at-answer reveal).
          let style = '';
          let cls = '';
          if (studyRevealed) {
            if (idx === q.correct) {
              cls = 'correct';
              style = 'background:var(--good-soft); border-color:var(--good); color:var(--good);';
            } else if (selected) {
              cls = 'wrong';
              style = 'background:var(--bad-soft); border-color:var(--bad); color:var(--bad);';
            }
          } else if (selected) {
            cls = 'correct';
            style = 'background:var(--accent-soft); border-color:var(--accent); color:var(--accent);';
          }
          return `<button class="choice ${cls}" data-shv-choice="${idx}" style="${style}">
            <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(opt)}</span>
          </button>`;
        }).join('')}
      </div>
    </div>
    ${studyRevealed ? renderShvEnrichmentPanel(qid, q) : ''}
    <div class="nav-controls">
      <button class="btn" id="shv-exam-prev" ${i === 0 ? 'disabled' : ''}>${isDE ? '← Zurück' : '← Previous'}</button>
      ${i === state.shvExam.qids.length - 1
        ? (isStudy
            ? `<button class="btn primary" id="shv-exam-finish">${isDE ? 'Lernsitzung beenden' : 'Finish study session'}</button>`
            : `<button class="btn primary" id="shv-exam-finish">${isDE ? 'Prüfung abschliessen' : 'Finish exam'}</button>`)
        : `<button class="btn primary" id="shv-exam-next">${isDE ? 'Weiter →' : 'Next →'}</button>`}
    </div>
    <div class="row" style="margin-top:14px; justify-content:center;">
      <button class="btn ghost danger small" id="shv-exam-abort">${isStudy ? (isDE ? 'Lernmodus verlassen' : 'Exit study mode') : (isDE ? 'Prüfung abbrechen' : 'Abort exam')}</button>
    </div>
  `;
}

function renderSHVExamResult(r) {
  const pool = getSHVQuestions() || {};
  const dur = fmtTime(r.duration);
  const isStudy = r.mode === 'study';
  const circumference = 2 * Math.PI * 60;
  const dashOffset = circumference - circumference * r.scorePct / 100;
  const sectionsHtml = Object.entries(r.sections).map(([t, s]) => {
    const meta = shvTopicMeta(t);
    const pct = s.total ? Math.round(100 * s.right / s.total) : 0;
    const pass = pct >= r.pass_threshold_pct;
    return `
      <div class="exam-section-row">
        <div class="name">${meta.icon} ${escapeHtml(t)}</div>
        <div class="score">${s.right}/${s.total} (${pct}%)</div>
        <div class="verdict ${pass ? 'pass' : 'fail'}">${pass ? (state.lang === 'de' ? '✓ Bestanden' : '✓ Pass') : (state.lang === 'de' ? '✗ Nicht bestanden' : '✗ Fail')}</div>
      </div>
    `;
  }).join('');
  const markers = ['A', 'B', 'C', 'D'];
  const wrongHtml = r.wrong.length === 0 ? `<div class="muted" style="font-size:13px;">${state.lang === 'de' ? 'Nichts durchzugehen — volle Punktzahl!' : 'Nothing to review — full marks!'}</div>` :
    r.wrong.slice(0, 100).map(w => {
      const q = pool[w.qid]; if (!q) return '';
      const meta = shvTopicMeta(q.topic);
      return `
        <div class="card" style="margin-bottom:14px;">
          <div class="muted" style="font-size:11px;">
            <span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} ${escapeHtml(q.topic)}
          </div>
          <div style="margin:6px 0; font-weight:600;">${escapeHtml(q.text)}</div>
          ${q.has_image && q.image_path ? `<div class="shv-question-image"><img src="${escapeHtml(q.image_path)}" alt="" loading="lazy" /></div>` : ''}
          ${q.options.map((opt, idx) => {
            const isCorrect = idx === q.correct;
            const isPicked = idx === w.picked;
            const cls = isCorrect ? 'correct' : (isPicked ? 'wrong' : '');
            const tag = isCorrect ? ' ✓' : (isPicked ? (state.lang === 'de' ? ' ✗ (deine Wahl)' : ' ✗ (your pick)') : '');
            return `<div class="choice ${cls}" style="cursor:default; ${isCorrect ? 'background:var(--good-soft); border-color:var(--good); color:var(--good);' : ''}${isPicked && !isCorrect ? 'background:var(--bad-soft); border-color:var(--bad); color:var(--bad);' : ''}">
              <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(opt)}${tag}</span>
            </div>`;
          }).join('')}
          ${renderShvEnrichmentPanel(w.qid, q)}
        </div>
      `;
    }).join('');
  const isDE = state.lang === 'de';
  return `
    <div class="page-header">
      <h1>${r.passed ? (isDE ? '🎉 Übungsprüfung bestanden' : '🎉 Practice exam passed') : (isDE ? '✗ Übungsprüfung nicht bestanden' : '✗ Practice exam not passed')}</h1>
      <p class="page-subtitle">${isDE
        ? `Beendet in ${dur}. Ergebnis ${r.totalRight}/${r.totalCount} (${r.scorePct}%) · Bestehensgrenze ${r.pass_threshold_pct} % pro Fachgebiet`
        : `Finished in ${dur}. Score ${r.totalRight}/${r.totalCount} (${r.scorePct}%) · Pass threshold ${r.pass_threshold_pct}% per topic`}</p>
    </div>
    <div class="card elevated" style="display:flex; gap:24px; align-items:center; flex-wrap:wrap;">
      <div class="donut">
        <svg viewBox="0 0 140 140">
          <circle class="donut-bg" cx="70" cy="70" r="60"></circle>
          <circle class="donut-fg" cx="70" cy="70" r="60"
            stroke="${r.passed ? 'var(--good)' : 'var(--bad)'}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"></circle>
        </svg>
        <div class="donut-label">
          <div class="big" style="color:${r.passed ? 'var(--good)' : 'var(--bad)'}">${r.scorePct}%</div>
          <div class="small">${r.totalRight}/${r.totalCount}</div>
        </div>
      </div>
      <div style="flex:1; min-width:240px;">
        <h3 style="margin-top:0;">${isDE ? 'Auswertung pro Fachgebiet' : 'Per-topic breakdown'}</h3>
        ${sectionsHtml}
      </div>
    </div>
    ${r.subSections && Object.keys(r.subSections).length > 0 ? `
      <div class="card" style="margin-top:18px;">
        <h3 style="margin-top:0;">${isDE ? 'Auswertung pro Unterthema' : 'Per-subtopic breakdown'}</h3>
        <p class="muted" style="font-size:12px; margin:-4px 0 10px;">${isDE ? 'Hier ansetzen: Unterthemen mit falschen Antworten sind wahrscheinlich genau die, an denen du gezielt arbeiten solltest.' : 'Where to grind: subtopics you got wrong are likely where you need targeted study.'}</p>
        ${Object.entries(r.subSections).sort(([,a],[,b]) => {
          const aPct = a.right / a.total, bPct = b.right / b.total;
          return aPct - bPct; // weakest first
        }).map(([key, s]) => {
          const meta = shvTopicMeta(s.topic);
          const pct = s.total ? Math.round(100 * s.right / s.total) : 0;
          const pass = pct >= r.pass_threshold_pct;
          return `
            <div class="exam-section-row" style="border-bottom:1px solid var(--border);">
              <div class="name" style="font-size:13px;">
                <span style="color:${meta.color}; font-size:11px;">${meta.icon} ${escapeHtml(s.topic)}</span>
                <span> · ${escapeHtml(s.title)}</span>
              </div>
              <div class="score">${s.right}/${s.total} (${pct}%)</div>
              <div class="verdict ${pass ? 'pass' : 'fail'}" style="font-size:11px;">${pass ? '✓' : '✗'}</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}
    <div class="row" style="margin-top:18px; flex-wrap:wrap;">
      <button class="btn primary" id="shv-exam-new">${isDE ? '↻ Neue Prüfung auf Zeit' : '↻ New timed exam'}</button>
      <button class="btn" id="shv-study-new">${isDE ? '🎓 Lernmodus' : '🎓 Study mode'}</button>
      <button class="btn ghost" id="shv-exam-clear">${isDE ? 'Ergebnis löschen' : 'Clear result'}</button>
    </div>
    ${r.wrong.length > 0 ? `<h2 style="margin-top:30px;">${isDE ? `Falsche Antworten durchgehen (${r.wrong.length})` : `Review wrong answers (${r.wrong.length})`}</h2>${wrongHtml}` : ''}
  `;
}

// ============================================================================
// VIEW: SHV Browse (explore the pool by topic + subcategory, expand inline)
// ============================================================================
function getSHVQuestionsForTopic(topic) {
  return Object.values(getSHVQuestions() || {}).filter(q => q.topic === topic);
}
function getSHVQuestionsForSubcat(topic, subcatId) {
  return getSHVQuestionsForTopic(topic).filter(q => {
    const e = getSHVEnrichmentFor(`${q.topic}_${q.qid}`);
    return e && e.subcategory === subcatId;
  });
}

function ensureShvBrowseTopic() {
  const byTopic = getSHVQuestionsByTopic();
  const topics = Object.keys(byTopic);
  if (!state.shvBrowse.topic || !byTopic[state.shvBrowse.topic]) {
    state.shvBrowse.topic = topics[0] || null;
  }
}

function renderSHVBrowse() {
  const pool = getSHVQuestions();
  if (!pool) {
    return `<div class="empty"><div class="emoji">🗂️</div><div>${state.lang === 'de' ? 'SHV-Fragenpool nicht geladen.' : 'SHV question pool not loaded.'}</div></div>`;
  }
  ensureShvBrowseTopic();
  const byTopic = getSHVQuestionsByTopic();
  const topics = Object.keys(byTopic).sort();
  const cur = state.shvBrowse.topic;
  const total = Object.keys(pool).length;

  // Tabs
  const tabsHtml = `
    <div class="subtabs">
      ${topics.map(t => {
        const meta = shvTopicMeta(t);
        return `<button class="subtab ${cur === t ? 'active' : ''}" data-shv-browse-topic="${escapeHtml(t)}">
          ${meta.icon} ${escapeHtml(t)} <span class="count">${byTopic[t].length}</span>
        </button>`;
      }).join('')}
    </div>`;

  if (!cur || !byTopic[cur]) {
    return `<div class="page-header"><h1>${t('page.shv-browse.h1')}</h1></div>${tabsHtml}<div class="empty">${t('shv.pickTopic')}</div>`;
  }

  const meta = shvTopicMeta(cur);
  const subs = getSHVSubcategoriesForTopic(cur);
  const topicQs = byTopic[cur];
  const q = (state.shvBrowse.query || '').trim().toLowerCase();

  // Group questions by subcategory for the selected topic
  const bySub = new Map();
  for (const qq of topicQs) {
    const e = getSHVEnrichmentFor(`${qq.topic}_${qq.qid}`);
    const sid = (e && e.subcategory) || '_unassigned';
    if (!bySub.has(sid)) bySub.set(sid, []);
    bySub.get(sid).push(qq);
  }
  for (const list of bySub.values()) list.sort((a, b) => a.qid - b.qid);

  // Build subcategory list (canonical order from subcats catalog, then any unassigned)
  const isDE = state.lang === 'de';
  const orderedSubcats = subs.slice();
  if (bySub.has('_unassigned')) orderedSubcats.push({
    id: '_unassigned',
    title: isDE ? 'Nicht zugeordnet' : 'Unsorted',
    description: isDE ? 'Noch keinem Unterthema zugeordnet' : 'Not yet assigned to a subcategory'
  });

  // Filter by query if any
  const matches = (qq) => {
    if (!q) return true;
    if (qq.text && qq.text.toLowerCase().includes(q)) return true;
    if (qq.options && qq.options.some(o => o.toLowerCase().includes(q))) return true;
    return false;
  };

  const subsHtml = orderedSubcats.map(s => {
    const list = (bySub.get(s.id) || []).filter(matches);
    if (list.length === 0 && q) return '';  // hide empty subcats during search
    const subKey = `${cur}::${s.id}`;
    const expanded = !!state.shvBrowse.expandedSubs[subKey] || !!q;
    const qsHtml = expanded ? list.map(qq => renderShvBrowseQuestionRow(qq)).join('') : '';
    return `
      <div class="shv-browse-subcat">
        <button class="shv-browse-subcat-header" data-shv-toggle-sub="${escapeHtml(subKey)}">
          <span class="shv-browse-subcat-chevron">${expanded ? '▾' : '▸'}</span>
          <span class="shv-browse-subcat-title">${escapeHtml(s.title)}</span>
          <span class="shv-browse-subcat-count">${list.length}${list.length !== (bySub.get(s.id) || []).length ? '/' + (bySub.get(s.id) || []).length : ''}</span>
        </button>
        ${s.description ? `<div class="shv-browse-subcat-desc">${escapeHtml(s.description)}</div>` : ''}
        ${expanded ? `<div class="shv-browse-question-list">${qsHtml}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>${t('page.shv-browse.h1')}</h1>
      <p class="page-subtitle">${isDE
        ? `Alle ${total} Fragen aus dem Pool, nach Fachgebiet und Unterthema gegliedert — aufklappen, um Inhalt, Antwort und Querverweise direkt zu sehen.`
        : `All ${total} scraped questions, grouped by topic and subtopic — expand to see content, answer, and references inline.`}</p>
    </div>
    ${tabsHtml}
    <div class="shv-browse-toolbar">
      <input class="search-input" id="shv-browse-q" type="search" placeholder="${escapeHtml(t('shv.searchPlaceholder', {topic: cur}))}" value="${escapeHtml(state.shvBrowse.query || '')}" />
      <button class="btn small" id="shv-browse-expand-all">${t('shv.expandAll')}</button>
      <button class="btn small ghost" id="shv-browse-collapse-all">${t('shv.collapseAll')}</button>
    </div>
    <div class="shv-browse-topic-header">
      <div><span class="cat-dot" style="background:${meta.color}"></span>${meta.icon} <strong>${escapeHtml(cur)}</strong>
        <span class="muted"> · ${topicQs.length} ${isDE ? 'Fragen in' : 'questions in'} ${subs.length} ${isDE ? 'Unterthemen' : 'subtopics'}</span>
      </div>
    </div>
    <div class="shv-browse-subcats">${subsHtml}</div>
  `;
}

function renderShvBrowseQuestionRow(q) {
  const key = `${q.topic}_${q.qid}`;
  const expanded = !!state.shvBrowse.expandedQs[key];
  const markers = ['A', 'B', 'C', 'D'];
  const hasImg = q.has_image && q.image_path;
  const e = getSHVEnrichmentFor(key);
  const hasEnrich = !!(e && (e.explanation || e.video_clips?.length || e.diagrams?.length));

  if (!expanded) {
    return `
      <button class="shv-browse-question shv-browse-question-collapsed" data-shv-toggle-q="${escapeHtml(key)}">
        <span class="shv-browse-qid">Q${q.qid}</span>
        <span class="shv-browse-qpreview">${escapeHtml(q.text.slice(0, 140))}${q.text.length > 140 ? '…' : ''}</span>
        <span class="shv-browse-qbadges">
          ${hasImg ? `<span class="shv-browse-badge" title="${state.lang === 'de' ? 'Mit Bezugsabbildung' : 'Has reference image'}">🖼</span>` : ''}
          ${hasEnrich ? `<span class="shv-browse-badge" title="${state.lang === 'de' ? 'Mit Erklärung und Querverweisen' : 'Has explanation + links'}">💡</span>` : ''}
          <span class="shv-browse-chevron">▸</span>
        </span>
      </button>
    `;
  }

  return `
    <div class="shv-browse-question shv-browse-question-expanded">
      <button class="shv-browse-question-header" data-shv-toggle-q="${escapeHtml(key)}">
        <span class="shv-browse-qid">Q${q.qid}</span>
        <span class="shv-browse-qfulltext">${escapeHtml(q.text)}</span>
        <span class="shv-browse-chevron">▾</span>
      </button>
      ${hasImg ? `<div class="shv-question-image"><img src="${escapeHtml(q.image_path)}" alt="" loading="lazy" /></div>` : ''}
      <div class="choices">
        ${q.options.map((opt, idx) => {
          const isCorrect = idx === q.correct;
          return `<div class="choice ${isCorrect ? 'correct' : ''}" style="cursor:default; ${isCorrect ? 'background:var(--good-soft); border-color:var(--good); color:var(--good);' : ''}">
            <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(opt)}${isCorrect ? ' ✓' : ''}</span>
          </div>`;
        }).join('')}
      </div>
      ${renderShvEnrichmentPanel(key, q)}
    </div>
  `;
}

function attachShvBrowseEvents() {
  document.querySelectorAll('[data-shv-browse-topic]').forEach(b => b.onclick = () => {
    state.shvBrowse.topic = b.dataset.shvBrowseTopic;
    // Don't reset expansion when switching topics — but visibility filters by topic anyway
    saveState();
    render();
  });
  document.querySelectorAll('[data-shv-toggle-sub]').forEach(b => b.onclick = () => {
    const key = b.dataset.shvToggleSub;
    state.shvBrowse.expandedSubs[key] = !state.shvBrowse.expandedSubs[key];
    saveState();
    render();
  });
  document.querySelectorAll('[data-shv-toggle-q]').forEach(b => b.onclick = () => {
    const key = b.dataset.shvToggleQ;
    state.shvBrowse.expandedQs[key] = !state.shvBrowse.expandedQs[key];
    saveState();
    render();
  });
  const q = document.getElementById('shv-browse-q');
  if (q) q.oninput = (e) => {
    state.shvBrowse.query = e.target.value;
    saveState();
    render();
    const inp = document.getElementById('shv-browse-q');
    if (inp) { inp.focus(); inp.setSelectionRange(state.shvBrowse.query.length, state.shvBrowse.query.length); }
  };
  const exp = document.getElementById('shv-browse-expand-all');
  if (exp) exp.onclick = () => {
    const subs = getSHVSubcategoriesForTopic(state.shvBrowse.topic);
    for (const s of subs) state.shvBrowse.expandedSubs[`${state.shvBrowse.topic}::${s.id}`] = true;
    saveState();
    render();
  };
  const col = document.getElementById('shv-browse-collapse-all');
  if (col) col.onclick = () => {
    state.shvBrowse.expandedSubs = {};
    state.shvBrowse.expandedQs = {};
    saveState();
    render();
  };
  // Click-into-app handlers also work in browse view (chips → guide/workbook, video clips, slides)
  // The chips are produced by renderShvEnrichmentPanel and pick up the same data-shv-* attributes
  // bound by attachSHVExamEvents — re-bind here:
  document.querySelectorAll('[data-shv-goto-guide]').forEach(b => b.onclick = () => {
    state.guide.partId = b.dataset.shvGotoPart;
    state.guide.chapterId = b.dataset.shvGotoGuide;
    saveState();
    navigate('guide');
  });
  document.querySelectorAll('[data-shv-goto-workbook]').forEach(b => b.onclick = () => {
    state.workbook.bookId = b.dataset.shvGotoBook;
    state.workbook.chapterId = b.dataset.shvGotoWorkbook;
    saveState();
    navigate('workbook');
  });
  document.querySelectorAll('[data-shv-play-clip]').forEach(b => b.onclick = () => {
    const [videoId, tStart] = b.dataset.shvPlayClip.split('|');
    openVideoPlayer(videoId);
    setTimeout(() => {
      const v = document.getElementById('vp-video');
      if (v) { v.currentTime = parseFloat(tStart); v.play().catch(() => {}); }
    }, 600);
  });
  document.querySelectorAll('[data-shv-open-slide]').forEach(b => b.onclick = () => {
    const [deckId, page] = b.dataset.shvOpenSlide.split('|');
    openSlideViewer(deckId, parseInt(page, 10));
  });
}

function attachSHVExamEvents() {
  const topicSel = document.getElementById('shv-setup-topic');
  if (topicSel) topicSel.onchange = (e) => {
    state.shvExam.setup.topic = e.target.value;
    state.shvExam.setup.subcategory = 'all'; // reset subcategory when topic changes
    saveState();
    render();
  };
  const subcatSel = document.getElementById('shv-setup-subcategory');
  if (subcatSel) subcatSel.onchange = (e) => { state.shvExam.setup.subcategory = e.target.value; saveState(); render(); };
  const countSel = document.getElementById('shv-setup-count');
  if (countSel) countSel.onchange = (e) => { state.shvExam.setup.count = parseInt(e.target.value, 10); saveState(); render(); };

  const startBtn = document.getElementById('shv-exam-start');
  if (startBtn) startBtn.onclick = () => { state.shvExam.lastResult = null; startSHVExam('exam'); };
  const studyBtn = document.getElementById('shv-study-start');
  if (studyBtn) studyBtn.onclick = () => { state.shvExam.lastResult = null; startSHVExam('study'); };
  const newBtn = document.getElementById('shv-exam-new');
  if (newBtn) newBtn.onclick = () => { state.shvExam.lastResult = null; startSHVExam('exam'); };
  const newStudyBtn = document.getElementById('shv-study-new');
  if (newStudyBtn) newStudyBtn.onclick = () => { state.shvExam.lastResult = null; startSHVExam('study'); };
  const clrBtn = document.getElementById('shv-exam-clear');
  if (clrBtn) clrBtn.onclick = () => { state.shvExam.lastResult = null; saveState(); render(); };
  const viewLast = document.getElementById('shv-exam-view-last');
  if (viewLast) viewLast.onclick = () => { state.shvExam.lastResult = state.shvExam.history[state.shvExam.history.length - 1]; render(); };

  // Enrichment chip clicks: jump to guide / workbook / video / slide
  document.querySelectorAll('[data-shv-goto-guide]').forEach(b => b.onclick = () => {
    state.guide.partId = b.dataset.shvGotoPart;
    state.guide.chapterId = b.dataset.shvGotoGuide;
    saveState();
    navigate('guide');
  });
  document.querySelectorAll('[data-shv-goto-workbook]').forEach(b => b.onclick = () => {
    state.workbook.bookId = b.dataset.shvGotoBook;
    state.workbook.chapterId = b.dataset.shvGotoWorkbook;
    saveState();
    navigate('workbook');
  });
  document.querySelectorAll('[data-shv-play-clip]').forEach(b => b.onclick = () => {
    const [videoId, tStart] = b.dataset.shvPlayClip.split('|');
    openVideoPlayer(videoId);
    // Seek to the timestamp once the video has loaded
    setTimeout(() => {
      const v = document.getElementById('vp-video');
      if (v) { v.currentTime = parseFloat(tStart); v.play().catch(() => {}); }
    }, 600);
  });
  document.querySelectorAll('[data-shv-open-slide]').forEach(b => b.onclick = () => {
    const [deckId, page] = b.dataset.shvOpenSlide.split('|');
    openSlideViewer(deckId, parseInt(page, 10));
  });

  document.querySelectorAll('[data-shv-choice]').forEach(b => b.onclick = () => {
    state.shvExam.answers[state.shvExam.current] = parseInt(b.dataset.shvChoice, 10);
    saveState();
    render();
  });
  document.querySelectorAll('[data-shv-jump]').forEach(b => b.onclick = () => {
    state.shvExam.current = parseInt(b.dataset.shvJump, 10);
    saveState();
    render();
  });
  const prev = document.getElementById('shv-exam-prev');
  if (prev) prev.onclick = () => { state.shvExam.current--; saveState(); render(); };
  const next = document.getElementById('shv-exam-next');
  if (next) next.onclick = () => { state.shvExam.current++; saveState(); render(); };
  const flag = document.getElementById('shv-exam-flag');
  if (flag) flag.onclick = () => {
    const i = state.shvExam.current;
    const set = new Set(state.shvExam.flagged);
    if (set.has(i)) set.delete(i); else set.add(i);
    state.shvExam.flagged = [...set];
    saveState();
    render();
  };
  const fin = document.getElementById('shv-exam-finish');
  if (fin) fin.onclick = () => {
    const isDE = state.lang === 'de';
    const unanswered = state.shvExam.answers.filter(a => a === null).length;
    const msg = unanswered > 0
      ? (isDE ? `Du hast ${unanswered} unbeantwortete Fragen. Trotzdem beenden?` : `You have ${unanswered} unanswered questions. Finish anyway?`)
      : (isDE ? 'Prüfung beenden und Ergebnis ansehen?' : 'Finish exam and see results?');
    if (confirm(msg)) finishSHVExam();
  };
  const abort = document.getElementById('shv-exam-abort');
  if (abort) abort.onclick = () => {
    if (confirm(state.lang === 'de' ? 'Übungsprüfung abbrechen? Der Fortschritt geht verloren.' : 'Abort the practice exam? Progress will be lost.')) {
      stopSHVExamTimer();
      state.shvExam.active = false;
      state.shvExam.lastResult = null;
      saveState();
      render();
    }
  };
}

// ============================================================================
// VIEW: Study Guide
// ============================================================================
function ensureGuideSelection() {
  const g = getGuide();
  if (!g.parts || g.parts.length === 0) return;
  let part = g.parts.find(p => p.id === state.guide.partId);
  if (!part) {
    part = g.parts[0];
    state.guide.partId = part.id;
    state.guide.chapterId = null;
  }
  if (!part.chapters.find(c => c.id === state.guide.chapterId)) {
    state.guide.chapterId = part.chapters[0].id;
  }
  saveState();
}

function renderGuide() {
  const g = getGuide();
  if (!g.parts || g.parts.length === 0) {
    return `<div class="empty"><div class="emoji">📚</div><div>Study guide not loaded.</div></div>`;
  }
  ensureGuideSelection();
  const part = g.parts.find(p => p.id === state.guide.partId) || g.parts[0];
  const chapter = part.chapters.find(c => c.id === state.guide.chapterId) || part.chapters[0];
  state.guide.partId = part.id;
  state.guide.chapterId = chapter.id;

  // Build a list of pages for this chapter
  const partNum = part.id; // "part1" etc.
  const pages = [];
  for (let p = chapter.startPage; p <= chapter.endPage; p++) {
    pages.push({ part: partNum, page: p, url: `assets/pages/${partNum}-${String(p).padStart(2, '0')}.jpg` });
  }

  // Cross-link Question NNN references (EN: "Question(s)", DE: "Frage(n)")
  const textWithLinks = (chapter.text || '').replace(/(?:Question[s]?|Frage[n]?)\s+(\d{1,3})(?:\s*(?:[,–-]|and|to|und|bis)\s*(\d{1,3}))?/g, (match, q1, q2) => {
    const refs = q2 ? `${q1}–${q2}` : q1;
    return `<span class="q-ref">Q${refs}</span>`;
  });

  // Related flashcards
  const related = (chapter.questions || []).map(q => findCardByQuestionNumber(part.id, q)).filter(Boolean);

  // Paragraph-ize text
  const paragraphs = textWithLinks.split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');

  // Custom diagrams keyed to this chapter
  const allDiagrams = (window.DIAGRAMS && window.DIAGRAMS.diagrams) || [];
  const diagrams = allDiagrams.filter(d => d.use_in_chapter === chapter.id);
  const diagramsHtml = diagrams.length === 0 ? '' : `
        <div class="guide-diagrams">
          <h3 class="guide-section-title">${state.lang === 'de' ? 'Diagramme' : 'Diagrams'}</h3>
          ${diagrams.map(d => `
            <figure class="guide-diagram">
              <div class="guide-diagram-svg">${d.svg}</div>
              <figcaption>
                <strong>${escapeHtml(d.title)}</strong>
                <div class="guide-diagram-caption">${escapeHtml(d.caption)}</div>
              </figcaption>
            </figure>
          `).join('')}
        </div>
  `;

  const isDE = state.lang === 'de';
  const L = {
    title: isDE ? 'Studienführer' : 'Study Guide',
    subtitle: isDE
      ? 'Offizieller SHV/FSVL-Theoriekommentar von J. Oberson & A. Piers — soaringmeteo.org'
      : 'Official SHV/FSVL theory commentary by J. Oberson & A. Piers — soaringmeteo.org',
    pages: isDE ? 'Seiten' : 'pages',
    examQuestions: isDE ? 'Prüfungsfragen behandelt' : 'exam questions covered',
    keyTakeaways: isDE ? 'Wichtigste Erkenntnisse' : 'Key takeaways',
    diagrams: isDE ? 'Diagramme' : 'Diagrams',
    originalPages: isDE ? 'Originalseiten' : 'Original pages',
    clickToEnlarge: isDE ? 'Klicke zum Vergrössern' : 'click any to enlarge',
    visualCompanion: isDE ? 'Visuelle Ergänzung — Freewings-Foliensatz' : 'Visual companion — Freewings video deck',
    deckLabel: isDE ? 'Foliensatz' : 'deck',
    slidesLabel: isDE ? 'Folien' : 'slides',
    relatedFlashcards: isDE ? 'Verwandte Lernkarten' : 'Related flashcards',
    pagePrefix: isDE ? 'S.' : 'p.',
  };
  return `
    <div class="page-header">
      <h1>${L.title}</h1>
      <p class="page-subtitle">${L.subtitle}</p>
    </div>
    <div class="guide-layout">
      <aside class="guide-toc">
        ${g.parts.map(p => `
          <div class="guide-toc-part">${p.title}</div>
          ${p.chapters.map(c => `
            <button class="guide-toc-chapter ${c.id === state.guide.chapterId ? 'active' : ''}" data-guide-chap="${p.id}|${c.id}">
              ${escapeHtml(c.title)}
            </button>
          `).join('')}
        `).join('')}
      </aside>
      <div class="guide-content">
        <div class="guide-chapter-header">
          <div class="guide-chapter-title">${escapeHtml(chapter.title)}</div>
          <div class="guide-chapter-meta">${escapeHtml(part.title)} · ${L.pages} ${chapter.startPage}–${chapter.endPage} · ${(chapter.questions || []).length} ${L.examQuestions}</div>
        </div>
        ${(chapter.key_points && chapter.key_points.length > 0) ? `
          <div class="guide-keypoints">
            <h4>${L.keyTakeaways}</h4>
            <ul>${chapter.key_points.map(kp => `<li>${escapeHtml(kp)}</li>`).join('')}</ul>
          </div>
        ` : ''}
        <div class="guide-text">${paragraphs}</div>

        ${diagramsHtml}

        <div class="guide-pages">
          <div class="guide-pages-head">
            <h3 style="margin:0;">${L.originalPages}</h3>
            <span class="muted" style="font-size:12px;">${pages.length} ${L.pages} · ${L.clickToEnlarge}</span>
          </div>
          <div class="guide-pages-imgs">
            ${pages.map(p => `
              <div class="guide-page-thumb" data-lightbox="${p.url}" data-lb-list="${pages.map(pp => pp.url).join('|')}">
                <img src="${p.url}" loading="lazy" alt="${L.pages} ${p.page}" />
                <div class="pp-label">${L.pagePrefix} ${p.page}</div>
              </div>
            `).join('')}
          </div>
        </div>

        ${(() => {
          const partCat = PART_TO_CATEGORY[part.id];
          const deck = partCat ? getDeckByCategory(partCat) : null;
          return deck ? `
            <div class="guide-related">
              <h4>${L.visualCompanion}</h4>
              <button class="flash-link" data-open-deck="${deck.id}">${deck.icon} ${escapeHtml(deck.title)} ${L.deckLabel} · ${deckSlideCount(deck)} ${L.slidesLabel}</button>
            </div>
          ` : '';
        })()}
        ${related.length > 0 ? `
          <div class="guide-related">
            <h4>${L.relatedFlashcards} (${related.length})</h4>
            ${related.map(c => `<button class="flash-link" data-flash-jump="${c.id}">${CATEGORY_META[c.category].icon} #${c.original_id} · ${escapeHtml(c.q_en.slice(0, 60))}${c.q_en.length > 60 ? '…' : ''}</button>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}
function attachGuideEvents() {
  document.querySelectorAll('[data-guide-chap]').forEach(b => b.onclick = () => {
    const [partId, chapterId] = b.dataset.guideChap.split('|');
    state.guide.partId = partId;
    state.guide.chapterId = chapterId;
    saveState();
    render();
  });
  document.querySelectorAll('[data-lightbox]').forEach(b => b.onclick = () => {
    const list = b.dataset.lbList.split('|');
    openLightbox(list, list.indexOf(b.dataset.lightbox));
  });
  document.querySelectorAll('[data-flash-jump]').forEach(b => b.onclick = () => {
    const id = b.dataset.flashJump;
    const card = getCardById(id);
    if (!card) return;
    state.fc.category = card.category;
    state.fc.mode = 'flashcards';
    const list = cardsForCategory(card.category);
    state.fc.index = list.findIndex(c => c.id === id);
    state.fc.shuffle = false;
    _fcDeck = null;
    _fcReveal = false;
    saveState();
    navigate('flashcards');
  });
  document.querySelectorAll('[data-open-deck]').forEach(b => b.onclick = () => {
    state.slides.deckId = b.dataset.openDeck;
    state.slides.page = 1;
    saveState();
    navigate('slides');
  });
}

// ---- Lightbox ----------------------------------------------------------------
let _lbList = [], _lbIndex = 0;
function openLightbox(list, idx) {
  _lbList = list; _lbIndex = idx;
  const lb = document.getElementById('lightbox');
  document.getElementById('lb-img').src = list[idx];
  lb.classList.add('show');
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
}
function lightboxNav(d) {
  _lbIndex = (_lbIndex + d + _lbList.length) % _lbList.length;
  document.getElementById('lb-img').src = _lbList[_lbIndex];
}

// ============================================================================
// VIEW: Workbook (guided learning path)
// ============================================================================
function bookProgress(book) {
  const total = book.chapters.length;
  let done = 0, partial = 0;
  for (const c of book.chapters) {
    const p = state.workbook.completed[c.id];
    if (p && p.readAt && p.quizScore != null) done++;
    else if (p && p.readAt) partial++;
  }
  return { total, done, partial };
}
function ensureWorkbookSelection() {
  const books = getWorkbook();
  if (books.length === 0) return;
  if (!state.workbook.bookId || !getBookById(state.workbook.bookId)) {
    state.workbook.bookId = books[0].id;
    state.workbook.chapterId = null;
    saveState();
  }
}

function renderWorkbook() {
  const books = getWorkbook();
  if (books.length === 0) {
    return `<div class="empty"><div class="emoji">📒</div><div>Workbook not loaded yet.</div></div>`;
  }
  ensureWorkbookSelection();
  const book = getBookById(state.workbook.bookId);

  // If a chapter is selected, render the chapter detail
  if (state.workbook.chapterId) {
    const ch = getChapterById(book.id, state.workbook.chapterId);
    if (!ch) {
      state.workbook.chapterId = null;
      saveState();
      return renderWorkbook();
    }
    return renderWorkbookChapter(book, ch);
  }

  // Else render the book overview (chapter list)
  return renderWorkbookOverview(books, book);
}

function renderWorkbookOverview(books, book) {
  const bookTabs = books.map(b => {
    const p = bookProgress(b);
    return `<button class="subtab ${state.workbook.bookId === b.id ? 'active' : ''}" data-wb-book="${b.id}">
      ${b.icon} ${escapeHtml(b.title.replace(/ for .*$/, ''))} <span class="count">${p.done}/${p.total}</span>
    </button>`;
  }).join('');

  const p = bookProgress(book);
  const pct = p.total > 0 ? Math.round(100 * p.done / p.total) : 0;

  return `
    <div class="page-header">
      <h1>${t('page.workbook.h1')}</h1>
      <p class="page-subtitle">${state.lang === 'de'
        ? `Begleitete Lernpfade — lesen, anschauen, dann selbst prüfen. ${getWorkbook().length} Bücher · ${getWorkbook().reduce((a, b) => a + b.chapters.length, 0)} Kapitel.`
        : `Guided study paths — read, look, then test yourself. ${getWorkbook().length} books · ${getWorkbook().reduce((a, b) => a + b.chapters.length, 0)} chapters.`}</p>
    </div>
    <div class="subtabs">${bookTabs}</div>

    <div class="wb-book-header">
      <div>
        <div class="wb-book-title">${escapeHtml(book.title)}</div>
        <div class="wb-book-subtitle">${escapeHtml(book.subtitle || '')}</div>
      </div>
      <div class="wb-book-stat">
        <div class="wb-book-stat-num tabnum">${p.done}<span class="muted">/${p.total}</span></div>
        <div class="wb-book-stat-label">${state.lang === 'de' ? 'Kapitel abgeschlossen' : 'chapters complete'}</div>
        <div class="progress good"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
    </div>

    <div class="wb-chapter-list">
      ${book.chapters.map((c, i) => {
        const cp = state.workbook.completed[c.id];
        const done = cp && cp.readAt && cp.quizScore != null;
        const partial = cp && cp.readAt && !done;
        const statusBadge = done
          ? `<span class="badge good">✓ ${cp.quizScore}/${cp.quizTotal}</span>`
          : partial
          ? `<span class="badge warn">${state.lang === 'de' ? 'Gelesen · Quiz offen' : 'Read · quiz pending'}</span>`
          : `<span class="badge">${state.lang === 'de' ? 'Noch nicht begonnen' : 'Not started'}</span>`;
        return `
          <button class="wb-chapter-row ${done ? 'done' : ''}" data-wb-open="${c.id}">
            <div class="wb-chapter-num">${String(i + 1).padStart(2, '0')}</div>
            <div class="wb-chapter-info">
              <div class="wb-chapter-title">${escapeHtml(c.title)}</div>
              <div class="wb-chapter-sub">${escapeHtml(c.subtitle || '')}</div>
              <div class="wb-chapter-meta muted">⏱ ${c.estimated_min || 4} min · ${(c.quiz || []).length} ${state.lang === 'de' ? 'Fragen' : 'questions'}</div>
            </div>
            <div class="wb-chapter-status">${statusBadge}</div>
          </button>
        `;
      }).join('')}
    </div>
  `;
}

function renderWorkbookChapter(book, ch) {
  const idx = book.chapters.findIndex(c => c.id === ch.id);
  const prev = idx > 0 ? book.chapters[idx - 1] : null;
  const next = idx < book.chapters.length - 1 ? book.chapters[idx + 1] : null;
  const cp = state.workbook.completed[ch.id] || {};
  const quizDone = cp.quizScore != null;

  // Render sections
  const sectionsHtml = (ch.sections || []).map(s => {
    if (s.kind === 'h2') return `<h2 class="wb-h2">${escapeHtml(s.text)}</h2>`;
    if (s.kind === 'p') return `<p class="wb-p">${escapeHtml(s.text)}</p>`;
    if (s.kind === 'image') {
      // Resolve image to deck path
      const deck = getDeckById(s.deck);
      if (!deck) return '';
      const num = String(s.page).padStart(3, '0');
      const url = `${deck.path}/page-${num}.jpg`;
      return `
        <figure class="wb-figure" data-wb-zoom="${s.deck}|${s.page}">
          <img src="${url}" loading="lazy" alt="${escapeHtml(s.caption || '')}" />
          ${s.caption ? `<figcaption>${escapeHtml(s.caption)}</figcaption>` : ''}
        </figure>
      `;
    }
    if (s.kind === 'callout') {
      return `
        <div class="wb-callout">
          ${s.title ? `<div class="wb-callout-title">${escapeHtml(s.title)}</div>` : ''}
          <ul>${(s.items || []).map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
        </div>
      `;
    }
    return '';
  }).join('');

  const isDE = state.lang === 'de';
  return `
    <div class="wb-detail-header">
      <button class="btn ghost small" data-wb-back>${isDE ? '← Alle Kapitel' : '← All chapters'}</button>
      <div class="wb-detail-meta muted">
        ${book.icon} ${escapeHtml(book.title.replace(/ for .*$/, ''))} · ${isDE ? `Kapitel ${idx + 1} von ${book.chapters.length}` : `Chapter ${idx + 1} of ${book.chapters.length}`}
      </div>
    </div>

    <div class="wb-chapter-detail">
      <h1 class="wb-detail-title">${escapeHtml(ch.title)}</h1>
      ${ch.subtitle ? `<p class="wb-detail-sub">${escapeHtml(ch.subtitle)}</p>` : ''}
      <div class="wb-detail-meta-row">
        <span>⏱ ${ch.estimated_min || 4} ${isDE ? 'Min. Lesezeit' : 'min read'}</span>
        <span>·</span>
        <span>${(ch.quiz || []).length} ${isDE ? 'Quizfragen' : 'quiz questions'}</span>
        ${quizDone ? `<span>·</span><span class="badge good">✓ ${isDE ? `Abgeschlossen (${cp.quizScore}/${cp.quizTotal})` : `Completed (${cp.quizScore}/${cp.quizTotal})`}</span>` : ''}
      </div>

      ${ch.intro ? `<div class="wb-intro">${escapeHtml(ch.intro)}</div>` : ''}

      <div class="wb-body">${sectionsHtml}</div>

      ${renderWorkbookQuiz(book, ch)}

      <div class="wb-nav">
        ${prev ? `<button class="btn" data-wb-open="${prev.id}">← ${escapeHtml(prev.title)}</button>` : '<span></span>'}
        ${next ? `<button class="btn primary" data-wb-open="${next.id}">${escapeHtml(next.title)} →</button>` : `<button class="btn" data-wb-back>${state.lang === 'de' ? 'Alle Kapitel →' : 'All chapters →'}</button>`}
      </div>
    </div>
  `;
}

function renderWorkbookQuiz(book, ch) {
  const cardIds = ch.quiz || [];
  if (cardIds.length === 0) return '';
  const cards = cardIds.map(id => getCardById(id)).filter(Boolean);
  if (cards.length === 0) return '';

  const cp = state.workbook.completed[ch.id] || {};
  const answers = cp.quizAnswers || {};
  const allAnswered = cards.every(c => answers[c.id] != null);

  // Cache choices per chapter once
  const cacheKey = `${ch.id}|${cards.map(c => c.id).join(',')}`;
  if (state.workbook._choicesKey !== cacheKey) {
    state.workbook._choices = {};
    cards.forEach(c => {
      const distractors = distractorsFor(c);
      state.workbook._choices[c.id] = shuffle([c.a_en, ...distractors]);
    });
    state.workbook._choicesKey = cacheKey;
  }

  const right = cards.filter(c => answers[c.id] != null && state.workbook._choices[c.id][answers[c.id]] === c.a_en).length;

  const qsHtml = cards.map((c, i) => {
    const choices = state.workbook._choices[c.id];
    const picked = answers[c.id];
    const markers = ['A', 'B', 'C', 'D'];
    const choiceBtns = choices.map((txt, idx) => {
      let cls = 'choice';
      let icon = '';
      if (picked != null) {
        if (txt === c.a_en) { cls += ' correct'; icon = '✓'; }
        else if (idx === picked) { cls += ' incorrect'; icon = '✗'; }
      }
      return `<button class="${cls}" data-wb-pick="${c.id}|${idx}" ${picked != null ? 'disabled' : ''}>
        <span class="marker">${markers[idx]}</span><span class="ct">${escapeHtml(txt)}</span>${icon ? `<span class="check-icon">${icon}</span>` : ''}
      </button>`;
    }).join('');
    return `
      <div class="wb-q">
        <div class="wb-q-num">${state.lang === 'de' ? `Frage ${i + 1} von ${cards.length}` : `Question ${i + 1} of ${cards.length}`}</div>
        <div class="wb-q-text">${escapeHtml(c.q_en)}</div>
        <div class="choices">${choiceBtns}</div>
        ${picked != null ? `<div class="wb-q-de"><span class="lang-tag">DE</span><span class="ct">${escapeHtml(c.a_de)}</span></div>` : ''}
      </div>
    `;
  }).join('');

  const summary = allAnswered
    ? `<div class="wb-quiz-summary ${right === cards.length ? 'perfect' : right >= cards.length * 0.8 ? 'good' : 'partial'}">
        <div class="wb-quiz-score">${right} / ${cards.length}</div>
        <div class="wb-quiz-label">${right === cards.length ? '🎉 Perfect score!' : right >= cards.length * 0.8 ? '👍 Solid — chapter understood' : '🤔 Worth reviewing the chapter'}</div>
        <div class="wb-quiz-actions">
          <button class="btn primary" data-wb-complete="${ch.id}">${state.lang === 'de' ? 'Kapitel abschliessen' : 'Mark chapter complete'}</button>
          <button class="btn" data-wb-reset-quiz="${ch.id}">${state.lang === 'de' ? 'Quiz erneut versuchen' : 'Try quiz again'}</button>
        </div>
      </div>`
    : '';

  return `
    <div class="wb-quiz">
      <h2 class="wb-h2">${state.lang === 'de' ? 'Verständnis prüfen' : 'Check your understanding'}</h2>
      <div class="muted" style="font-size:13px; margin-bottom:14px;">${state.lang === 'de'
        ? `${cards.length} Fragen aus den ${escapeHtml(book.category)}-Lernkarten.`
        : `${cards.length} questions drawn from the ${escapeHtml(book.category)} flashcards.`}</div>
      ${qsHtml}
      ${summary}
    </div>
  `;
}

function attachWorkbookEvents() {
  document.querySelectorAll('[data-wb-book]').forEach(b => b.onclick = () => {
    state.workbook.bookId = b.dataset.wbBook;
    state.workbook.chapterId = null;
    saveState();
    render();
    window.scrollTo(0, 0);
  });
  document.querySelectorAll('[data-wb-open]').forEach(b => b.onclick = () => {
    state.workbook.chapterId = b.dataset.wbOpen;
    // Mark as read on first open
    const cp = state.workbook.completed[b.dataset.wbOpen] || {};
    if (!cp.readAt) {
      state.workbook.completed[b.dataset.wbOpen] = { ...cp, readAt: Date.now() };
    }
    state.workbook._choicesKey = null;
    saveState();
    render();
    window.scrollTo(0, 0);
  });
  document.querySelectorAll('[data-wb-back]').forEach(b => b.onclick = () => {
    state.workbook.chapterId = null;
    saveState();
    render();
    window.scrollTo(0, 0);
  });
  document.querySelectorAll('[data-wb-zoom]').forEach(b => b.onclick = () => {
    const [deckId, page] = b.dataset.wbZoom.split('|');
    openSlideViewer(deckId, parseInt(page, 10));
  });
  document.querySelectorAll('[data-wb-pick]').forEach(b => b.onclick = () => {
    const [cardId, idxStr] = b.dataset.wbPick.split('|');
    const idx = parseInt(idxStr, 10);
    const chId = state.workbook.chapterId;
    const cp = state.workbook.completed[chId] || { readAt: Date.now() };
    cp.quizAnswers = { ...(cp.quizAnswers || {}), [cardId]: idx };
    state.workbook.completed[chId] = cp;
    // Also feed the SRS system
    const card = getCardById(cardId);
    const choices = state.workbook._choices[cardId];
    if (card && choices) {
      recordSrs(cardId, choices[idx] === card.a_en ? 'good' : 'again');
    }
    saveState();
    render();
  });
  document.querySelectorAll('[data-wb-complete]').forEach(b => b.onclick = () => {
    const chId = b.dataset.wbComplete;
    const book = getBookById(state.workbook.bookId);
    const ch = book.chapters.find(c => c.id === chId);
    const cp = state.workbook.completed[chId] || {};
    const cards = (ch.quiz || []).map(id => getCardById(id)).filter(Boolean);
    const right = cards.filter(c =>
      cp.quizAnswers && cp.quizAnswers[c.id] != null &&
      state.workbook._choices && state.workbook._choices[c.id] &&
      state.workbook._choices[c.id][cp.quizAnswers[c.id]] === c.a_en
    ).length;
    cp.quizScore = right;
    cp.quizTotal = cards.length;
    cp.completedAt = Date.now();
    state.workbook.completed[chId] = cp;
    saveState();
    // Jump to next chapter if any
    const idx = book.chapters.findIndex(c => c.id === chId);
    if (idx < book.chapters.length - 1) {
      state.workbook.chapterId = book.chapters[idx + 1].id;
      const nextCp = state.workbook.completed[state.workbook.chapterId] || {};
      if (!nextCp.readAt) {
        state.workbook.completed[state.workbook.chapterId] = { ...nextCp, readAt: Date.now() };
      }
      state.workbook._choicesKey = null;
      saveState();
    } else {
      state.workbook.chapterId = null;
      saveState();
    }
    render();
    window.scrollTo(0, 0);
  });
  document.querySelectorAll('[data-wb-reset-quiz]').forEach(b => b.onclick = () => {
    const chId = b.dataset.wbResetQuiz;
    const cp = state.workbook.completed[chId] || {};
    cp.quizAnswers = {};
    cp.quizScore = null;
    cp.quizTotal = null;
    state.workbook.completed[chId] = cp;
    state.workbook._choicesKey = null;
    saveState();
    render();
  });
}

// ============================================================================
// VIEW: Slide Decks (Freewings video course)
// ============================================================================
function ensureSlideSelection() {
  const decks = getDecks();
  if (decks.length === 0) return;
  if (!state.slides.deckId || !getDeckById(state.slides.deckId)) {
    state.slides.deckId = decks[0].id;
    state.slides.page = 1;
    saveState();
  }
}

let _slidesQuery = '';
function renderSlides() {
  const decks = getDecks();
  if (decks.length === 0) {
    return `<div class="empty"><div class="emoji">🎬</div><div>${state.lang === 'de' ? 'Keine Foliensätze geladen.' : 'No slide decks loaded.'}</div></div>`;
  }
  ensureSlideSelection();
  const deck = getDeckById(state.slides.deckId);
  const slides = deckSlides(deck);
  const totalPages = slides.length;
  const totalSlides = decks.reduce((acc, d) => acc + deckSlideCount(d), 0);

  // Tabs
  const tabsHtml = `
    <div class="subtabs">
      ${decks.map(d => {
        return `<button class="subtab ${state.slides.deckId === d.id ? 'active' : ''}" data-deck="${d.id}">
          ${d.icon} ${escapeHtml(d.title)} <span class="count">${deckSlideCount(d)}</span>
        </button>`;
      }).join('')}
    </div>
  `;

  // Related flashcards count (by category)
  const relatedCards = cardsForCategory(deck.category);

  // Filter by query
  const q = _slidesQuery.trim().toLowerCase();
  const filtered = q ? slides.filter(s =>
    (s.en_title || '').toLowerCase().includes(q) ||
    (s.en_body || '').toLowerCase().includes(q) ||
    (s.de_title || '').toLowerCase().includes(q) ||
    (s.de_body || '').toLowerCase().includes(q)
  ) : slides;

  // Slide grid
  const slidesHtml = filtered.map(s => {
    const url = slideUrl(deck, s.page);
    const title = s.en_title || s.de_title || '';
    return `
      <button class="slide-thumb" data-open-slide="${deck.id}|${s.page}">
        <img src="${url}" loading="lazy" alt="Slide ${s.page}" />
        <div class="pp-label">${s.page}</div>
        ${title ? `<div class="slide-thumb-title">${escapeHtml(title)}</div>` : ''}
      </button>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>${t('page.slides.h1')}</h1>
      <p class="page-subtitle">${state.lang === 'de'
        ? `Folien aus dem Freewings-Videokurs — ${totalSlides} Folien in ${decks.length} Foliensätzen. EN/DE nebeneinander · für die grosse Ansicht anklicken.`
        : `Freewings video-course slides — ${totalSlides} slides across ${decks.length} decks. EN/DE side-by-side · click any to expand.`}</p>
    </div>
    ${tabsHtml}
    <div class="deck-header">
      <div>
        <div class="deck-title">${escapeHtml(deck.title)}</div>
        <div class="deck-meta">${state.lang === 'de'
          ? `${totalPages} Folien · Instruktor: ${escapeHtml(deck.instructor)} · Verknüpft mit <strong>${escapeHtml(deck.category)}</strong>-Lernkarten (${relatedCards.length} Karten)`
          : `${totalPages} slides · Instructor: ${escapeHtml(deck.instructor)} · Maps to <strong>${escapeHtml(deck.category)}</strong> flashcards (${relatedCards.length} cards)`}</div>
      </div>
      <button class="btn small" data-jump-cards="${deck.category}">${state.lang === 'de' ? `${escapeHtml(deck.category)}-Karten lernen →` : `Study ${escapeHtml(deck.category)} cards →`}</button>
    </div>
    <input class="search-input" id="slides-q" type="search" placeholder="${state.lang === 'de' ? 'Folientitel durchsuchen (EN/DE)…' : 'Search slide titles (EN/DE)…'}" value="${escapeHtml(_slidesQuery)}" />
    ${q ? `<div class="muted" style="margin-bottom:12px; font-size:13px;">${state.lang === 'de' ? `Zeige <strong>${filtered.length}</strong> von ${slides.length}` : `Showing <strong>${filtered.length}</strong> of ${slides.length}`}</div>` : ''}
    <div class="slide-grid">
      ${slidesHtml}
    </div>
  `;
}

function attachSlidesEvents() {
  document.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => {
    state.slides.deckId = b.dataset.deck;
    state.slides.page = 1;
    _slidesQuery = '';
    saveState();
    render();
  });
  document.querySelectorAll('[data-open-slide]').forEach(b => b.onclick = () => {
    const [deckId, page] = b.dataset.openSlide.split('|');
    openSlideViewer(deckId, parseInt(page, 10));
  });
  document.querySelectorAll('[data-jump-cards]').forEach(b => b.onclick = () => {
    state.fc.category = b.dataset.jumpCards;
    state.fc.mode = 'flashcards';
    state.fc.index = 0;
    state.fc.shuffle = false;
    _fcDeck = null;
    _fcReveal = false;
    saveState();
    navigate('flashcards');
  });
  const sq = document.getElementById('slides-q');
  if (sq) {
    sq.oninput = (e) => {
      _slidesQuery = e.target.value;
      render();
      const inp = document.getElementById('slides-q');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(_slidesQuery.length, _slidesQuery.length);
      }
    };
  }
}

// ---- Slide Viewer (replaces lightbox for slides) ----------------------------
let _svDeckId = null, _svPage = 1;
function openSlideViewer(deckId, page) {
  _svDeckId = deckId;
  _svPage = page;
  renderSlideViewer();
  document.getElementById('slide-viewer').classList.add('show');
}
function closeSlideViewer() {
  document.getElementById('slide-viewer').classList.remove('show');
}
function slideViewerNav(d) {
  const deck = getDeckById(_svDeckId);
  if (!deck) return;
  const slides = deckSlides(deck);
  const idx = slides.findIndex(s => s.page === _svPage);
  const nextIdx = (idx + d + slides.length) % slides.length;
  _svPage = slides[nextIdx].page;
  renderSlideViewer();
}
function renderSlideViewer() {
  const deck = getDeckById(_svDeckId);
  if (!deck) return;
  const slides = deckSlides(deck);
  const slide = slides.find(s => s.page === _svPage) || slides[0];
  const idx = slides.indexOf(slide);
  const url = slideUrl(deck, slide.page);
  const root = document.getElementById('slide-viewer-content');
  const hasTrans = !!(slide.en_title || slide.en_body || slide.de_title || slide.de_body);
  root.innerHTML = `
    <button class="sv-close" id="sv-close">${state.lang === 'de' ? 'Schliessen ✕' : 'Close ✕'}</button>
    <div class="sv-image-wrap">
      <button class="sv-nav prev" id="sv-prev" aria-label="Previous">‹</button>
      <img class="sv-image" src="${url}" alt="Slide ${slide.page}" />
      <button class="sv-nav next" id="sv-next" aria-label="Next">›</button>
    </div>
    <div class="sv-panel">
      <div class="sv-meta">
        <span class="sv-deck">${deck.icon} ${escapeHtml(deck.title)}</span>
        <span class="sv-counter tabnum">${idx + 1} / ${slides.length}</span>
      </div>
      ${hasTrans ? `
        <div class="sv-lang">
          <div class="sv-lang-label">English</div>
          ${slide.en_title ? `<div class="sv-title">${escapeHtml(slide.en_title)}</div>` : ''}
          ${slide.en_body ? `<div class="sv-body">${escapeHtml(slide.en_body)}</div>` : ''}
        </div>
        <div class="sv-lang sv-lang-de">
          <div class="sv-lang-label">Deutsch</div>
          ${slide.de_title ? `<div class="sv-title">${escapeHtml(slide.de_title)}</div>` : ''}
          ${slide.de_body ? `<div class="sv-body">${escapeHtml(slide.de_body)}</div>` : ''}
        </div>
      ` : `<div class="muted" style="font-size:13px;">${state.lang === 'de' ? 'Kein Transkript für diese Folie — das Diagramm spricht für sich.' : 'No transcript available for this slide — the diagram speaks for itself.'}</div>`}
    </div>
  `;
  document.getElementById('sv-close').onclick = closeSlideViewer;
  document.getElementById('sv-prev').onclick = () => slideViewerNav(-1);
  document.getElementById('sv-next').onclick = () => slideViewerNav(1);
}

// ============================================================================
// VIEW: Videos (Freewings) — embedded player + bilingual transcript
// ============================================================================
// VTT strings are inlined into the build (window.VIDEO_VTT[videoId][lang])
// and converted to blob URLs at runtime so <track> can load them.
const _vttBlobUrls = {};
function vttBlobUrl(videoId, lang) {
  const key = `${videoId}|${lang}`;
  if (_vttBlobUrls[key]) return _vttBlobUrls[key];
  const store = window.VIDEO_VTT || {};
  const text = store[videoId] && store[videoId][lang];
  if (!text) return null;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/vtt' }));
  _vttBlobUrls[key] = url;
  return url;
}

function fmtClock(seconds) {
  if (!Number.isFinite(seconds)) return '';
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
           : `${m}:${String(ss).padStart(2, '0')}`;
}

function ensureVideoSelection() {
  const decks = getVideoDecks();
  if (decks.length === 0) return;
  if (!decks.find(d => d.id === state.videos.deckId)) {
    state.videos.deckId = decks[0].id;
  }
}

function renderVideos() {
  const decks = getVideoDecks();
  if (decks.length === 0) {
    return `<div class="empty"><div class="emoji">📺</div><div>${state.lang === 'de' ? 'Keine Videos geladen.' : 'No videos loaded.'}</div></div>`;
  }
  ensureVideoSelection();
  const deck = getVideoDeck(state.videos.deckId);
  const total = getAllVideos().length;
  const withSubs = getAllVideos().filter(v => v.has_en_vtt).length;
  const withDe = getAllVideos().filter(v => v.has_de_vtt).length;
  const stats = (getVideoManifest().stats) || {};
  const fwCount = stats.by_provider?.freewings || 0;
  const aaCount = stats.by_provider?.airactive || 0;

  const tabsHtml = `
    <div class="subtabs">
      ${decks.map(d => `
        <button class="subtab ${state.videos.deckId === d.id ? 'active' : ''}" data-video-deck="${d.id}">
          ${d.icon} ${escapeHtml(d.title)} <span class="count">${d.videos.length}</span>
        </button>
      `).join('')}
    </div>
  `;

  const cardsHtml = deck.videos.map(v => {
    const enReady = v.has_en_vtt;
    const deReady = v.has_de_vtt;
    const providerClass = v.provider === 'airactive' ? 'chip-aa' : 'chip-fw';
    const posterStyle = v.poster
      ? `style="background-image: url('${v.poster.replace(/'/g, '%27')}'); background-size: cover; background-position: center;"`
      : '';
    return `
      <div class="video-card">
        <button class="video-card-thumb" data-play-video="${v.id}" aria-label="Play ${escapeHtml(v.title)}" ${posterStyle}>
          <div class="video-card-thumb-inner">
            <div class="video-card-play">▶</div>
            ${v.duration_label ? `<div class="video-card-duration">${v.duration_label}</div>` : ''}
          </div>
        </button>
        <div class="video-card-body">
          <div class="video-card-title">${escapeHtml(v.title)}</div>
          <div class="video-card-meta">
            <span class="chip ${providerClass}" title="${state.lang === 'de' ? `Quelle: ${escapeHtml(v.provider_label)}` : `Source: ${escapeHtml(v.provider_label)}`}">${escapeHtml(v.provider_label)}</span>
            ${enReady
              ? `<span class="chip chip-good" title="${state.lang === 'de' ? 'Englische Untertitel bereit' : 'English subtitles ready'}">🇬🇧 EN subs</span>`
              : `<span class="chip chip-warn" title="${state.lang === 'de' ? 'Übersetzung ausstehend' : 'Translation pending'}">🇬🇧 EN — ${state.lang === 'de' ? 'ausstehend' : 'pending'}</span>`}
            ${deReady
              ? `<span class="chip" title="${state.lang === 'de' ? 'Deutsches Transkript bereit' : 'German transcript ready'}">🇩🇪 DE ${state.lang === 'de' ? 'Transkript' : 'transcript'}</span>`
              : `<span class="chip chip-warn" title="${state.lang === 'de' ? 'Transkription läuft' : 'Transcription pending'}">🇩🇪 DE — ${state.lang === 'de' ? 'wird transkribiert' : 'transcribing'}</span>`}
          </div>
          <div class="video-card-actions">
            <button class="btn small primary" data-play-video="${v.id}">${state.lang === 'de' ? 'Mit Untertiteln ansehen' : 'Watch with subtitles'}</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="page-header">
      <h1>${t('page.videos.h1')}</h1>
      <p class="page-subtitle">${state.lang === 'de'
        ? `${total} Videos von <strong>Free Wings</strong> (${fwCount}) und <strong>Air Active</strong> (${aaCount}) · ${withDe} deutsche Transkripte · ${withSubs} englische Untertitel. Der Player wählt automatisch die englischen Untertitel; die Sprache lässt sich unten am Player umschalten.`
        : `${total} videos from <strong>Free Wings</strong> (${fwCount}) and <strong>Air Active</strong> (${aaCount}) academies · ${withDe} German transcripts · ${withSubs} English subtitle tracks. Player auto-selects English subs; toggle the language with the buttons below the video.`}</p>
    </div>
    ${tabsHtml}
    <div class="deck-header">
      <div>
        <div class="deck-title">${deck.icon} ${escapeHtml(deck.title)}</div>
        <div class="deck-meta">${deck.videos.length} videos · MP4 streamed from Free Wings · subtitles served locally</div>
      </div>
    </div>
    <div class="video-grid">
      ${cardsHtml}
    </div>
  `;
}

function attachVideosEvents() {
  document.querySelectorAll('[data-video-deck]').forEach(b => b.onclick = () => {
    state.videos.deckId = b.dataset.videoDeck;
    saveState();
    render();
  });
  document.querySelectorAll('[data-play-video]').forEach(b => b.onclick = () => {
    openVideoPlayer(b.dataset.playVideo);
  });
}

// ---- Video Player overlay ---------------------------------------------------
let _vpVideoId = null;
let _vpCues = [];           // parsed cues for the bilingual transcript panel
let _vpCueIdxByLang = { en: [], de: [] };

function openVideoPlayer(videoId) {
  _vpVideoId = videoId;
  state.videos.openId = videoId;
  saveState();
  renderVideoPlayer();
  document.getElementById('video-player').classList.add('show');
}

function closeVideoPlayer() {
  document.getElementById('video-player').classList.remove('show');
  // pause + free the <video> by clearing innerHTML on the host
  const host = document.getElementById('video-player-content');
  if (host) host.innerHTML = '';
  _vpVideoId = null;
  state.videos.openId = null;
  _vpCues = [];
  saveState();
}

function parseVtt(text) {
  // Minimal VTT cue parser → [{start, end, text}]
  if (!text) return [];
  const out = [];
  const blocks = text.replace(/\r/g, '').split('\n\n');
  for (const blk of blocks) {
    const lines = blk.split('\n').filter(Boolean);
    if (lines.length === 0) continue;
    const tsIdx = lines.findIndex(l => l.includes('-->'));
    if (tsIdx === -1) continue;
    const m = lines[tsIdx].match(/(\d+:)?(\d+):(\d+\.\d+)\s*-->\s*(\d+:)?(\d+):(\d+\.\d+)/);
    if (!m) continue;
    const toSec = (h, mm, ss) => (parseInt(h || '0', 10) * 3600) + (parseInt(mm, 10) * 60) + parseFloat(ss);
    const start = toSec((m[1] || '').replace(':', ''), m[2], m[3]);
    const end = toSec((m[4] || '').replace(':', ''), m[5], m[6]);
    const text = lines.slice(tsIdx + 1).join(' ').trim();
    if (text) out.push({ start, end, text });
  }
  return out;
}

function renderVideoPlayer() {
  const v = getVideoById(_vpVideoId);
  const host = document.getElementById('video-player-content');
  if (!v || !host) return;

  const enUrl = vttBlobUrl(v.id, 'en');
  const deUrl = vttBlobUrl(v.id, 'de');

  // Prefer EN if available, else DE, else state preference
  let initialLang = state.videos.lang || 'en';
  if (initialLang === 'en' && !enUrl) initialLang = deUrl ? 'de' : 'en';

  // Parse cues for the transcript panel
  const store = window.VIDEO_VTT || {};
  const enCues = parseVtt(store[v.id] && store[v.id].en);
  const deCues = parseVtt(store[v.id] && store[v.id].de);

  // Decide which cue list drives the side-by-side transcript:
  // EN if available, otherwise DE. We align by index since both come from the
  // same Whisper segmentation.
  const primary = enCues.length ? enCues : deCues;
  _vpCues = primary;
  _vpCueIdxByLang = { en: enCues, de: deCues };

  const transcriptHtml = primary.length
    ? primary.map((c, i) => {
        const en = enCues[i]?.text || '';
        const de = deCues[i]?.text || '';
        return `
          <li class="vp-cue" data-cue-idx="${i}" data-cue-start="${c.start.toFixed(2)}">
            <button class="vp-cue-time tabnum" data-cue-seek="${c.start.toFixed(2)}">${fmtClock(c.start)}</button>
            <div class="vp-cue-text">
              ${en ? `<div class="vp-cue-en">${escapeHtml(en)}</div>` : ''}
              ${de ? `<div class="vp-cue-de">${escapeHtml(de)}</div>` : ''}
            </div>
          </li>
        `;
      }).join('')
    : `<li class="muted" style="padding:16px;">${state.lang === 'de' ? 'Transkript wird noch aufbereitet — bald wieder vorbeischauen.' : 'Transcript still processing — check back shortly.'}</li>`;

  host.innerHTML = `
    <div class="vp-header">
      <div>
        <div class="vp-title">${v.deck_icon || '🎬'} ${escapeHtml(v.title)}</div>
        <div class="vp-sub muted">${v.duration_label || ''} · ${state.lang === 'de' ? 'MP4 von' : 'MP4 from'} ${escapeHtml(v.provider_label || 'source')} · ${state.lang === 'de' ? 'Untertitel für diese App lokalisiert' : 'Subtitles localized for this app'}</div>
      </div>
      <button class="vp-close" id="vp-close">${state.lang === 'de' ? 'Schliessen ✕' : 'Close ✕'}</button>
    </div>
    <div class="vp-body">
      <div class="vp-video-wrap">
        <video id="vp-video" controls crossorigin="anonymous" preload="metadata" playsinline>
          <source src="${v.mp4_url}" type="video/mp4" />
          ${enUrl ? `<track id="vp-track-en" kind="subtitles" label="English" srclang="en" src="${enUrl}" ${initialLang === 'en' ? 'default' : ''} />` : ''}
          ${deUrl ? `<track id="vp-track-de" kind="subtitles" label="Deutsch" srclang="de" src="${deUrl}" ${initialLang === 'de' ? 'default' : ''} />` : ''}
        </video>
        <div class="vp-controls">
          <span class="vp-lang-label">${state.lang === 'de' ? 'Untertitel:' : 'Subtitles:'}</span>
          ${enUrl ? `<button class="vp-lang-btn ${initialLang === 'en' ? 'active' : ''}" data-vp-lang="en">🇬🇧 English</button>` : ''}
          ${deUrl ? `<button class="vp-lang-btn ${initialLang === 'de' ? 'active' : ''}" data-vp-lang="de">🇩🇪 Deutsch</button>` : ''}
          <button class="vp-lang-btn" data-vp-lang="off">${state.lang === 'de' ? 'Aus' : 'Off'}</button>
        </div>
      </div>
      <aside class="vp-transcript">
        <div class="vp-transcript-head">
          <div class="vp-transcript-title">Transcript</div>
          <div class="vp-transcript-sub muted">EN over DE · click a timestamp to jump</div>
        </div>
        <ol class="vp-cue-list" id="vp-cue-list">${transcriptHtml}</ol>
      </aside>
    </div>
  `;

  const video = document.getElementById('vp-video');
  // Force the initial subtitle selection (some browsers ignore `default`)
  video.addEventListener('loadedmetadata', () => setSubtitleLang(initialLang), { once: true });

  // Highlight + auto-scroll active cue
  let lastActive = -1;
  video.addEventListener('timeupdate', () => {
    const t = video.currentTime;
    // Binary search-ish: cues are time-ordered
    let idx = -1;
    for (let i = 0; i < _vpCues.length; i++) {
      if (t >= _vpCues[i].start && t <= _vpCues[i].end) { idx = i; break; }
      if (_vpCues[i].start > t) { idx = Math.max(0, i - 1); break; }
    }
    if (idx !== lastActive) {
      const list = document.getElementById('vp-cue-list');
      if (!list) return;
      const old = list.querySelector('.vp-cue.active');
      if (old) old.classList.remove('active');
      const next = list.querySelector(`.vp-cue[data-cue-idx="${idx}"]`);
      if (next) {
        next.classList.add('active');
        // gentle auto-scroll only when near the bottom of viewport
        const r = next.getBoundingClientRect();
        const lr = list.getBoundingClientRect();
        if (r.top < lr.top + 40 || r.bottom > lr.bottom - 40) {
          next.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      lastActive = idx;
    }
  });

  document.getElementById('vp-close').onclick = closeVideoPlayer;
  document.querySelectorAll('[data-vp-lang]').forEach(b => b.onclick = () => {
    const lang = b.dataset.vpLang;
    setSubtitleLang(lang);
    state.videos.lang = lang === 'off' ? state.videos.lang : lang;
    saveState();
    document.querySelectorAll('[data-vp-lang]').forEach(x => x.classList.toggle('active', x.dataset.vpLang === lang));
  });
  document.querySelectorAll('[data-cue-seek]').forEach(b => b.onclick = () => {
    const video = document.getElementById('vp-video');
    if (video) {
      video.currentTime = parseFloat(b.dataset.cueSeek);
      video.play().catch(() => {});
    }
  });
}

function setSubtitleLang(lang) {
  const video = document.getElementById('vp-video');
  if (!video) return;
  for (const t of video.textTracks) {
    if (lang === 'off') {
      t.mode = 'disabled';
    } else {
      t.mode = (t.language === lang) ? 'showing' : 'disabled';
    }
  }
}

// ============================================================================
// VIEW: Cheat Sheet
// ============================================================================
function renderCheatsheet() {
  const isDE = state.lang === 'de';
  const sections = isDE ? [
    {
      title: 'Standardatmosphäre (ISA)',
      icon: '🌡️',
      rows: [
        ['Druck auf Meereshöhe', '1013,25 hPa'],
        ['Temperatur auf Meereshöhe', '15 °C'],
        ['Temperaturgradient', '6,5 °C / 1000 m'],
        ['1 hPa ≈', '8,3 m / 27 ft'],
        ['Luftdichte halbiert sich bei', '6600 m AMSL'],
        ['Luftdruck halbiert sich bei', '5500 m AMSL']
      ]
    },
    {
      title: 'Einheiten umrechnen',
      icon: '🔢',
      rows: [
        ['FL × 30', '≈ Meter'],
        ['FL × 100', '= Fuss'],
        ['1 m', '3,28 ft'],
        ['1 km/h', '0,54 kt'],
        ['1 m/s × 3,6', '= km/h'],
        ['1 ft', '30,5 cm']
      ]
    },
    {
      title: 'Schweizer Lufträume — Obergrenzen',
      icon: '🗺️',
      rows: [
        ['G (unkontrolliert)', 'GND → 600 m AGL'],
        ['E Mittelland/Jura', '600 AGL → FL100 (3050 m)'],
        ['E Alpen MIL-ON', '600 AGL → FL130 (3950 m)'],
        ['E Alpen MIL-OFF', '600 AGL → FL150 (4550 m)'],
        ['C über E', 'bis FL195 (5900 m)']
      ],
      note: 'Glider Map (GLDK) erscheint jedes Jahr im März neu.'
    },
    {
      title: 'Sicht und Wolkenabstand',
      icon: '☁️',
      rows: [
        ['Unter 300 AGL', '1,5 km Sicht, wolkenfrei'],
        ['300 AGL – FL100 (Klasse E/G)', '5 km Sicht · 1500 m H · 300 m V'],
        ['Über FL100 (Klasse E)', '8 km Sicht · 1500 m H · 300 m V'],
        ['LSR für Segelflieger (März–Okt)', '5–8 km Sicht · 100 m H · 50 m V']
      ]
    },
    {
      title: 'MIL-ON-Zeiten (Mo–Fr)',
      icon: '⏰',
      rows: [
        ['Vormittag', '07:30 – 12:05 LT'],
        ['Nachmittag', '13:15 – 17:05 LT'],
        ['Obergrenze MIL-ON', 'FL130 (3950 m)'],
        ['Obergrenze MIL-OFF', 'FL150 (4550 m)']
      ],
      note: 'Wochenenden und Schweizer Feiertage = MIL-OFF.'
    },
    {
      title: 'Funkfrequenzen',
      icon: '📻',
      rows: [
        ['Notfall / Rega', '161,300 MHz'],
        ['Gleitschirm zu Gleitschirm', '130,930 MHz'],
        ['Gleitschirm-Ausbildung', '123,430 MHz'],
        ['Flugfunkband', '118,000 – 136,975 MHz']
      ]
    },
    {
      title: 'Versicherung und Dokumente',
      icon: '📋',
      rows: [
        ['Haftpflicht Solopilot mindestens', 'CHF 1\'000\'000'],
        ['Tandempassagier', 'CHF 5\'000\'000'],
        ['Max. Lücke Theorie ↔ Praxis', '36 Monate'],
        ['Frühestens Wiederholung', '12 Tage'],
        ['Frist für Einsprache', '30 Tage']
      ]
    },
    {
      title: 'Gefahren: Föhn-Warnzeichen',
      icon: '💨',
      rows: [
        ['Druckdifferenz Lugano–Zürich', '≥ 4 hPa → Föhn erwarten'],
        ['Himmel', 'Tiefblau, ungewöhnlich klar'],
        ['Ferne Berge', 'Wolkenverhangen'],
        ['Wolken', 'Lenticularis an/hinter den Gipfeln'],
        ['Wind', 'Variabel / auffrischender SW-Wind']
      ]
    },
    {
      title: 'Polare — wichtige Punkte',
      icon: '📈',
      rows: [
        ['Trimm (Hände hoch)', 'BESTES GLEITEN'],
        ['20–30 % Bremse', 'GERINGSTES SINKEN'],
        ['Voll gebremst', 'STRÖMUNGSABRISS'],
        ['Beschleuniger', 'Bei Gegenwind / Absinken'],
        ['Leicht gebremst', 'Bei Rückenwind / Steigen']
      ]
    },
    {
      title: 'Schirm-Zertifizierung (EN)',
      icon: '🪂',
      rows: [
        ['A', 'Schulschirm — selbstständige Stabilität'],
        ['B', 'Schirm der meisten Pilotinnen'],
        ['C', 'Mittelklasse, aktives Fliegen nötig'],
        ['D', 'Fortgeschritten / acro-tauglich']
      ],
      note: 'EN-Tests: 8 g Stosslast Minimum (echte Schirme 12–16 g).'
    },
    {
      title: 'Aerodynamik-Faustregeln',
      icon: '📐',
      rows: [
        ['Widerstand ∝ v²', 'Geschwindigkeit verdoppeln → 4× Widerstand'],
        ['Widerstand ∝ Fläche', 'linear'],
        ['Widerstand ∝ Luftdichte', 'linear'],
        ['Luftdichte bei 1100/2200/3300/4400 m', '90/80/70/60 % von MSL'],
        ['Lastvielfaches bei 70° Schräglage', '≈ 3 g'],
        ['Abrissgeschwindigkeit × √(Lastvielfaches)', 'in der Kurve']
      ]
    },
    {
      title: 'Aggregatzustandsänderungen (Energie)',
      icon: '💧',
      rows: [
        ['Schmelzen (fest → flüssig)', 'NIMMT Wärme AUF'],
        ['Verdunsten (flüssig → gasförmig)', 'NIMMT Wärme AUF'],
        ['Kondensieren (gasförmig → flüssig)', 'GIBT Wärme AB'],
        ['Gefrieren (flüssig → fest)', 'GIBT Wärme AB']
      ]
    },
    {
      title: '5-Punkte-Vorflugcheck',
      icon: '✅',
      rows: [
        ['1', 'Gurtzeug und persönliche Ausrüstung'],
        ['2', 'Tragegurte / Leinen frei'],
        ['3', 'Eintrittskante des Schirms offen'],
        ['4', 'Windrichtung und -stärke'],
        ['5', 'Startplatz und Luftraum frei']
      ]
    },
    {
      title: 'Notfallhandeln: Schock',
      icon: '🆘',
      rows: [
        ['Zeichen', 'Blass, blaue Lippen, kalter Schweiss, schwacher schneller Puls'],
        ['Lagerung', 'So bequem wie möglich'],
        ['Schützen', 'Vor Witterung'],
        ['NICHT geben', 'Keine Getränke, keine Nahrung']
      ],
      note: 'Rega alarmieren: 1414 (schweizweit) oder Funk 161,300 MHz.'
    },
    {
      title: 'Nützliche Kartensymbole',
      icon: '🧭',
      rows: [
        ['Heliport', 'Violetter Kreis + H · 2,5 km Radius'],
        ['Ziviler Flugplatz', 'Violetter Kreis + Strich · 5 km'],
        ['MIL+Zivil', 'Violette Doppelkreise · 5 km'],
        ['Militär', 'ROTE Doppelkreise · 5 km'],
        ['Mindestüberflughöhe', '600 m über Bezugspunkt']
      ]
    },
    {
      title: 'Abkürzungs-Dump',
      icon: '🔤',
      rows: [
        ['AGL / AMSL', 'Über Grund / über Meereshöhe'],
        ['VFR / IFR', 'Sicht- / Instrumentenflugregeln'],
        ['FL', 'Flugfläche (×30 ≈ m)'],
        ['CTR / TMA', 'Kontrollzone / Nahkontrollbezirk'],
        ['AWY / FIZ / RMZ', 'Luftstrasse / Fluginformationszone / Funkpflichtzone'],
        ['LS-R / LS-D / LS-P', 'Restricted / Danger / Prohibited'],
        ['BAZL / OFAC', 'Bundesamt für Zivilluftfahrt'],
        ['SHV / FSVL', 'Schweizerischer Hängegleiter Verband'],
        ['VLK / OACS', 'Verordnung über Luftfahrzeuge besonderer Kategorien'],
        ['NOTAM', 'Notice to Airmen'],
        ['DABS', 'Daily Airspace Bulletin Switzerland'],
        ['QNH', 'Druckeinstellung auf Meereshöhe'],
        ['ISA', 'Internationale Standardatmosphäre'],
        ['EN-A / B / C / D', 'Zertifizierungsklasse Schirm']
      ]
    }
  ] : [
    {
      title: 'Standard atmosphere (ISA)',
      icon: '🌡️',
      rows: [
        ['Sea-level pressure', '1013.25 hPa'],
        ['Sea-level temperature', '15 °C'],
        ['Lapse rate', '6.5 °C / 1000 m'],
        ['1 hPa ≈', '8.3 m / 27 ft'],
        ['Density halves at', '6600 m AMSL'],
        ['Pressure halves at', '5500 m AMSL']
      ]
    },
    {
      title: 'Unit conversions',
      icon: '🔢',
      rows: [
        ['FL × 30', '≈ meters'],
        ['FL × 100', '= feet'],
        ['1 m', '3.28 ft'],
        ['1 km/h', '0.54 kt'],
        ['1 m/s × 3.6', '= km/h'],
        ['1 ft', '30.5 cm']
      ]
    },
    {
      title: 'Swiss airspace ceilings',
      icon: '🗺️',
      rows: [
        ['G (uncontrolled)', 'GND → 600 m AGL'],
        ['E Mittelland/Jura', '600 AGL → FL100 (3050 m)'],
        ['E Alps MIL-ON', '600 AGL → FL130 (3950 m)'],
        ['E Alps MIL-OFF', '600 AGL → FL150 (4550 m)'],
        ['C above E', 'up to FL195 (5900 m)']
      ],
      note: 'Glider Map (GLDK) new every March.'
    },
    {
      title: 'Visibility & cloud clearance',
      icon: '☁️',
      rows: [
        ['Below 300 AGL', '1.5 km vis, clear of cloud'],
        ['300 AGL – FL100 (Class E/G)', '5 km vis · 1500 m H · 300 m V'],
        ['Above FL100 (Class E)', '8 km vis · 1500 m H · 300 m V'],
        ['LSR for gliders (Mar–Oct)', '5–8 km vis · 100 m H · 50 m V']
      ]
    },
    {
      title: 'MIL-ON times (Mon–Fri)',
      icon: '⏰',
      rows: [
        ['Morning', '07:30 – 12:05 LT'],
        ['Afternoon', '13:15 – 17:05 LT'],
        ['Ceiling MIL-ON', 'FL130 (3950 m)'],
        ['Ceiling MIL-OFF', 'FL150 (4550 m)']
      ],
      note: 'Weekends & Swiss public holidays = MIL-OFF.'
    },
    {
      title: 'Radio frequencies',
      icon: '📻',
      rows: [
        ['Emergency / Rega', '161.300 MHz'],
        ['Glider–glider air-to-air', '130.930 MHz'],
        ['Hang-glider training', '123.430 MHz'],
        ['Aviation band', '118.000 – 136.975 MHz']
      ]
    },
    {
      title: 'Insurance & docs',
      icon: '📋',
      rows: [
        ['Solo liability minimum', 'CHF 1 million'],
        ['Tandem passenger', 'CHF 5 million'],
        ['Theory ↔ practical max gap', '36 months'],
        ['Re-sit minimum gap', '12 days'],
        ['Appeal deadline', '30 days']
      ]
    },
    {
      title: 'Hazards: Föhn warning signs',
      icon: '💨',
      rows: [
        ['Pressure diff Lugano–Zürich', '≥ 4 hPa → expect Föhn'],
        ['Sky', 'Deep blue, abnormally clear'],
        ['Distant mountains', 'Cloud-veiled'],
        ['Clouds', 'Lenticularis at/behind peaks'],
        ['Wind', 'Variable / freshening SW']
      ]
    },
    {
      title: 'Polar curve key points',
      icon: '📈',
      rows: [
        ['Trim speed (hands up)', 'BEST GLIDE'],
        ['20–30% brake', 'MINIMUM SINK'],
        ['Full brake', 'STALL POINT'],
        ['Speed bar', 'For headwind / sink'],
        ['Light brake', 'For tailwind / lift']
      ]
    },
    {
      title: 'Wing certification (EN)',
      icon: '🪂',
      rows: [
        ['A', 'School wing — auto-recovery'],
        ['B', 'Most pilots fly these'],
        ['C', 'Intermediate, pilot input needed'],
        ['D', 'Advanced / acro-tolerant']
      ],
      note: 'EN tests: 8 G shock load minimum (real wings 12-16 G).'
    },
    {
      title: 'Aerodynamics shortcuts',
      icon: '📐',
      rows: [
        ['Drag ∝ v²', 'Double speed → 4× drag'],
        ['Drag ∝ area', 'Linear'],
        ['Drag ∝ density', 'Linear'],
        ['Density at 1100/2200/3300/4400 m', '90/80/70/60% of MSL'],
        ['Load factor at 70° bank', '≈ 3 G'],
        ['Stall speed × √(load factor)', 'In turns']
      ]
    },
    {
      title: 'Phase changes (energy)',
      icon: '💧',
      rows: [
        ['Melting (solid → liquid)', 'ABSORBS heat'],
        ['Evaporation (liquid → gas)', 'ABSORBS heat'],
        ['Condensation (gas → liquid)', 'RELEASES heat'],
        ['Freezing (liquid → solid)', 'RELEASES heat']
      ]
    },
    {
      title: '5-Point pre-launch check',
      icon: '✅',
      rows: [
        ['1', 'Harness & personal gear'],
        ['2', 'Risers / lines free'],
        ['3', 'Wing leading edge open'],
        ['4', 'Wind direction & strength'],
        ['5', 'Takeoff & airspace clear']
      ]
    },
    {
      title: 'Emergency action: shock',
      icon: '🆘',
      rows: [
        ['Signs', 'Pale, blue lips, cold sweat, weak fast pulse'],
        ['Position', 'As comfortable as possible'],
        ['Protect', 'From weather'],
        ['Do NOT', 'Give drinks or food']
      ],
      note: 'Call Rega: 1414 (Swiss-wide) or 161.300 MHz radio.'
    },
    {
      title: 'Useful map symbols',
      icon: '🧭',
      rows: [
        ['Heliport', 'Violet circle + H · 2.5 km radius'],
        ['Civil airfield', 'Violet circle + line · 5 km'],
        ['MIL+Civil', 'Violet two circles · 5 km'],
        ['Military', 'RED two circles · 5 km'],
        ['Overflight min altitude', '600 m above ref point']
      ]
    },
    {
      title: 'Acronym dump',
      icon: '🔤',
      rows: [
        ['AGL / AMSL', 'Above Ground / Mean Sea Level'],
        ['VFR / IFR', 'Visual / Instrument Flight Rules'],
        ['FL', 'Flight Level (×30 ≈ m)'],
        ['CTR / TMA', 'Control Zone / Terminal Area'],
        ['AWY / FIZ / RMZ', 'Airway / Flight Info Zone / Radio Mandatory'],
        ['LS-R / LS-D / LS-P', 'Restricted / Danger / Prohibited'],
        ['BAZL / OFAC', 'Federal Office of Civil Aviation'],
        ['SHV / FSVL', 'Swiss Hang Gliding Federation'],
        ['VLK / OACS', 'Special-Category Aircraft Ordinance'],
        ['NOTAM', 'Notice to Airmen'],
        ['DABS', 'Daily Airspace Bulletin Switzerland'],
        ['QNH', 'Sea-level pressure setting'],
        ['ISA', 'International Standard Atmosphere'],
        ['EN-A / B / C / D', 'Glider certification class']
      ]
    }
  ];

  return `
    <div class="page-header">
      <h1>${t('page.cheatsheet.h1')}</h1>
      <p class="page-subtitle">${isDE ? 'Pflichtwissen auf einer Seite. Druckfreundlich · für den Prüfungsmorgen.' : 'Must-memorize facts in one place. Print-friendly · use on test day morning.'}</p>
    </div>
    <div class="cheat-grid">
      ${sections.map(s => `
        <div class="cheat-card">
          <h3><span class="icon">${s.icon}</span>${escapeHtml(s.title)}</h3>
          ${s.rows.map(([k, v]) => `<div class="cheat-row"><span class="cheat-key">${escapeHtml(k)}</span><span class="cheat-value">${escapeHtml(v)}</span></div>`).join('')}
          ${s.note ? `<div class="cheat-note">${escapeHtml(s.note)}</div>` : ''}
        </div>
      `).join('')}
    </div>
    <div class="row" style="margin-top:24px; justify-content:center;">
      <button class="btn" onclick="window.print()">${isDE ? '🖨️ Spickzettel drucken' : '🖨️ Print cheat sheet'}</button>
    </div>
  `;
}

// ============================================================================
// VIEW: Tips & Strategy
// ============================================================================
function renderTips() {
  const isDE = state.lang === 'de';
  return `
    <div class="page-header">
      <h1>${t('page.tips.h1')}</h1>
      <p class="page-subtitle">${isDE ? 'Recherchierte Ratschläge für die SHV/FSVL-Theorieprüfung.' : 'Research-backed advice for the SHV/FSVL theory exam.'}</p>
    </div>
    <div class="tips-content">
      ${renderMarkdown(getTipsMd())}
    </div>
  `;
}

// ============================================================================
// Main render
// ============================================================================
function render() {
  applyTheme();
  // sidebar
  const sb = document.getElementById('sidebar-nav');
  const navItems = [
    { id: 'dashboard',  icon: '📊', label: t('nav.dashboard') },
    { id: 'quickquiz',  icon: '🎲', label: t('nav.quickquiz') },
    { id: 'workbook',   icon: '📒', label: t('nav.workbook'), badge: getWorkbook().reduce((a, b) => a + b.chapters.length, 0) || null },
    { id: 'shv-exam',   icon: '🎯', label: t('nav.shv-exam'), badge: Object.keys(getSHVQuestions() || {}).length || null },
    { id: 'shv-browse', icon: '🗂️', label: t('nav.shv-browse'), badge: Object.keys(getSHVQuestions() || {}).length || null },
    { id: 'guide',      icon: '📚', label: t('nav.guide') },
    { id: 'slides',     icon: '🎬', label: t('nav.slides'), badge: getDecks().reduce((a, d) => a + deckSlideCount(d), 0) || null },
    { id: 'videos',     icon: '📺', label: t('nav.videos'), badge: getAllVideos().length || null },
    { id: 'cheatsheet', icon: '⚡', label: t('nav.cheatsheet') },
    { id: 'tips',       icon: '💡', label: t('nav.tips') }
  ];
  // Superseded by the official SHV question pool — kept around but tucked into a
  // collapsible 'Legacy' group so they no longer compete with SHV Practice.
  const legacyItems = [
    { id: 'flashcards', icon: '📇', label: t('nav.flashcards') },
    { id: 'quiz',       icon: '📝', label: t('nav.quiz') },
    { id: 'exam',       icon: '⏱️', label: t('nav.exam') }
  ];
  const renderNavItem = n => `
    <button class="nav-item ${state.view === n.id ? 'active' : ''}" data-nav="${n.id}">
      <span class="nav-icon">${n.icon}</span>
      <span>${n.label}</span>
      ${n.badge ? `<span class="nav-badge">${n.badge}</span>` : ''}
    </button>
  `;
  const navHtml = navItems.map(renderNavItem).join('');
  const legacyHtml = `
    <div class="nav-group ${state.legacyOpen ? 'open' : ''}">
      <button class="nav-section nav-group-header" data-legacy-toggle title="${state.lang === 'de' ? 'Durch SHV-Übung ersetzt' : 'Replaced by SHV Practice'}">
        <span class="nav-group-chevron">▸</span>
        <span>${t('nav.legacy')}</span>
      </button>
      <div class="nav-group-body">
        ${legacyItems.map(renderNavItem).join('')}
      </div>
    </div>
  `;
  sb.innerHTML = navHtml + legacyHtml;

  // Legacy group expand/collapse
  const legacyToggle = sb.querySelector('[data-legacy-toggle]');
  if (legacyToggle) legacyToggle.onclick = () => {
    state.legacyOpen = !state.legacyOpen;
    saveState();
    render();
  };

  // theme indicator
  const themeBtn = document.getElementById('theme-toggle');
  themeBtn.innerHTML = state.theme === 'dark' ? t('theme.dark') : state.theme === 'light' ? t('theme.light') : t('theme.auto');

  // language indicator (disabled when no German data is loaded)
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    const deAvail = hasGermanSHV() || hasGermanWorkbook();
    langBtn.innerHTML = state.lang === 'de' ? t('lang.toggle.de') : t('lang.toggle.en');
    langBtn.disabled = !deAvail && state.lang === 'en';
    langBtn.title = deAvail
      ? (state.lang === 'de' ? 'Auf Englisch wechseln' : 'Switch to Deutsch')
      : 'German content not yet loaded — workbook + SHV scrape still in progress';
    langBtn.style.opacity = (!deAvail && state.lang === 'en') ? '0.55' : '1';
  }

  // sidebar 'Study' section label
  const studyLabel = document.getElementById('sidebar-study-label');
  if (studyLabel) studyLabel.textContent = t('sidebar.study');

  // content
  const app = document.getElementById('app');
  let html = '';
  switch (state.view) {
    case 'dashboard':  html = renderDashboard(); break;
    case 'quickquiz':  html = renderQuickQuiz(); break;
    case 'workbook':   html = renderWorkbook(); break;
    case 'flashcards': html = renderFlashcards(); break;
    case 'quiz':       html = renderQuiz(); break;
    case 'exam':       html = renderExam(); break;
    case 'shv-exam':   html = renderSHVExam(); break;
    case 'shv-browse': html = renderSHVBrowse(); break;
    case 'guide':      html = renderGuide(); break;
    case 'slides':     html = renderSlides(); break;
    case 'videos':     html = renderVideos(); break;
    case 'cheatsheet': html = renderCheatsheet(); break;
    case 'tips':       html = renderTips(); break;
    default:           html = renderDashboard();
  }
  app.innerHTML = html;

  // Attach generic nav handlers
  document.querySelectorAll('[data-nav]').forEach(b => {
    b.onclick = (e) => { e.preventDefault(); navigate(b.dataset.nav); };
  });

  // View-specific
  if (state.view === 'quickquiz') attachQuickQuizEvents();
  if (state.view === 'flashcards') attachFlashcardsEvents();
  if (state.view === 'quiz') attachQuizEvents();
  if (state.view === 'exam') {
    attachExamEvents();
    if (state.exam.active) startExamTimer(); else stopExamTimer();
  } else {
    stopExamTimer();
  }
  if (state.view === 'shv-exam') {
    attachSHVExamEvents();
    if (state.shvExam.active && state.shvExam.mode !== 'study') startSHVExamTimer();
    else stopSHVExamTimer();
  } else {
    stopSHVExamTimer();
  }
  if (state.view === 'shv-browse') attachShvBrowseEvents();
  if (state.view === 'guide') attachGuideEvents();
  if (state.view === 'slides') attachSlidesEvents();
  if (state.view === 'videos') attachVideosEvents();
  if (state.view === 'workbook') attachWorkbookEvents();
}

// ============================================================================
// Init
// ============================================================================
function init() {
  // Theme toggle
  document.getElementById('theme-toggle').onclick = () => {
    state.theme = state.theme === 'auto' ? 'light' : state.theme === 'light' ? 'dark' : 'auto';
    saveState();
    render();
  };

  // Language toggle (en ↔ de) — only does anything when German data is loaded
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.onclick = () => {
    if (!hasGermanSHV() && !hasGermanWorkbook()) return;  // disabled state
    state.lang = state.lang === 'de' ? 'en' : 'de';
    saveState();
    render();
  };

  // Mobile menu
  document.getElementById('mobile-menu').onclick = () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-backdrop').classList.toggle('show');
  };
  document.getElementById('sidebar-backdrop').onclick = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-backdrop').classList.remove('show');
  };

  // Lightbox
  document.getElementById('lb-close').onclick = closeLightbox;
  document.getElementById('lb-prev').onclick = () => lightboxNav(-1);
  document.getElementById('lb-next').onclick = () => lightboxNav(1);
  document.getElementById('lightbox').addEventListener('click', (e) => {
    if (e.target.id === 'lightbox') closeLightbox();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    // Slide viewer shortcuts
    const sv = document.getElementById('slide-viewer');
    if (sv && sv.classList.contains('show')) {
      if (e.key === 'Escape') closeSlideViewer();
      else if (e.key === 'ArrowLeft') slideViewerNav(-1);
      else if (e.key === 'ArrowRight') slideViewerNav(1);
      return;
    }
    // Video player shortcuts
    const vp = document.getElementById('video-player');
    if (vp && vp.classList.contains('show')) {
      if (e.key === 'Escape') { closeVideoPlayer(); return; }
      const video = document.getElementById('vp-video');
      if (video) {
        if (e.key === ' ') { e.preventDefault(); video.paused ? video.play() : video.pause(); return; }
        if (e.key === 'ArrowLeft')  { video.currentTime = Math.max(0, video.currentTime - 5); return; }
        if (e.key === 'ArrowRight') { video.currentTime = video.currentTime + 5; return; }
      }
      return;
    }
    // Lightbox shortcuts
    if (document.getElementById('lightbox').classList.contains('show')) {
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lightboxNav(-1);
      else if (e.key === 'ArrowRight') lightboxNav(1);
      return;
    }
    if (state.view === 'flashcards' && (state.fc.mode === 'flashcards' || state.fc.mode === 'review')) {
      if (e.key === ' ' && !_fcReveal) { e.preventDefault(); _fcReveal = true; render(); return; }
      if (_fcReveal && ['1','2','3','4'].includes(e.key)) {
        const map = { '1':'again', '2':'hard', '3':'good', '4':'easy' };
        const card = currentFcCard();
        if (card) {
          recordSrs(card.id, map[e.key]);
          _fcReveal = false;
          setFcIndex(state.fc.index + 1);
          if (state.fc.mode === 'review') _fcDeck = null;
          render();
        }
        return;
      }
      if (e.key === 'ArrowLeft') { setFcIndex(state.fc.index - 1); _fcReveal = false; render(); return; }
      if (e.key === 'ArrowRight') { setFcIndex(state.fc.index + 1); _fcReveal = false; render(); return; }
    }
  });

  // Initial render
  render();
}

// Boot when data is loaded
window.addEventListener('DOMContentLoaded', init);
