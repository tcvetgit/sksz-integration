(function () {
  'use strict';
  const D = window.SZVERS, CH = D.chapters;
  const IN = window.SZVERS_INST || { insts: [] };
  const Q = (window.SZVERS_Q || []).map((r, i) => ({ id: i, c: r[0], q: r[1], ok: r[2], bad: r[3], e: r[4] }));
  const chById = Object.fromEntries(CH.map(c => [c.id, c]));
  const PASS = 95, EXAM_N = Q.length;
  const KEY = 'szvers.v2';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

  // ---------- i18n
  const LANGS = [
    { id: 'ru', name: 'Русский', flag: '🇷🇺' },
    { id: 'kk', name: 'Қазақша', flag: '🇰🇿' },
    { id: 'ky', name: 'Кыргызча', flag: '🇰🇬' },
    { id: 'en', name: 'English', flag: '🇬🇧' }
  ];
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
    examDesc: 'По {n1} случайных вопросов из каждой главы ({n2} всего в банке — в экзамен попадёт не более {n3}). Для сдачи нужно 95% правильных ответов.',
    best: 'Лучший результат:', never: 'ещё не сдавал', startExam: 'Начать экзамен', wrongTitle: 'Работа над ошибками', chTests: 'Тест по главам',
    questionsOf: '{a} вопросов из {b}', lastAttempts: 'Последние попытки', yourAnswer: '✗ Твой ответ:', correctAnswer: '✓ Правильно:',
    explain: '📖', nextQ: 'Следующий вопрос →', showResult: 'Показать результат', openChapter: '📖 Открыть главу',
    correct: '✅ Верно!', incorrect: '❌ Неверно', correctWas: 'Правильный ответ:', result: 'Результат',
    examPassed: 'Экзамен сдан! 🎉', examFailed: 'Экзамен не сдан', great: 'Отличный результат!', repeat: 'Нужно повторить',
    threshold: 'Порог сдачи — 95%.', time: 'Время:', again: '🔄 Пройти ещё раз', toTests: 'К списку тестов',
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
    langChanged: 'Язык изменён'
  };

  // ---------- storage
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.read = S.read || {}; S.best = S.best || {}; S.wrong = S.wrong || {}; S.hist = S.hist || [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
  if (!S.dev) { S.dev = 'D-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); save(); }

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
    const tabs = [['learn', '📚', T('tabs_learn')], ['test', '📝', T('tabs_test')], ['inst', '📋', T('tabs_inst')], ['cheat', '⚡', T('tabs_cheat')], ['more', '⋯', T('tabs_more')]];
    const tabEls = tabs.map(([k, i, t]) => `<a href="#/${k}" class="${tab === k ? 'on' : ''}"><span class="ic">${i}</span>${t}</a>`).join('');
    app.innerHTML = `<header class="topbar">${back}<h1>${title}</h1>${badge}</header><main class="${sameScreen ? '' : 'anim'}">${body}</main><nav class="tabbar"><div class="in">${tabEls}<div class="pill"></div></div></nav>`;
    requestAnimationFrame(() => movePill(true));
    window.scrollTo(0, 0);
  }

  // ---------- Обучение
  function viewLearn() {
    const n = CH.filter(c => S.read[c.id]).length, pct = Math.round(n / CH.length * 100);
    const ins = (!isStandalone() && !S.hideInstall) ? `<div class="banner">📲 ${T('installBanner')}<button data-go="#/more">${T('installHow')}</button></div>` : '';
    const langBanner = `<div class="banner lang-banner"><a class="lang-link" href="#/lang">🌐 ${T('langTitle')}<span class="lang-cur">${LANGS.find(l => l.id === (S.lang || 'ru')).name}</span><span class="lnk-arr">›</span></a></div>`;
    const items = CH.map((c, i) => {
      const tr = tch(c.id);
      return `<a class="item" href="#/ch/${c.id}"><div class="ic">${c.icon}</div><div class="tt"><b>${i + 1}. ${tr.t}</b><span>${tr.s}</span></div>${S.read[c.id] ? '<span class="done"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '<span class="todo"></span>'}</a>`;
    }).join('');
    shell(T('learnTitle'), `${ins}${langBanner}
<div class="large-title"><h2>${T('largeTitle')}</h2><p>СК «Северная Звезда» · Лемана ПРО</p></div>
<div class="hero"><small>${T('heroSmall')}</small><h2>${T('heroTitle')}</h2>
<div class="pbar"><i style="width:${pct}%"></i></div><div class="row"><span>${T('studied', { n, m: CH.length })}</span><span>${pct}%</span></div></div>
<div class="sec-t">${T('chapters')}</div><div class="list">${items}</div>`, { tab: 'learn' });
  }

  function viewChapter(id) {
    const c = chById[id]; if (!c) return go('#/learn');
    const i = CH.indexOf(c), next = CH[i + 1], prev = CH[i - 1];
    const tr = tch(id);
    shell(tr.t, `<article class="content">${tHtmlCh(id)}</article>
<div class="chap-nav">
<button class="btn" data-act="read" data-id="${id}">${S.read[id] ? T('markReadDone') : T('markRead')}</button>
<div class="btn-row">${prev ? `<a class="btn prev" href="#/ch/${prev.id}">${T('prev')}</a>` : '<span class="ph"></span>'}${next ? `<a class="btn next" href="#/ch/${next.id}">${T('next')}</a>` : '<span class="ph"></span>'}</div>
</div>`, { tab: 'learn', back: '#/learn', badge: `${i + 1}/${CH.length}` });
  }

  // ---------- Тесты
  const CH_N = 4; // максимум вопросов на категорию
  function startQuiz(mode, id) {
    let qs, title;
    if (mode === 'exam') { qs = shuffle(CH.map(c => shuffle(Q.filter(q => q.c === c.id)).slice(0, CH_N)).flat()); title = T('exam'); }
    else if (mode === 'ch') { qs = shuffle(Q.filter(q => q.c === id)).slice(0, CH_N); title = T('chapter') + ': ' + tch(id).t; }
    else if (mode === 'wrong') { qs = shuffle(Q.filter(q => S.wrong[q.id])); title = T('wrongTitle'); if (!qs.length) return toast('🎉'); }
    else return;
    quiz = { mode, id, title, qs: shuffle(qs).map(q => ({ ...q, ...tQ(q), opts: null })), i: 0, ans: [], t0: Date.now() };
    quiz.qs.forEach(q => { q.opts = shuffle([q.ok, ...q.bad]); });
    go('#/quiz');
  }

  function viewTest() {
    const be = S.best.exam, wrongN = Object.keys(S.wrong).length;
    const tiles = CH.map(c => {
      const n = Q.filter(q => q.c === c.id).length, b = S.best['ch:' + c.id];
      return `<button class="item" data-act="quiz-ch" data-id="${c.id}"><div class="ic">${c.icon}</div><div class="tt"><b>${tch(c.id).t}</b><span>${T('questionsOf', { a: Math.min(n, CH_N), b: n })}</span></div><span class="st">${b != null ? (b >= PASS ? '✅ ' : '') + b + '%' : '—'}</span></button>`;
    }).join('');
    const last = S.hist.slice(-5).reverse().map(h => `<div class="kv with-num"><div class="k" style="min-width:52px">${h.p}%</div><div class="v">${esc(h.t)}<br><span class="muted small">${new Date(h.d).toLocaleString('ru-RU')}</span></div></div>`).join('');
    shell(T('examPrep'), `
<div class="examcard"><h2>🎓 ${T('exam')}</h2><p>${T('examDesc', { n1: CH_N, n2: EXAM_N, n3: CH.length * CH_N })}</p>
<p>${T('best')} <b>${be != null ? be + '%' : T('never')}</b></p><button class="btn light" data-act="exam">${T('startExam')}</button></div>
<div class="grid2" style="margin-top:12px">
<button class="tile" data-act="wrong"><div class="n">${wrongN}</div><div class="d">${T('wrongTitle')}</div></button></div>
<div class="sec-t">${T('chTests')}</div><div class="list">${tiles}</div>
${last ? `<div class="sec-t">${T('lastAttempts')}</div><div class="cheat">${last}</div>` : ''}`, { tab: 'test' });
  }

  function viewQuiz() {
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
    shell(quiz.title, `<div class="qprog"><span>${quiz.i + 1} / ${n}</span><div class="bar"><i style="width:${(quiz.i + (a ? 1 : 0)) / n * 100}%"></i></div><span>✓ ${right}</span></div>
<div class="qcard"><div class="qchap">${chById[q.c].icon} ${esc(tch(q.c).t)}</div><div class="qtext">${esc(q.q)}</div>${opts}${fb}</div>`,
      { tab: 'test', back: '#/test' });
  }

  function answer(k) {
    const q = quiz.qs[quiz.i]; if (quiz.ans[quiz.i]) return;
    const pick = q.opts[k], ok = pick === q.ok;
    quiz.ans[quiz.i] = { pick, ok };
    if (ok) delete S.wrong[q.id]; else S.wrong[q.id] = 1;
    save(); viewQuiz();
    const fb = $('.fb'); if (fb) fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (navigator.vibrate && !ok) navigator.vibrate(60);
  }

  function viewResult() {
    const n = quiz.qs.length, r = quiz.ans.filter(x => x && x.ok).length, p = Math.round(r / n * 100);
    if (!quiz.saved) {
      quiz.saved = true;
      const key = quiz.mode === 'exam' ? 'exam' : quiz.mode === 'ch' ? 'ch:' + quiz.id : quiz.mode;
      S.best[key] = Math.max(S.best[key] || 0, p);
      S.hist.push({ t: quiz.title, p, d: Date.now() }); S.hist = S.hist.slice(-30); save();
      const dur = Math.round((Date.now() - quiz.t0) / 1000);
      quiz.rec = { rid: S.dev + '-' + Date.now().toString(36), ts: Date.now(), type: quiz.title, correct: r, total: n, percent: p, passed: quiz.mode === 'exam' ? (p >= PASS) : null, duration: dur, device: S.dev, app: 'szvers-2.0' };
      if (quiz.mode === 'exam' && p >= PASS) setTimeout(confetti, 350);
    }
    const pass = p >= PASS, col = pass ? 'var(--brand)' : 'var(--red)';
    const mist = quiz.qs.map((q, i) => ({ q, a: quiz.ans[i] })).filter(x => !x.a.ok);
    const ml = mist.map(({ q, a }) => `<div class="mist"><div class="qq">${esc(q.q)}</div><div class="yr">${T('yourAnswer')} ${esc(a.pick)}</div><div class="cr">${T('correctAnswer')} ${esc(q.ok)}</div><div class="ex">${T('explain')} ${esc(q.e)}</div></div>`).join('');
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
        const icons = { tech: '🚜', inloker: '🗄️', goodt: '⏱️', facts: '🔢', slang: '🗣️', terms: '📖' };
        blocks = ['tech', 'inloker', 'goodt', 'facts', 'slang', 'terms'].map(k => {
          const b = pack.cheat[k];
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
        blk('🔢', 'Ключевые цифры и факты', `${kv('Запомнить', '🚫 Не нажимай «Запомнить меня» — ТСД каждую смену новый.')}${kv('ТСД', 'Показывает задания, ведёт по складу, сканирует ШК, подтверждает действия, печатает этикетки.')}${kv('АБК', 'Столовая · раздевалка · комната отдыха · ценные вещи · LKK · медкабинет · брифинг · эвакуация · ОКО · Инлокер.')}${kv('Одежда', 'Спецодежда без повреждений, по размеру, застёгнута; защитная обувь по сезону; светоотражающий жилет; безопасный нож; перчатки.')}`),
        `<div class="cheat" style="border-left:4px solid var(--red)"><h3>🚨 ЧС — порядок действий</h3>${['Немедленно прекрати работу.', 'Убедись в безопасности себя и окружающих.', 'Оповести руководителя.', 'Вызови помощь по внутреннему каналу связи или телефону.', 'При необходимости эвакуируйся согласно плану эвакуации.'].map((t, i) => `<div class="kv with-num"><span class="pillnum">${i + 1}</span><div class="v">${t}</div></div>`).join('')}<a class="btn sec" href="#/ch/emergency">Глава про ЧС</a></div>`,
        blk('🗣️', 'Народные названия отделов и процессов', `${kv('ХД / XD / КРОСС', 'Отдел КРОСС-ДОК')}${kv('Ручка / Раздел / ЕЗ / ББХД', 'НЕ автоматизированная часть отдела ЕДИНЫЙ ЗАКАЗ')}${kv('Станция / Адапто / Пал / Депал', 'АВТОМАТИЗИРОВАННАЯ часть отдела ЕДИНЫЙ ЗАКАЗ — ADAPTO')}${kv('СТОК / Сборка / Пикинг', 'Отдел ИМПОРТ')}${kv('Отгрузка / Накатка / Раунды / Загрузка', 'Отдел ОТГРУЗКА')}`),
        blk('📖', 'Прочие расшифровки', `${kv('СиСиха / Сишка', 'Наклейка, несущая основной штрихкод паллеты')}${kv('Пистолет / Тэха', 'Терминал сбора данных (ТСД), основной рабочий инструмент сборщика')}${kv('Циклоп', 'Автоматическая машина оплачивания паллет')}${kv('МД', 'Мастер-данные товара: вес, размер, вложимость и т. п.')}${kv('Сброс', 'Принудительный системный сброс задания')}${kv('ПЦБ / PCB', 'Метод отбора товара — упаковка')}${kv('СПЦБ / SPCB', 'Метод отбора товара — подупаковка')}${kv('Inner / Unit (Штука)', 'Метод отбора товара — штучный (короб)')}${kv('ОПВС', 'Отдел предотвращения внештатных ситуаций (служба безопасности склада)')}`)
      ];
    }
    shell(T('cheatTitle'), blocks.join('\n'), { tab: 'cheat' });
  }

  // ---------- Язык
  function viewLang() {
    const items = LANGS.map(l => `<button class="item lang-item ${((S.lang || 'ru') === l.id) ? 'lang-on' : ''}" data-act="lang" data-lang="${l.id}"><div class="ic">${l.flag}</div><div class="tt"><b>${l.name}</b><span>${l.id.toUpperCase()}</span></div>${(S.lang || 'ru') === l.id ? '<span class="done"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '<span class="todo"></span>'}</button>`).join('');
    shell(T('langTitle'), `<div class="large-title"><h2>${T('langTitle')}</h2><p>${T('langHint')}</p></div><div class="list">${items}</div>`, { tab: 'more' });
  }

  // ---------- Ещё
  function viewMore() {
    const lang = S.lang || 'ru';
    const langRow = `<a class="item" href="#/lang"><div class="ic">🌐</div><div class="tt"><b>${T('langTitle')}</b><span>${T('langHint')}</span></div><span class="st">${LANGS.find(l => l.id === lang).name}</span></a>`;
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
<button class="btn ghost" data-act="reset">${T('reset')}</button><p class="small muted">${T('deviceId')} ${S.dev}</p></div>
<div class="inst"><h3>${T('about')}</h3><p class="small">${T('aboutText')}</p>
<p class="small muted">${T('bank', { q: Q.length, c: CH.length })}</p></div>`, { tab: 'more' });
  }

  // ---------- Инструкции по отделам (без тестов)
  function viewInst() {
    const items = IN.insts.map(i => { const tr = tinst(i.id); return `<a class="item" href="#/doc/${i.id}"><div class="ic">${i.icon}</div><div class="tt"><b>${tr.t}</b><span>${tr.s}</span></div><span class="todo"></span></a>`; }).join('');
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
    if (c) { const t = c.dataset.copy; (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Скопировано'), () => toast(t)); return; }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); return go(g.dataset.go); }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, id = b.dataset.id;
    if (act === 'read') { S.read[id] = !S.read[id]; save(); if (S.read[id]) { toast('Глава отмечена как изученная ✓'); if (CH.every(c => S.read[c.id])) setTimeout(confetti, 350); } const sy = window.scrollY; viewChapter(id); window.scrollTo(0, sy); }
    else if (act === 'quiz-ch') startQuiz('ch', id);
    else if (act === 'exam') startQuiz('exam');
    else if (act === 'wrong') startQuiz('wrong');
    else if (act === 'ans') answer(+b.dataset.k);
    else if (act === 'next') { quiz.i++; viewQuiz(); }
    else if (act === 'again') startQuiz(quiz.mode, quiz.id);
    else if (act === 'install' && deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    else if (act === 'lang') setLang(b.dataset.lang);
    else if (act === 'reset') { if (confirm(T('confirmReset'))) { S = { read: {}, dev: S.dev, lang: S.lang }; save(); viewMore(); toast(T('resetDone')); } }
  });

  function lightbox(src, alt) {
    const d = document.createElement('div'); d.className = 'lb';
    d.innerHTML = `<button class="x" aria-label="Закрыть">✕</button><img src="${src}" alt="${esc(alt)}"><div class="hint">Нажми на изображение — увеличить/уменьшить</div>`;
    d.addEventListener('click', ev => { if (ev.target.tagName === 'IMG') d.classList.toggle('z'); else d.remove(); });
    document.body.appendChild(d);
  }

  function isStandalone() { return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredPrompt = e; });

  if ('serviceWorker' in navigator && !window.SZVERS_SINGLE && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
  }
  route();
})();
