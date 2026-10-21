(function () {
  'use strict';
  const D = window.SZVERS, CH = D.chapters;
  const Q = (window.SZVERS_Q || []).map((r, i) => ({ id: i, c: r[0], q: r[1], ok: r[2], bad: r[3], e: r[4] }));
  const chById = Object.fromEntries(CH.map(c => [c.id, c]));
  const PASS = 95, EXAM_N = Q.length;
  const KEY = 'szvers.v2';
  const $ = (s, el = document) => el.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

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
    const tabs = [['learn', '📚', 'Обучение'], ['test', '📝', 'Тест'], ['cheat', '⚡', 'Шпаргалка'], ['more', '⋯', 'Ещё']];
    const tabEls = tabs.map(([k, i, t]) => `<a href="#/${k}" class="${tab === k ? 'on' : ''}"><span class="ic">${i}</span>${t}</a>`).join('');
    app.innerHTML = `<header class="topbar">${back}<h1>${title}</h1>${badge}</header><main class="${sameScreen ? '' : 'anim'}">${body}</main><nav class="tabbar"><div class="in">${tabEls}<div class="pill"></div></div></nav>`;
    requestAnimationFrame(() => movePill(true));
    window.scrollTo(0, 0);
  }

  // ---------- Обучение
  function viewLearn() {
    const n = CH.filter(c => S.read[c.id]).length, pct = Math.round(n / CH.length * 100);
    const ins = (!isStandalone() && !S.hideInstall) ? `<div class="banner">📲 Установи приложение на телефон — будет работать без интернета.<button data-go="#/more">Как?</button></div>` : '';
    const items = CH.map((c, i) => {
      return `<a class="item" href="#/ch/${c.id}"><div class="ic">${c.icon}</div><div class="tt"><b>${i + 1}. ${c.title}</b><span>${c.sub}</span></div>${S.read[c.id] ? '<span class="done"><svg viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' : '<span class="todo"></span>'}</a>`;
    }).join('');
    shell('Инструкция СЗ', `${ins}
<div class="large-title"><h2>Обучение</h2><p>СК «Северная Звезда» · Лемана ПРО</p></div>
<div class="hero"><small>Инструкция для сотрудника склада</small><h2>Техника · Инлокер · Goodt Time · Безопасность</h2>
<div class="pbar"><i style="width:${pct}%"></i></div><div class="row"><span>Изучено ${n} из ${CH.length} глав</span><span>${pct}%</span></div></div>
<div class="sec-t">Главы</div><div class="list">${items}</div>`, { tab: 'learn' });
  }

  function viewChapter(id) {
    const c = chById[id]; if (!c) return go('#/learn');
    const i = CH.indexOf(c), next = CH[i + 1], prev = CH[i - 1];
    shell(c.title, `<article class="content">${c.html}</article>
<div class="chap-nav">
<button class="btn" data-act="read" data-id="${id}">${S.read[id] ? '✓ Глава изучена' : 'Отметить как изученную ✓'}</button>
<div class="btn-row">${prev ? `<a class="btn prev" href="#/ch/${prev.id}">‹ Назад</a>` : '<span class="ph"></span>'}${next ? `<a class="btn next" href="#/ch/${next.id}">Далее ›</a>` : '<span class="ph"></span>'}</div>
</div>`, { tab: 'learn', back: '#/learn', badge: `${i + 1}/${CH.length}` });
  }

  // ---------- Тесты
  const CH_N = 4; // максимум вопросов на категорию
  function startQuiz(mode, id) {
    let qs, title;
    if (mode === 'exam') { qs = shuffle(CH.map(c => shuffle(Q.filter(q => q.c === c.id)).slice(0, CH_N)).flat()); title = 'Экзамен'; }
    else if (mode === 'ch') { qs = shuffle(Q.filter(q => q.c === id)).slice(0, CH_N); title = 'Тест: ' + chById[id].title; }
    else if (mode === 'wrong') { qs = shuffle(Q.filter(q => S.wrong[q.id])); title = 'Работа над ошибками'; if (!qs.length) return toast('Ошибок нет — отлично! 🎉'); }
    else return;
    quiz = { mode, id, title, qs: shuffle(qs).map(q => ({ ...q, opts: shuffle([q.ok, ...q.bad]) })), i: 0, ans: [], t0: Date.now() };
    go('#/quiz');
  }

  function viewTest() {
    const be = S.best.exam, wrongN = Object.keys(S.wrong).length;
    const tiles = CH.map(c => {
      const n = Q.filter(q => q.c === c.id).length, b = S.best['ch:' + c.id];
      return `<button class="item" data-act="quiz-ch" data-id="${c.id}"><div class="ic">${c.icon}</div><div class="tt"><b>${c.title}</b><span>${Math.min(n, CH_N)} вопросов из ${n}</span></div><span class="st">${b != null ? (b >= PASS ? '✅ ' : '') + b + '%' : '—'}</span></button>`;
    }).join('');
    const last = S.hist.slice(-5).reverse().map(h => `<div class="kv with-num"><div class="k" style="min-width:52px">${h.p}%</div><div class="v">${esc(h.t)}<br><span class="muted small">${new Date(h.d).toLocaleString('ru-RU')}</span></div></div>`).join('');
    shell('Подготовка к экзамену', `
<div class="examcard"><h2>🎓 Экзамен</h2><p>По ${CH_N} случайных вопросов из каждой главы (${EXAM_N} всего в банке — в экзамен попадёт не более ${CH.length * CH_N}). Для сдачи нужно ${PASS}% правильных ответов.</p>
<p>Лучший результат: <b>${be != null ? be + '%' : 'ещё не сдавал'}</b></p><button class="btn light" data-act="exam">Начать экзамен</button></div>
<div class="grid2" style="margin-top:12px">
<button class="tile" data-act="wrong"><div class="n">${wrongN}</div><div class="d">Работа над ошибками</div></button></div>
<div class="sec-t">Тест по главам</div><div class="list">${tiles}</div>
${last ? `<div class="sec-t">Последние попытки</div><div class="cheat">${last}</div>` : ''}`, { tab: 'test' });
  }

  function viewQuiz() {
    if (!quiz) return go('#/test');
    if (quiz.i >= quiz.qs.length) return viewResult();
    const q = quiz.qs[quiz.i], n = quiz.qs.length, a = quiz.ans[quiz.i];
    const L = 'АБВГ';
    const opts = q.opts.map((o, k) => {
      let cls = '';
      if (a) { if (o === q.ok) cls = 'ok'; else if (o === a.pick) cls = 'bad'; else cls = 'dim'; }
      return `<button class="opt ${cls}" data-act="ans" data-k="${k}" ${a ? 'disabled' : ''}><span class="l">${L[k]}</span><span>${esc(o)}</span></button>`;
    }).join('');
    const fb = a ? `<div class="fb ${a.ok ? 'ok' : 'bad'}"><b>${a.ok ? '✅ Верно!' : '❌ Неверно'}</b>${a.ok ? '' : `<div style="margin-bottom:6px">Правильный ответ: <b style="display:inline">${esc(q.ok)}</b></div>`}<div class="q">${esc(q.e)}</div></div>
<button class="btn" data-act="next">${quiz.i + 1 < n ? 'Следующий вопрос →' : 'Показать результат'}</button>
<button class="btn sec" data-go="#/ch/${q.c}">📖 Открыть главу «${esc(chById[q.c].title)}»</button>` : '';
    const right = quiz.ans.filter(x => x && x.ok).length;
    shell(quiz.title, `<div class="qprog"><span>${quiz.i + 1} / ${n}</span><div class="bar"><i style="width:${(quiz.i + (a ? 1 : 0)) / n * 100}%"></i></div><span>✓ ${right}</span></div>
<div class="qcard"><div class="qchap">${chById[q.c].icon} ${esc(chById[q.c].title)}</div><div class="qtext">${esc(q.q)}</div>${opts}${fb}</div>`,
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
    const ml = mist.map(({ q, a }) => `<div class="mist"><div class="qq">${esc(q.q)}</div><div class="yr">✗ Твой ответ: ${esc(a.pick)}</div><div class="cr">✓ Правильно: ${esc(q.ok)}</div><div class="ex">📖 ${esc(q.e)}</div></div>`).join('');
    const title = quiz.mode === 'exam' ? (pass ? 'Экзамен сдан! 🎉' : 'Экзамен не сдан') : (pass ? 'Отличный результат!' : 'Нужно повторить');
    shell('Результат', `<div class="qcard res"><div class="ring" style="background:conic-gradient(${col} ${p * 3.6}deg,var(--bd) 0)"><span>${p}%<small>${r} из ${n}</small></span></div>
<h2 class="${pass ? 'pass' : 'fail'}">${title}</h2><p class="muted">${quiz.title}. Порог сдачи — ${PASS}%.</p>
<p class="muted small">Время: ${fmtDur(quiz.rec.duration)} · ${new Date(quiz.rec.ts).toLocaleString('ru-RU')}</p>
<button class="btn" data-act="again">🔄 Пройти ещё раз</button><button class="btn sec" data-go="#/test">К списку тестов</button></div>
${mist.length ? `<div class="sec-t">Разбор ошибок (${mist.length})</div>${ml}` : '<div class="sec-t">Ошибок нет — так держать! 💪</div>'}`, { tab: 'test', back: '#/test' });
  }

  // ---------- Шпаргалка
  function viewCheat() {
    shell('Шпаргалка', `
<div class="cheat"><h3>🚜 Техника — 3 категории</h3>
<div class="kv"><div class="k">Без допуска</div><div class="v">Рохля — после инструктажа бригадира. Осмотри колёса, не перегружай (до 1000–2000 кг), опусти вилы перед толканием, не катайся.</div></div>
<div class="kv"><div class="k">До 4 кВт</div><div class="v">Мулинет, поводковый штабелёр (до 2 м) — допуск + протокол проверки знаний + инструктаж. Не возити людей; закончив — опусти вилы, вытащи ключ.</div></div>
<div class="kv"><div class="k">Свыше 4 кВт</div><div class="v">Ричтрак (до 8–12 м), погрузчик — удостоверение тракториста-машиниста + допуск. Без удостоверения не садись даже «просто попробовать».</div></div>
<div class="kv"><div class="k">Нестандарт</div><div class="v">Звук, дым, вибрация — немедленно останови работу и сообщи бригадиру.</div></div></div>

<div class="cheat"><h3>🗄️ Инлокер — кратко</h3>
<div class="kv"><div class="k">Взять</div><div class="v">Бейдж к считывателю (или PIN) → шкаф назначает ТСД, ячейка открывается → достань → закрой ячейку → проверь: экран, сканер, корпус.</div></div>
<div class="kv"><div class="k">Сдать</div><div class="v">Бейдж → QR/ШК на ТСД → «Исправен»/«Неисправен» (тип поломки) → подтвердить → первая свободная ячейка → закрыть.</div></div>
<div class="kv"><div class="k">Перерыв</div><div class="v">ТСД можно оставить в Инлокере — опция «Временное хранение».</div></div>
<div class="kv"><div class="k">Проблема</div><div class="v">Забыл/не открывается/не считается — бейдж ещё раз или бригадир через панель администратора.</div></div></div>

<div class="cheat"><h3>⏱️ Goodt Time (LKK) — кратко</h3>
<div class="kv"><div class="k">Сервер</div><div class="v"><code class="copy" data-copy="https://time.lemanapro.ru/api/v1">https://time.lemanapro.ru/api/v1</code> → «Сохранить» → логин/пароль → «Войти»</div></div>
<div class="kv"><div class="k">Приход</div><div class="v">«Начать» → сканирование QR-кода → подтверждение</div></div>
<div class="kv"><div class="k">Перерыв</div><div class="v">«Начать перерыв» → «Да» → QR-код → ждать сообщения → «Завершить перерыв» → QR-код → ждать сообщения</div></div>
<div class="kv"><div class="k">Уход</div><div class="v">«Завершить смену» → QR-код → подтверждение</div></div>
<p class="small muted">QR-код — у входа в зону работы. Нет отметки прихода — смена не зафиксирована; нет отметки ухода — неявка; одна отметка перерыва — ошибки в учёте. Проблемы — сразу к руководителю.</p></div>

<div class="cheat"><h3>🔢 Ключевые цифры и факты</h3>
<div class="kv"><div class="k">Запомнить</div><div class="v">🚫 Не нажимай «Запомнить меня» — ТСД каждую смену новый.</div></div>
<div class="kv"><div class="k">ТСД</div><div class="v">Показывает задания, ведёт по складу, сканирует ШК, подтверждает действия, печатает этикетки.</div></div>
<div class="kv"><div class="k">АБК</div><div class="v">Столовая · раздевалка · комната отдыха · ценные вещи · LKK · медкабинет · брифинг · эвакуация · ОКО · Инлокер.</div></div>
<div class="kv"><div class="k">Одежда</div><div class="v">Спецодежда без повреждений, по размеру, застёгнута; защитная обувь по сезону; светоотражающий жилет; безопасный нож; перчатки.</div></div></div>

<div class="cheat" style="border-left:4px solid var(--red)"><h3>🚨 ЧС — порядок действий</h3>
${['Немедленно прекрати работу.', 'Убедись в безопасности себя и окружающих.', 'Оповести руководителя.', 'Вызови помощь по внутреннему каналу связи или телефону.', 'При необходимости эвакуируйся согласно плану эвакуации.'].map((t, i) => `<div class="kv with-num"><span class="pillnum">${i + 1}</span><div class="v">${t}</div></div>`).join('')}
<a class="btn sec" href="#/ch/emergency">Глава про ЧС</a></div>

<div class="cheat"><h3>🗣️ Народные названия отделов и процессов</h3>
<div class="kv"><div class="k">ХД / XD / КРОСС</div><div class="v">Отдел КРОСС-ДОК</div></div>
<div class="kv"><div class="k">Ручка / Раздел / ЕЗ / ББХД</div><div class="v">НЕ автоматизированная часть отдела ЕДИНЫЙ ЗАКАЗ</div></div>
<div class="kv"><div class="k">Станция / Адапто / Пал / Депал</div><div class="v">АВТОМАТИЗИРОВАННАЯ часть отдела ЕДИНЫЙ ЗАКАЗ — ADAPTO</div></div>
<div class="kv"><div class="k">СТОК / Сборка / Пикинг</div><div class="v">Отдел ИМПОРТ</div></div>
<div class="kv"><div class="k">Отгрузка / Накатка / Раунды / Загрузка</div><div class="v">Отдел ОТГРУЗКА</div></div></div>

<div class="cheat"><h3>📖 Прочие расшифровки</h3>
<div class="kv"><div class="k">СиСиха / Сишка</div><div class="v">Наклейка, несущая основной штрихкод паллеты</div></div>
<div class="kv"><div class="k">Пистолет / Тэха</div><div class="v">Терминал сбора данных (ТСД), основной рабочий инструмент сборщика</div></div>
<div class="kv"><div class="k">Циклоп</div><div class="v">Автоматическая машина оплачивания паллет</div></div>
<div class="kv"><div class="k">МД</div><div class="v">Мастер-данные товара: вес, размер, вложимость и т. п.</div></div>
<div class="kv"><div class="k">Сброс</div><div class="v">Принудительный системный сброс задания</div></div>
<div class="kv"><div class="k">ПЦБ / PCB</div><div class="v">Метод отбора товара — упаковка</div></div>
<div class="kv"><div class="k">СПЦБ / SPCB</div><div class="v">Метод отбора товара — подупаковка</div></div>
<div class="kv"><div class="k">Inner / Unit (Штука)</div><div class="v">Метод отбора товара — штучный (короб)</div></div>
<div class="kv"><div class="k">ОПВС</div><div class="v">Отдел предотвращения внештатных ситуаций (служба безопасности склада)</div></div></div>`, { tab: 'cheat' });
  }

  // ---------- Ещё
  function viewMore() {
    shell('Ещё', `
<div class="inst"><h3>📲 Установка на телефон</h3>
<p class="small muted">${isStandalone() ? '✅ Приложение уже установлено.' : 'После установки иконка появится на главном экране, приложение будет работать без интернета.'}</p>
${deferredPrompt ? '<button class="btn" data-act="install">Установить приложение</button>' : ''}
<b>Android (Chrome):</b><ol><li>Открой ссылку на приложение в Chrome.</li><li>Нажми меню <b>⋮</b> (справа вверху).</li><li>Выбери <b>«Добавить на главный экран»</b> или <b>«Установить приложение»</b>.</li></ol>
<b>iPhone (Safari):</b><ol><li>Открой ссылку в <b>Safari</b>.</li><li>Нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх).</li><li>Выбери <b>«На экран „Домой“»</b> → «Добавить».</li></ol>
<p class="small muted">Если у тебя файл <b>szvers-instrukciya.html</b> — просто открой его в браузере телефона: всё работает офлайн, прогресс сохраняется в этом браузере.</p></div>
<div class="inst"><h3>📊 Мой прогресс</h3>
<p>Изучено глав: <b>${CH.filter(c => S.read[c.id]).length} из ${CH.length}</b><br>Лучший результат экзамена: <b>${S.best.exam != null ? S.best.exam + '%' : '—'}</b><br>Вопросов в работе над ошибками: <b>${Object.keys(S.wrong).length}</b></p>
<button class="btn ghost" data-act="reset">Сбросить прогресс</button><p class="small muted">ID устройства: ${S.dev}</p></div>
<div class="inst"><h3>ℹ️ О приложении</h3><p class="small">Учебное приложение по документу «Инструкция для сотрудника склада» (ООО «Ле Монлид», Лемана ПРО, СК «Северная Звезда»), версия документа 1.0. Все правила и вопросы взяты из текста инструкции. При расхождении действует актуальная инструкция и указания бригадира.</p>
<p class="small muted">Банк вопросов: ${Q.length} · Глав: ${CH.length}</p></div>`, { tab: 'more' });
  }

  // ---------- routing
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  function route() {
    const h = location.hash.replace(/^#\/?/, '');
    const [p, a] = h.split('/');
    if (p === 'ch') viewChapter(a);
    else if (p === 'test') viewTest();
    else if (p === 'quiz') viewQuiz();
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
    else if (act === 'reset') { if (confirm('Сбросить весь прогресс?')) { S = { read: {}, dev: S.dev }; save(); viewMore(); toast('Прогресс сброшен'); } }
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
