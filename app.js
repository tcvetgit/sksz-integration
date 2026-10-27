(function () {
  'use strict';
  const D = window.SZVERS, CH = D.chapters;
  const IN = window.SZVERS_INST || { insts: [] };
  const Q = (window.SZVERS_Q || []).map((r, i) => ({ id: i, c: r[0], q: r[1], ok: r[2], bad: r[3], e: r[4] }));
  const chById = Object.fromEntries(CH.map(c => [c.id, c]));
  const PASS = 80, EXAM_N = Q.length; // допуск: 1 ошибка на 5 вопросов = 80%
  let EXAM_LEN = null;
  const KEY = 'szvers.v2';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  // сериализуемый слепок активного квиза — для «продолжить после закрытия»
  const quizSnapshot = () => quiz ? { mode: quiz.mode, id: quiz.id, title: quiz.title, qs: quiz.qs.map(q => ({ id: q.id, opts: q.opts })), i: quiz.i, ans: quiz.ans, t0: quiz.t0 } : null;
  function saveQuizState() { if (quiz && !quiz.saved) { S.qz = quizSnapshot(); } else { delete S.qz; } save(); }
  function restoreQuiz() {
    const z = S.qz; if (!z) return false;
    const qs = z.qs.map(s => { const q = Q[s.id]; if (!q) return null; const tr = tQ(q); return { ...q, ...tr, opts: s.opts }; }).filter(Boolean);
    if (!qs.length) { delete S.qz; save(); return false; }
    quiz = { mode: z.mode, id: z.id, title: z.title, qs, i: z.i, ans: z.ans || [], t0: z.t0, saved: false };
    return true;
  }

  // ---------- i18n
  const LANGS = [
    { id: 'ru', name: 'Русский', flag: 'img/flag-ru.png' },
    { id: 'kk', name: 'Қазақша', flag: 'img/flag-kk.png' },
    { id: 'ky', name: 'Кыргызча', flag: 'img/flag-ky.png' },
    { id: 'en', name: 'English', flag: 'img/flag-en.png' }
  ];
  const iconHtml = (icon, cls) => icon.startsWith('img/') ? `<img class="icimg" src="${icon}" alt="" loading="lazy">` : icon;
  const flagImg = (l, cls) => `<span class="flag ${cls || ''}" style="background-image:url('${l.flag}')" role="img" aria-label="${l.name}"></span>`;
  function loadPack(id) {
    let p = null;
    if (id === 'kk') p = window.SZVERS_LANG_KK || null;
    else if (id === 'ky') p = window.SZVERS_LANG_KY || null;
    else if (id === 'en') p = window.SZVERS_LANG_EN || null;
    // нормализация: контент может лежать внутри ui
    if (p && p.ui && !p.chHtml && p.ui.chHtml) p = Object.assign({}, p.ui, { ui: p.ui });
    return p;
  }
  function setLang(id) {
    S.lang = id; save();
    toast(T('langChanged'));
    route();
  }
  function tfmt(str, vars) { return String(str).replace(/\{(\w+)\}/g, (m, k) => vars && k in vars ? vars[k] : m); }
  // T(key, vars) — перевод строки интерфейса; tch(id) — глава; tinst(id) — инструкция; tq(q) — вопрос
  function T(key, vars) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') {
      const pack = loadPack(lang);
      if (pack && pack.ui && pack.ui[key] != null) return tfmt(pack.ui[key], vars);
      if (pack && pack.ui && pack.ui.tabs && key.startsWith('tabs_') && pack.ui.tabs[key.slice(5)] != null) return tfmt(pack.ui.tabs[key.slice(5)], vars);
    }
    return tfmt(RU_UI[key] != null ? RU_UI[key] : key, vars);
  }
  function tch(id) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') { const pack = loadPack(lang); if (pack && pack.chs && pack.chs[id]) return pack.chs[id]; }
    const c = chById[id]; return { t: c.title, s: c.sub };
  }
  function tinst(id) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') { const pack = loadPack(lang); if (pack && pack.instList && pack.instList[id]) return pack.instList[id]; }
    const i = IN.insts.find(x => x.id === id); return i ? { t: i.title, s: i.sub } : { t: id, s: '' };
  }
  function tHtmlCh(id) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') { const pack = loadPack(lang); if (pack && pack.chHtml && pack.chHtml[id]) return pack.chHtml[id]; }
    return chById[id].html;
  }
  function tHtmlInst(id) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') { const pack = loadPack(lang); if (pack && pack.instHtml && pack.instHtml[id]) return pack.instHtml[id]; }
    const i = IN.insts.find(x => x.id === id); return i ? i.html : '';
  }
  function tQ(q) {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') {
      const pack = loadPack(lang);
      if (pack && pack.qs && pack.qs[q.id]) { const r = pack.qs[q.id]; return { q: r[1], ok: r[2], bad: r[3], e: r[4] }; }
    }
    return { q: q.q, ok: q.ok, bad: q.bad, e: q.e };
  }
  const RU_UI = {
    tabs_learn: 'Обучение', tabs_test: 'Тест', tabs_inst: 'Инструкции', tabs_cheat: 'Шпаргалка', tabs_more: 'Ещё',
    learnTitle: 'Инструкция СЗ', installBanner: 'Установи приложение на телефон — будет работать без интернета.', installHow: 'Как?',
    largeTitle: 'Обучение', heroSmall: 'Инструкция для сотрудника склада', heroTitle: 'Техника · Инлокер · Goodt Time · Безопасность',
    studied: 'Изучено {n} из {m} глав', chapters: 'Главы', markRead: 'Отметить как изученную ✓', markReadDone: '✓ Глава изучена',
    prev: '‹ Назад', next: 'Далее ›', examPrep: 'Подготовка к экзамену', exam: 'Экзамен',
    examDesc: 'По {n1} случайных вопросов из каждой главы ({n2} всего в банке — в экзамен попадёт не более {n3}). Для сдачи нужно 80% правильных ответов (допускается 1 ошибка на 5 вопросов).',
    best: 'Лучший результат:', never: 'ещё не сдавал', startExam: 'Начать экзамен', wrongTitle: 'Работа над ошибками', chTests: 'Тест по главам',
    questionsOf: '{a} вопросов из {b}', lastAttempts: 'Последние попытки', yourAnswer: '✗ Твой ответ:', correctAnswer: '✓ Правильно:',
    explain: '📖', nextQ: 'Следующий вопрос →', showResult: 'Показать результат', openChapter: '📖 Открыть главу',
    correct: '✅ Верно!', incorrect: '❌ Неверно', correctWas: 'Правильный ответ:', result: 'Результат',
    examPassed: 'Экзамен сдан! 🎉', examFailed: 'Экзамен не сдан', great: 'Отличный результат!', repeat: 'Нужно повторить',
    threshold: 'Порог сдачи — 80% (1 ошибка на 5 вопросов).', time: 'Время:', again: '🔄 Пройти ещё раз', toTests: 'К списку тестов',
    mistakes: 'Разбор ошибок ({n})', noMistakes: 'Ошибок нет — так держать! 💪',
    cheatTitle: 'Шпаргалка', moreTitle: 'Ещё', installTitle: '📲 Установка на телефон',
    installed: '✅ Приложение уже установлено.', installHint: 'После установки иконка появится на главном экране, приложение будет работать без интернета.',
    installAndroid: 'Android (Chrome):', installIphone: 'iPhone (Safari):',
    installStepsA: 'Открой ссылку на приложение в Chrome.|Нажми меню ⋮ (справа вверху).|Выбери «Добавить на главный экран» или «Установить приложение».',
    installStepsI: 'Открой ссылку в Safari.|Нажми кнопку «Поделиться» (квадрат со стрелкой вверх).|Выбери «На экран „Домой“» → «Добавить».',
    installHtml: 'Если у тебя файл szvers-instrukciya.html — просто открой его в браузере телефона: всё работает офлайн, прогресс сохраняется в этом браузере.',
    myProgress: '📊 Мой прогресс', chaptersRead: 'Изучено глав:', bestExam: 'Лучший результат экзамена:', wrongCount: 'Вопросов в работе над ошибками:',
    reset: 'Сбросить прогресс', deviceId: 'ID устройства:', about: 'ℹ️ О приложении',
    aboutText: 'Учебное приложение по документу «Инструкция для сотрудника склада» (ООО «Ле Монлид», Лемана ПРО, СК «Северная Звезда»), версия документа 1.2. Все правила и вопросы взяты из текста инструкции. При расхождении действует актуальная инструкция и указания бригадира.',
    bank: 'Банк вопросов: {q} · Глав: {c}',
    instTitle: 'Инструкции', instSub: 'Рабочие инструкции по отделам и процессам', allInst: '‹ Все инструкции',
    langTitle: 'Язык', langHint: 'Выбери язык интерфейса и всего контента',
    chapter: 'Глава', noLangPack: 'Перевод ещё загружается — обнови страницу.',
    quizLetters: 'АБВГ',
    installApp: 'Установить приложение', of: 'из', confirmReset: 'Сбросить весь прогресс?', resetDone: 'Прогресс сброшен',
    result: 'Результат',
    langChanged: 'Язык изменён',
    copied: 'Скопировано', markedRead: 'Глава отмечена как изученная ✓',
    zoomHint: 'Нажми на изображение — увеличить/уменьшить',
    noMistakesToast: 'Ошибок нет — отлично! 🎉',
    searchPh: '🔍 Поиск по шпаргалке…',
    openMist: 'Открыть главу с ошибкой',
    resumeQuiz: 'Продолжить тест ({n} из {m})', streak: 'Серия верных ответов', offline: '📴 Нет сети — приложение работает офлайн',
    fixMistakes: 'Повторить {n} ошиб.', goExam: 'Сдать экзамен', refBadge: 'Справочник',
    pulseTitle: 'Аутсорс - Пульс', pulseSub: 'Предложения по улучшению работы склада', pulseBadge: 'Опрос',
    themeTitle: 'Тема', themeDark: '🌙 Включить тёмную тему', themeLight: '☀️ Включить светлую тему',
    backToWrong: '← К разбору ошибок', histEmpty: 'Пройди первый тест — результаты появятся здесь 📊',
    mixTitle: 'Смешанный тест', mixSub: '8 случайных вопросов',
    sparkEmpty: 'Пройди пару тестов — здесь появится график динамики 📈', sparkCap: 'Динамика последних попыток',
    updateReady: 'Доступна новая версия приложения', updateBtn: 'Обновить'
  };

  // ---------- storage
  let S = initS();
  function initS() { let s; try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; } s.read = s.read || {}; s.best = s.best || {}; s.wrong = s.wrong || {}; s.hist = s.hist || []; return s; }
  const genDev = () => 'D-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  if (!S.dev) { S.dev = genDev(); save(); }
  // тема: применять сразу при старте (до первого рендера), чтобы не мигало
  document.documentElement.classList.toggle('dark', S.theme === 'dark');
  function setTheme(t) { S.theme = t; save(); document.documentElement.classList.toggle('dark', t === 'dark'); const mt = document.querySelector('meta[name=theme-color]'); if (mt) mt.content = t === 'dark' ? '#1d2223' : '#2f3738'; }

  const toast = t => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); };

  // ---------- ripple только на кнопках (на карточках вызывал глюки при скролле)
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('.btn');
    if (!el || e.pointerType === 'touch') return;
    if (!el) return;
    const r = el.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const rip = document.createElement('span');
    rip.className = 'ripple';
    rip.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    el.appendChild(rip);
    setTimeout(() => rip.remove(), 650);
  });

  // ---------- конфетти при завершении всех глав
  function confetti() {
    const colors = ['#ffc100', '#2f3738', '#ffd54d', '#e6e9e9', '#8a6900'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      const s = 5 + Math.random() * 7;
      c.style.cssText = `left:${Math.random() * 100}vw;width:${s}px;height:${s * (Math.random() > .5 ? 1 : 2.2)}px;background:${colors[i % colors.length]};animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * .5}s`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 4200);
    }
  }

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fmtDur = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

  const app = $('#app');
  let quiz = null;
  let lastShellKey = null;

  function movePill(instant) {
    const in_ = $('.tabbar .in'), on = $('.tabbar a.on'), pill = $('.tabbar .pill');
    if (!in_ || !on || !pill) return;
    const ir = in_.getBoundingClientRect(), ar = on.getBoundingClientRect();
    const left = Math.round(ar.left - ir.left), width = Math.round(ar.width);
    if (pill._l === left && pill._w === width) return;
    pill._l = left; pill._w = width;
    if (instant) { pill.style.transition = 'none'; pill.style.left = left + 'px'; pill.style.width = width + 'px'; void pill.offsetWidth; pill.style.transition = ''; }
    else { pill.style.left = left + 'px'; pill.style.width = width + 'px'; }
  }

  function shell(title, body, opts = {}) {
    const tab = opts.tab || 'learn';
    const key = tab + '|' + title + '|' + (opts.badge || '');
    const sameScreen = key === lastShellKey;
    lastShellKey = key;
    const back = opts.back ? `<button class="back" aria-label="Назад" data-go="${opts.back}">‹</button>` : '<button class="back ghost" aria-hidden="true" tabindex="-1">‹</button>';
    const badge = opts.badge ? `<span class="badge">${opts.badge}</span>` : '';
    const tabs = [['learn', 'img/tab-1.png', T('tabs_learn')], ['test', 'img/tab-2.png', T('tabs_test')], ['inst', 'img/tab-3.png', T('tabs_inst')], ['cheat', 'img/tab-4.png', T('tabs_cheat')], ['more', 'img/tab-5.png', T('tabs_more')]];
    const tabEls = tabs.map(([k, i, t]) => `<a href="#/${k}" class="${tab === k ? 'on' : ''}"><span class="ic"><img src="${i}" alt="" loading="lazy"></span><span class="tlabel">${t}</span></a>`).join('');
    app.innerHTML = `<div class="offline-bar" id="offlineBar" hidden>${T('offline')}</div><header class="topbar">${back}<h1>${title}</h1>${badge}</header><main class="${sameScreen ? '' : 'anim'}">${body}</main><nav class="tabbar"><div class="in">${tabEls}<div class="pill"></div></div></nav>`;
    updateOfflineBar();
    requestAnimationFrame(() => movePill(true));
    const y = window.scrollY;
    if (y > 40) window.scrollTo({ top: 0, behavior: 'smooth' }); else window.scrollTo(0, 0);
  }

  // ---------- Обучение
  function viewLearn() {
    const n = CH.filter(c => S.read[c.id]).length, pct = Math.round(n / CH.length * 100);
    const ins = (!isStandalone() && !S.hideInstall) ? `<div class="banner">📲 ${T('installBanner')}<button data-go="#/more">${T('installHow')}</button></div>` : '';
    const cur = LANGS.find(l => l.id === (S.lang || 'ru'));
    const langBanner = `<div class="banner lang-banner"><a class="lang-link" href="#/lang">${flagImg(cur, 'sm')} ${T('langTitle')}<span class="lang-cur">${cur.name}</span><span class="lnk-arr">›</span></a></div>`;
    const items = CH.map((c, i) => {
      const tr = tch(c.id);
      return `<a class="item" href="#/ch/${c.id}"><div class="ic">${iconHtml(c.icon)}</div><div class="tt"><b>${i + 1}. ${tr.t}</b><span>${tr.s}</span></div>${S.read[c.id] ? '<span class="done"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '<span class="todo"></span>'}</a>`;
    }).join('');
    shell(T('learnTitle'), `${ins}${langBanner}
<div class="large-title"><h2>${T('largeTitle')}</h2><p>СК «Северная Звезда» · Лемана ПРО</p></div>
<div class="hero"><small>${T('heroSmall')}</small><h2>${T('heroTitle')}</h2>
<div class="pbar"><i style="width:${pct}%"></i></div><div class="row"><span>${T('studied', { n, m: CH.length })}</span><span>${pct}%</span></div></div>
<div class="sec-t">${T('chapters')}</div><div class="list">${items}</div>
<div class="divider" aria-hidden="true"><b></b><b></b><b></b></div>
<a class="item" href="#/pulse"><div class="ic">${iconHtml('img/ch9.png')}</div><div class="tt"><b>${T('pulseTitle')}</b><span>${T('pulseSub')}</span></div><span class="ref-badge">${T('pulseBadge')}</span></a>`, { tab: 'learn' });
  }

  function viewChapter(id) {
    const c = chById[id]; if (!c) return go('#/learn');
    const i = CH.indexOf(c), next = CH[i + 1], prev = CH[i - 1];
    const tr = tch(id);
    const allRead = CH.every(c => S.read[c.id]);
    const wrongHere = Q.filter(q => q.c === id && S.wrong[q.id]).length;
    const smartNext = (!S.read[id] && allRead !== false)
      ? ''
      : (allRead && Object.keys(S.wrong).length)
        ? `<a class="btn sec smart" href="#/test">🔁 ${T('fixMistakes', { n: Object.keys(S.wrong).length })}</a>`
        : (allRead ? `<a class="btn sec smart" href="#/test">🎓 ${T('goExam')}</a>` : (wrongHere ? `<a class="btn sec smart" href="#/test">🔁 ${T('fixMistakes', { n: wrongHere })}</a>` : ''));
    shell(tr.t, `<article class="content">${tHtmlCh(id)}</article>
<div class="chap-nav">
<button class="btn" data-act="read" data-id="${id}">${S.read[id] ? T('markReadDone') : T('markRead')}</button>
${smartNext}
<div class="btn-row">${prev ? `<a class="btn prev" href="#/ch/${prev.id}">${T('prev')}</a>` : '<span class="ph"></span>'}${next ? `<a class="btn next" href="#/ch/${next.id}">${T('next')}</a>` : '<span class="ph"></span>'}</div>
${S.from === id ? `<a class="btn sec" href="#/test" data-act="backwr">${T('backToWrong')}</a>` : ''}
</div>`, { tab: 'learn', back: '#/learn', badge: `${i + 1}/${CH.length}` });
  }

  // ---------- Тесты
  const CH_N = 4; // минимум на категорию; квота = clamp(round(N*0.35), 4, 12)
  const chQuota = n => Math.max(4, Math.min(12, Math.round(n * 0.35)));
  const MIX_N = 8; // вопросов в смешанном тесте
  function startQuiz(mode, id) {
    let qs, title;
    if (mode === 'exam') { qs = shuffle(CH.map(c => shuffle(Q.filter(q => q.c === c.id)).slice(0, chQuota(Q.filter(q => q.c === c.id).length))).flat()); EXAM_LEN = qs.length; title = T('exam'); }
    else if (mode === 'ch') { const bank = Q.filter(q => q.c === id); qs = shuffle(bank).slice(0, chQuota(bank.length)); title = T('chapter') + ': ' + tch(id).t; }
    else if (mode === 'mix') { qs = shuffle(Q).slice(0, MIX_N); title = T('mixTitle'); }
    else if (mode === 'wrong') { qs = shuffle(Q.filter(q => S.wrong[q.id])); title = T('wrongTitle'); if (!qs.length) return toast(T('noMistakesToast')); }
    else return;
    quiz = { mode, id, title, qs: shuffle(qs).map(q => ({ ...q, ...tQ(q), opts: null })), i: 0, ans: [], t0: Date.now() };
    quiz.qs.forEach(q => { q.opts = shuffle([q.ok, ...q.bad]); });
    saveQuizState();
    go('#/quiz');
  }

  function viewTest() {
    const be = S.best.exam, wrongN = Object.keys(S.wrong).length;
    const wrongBy = {};
    Q.forEach(q => { if (S.wrong[q.id]) wrongBy[q.c] = (wrongBy[q.c] || 0) + 1; });
    const wrongChips = Object.entries(wrongBy).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${tch(c).t} ${n}`).join(' · ');
    const tiles = CH.map(c => {
      const n = Q.filter(q => q.c === c.id).length, b = S.best['ch:' + c.id], read = S.read[c.id];
      return `<button class="item" data-act="quiz-ch" data-id="${c.id}"><div class="ic">${iconHtml(c.icon)}</div><div class="tt"><b>${tch(c.id).t}</b><span>${T('questionsOf', { a: Math.min(n, chQuota(n)), b: n })}</span><span class="mini-pbar"><i style="width:${read ? 100 : 0}%"></i></span></div><span class="st">${b != null ? (b >= PASS ? '✅ ' : '') + b + '%' : '—'}</span></button>`;
    }).join('');
    const last = S.hist.slice(-5).reverse().map(h => `<div class="kv with-num"><div class="k" style="min-width:52px">${h.p}%</div><div class="v">${esc(h.t)}<br><span class="muted small">${new Date(h.d).toLocaleString('ru-RU')}</span></div></div>`).join('');
    shell(T('examPrep'), `
${S.qz ? `<button class="banner resume-banner" data-act="resume">▶ ${T('resumeQuiz', { n: (S.qz.ans || []).filter(Boolean).length, m: S.qz.qs.length })}</button>` : ''}
<div class="examcard"><h2>🎓 ${T('exam')}</h2><p>${T('examDesc', { n1: '4–12', n2: EXAM_N, n3: EXAM_LEN || CH.reduce((s, c) => s + chQuota(Q.filter(q => q.c === c.id).length), 0) })}</p>
<p>${T('best')} <b>${be != null ? be + '%' : T('never')}</b></p><button class="btn light" data-act="exam">${T('startExam')}</button></div>
<div class="grid2" style="margin-top:12px">
<button class="tile ${wrongN ? '' : 'tile-empty'}" data-act="wrong"><div class="n">${wrongN ? wrongN : '🎉'}</div><div class="d">${T('wrongTitle')}</div>${wrongN ? `<div class="d small">${wrongChips}</div>` : `<div class="d small">${T('noMistakes')}</div>`}</button>
<button class="tile" data-act="quiz-mix"><div class="n">🎲</div><div class="d">${T('mixTitle')}</div><div class="d small">${T('mixSub')}</div></button></div>
<div class="sec-t">${T('chTests')}</div><div class="list">${tiles}</div>
<div class="sec-t">${T('lastAttempts')}</div>${last ? `<div class="cheat">${last}</div>` : `<div class="cheat empty-state">${T('histEmpty')}</div>`}`, { tab: 'test' });
  }

  function viewQuiz() {
    if (!quiz && S.qz && restoreQuiz()) { /* возобновляем после перезапуска приложения */ }
    if (!quiz) return go('#/test');
    if (quiz.i >= quiz.qs.length) return viewResult();
    const q = quiz.qs[quiz.i], n = quiz.qs.length, a = quiz.ans[quiz.i];
    const L = (T('quizLetters') || 'АБВГ').split('');
    const opts = q.opts.map((o, k) => {
      let cls = '';
      if (a) { if (o === q.ok) cls = 'ok'; else if (o === a.pick) cls = 'bad'; else cls = 'dim'; }
      return `<button class="opt ${cls}" data-act="ans" data-k="${k}" ${a ? 'disabled' : ''}><span class="l">${L[k] || k + 1}</span><span>${esc(o)}</span></button>`;
    }).join('');
    const fb = a ? `<div class="fb ${a.ok ? 'ok' : 'bad'}"><b>${a.ok ? T('correct') : T('incorrect')}</b>${a.ok ? '' : `<div style="margin-bottom:6px">${T('correctWas')} <b style="display:inline">${esc(q.ok)}</b></div>`}<div class="q">${esc(q.e)}</div></div>
<button class="btn" data-act="next">${quiz.i + 1 < n ? T('nextQ') : T('showResult')}</button>
<button class="btn sec" data-go="#/ch/${q.c}">${T('openChapter')} «${esc(tch(q.c).t)}»</button>` : '';
    const right = quiz.ans.filter(x => x && x.ok).length;
    const streak = calcStreak();
    const fire = streak >= 3 ? `<span class="streak" title="${T('streak')}">🔥${streak}</span>` : '';
    shell(quiz.title, `<div class="qprog"><span>${quiz.i + 1} / ${n}</span><div class="bar"><i style="width:${(quiz.i + (a ? 1 : 0)) / n * 100}%"></i></div><span class="qtimer" id="qtimer">${fire}⏱ <b>${fmtDur(Math.floor((Date.now() - quiz.t0) / 1000))}</b></span></div>
<div class="qcard"><div class="qchap">${iconHtml(chById[q.c].icon)} ${esc(tch(q.c).t)}</div><div class="qtext">${esc(q.q)}</div>${opts}${fb}</div>`,
      { tab: 'test', back: '#/test' });
    startTimer();
  }

  let timerId = null;
  let offlineState = null;
  function sparkline() {
    const h = S.hist.slice(-20);
    if (h.length < 2) return `<p class="small muted">${T('sparkEmpty')}</p>`;
    const w = 280, H = 56, pad = 6;
    const pts = h.map((x, i) => [pad + i * (w - 2 * pad) / (h.length - 1), H - pad - (x.p / 100) * (H - 2 * pad)]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = path + ` L${(w - pad)} ${H - pad} L${pad} ${H - pad} Z`;
    const dots = pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.4" fill="${h[i].p >= PASS ? 'var(--accent)' : 'var(--red)'}"/>`).join('');
    return `<div class="spark"><svg viewBox="0 0 ${w} ${H}" preserveAspectRatio="none"><path d="${area}" fill="rgba(255,193,0,.12)"/><path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${dots}</svg><div class="spark-cap">${T('sparkCap')}</div></div>`;
  }
  function updateOfflineBar() {
    const bar = $('#offlineBar'); if (!bar) return;
    const off = !navigator.onLine;
    if (off === offlineState) { if (off) bar.hidden = false; return; }
    offlineState = off;
    bar.hidden = !off;
  }
  window.addEventListener('online', updateOfflineBar);
  window.addEventListener('offline', updateOfflineBar);

  function startTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (!quiz || quiz.saved) return;
    timerId = setInterval(() => {
      const el = document.querySelector('#qtimer b');
      if (!el || !quiz || quiz.saved) { if (timerId) { clearInterval(timerId); timerId = null; } return; }
      el.textContent = fmtDur(Math.floor((Date.now() - quiz.t0) / 1000));
    }, 1000);
  }

  function calcStreak() {
    let s = 0;
    for (let i = quiz.ans.length - 1; i >= 0; i--) { const a = quiz.ans[i]; if (a && a.ok) s++; else break; }
    return s;
  }

  function answer(k) {
    const q = quiz.qs[quiz.i]; if (quiz.ans[quiz.i]) return;
    const pick = q.opts[k], ok = pick === q.ok;
    quiz.ans[quiz.i] = { pick, ok };
    if (ok) delete S.wrong[q.id]; else S.wrong[q.id] = 1;
    saveQuizState(); viewQuiz();
    const fb = $('.fb'); if (fb) fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (navigator.vibrate) navigator.vibrate(ok ? 18 : 60);
  }

  function viewResult() {
    const n = quiz.qs.length, r = quiz.ans.filter(x => x && x.ok).length, p = Math.round(r / n * 100);
    if (!quiz.saved) {
      quiz.saved = true;
      const key = quiz.mode === 'exam' ? 'exam' : quiz.mode === 'ch' ? 'ch:' + quiz.id : quiz.mode;
      S.best[key] = Math.max(S.best[key] || 0, p);
      S.hist.push({ t: quiz.title, p, d: Date.now() }); S.hist = S.hist.slice(-30); delete S.qz; save();
      const dur = Math.round((Date.now() - quiz.t0) / 1000);
      quiz.rec = { rid: S.dev + '-' + Date.now().toString(36), ts: Date.now(), type: quiz.title, correct: r, total: n, percent: p, passed: quiz.mode === 'exam' ? (p >= PASS) : null, duration: dur, device: S.dev, app: 'szvers-2.0' };
      if (quiz.mode === 'exam' && p >= PASS) setTimeout(confetti, 350);
    }
    const pass = p >= PASS, col = pass ? 'var(--brand)' : 'var(--red)';
    const mist = quiz.qs.map((q, i) => ({ q, a: quiz.ans[i] })).filter(x => !x.a.ok);
    const ml = mist.map(({ q, a }) => `<div class="mist"><div class="qq">${esc(q.q)}</div><div class="yr">${T('yourAnswer')} ${esc(a.pick)}</div><div class="cr">${T('correctAnswer')} ${esc(q.ok)}</div><div class="ex">${T('explain')} ${esc(q.e)}</div><a class="btn sec mist-go" data-act="mistgo" data-id="${q.c}" href="#/ch/${q.c}">${T('openMist')} «${esc(tch(q.c).t)}»</a></div>`).join('');
    const title = quiz.mode === 'exam' ? (pass ? T('examPassed') : T('examFailed')) : (pass ? T('great') : T('repeat'));
    shell(T('result'), `<div class="qcard res"><div class="ring" style="background:conic-gradient(${col} ${p * 3.6}deg,var(--bd) 0)"><span>${p}%<small>${r} из ${n}</small></span></div>
<h2 class="${pass ? 'pass' : 'fail'}">${title}</h2><p class="muted">${quiz.title}. ${T('threshold')}</p>
<p class="muted small">${T('time')} ${fmtDur(quiz.rec.duration)} · ${new Date(quiz.rec.ts).toLocaleString('ru-RU')}</p>
<button class="btn" data-act="again">${T('again')}</button><button class="btn sec" data-go="#/test">${T('toTests')}</button></div>
${mist.length ? `<div class="sec-t">${T('mistakes', { n: mist.length })}</div>${ml}` : `<div class="sec-t">${T('noMistakes')}</div>`}`, { tab: 'test', back: '#/test' });
  }

  // ---------- Шпаргалка
  function viewCheat() {
    const lang = S.lang || 'ru';
    let blocks;
    if (lang !== 'ru') {
      const pack = loadPack(lang);
      if (pack && pack.cheat) {
        const rowsHtml = b => b.rows.map(([k, v]) => `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
        const icons = { tech: '🚜', inloker: '🗄️', goodt: '⏱️', sborca: '📦', slang: '🗣️' };
        blocks = ['tech', 'inloker', 'goodt', 'sborca', 'slang'].map(k => {
          const b = pack.cheat[k];
          if (!b) return '';
          return `<details class="cblock" open><summary><span class="ci">${icons[k]}</span>${b.t}<span class="ch"></span></summary><div class="cheat cb-in">${rowsHtml(b)}${b.note ? `<p class="small muted">${b.note}</p>` : ''}</div></details>`;
        });
        const em = pack.cheat.emergency;
        if (em) blocks.push(`<div class="cheat" style="border-left:4px solid var(--red)"><h3>${em.t}</h3>${em.rows.map(([, v], i) => `<div class="kv with-num"><span class="pillnum">${i + 1}</span><div class="v">${v}</div></div>`).join('')}${em.link ? `<a class="btn sec" href="#/ch/emergency">${em.link}</a>` : ''}</div>`);
      }
    }
    if (!blocks) {
      const blk = (icon, title, rows) => `<details class="cblock" open><summary><span class="ci">${icon}</span>${title}<span class="ch"></span></summary><div class="cheat cb-in">${rows}</div></details>`;
      const kv = (k, v) => `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`;
      blocks = [
        blk('🚜', 'Техника — 3 категории', `${kv('Без допуска', 'Рохля — после инструктажа бригадира. Осмотри колёса, не перегружай (до 1000–2500 кг), опусти вилы перед толканием, не катайся.')}${kv('До 4 кВт', 'Мулинет, поводковый штабелёр (до 2 м) — допуск + протокол проверки знаний + инструктаж. Не возити людей; закончив — опусти вилы, вытащи ключ.')}${kv('Свыше 4 кВт', 'Ричтрак (до 8–12 м), погрузчик — удостоверение тракториста-машиниста + допуск. Без удостоверения не садись даже «просто попробовать».')}${kv('Нестандарт', 'Звук, дым, вибрация — немедленно останови работу и сообщи бригадиру.')}`),
        blk('🗄️', 'Инлокер — кратко', `${kv('Взять', 'Бейдж к считывателю (или PIN) → шкаф назначает ТСД, ячейка открывается → достань → закрой ячейку → проверь: экран, сканер, корпус.')}${kv('Сдать', 'Бейдж → QR/ШК на ТСД → «Исправен»/«Неисправен» (тип поломки) → подтвердить → первая свободная ячейка → закрыть.')}${kv('Перерыв', 'ТСД можно оставить в Инлокере — опция «Временное хранение».')}<div class="kv"><div class="k">Проблема</div><div class="v">Забыл/не открывается/не считается — бейдж ещё раз или бригадир через панель администратора.</div></div>`),
        blk('⏱️', 'Goodt Time (LKK) — кратко', `${kv('Сервер', '<code class="copy" data-copy="https://time.lemanapro.ru/api/v1">https://time.lemanapro.ru/api/v1</code> → «Сохранить» → логин/пароль → «Войти»')}${kv('Приход', '«Начать» → сканирование QR-кода → подтверждение')}${kv('Перерыв', '«Начать перерыв» → «Да» → QR-код → ждать сообщения → «Завершить перерыв» → QR-код → ждать сообщения')}${kv('Уход', '«Завершить смену» → QR-код → подтверждение')}<p class="small muted">QR-код — у входа в зону работы. Нет отметки прихода — смена не зафиксирована; нет отметки ухода — неявка; одна отметка перерыва — ошибки в учёте. Проблемы — сразу к руководителю.</p>`),
        blk('📦', 'Сборка — типы тары', `${kv('Составной товар', 'бывает разных типов; уточни у бригадира, какой где используется.')}${kv('Карнизы / рулонные шторы', 'меньше 5 шт. в заказе — делится через бригадира на BOX (собирается физически и привозится к бригадиру); больше 5 шт. — остаётся на паллете ST2 (PAL80×240).')}${kv('BOX', 'вмещает до 25 кг включительно, больше не грузи! Радиаторы, освещение (хрупкий товар) и зеркала в BOX не идут. Исключения — уточни у бригадира.')}${kv('STE (PAL80×60)', 'максимальная высота сборки 1,2 м, максимальный вес 70 кг. Исключение — составной товар.')}${kv('STD (PAL80×120)', 'максимальная высота сборки 1,8 м, вес не ограничен.')}${kv('ST2 (PAL80×240)', 'максимальная высота сборки 1,5 м, вес не ограничен. Для карнизов и рулонных штор.')}${kv('DIV (PAL120×170)', 'максимальная высота сборки 1,5 м, вес не ограничен. Для негабаритных товаров.')}${kv('BIG (PAL120×240)', 'максимальная высота сборки 1,5 м, вес не ограничен. Тип для дверей (виртуальная тара): физически используется паллет DIV (PAL120×170), максимум 8 больших или 16 маленьких/узких дверей.')}${kv('UKP (PAL120×120)', 'используется как исключение — уточни у бригадира.')}<p class="small muted">Будь внимателен — не повреди продажную упаковку: она часто отличается от транспортировочных коробов видом и цветом (презентабельный вид). Пуш-ячейка — ячейка из 2–3 ячеек с одним и тем же товаром; отбирай с начатой паллеты, с одной, а не с нескольких.</p>`),
        `<div class="cheat" style="border-left:4px solid var(--red)"><h3>🚨 ЧС — порядок действий</h3>${['Немедленно прекрати работу.', 'Убедись в безопасности себя и окружающих.', 'Оповести руководителя.', 'Вызови помощь по внутреннему каналу связи или телефону.', 'При необходимости эвакуируйся согласно плану эвакуации.'].map((t, i) => `<div class="kv with-num"><span class="pillnum">${i + 1}</span><div class="v">${t}</div></div>`).join('')}<a class="btn sec" href="#/ch/emergency">Глава про ЧС</a></div>`,
        blk('🗣️', 'Народные названия и прочие расшифровки', `${kv('ХД / XD / КРОСС', 'Отдел КРОСС-ДОК')}${kv('Ручка / Раздел / ЕЗ / ББХД', 'НЕ автоматизированная часть отдела ЕДИНЫЙ ЗАКАЗ')}${kv('Станция / Адапто / Пал / Депал', 'АВТОМАТИЗИРОВАННАЯ часть отдела ЕДИНЫЙ ЗАКАЗ — ADAPTO')}${kv('СТОК / Сборка / Пикинг', 'Отдел ИМПОРТ')}${kv('Отгрузка / Накатка / Раунды / Загрузка', 'Отдел ОТГРУЗКА')}${kv('СиСиха / Сишка', 'Наклейка, несущая основной штрихкод паллеты')}${kv('Пистолет / Тэха', 'Терминал сбора данных (ТСД), основной рабочий инструмент сборщика')}${kv('Циклоп', 'Автоматическая машина оплачивания паллет')}${kv('МД', 'Мастер-данные товара: вес, размер, вложимость и т. п.')}${kv('Сброс', 'Принудительный системный сброс задания')}${kv('ПЦБ / PCB', 'Метод отбора товара — упаковка')}${kv('СПЦБ / SPCB', 'Метод отбора товара — подупаковка')}${kv('Inner / Unit (Штука)', 'Метод отбора товара — штучный (короб)')}${kv('ОПВС', 'Отдел предотвращения внештатных ситуаций (служба безопасности склада)')}`)
      ];
    }
    shell(T('cheatTitle'), `<div class="cheat-search"><input id="cheatQ" type="search" placeholder="${T('searchPh')}" autocomplete="off">${(window.SpeechRecognition || window.webkitSpeechRecognition) ? '<button class="cs-mic" id="cheatMic" aria-label="🎤">🎤</button>' : ''}<button class="cs-x" id="cheatX" aria-label="✕" hidden>✕</button></div><div id="cheatBlocks">${blocks.join('\n')}</div>`, { tab: 'cheat' });
    const inp = $('#cheatQ');
    if (inp) {
      const x = $('#cheatX');
      const mic = $('#cheatMic');
      if (mic) {
        mic.addEventListener('click', () => {
          const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
          const rec = new SR();
          rec.lang = { ru: 'ru-RU', kk: 'kk-KZ', ky: 'ky-KG', en: 'en-US' }[S.lang || 'ru'];
          rec.interimResults = false;
          mic.classList.add('listening');
          rec.onresult = ev => { inp.value = ev.results[0][0].transcript; inp.dispatchEvent(new Event('input')); };
          rec.onend = () => mic.classList.remove('listening');
          rec.onerror = () => mic.classList.remove('listening');
          try { rec.start(); } catch (e) { mic.classList.remove('listening'); }
        });
      }
      inp.addEventListener('input', () => {
        const q = inp.value.trim().toLowerCase();
        x.hidden = !q;
        $('#cheatBlocks').querySelectorAll('.cblock, .cheat').forEach(b => {
          const hit = !q || b.textContent.toLowerCase().includes(q);
          b.hidden = !hit;
          if (q && hit) b.open = true;
          if (!q && b.tagName === 'DETAILS') b.open = true;
        });
      });
      x.addEventListener('click', () => { inp.value = ''; inp.dispatchEvent(new Event('input')); inp.focus(); });
    }
  }

  // ---------- Язык
  function viewLang() {
    const items = LANGS.map(l => `<button class="item lang-item ${((S.lang || 'ru') === l.id) ? 'lang-on' : ''}" data-act="lang" data-lang="${l.id}">${flagImg(l)}<div class="tt"><b>${l.name}</b><span>${l.id.toUpperCase()}</span></div>${(S.lang || 'ru') === l.id ? '<span class="done"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '<span class="todo"></span>'}</button>`).join('');
    shell(T('langTitle'), `<div class="large-title"><h2>${T('langTitle')}</h2><p>${T('langHint')}</p></div><div class="list">${items}</div>`, { tab: 'more', back: '#/more' });
  }

  // ---------- Ещё
  function viewMore() {
    const cur = LANGS.find(l => l.id === (S.lang || 'ru'));
    const langRow = `<a class="item" href="#/lang">${flagImg(cur)}<div class="tt"><b>${T('langTitle')}</b><span>${T('langHint')}</span></div><span class="st">${cur.name}</span></a>`;
    shell(T('moreTitle'), `
<div class="inst"><h3>🌐 ${T('langTitle')}</h3>
${langRow}</div><div class="inst"><h3>${T('installTitle')}</h3>
<p class="small muted">${isStandalone() ? T('installed') : T('installHint')}</p>
${deferredPrompt ? `<button class="btn" data-act="install">${T('installApp')}</button>` : ''}
<b>${T('installAndroid')}</b><ol>${T('installStepsA').split('|').map(s => `<li>${s}</li>`).join('')}</ol>
<b>${T('installIphone')}</b><ol>${T('installStepsI').split('|').map(s => `<li>${s}</li>`).join('')}</ol>
<p class="small muted">${T('installHtml')}</p></div>
<div class="inst"><h3>${T('myProgress')}</h3>
<p>${T('chaptersRead')} <b>${CH.filter(c => S.read[c.id]).length} ${T('of')} ${CH.length}</b><br>${T('bestExam')}: <b>${S.best.exam != null ? S.best.exam + '%' : '—'}</b><br>${T('wrongCount')}: <b>${Object.keys(S.wrong).length}</b></p>
${sparkline()}
<button class="btn ghost" data-act="reset">${T('reset')}</button><p class="small muted">${T('deviceId')} ${S.dev}</p></div>
<div class="inst"><h3>${S.theme === 'dark' ? '🌙' : '☀️'} ${T('themeTitle')}</h3>
<button class="btn ghost" data-act="theme">${S.theme === 'dark' ? T('themeLight') : T('themeDark')}</button></div>
<div class="inst"><h3>${T('about')}</h3><p class="small">${T('aboutText')}</p>
<p class="small muted">${T('bank', { q: Q.length, c: CH.length })}</p></div>`, { tab: 'more' });
  }

  // ---------- Инструкции по отделам (без тестов)
  function viewInst() {
    const items = IN.insts.map(i => { const tr = tinst(i.id); return `<a class="item" href="#/doc/${i.id}"><div class="ic">${iconHtml(i.icon)}</div><div class="tt"><b>${tr.t}</b><span>${tr.s}</span></div><span class="ref-badge">${T('refBadge')}</span></a>`; }).join('');
    shell(T('instTitle'), `
<div class="large-title"><h2>${T('instTitle')}</h2><p>${T('instSub')}</p></div>
<div class="list">${items}</div>`, { tab: 'inst' });
  }

  function viewDoc(id) {
    if (!IN.insts.find(x => x.id === id)) return go('#/inst');
    const tr = tinst(id);
    shell(tr.t, `<article class="content">${tHtmlInst(id)}</article>
<div class="chap-nav"><a class="btn sec" href="#/inst">${T('allInst')}</a></div>`, { tab: 'inst', back: '#/inst' });
  }

  // ---------- Аутсорс - Пульс
  function tPulse() {
    const lang = S.lang || 'ru';
    if (lang !== 'ru') {
      const pack = loadPack(lang);
      if (pack && pack.pulseHtml) return pack.pulseHtml;
      if (pack && pack.ui && pack.ui.pulseHtml) return pack.ui.pulseHtml;
    }
    return D.pulseHtml;
  }
  function viewPulse() {
    shell(T('pulseTitle'), `
<div class="large-title"><h2>${T('pulseTitle')}</h2><p>${T('pulseSub')}</p></div>
<article class="content">${tPulse()}</article>`, { tab: 'learn', back: '#/learn' });
  }

  // ---------- routing
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [p, a] = h.split('/');
    if (p === 'ch') viewChapter(a);
    else if (p === 'test') viewTest();
    else if (p === 'quiz') viewQuiz();
    else if (p === 'inst') viewInst();
    else if (p === 'doc') viewDoc(a);
    else if (p === 'pulse') viewPulse();
    else if (p === 'lang') viewLang();
    else if (p === 'cheat') viewCheat();
    else if (p === 'more') viewMore();
    else viewLearn();
  }
  window.addEventListener('hashchange', route);
  // resize дёргается на мобильных при скрытии/показе адресной строки во время быстрого скролла —
  // дебаунсим, чтобы пилюля не «улетала» и не провоцировала перерасчёты в середине скролла
  let rzT = null;
  window.addEventListener('resize', () => { if (rzT) clearTimeout(rzT); rzT = setTimeout(movePill, 180); });
  window.addEventListener('orientationchange', () => setTimeout(movePill, 200));

  document.addEventListener('click', e => {
    const img = e.target.closest('img[data-zoom]');
    if (img) return lightbox(img.src, img.alt);
    const c = e.target.closest('code.copy');
    if (c) { const t = c.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast(T('copied')), () => toast(t)); return; }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return go(g.dataset.go); }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'read') { S.read[id] = !S.read[id]; save(); if (S.read[id]) { toast(T('markedRead')); if (CH.every(c => S.read[c.id])) setTimeout(confetti, 350); } const sy = window.scrollY; viewChapter(id); window.scrollTo(0, sy); }
    else if (act === 'quiz-ch') startQuiz('ch', id);
    else if (act === 'quiz-mix') startQuiz('mix');
    else if (act === 'exam') startQuiz('exam');
    else if (act === 'wrong') startQuiz('wrong');
    else if (act === 'ans') answer(+b.dataset.k);
    else if (act === 'next') { quiz.i++; viewQuiz(); }
    else if (act === 'again') startQuiz(quiz.mode, quiz.id);
    else if (act === 'resume') { if (restoreQuiz()) { go('#/quiz'); } else toast(T('resetDone')); }
    else if (act === 'install' && deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    else if (act === 'theme') setTheme(S.theme === 'dark' ? 'light' : 'dark');
    else if (act === 'mistgo') { S.from = id; save(); }
    else if (act === 'backwr') { S.from = null; save(); }
    else if (act === 'lang') setLang(b.dataset.lang);
    else if (act === 'reset') {
      if (confirm(T('confirmReset'))) {
        quiz = null;
        try { localStorage.removeItem(KEY); } catch (e) { }
        S = initS();
        if (!S.dev) S.dev = genDev();
        save();
        // тема возвращается к светлой по умолчанию
        document.documentElement.classList.remove('dark');
        const mt = document.querySelector('meta[name=theme-color]'); if (mt) mt.content = '#2f3738';
        viewMore();
        toast(T('resetDone'));
      }
    }
  });

  function lightbox(src, alt) {
    const d = document.createElement('div'); d.className = 'lb';
    d.innerHTML = `<button class="x" aria-label="✕">✕</button><img src="${src}" alt="${esc(alt)}"><div class="hint">${T('zoomHint')}</div>`;
    d.addEventListener('click', ev => { if (ev.target.tagName === 'IMG') d.classList.toggle('z'); else d.remove(); });
    document.body.appendChild(d);
  }

  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

  if ('serviceWorker' in navigator && !window.SZVERS_SINGLE && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            const bar = document.createElement('div'); bar.className = 'update-bar';
            bar.innerHTML = `<span>🔄 ${T('updateReady')}</span><button>${T('updateBtn')}</button>`;
            bar.querySelector('button').addEventListener('click', () => location.reload());
            document.body.appendChild(bar);
          }
        });
      });
    }).catch(() => { }));
  }
  const sp = document.getElementById('splash');
  if (sp) {
    const MIN_SPLASH = 650; // минимум показа, чтобы анимация успела «сыграть»
    const t0 = Date.now();
    const hide = () => {
      const wait = Math.max(0, MIN_SPLASH - (Date.now() - t0));
      setTimeout(() => { sp.classList.add('off'); setTimeout(() => sp.remove(), 340); }, wait);
    };
    if (document.readyState === 'complete') hide(); else window.addEventListener('load', hide);
  }
  route();
})();
