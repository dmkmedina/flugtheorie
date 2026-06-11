/* Headless smoke-test harness for study-english.html (appended to a test copy). */
(function () {
  const out = [];
  const ok = (name, cond) => out.push((cond ? 'PASS' : 'FAIL') + ' ' + name);
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const click = el => el && el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const key = k => document.dispatchEvent(new KeyboardEvent('keydown', { key: k }));

  const shot = (location.hash.match(/^#shot=(\w+)/) || [])[1];
  if (shot) {
    if (shot === 'round') {
      click($('[data-action="quick"]'));
      const q = S.round.qs[0];
      click($$('[data-action="answer"]')[(q.correct + 1) % q.options.length]);
    } else if (shot === 'exam') {
      click($('[data-action="exam-setup"]'));
      click($$('[data-action="start-exam"]')[2]);
      click($$('[data-action="exam-answer"]')[0]);
    } else if (shot === 'result') {
      click($('[data-action="exam-setup"]'));
      click($$('[data-action="start-exam"]')[2]);
      S.exam.qs.forEach((q, i) => {
        S.exam.ans[i] = q.topic === 'Weather' ? (q.correct + 1) % q.options.length : q.correct;
      });
      submitExam(false);
    } else if (shot === 'cards') {
      click($('[data-action="cards"]'));
      click($('[data-action="flip"]'));
    }
    return;
  }

  try {
    ok('home renders altitude', !!$('.alt-value'));
    ok('5 topic cards', $$('.topic').length === 5);
    ok('first-run explainer shown', !!$('.first-run'));

    // practice round, all answered correctly
    click($('[data-action="quick"]'));
    ok('round starts with 10 questions', S.view === 'round' && S.round.qs.length === 10);
    ok('options rendered', $$('[data-action="answer"]').length >= 4);
    for (let i = 0; i < 10; i++) {
      if (S.view !== 'round') { out.push('step ' + i + ': view left round → ' + S.view); break; }
      const before = S.round.i;
      const q = S.round.qs[S.round.i];
      const btns = $$('[data-action="answer"]');
      click(btns[q.correct]);
      const revealed = S.round.revealed;
      click($('[data-action="round-next"]'));
      out.push(`step ${i}: i_before=${before} btns=${btns.length} correct=${q.correct} revealed_after_answer=${revealed} i_after=${S.round ? S.round.i : '-'} view=${S.view}`);
    }
    ok('round end reached', S.view === 'round-end');
    ok('recap rows rendered', $$('.rq').length === 10);
    ok('readiness grew', readiness() > 0);

    // wrong answer → explanation + review queue
    click($('[data-action="home"]'));
    click($('[data-action="quick"]'));
    const q0 = S.round.qs[0];
    click($$('[data-action="answer"]')[(q0.correct + 1) % q0.options.length]);
    ok('explanation shown on wrong answer', !q0.exp || !!$('.explain'));
    ok('keyboard Enter advances', (key('Enter'), S.round.i === 1));
    click($('[data-action="round-quit"]'));
    ok('quit mid-round shows summary of answered', S.view === 'round-end' && S.round.qs.length === 1);
    click($('[data-action="home"]'));
    ok('review queue has the miss', reviewQueue().length >= 1);
    click($('[data-action="review"]'));
    ok('review round starts', S.view === 'round' && S.round.mode === 'review');
    click($('[data-action="round-quit"]'));
    ok('quit with nothing answered goes home', S.view === 'home');

    // exam
    click($('[data-action="exam-setup"]'));
    ok('exam setup shows 3 presets', $$('[data-action="start-exam"]').length === 3);
    click($$('[data-action="start-exam"]')[2]);
    ok('exam live: 25 questions, 5 per topic', S.view === 'exam-live' && S.exam.qs.length === 25
      && TOPICS.every(t => S.exam.qs.filter(q => q.topic === t).length === 5));
    ok('clock renders', !!document.getElementById('clock'));
    key('1');
    ok('keyboard answers and advances', S.exam.ans[0] === 0 && S.exam.i === 1);
    key('f');
    ok('flag toggles', S.exam.flags[1] === true);
    click($$('[data-action="exam-jump"]')[5]);
    ok('navigator jump works', S.exam.i === 5);
    ok('live snapshot saved', !!P.live && P.live.n === 25);
    S.exam.qs.forEach((q, i) => { S.exam.ans[i] = q.correct; });
    click($('[data-action="exam-submit"]'));
    ok('submit confirm modal opens', !!S.modal);
    click($('[data-action="modal-ok"]'));
    ok('result view shown', S.view === 'exam-result');
    ok('pass banner', /PASSED/.test($('.result-banner').textContent));
    ok('5 section bars', $$('.bar-row').length === 5);
    ok('history recorded', P.exams.length === 1 && P.exams[0].pass === true);
    ok('live snapshot cleared', !P.live);

    // expired in-progress exam → gradeable from home banner
    P.live = { ids: QUESTIONS.slice(0, 25).map(q => q.id), ans: { 0: QUESTIONS[0].correct }, flags: {}, started: Date.now() - 99999 * 1000, dur: 1350, n: 25 };
    save(); S.view = 'home'; render();
    ok('expired banner offers submit', !!$('[data-action="expire-exam"]'));
    click($('[data-action="expire-exam"]'));
    ok('expired exam graded', S.view === 'exam-result' && P.exams.length === 2 && S.examResult.auto === true);

    // flashcards
    click($('[data-action="cards"]'));
    ok('cards view', S.view === 'cards' && !!$('.fc'));
    ok('grading disabled before flip', $('[data-action="card-got"]').disabled === true);
    click($('[data-action="flip"]'));
    ok('card flips', S.cards.flipped === true);
    click($('[data-action="card-got"]'));
    ok('"knew it" advances', S.cards.i === 1 && S.cards.got === 1);
    click($('[data-action="flip"]'));
    click($('[data-action="card-again"]'));
    ok('"again" requeues card', S.cards.deck.length === CARDS.length + 1 && S.cards.i === 2);
    click($$('[data-action="cards-cat"]')[1]);
    ok('category filter applies', S.cards.cat !== 'all' && S.cards.deck.every(c => c.cat === S.cards.cat));

    // persistence
    const raw = localStorage.getItem('cloudbase_en_v1');
    ok('state persisted to localStorage', !!raw && JSON.parse(raw).exams.length === 2);
  } catch (err) {
    out.push('THREW: ' + (err && err.stack || err));
  }

  const pre = document.createElement('pre');
  pre.id = 'test-output';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
})();
