/**
 * Practice and Quiz player.
 *  - Practice: instant feedback, hints, hero skills, explanation after each question.
 *  - Quiz: one shared timer, questions back-to-back, results at the end.
 */
import { h, mount, toast, floatText, burst, LETTERS, answerLabel, timerEl, startCountdown } from '../ui.js';
import { CHARACTERS, SKILL_CHARGES, streakMultiplier, applySkill } from '../characters.js';
import { profile, topicMastery } from '../state.js';
import { createScorer } from '../scoring.js';
import { go } from '../router.js';

export function renderPlay(app, config) {
  const { mode, questions } = config;
  const practice = mode === 'practice';
  const hero = CHARACTERS[profile.character];
  const scorer = createScorer(mode);
  const answers = [];
  const startedAt = Date.now();
  let index = 0;
  let charges = SKILL_CHARGES[mode];
  let deadline = config.timeLimit ? Date.now() + config.timeLimit * 1000 : null;
  let finished = false;

  // Per-question state, reset in show()
  let q, locked, usedHint, doubleXp, eliminated, notes;

  if (deadline && hero.id === 'explorer') {
    setTimeout(() => toast(hero.passive.name, hero.passive.text, { portrait: hero.portrait }), 300);
  }

  function show() {
    q = questions[index];
    locked = false;
    usedHint = false;
    doubleXp = false;
    eliminated = new Set();
    notes = [];
    draw();
  }

  function draw() {
    const mult = streakMultiplier(hero.id, scorer.streak);
    const card = h('article.q-card', {},
      h('div.q-meta', {},
        h('span.q-topic', {}, q.topicName),
        q.source === 'course' && h('span.q-source', { title: 'From your course practice questions' }, 'Course bank')),
      h('h2.q-text', { id: 'q-text' }, q.q),
      h('div.options', { role: 'group', 'aria-labelledby': 'q-text' }, q.options.map((opt, i) => optionButton(opt, i))),
      notes.map((n) => h(`div.note.${n.tone || 'insight'}`, {}, h('b', {}, n.title), h('p', {}, n.text))),
      practice && locked && feedback());

    mount(app,
      h('section.play', {},
        h('div.play-top', {},
          h('button.link', { onclick: quit }, '✕ Quit'),
          h('div.play-title', {}, h('b', {}, config.title), h('span', {}, `${practice ? 'Practice' : 'Quiz'} · ${config.subtitle}`)),
          deadline ? timerEl((deadline - Date.now()) / 1000) : h('span')),
        h('div.progress', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': questions.length, 'aria-valuenow': index + 1 },
          h('i', { style: { width: `${((index + (locked ? 1 : 0)) / questions.length) * 100}%` } })),
        h('div.play-bar', {},
          h('span.counter', {}, `Question ${index + 1} of ${questions.length}`),
          h('span.chip-stat', {}, `Session ${scorer.score.toLocaleString()} pts`),
          h('span.chip-stat.mult', { class: mult > 1 ? 'on' : '' }, `×${mult.toFixed(2)} streak`)),
        card,
        h('div.actions', {},
          h('button.btn.skill', {
            class: doubleXp ? 'active' : '',
            style: { '--c': hero.color },
            disabled: locked || charges === 0 || doubleXp,
            onclick: useSkill,
            title: hero.skill.text,
          }, h('span', { 'aria-hidden': 'true' }, hero.skill.icon), ` ${hero.skill.name}`, h('span.charges', {}, charges), h('kbd', {}, 'S')),
          practice && h('button.btn.ghost', { onclick: hint, disabled: locked || usedHint }, '💡 Hint', h('kbd', {}, 'H')),
          h('span.spacer'),
          !practice && h('button.btn.ghost', { onclick: () => choose(-1) }, 'Skip'))));
    if (practice && locked) app.querySelector('.next-btn')?.focus();
  }

  function optionButton(text, i) {
    let state = '';
    if (eliminated.has(i)) state = 'eliminated';
    if (locked && practice) {
      if (i === q.answer) state = 'correct';
      else if (i === answers[index]?.chosen) state = 'wrong';
      else state = 'dim';
    }
    return h('button.option', {
      type: 'button', class: state, disabled: locked || eliminated.has(i),
      onclick: (e) => choose(i, e.currentTarget),
    }, h('span.letter', {}, LETTERS[i]), h('span.opt-text', {}, text));
  }

  function feedback() {
    const a = answers[index];
    return h('div.feedback', { class: a.correct ? 'good' : 'bad', role: 'status' },
      h('div.feedback-head', {},
        h('b', {}, a.correct ? 'Correct!' : 'Not quite'),
        a.correct && h('span.earned', {}, `+${a.xp} XP · +${a.points} pts`)),
      !a.correct && h('p', {}, 'Correct answer: ', h('b', {}, answerLabel(q, q.answer))),
      h('p.explanation', {}, q.explanation),
      h('button.btn.primary.next-btn', { onclick: next }, index + 1 < questions.length ? 'Next question →' : 'See results →'));
  }

  // ---------------------------------------------------------------- actions
  function choose(i, el) {
    if (locked || finished) return;
    locked = true;
    const record = { chosen: i, correct: i === q.answer, usedHint, doubleXp, topicKey: q.topicKey, topicName: q.topicName };
    answers[index] = record;

    if (!practice) {
      el?.classList.add('picked');
      setTimeout(next, el ? 220 : 0);
      return;
    }
    const earned = scorer.settle(record);
    Object.assign(record, earned);
    draw();
    if (record.correct) {
      floatText(app.querySelector('.option.correct'), `+${earned.xp} XP`);
      streakToasts();
    } else {
      app.querySelector('.option.wrong')?.classList.add('shake');
    }
    if (earned.levels) {
      burst([hero.color, '#f6d77a', '#ffffff']);
      toast(`Level ${profile.level}!`, 'Your hero grows stronger.', { icon: '⭐', tone: 'level' });
    }
  }

  function streakToasts() {
    if (hero.id === 'warrior' && [3, 5, 10].includes(scorer.streak)) {
      toast(hero.passive.name, `${scorer.streak} in a row! XP ×${streakMultiplier(hero.id, scorer.streak).toFixed(1)}`, { portrait: hero.portrait });
    } else if ([5, 10].includes(scorer.streak)) {
      toast(`${scorer.streak} streak!`, 'Keep the chain going.', { icon: '🔥', tone: 'success' });
    }
  }

  function hint() {
    if (locked || usedHint) return;
    usedHint = true;
    notes.push({ tone: 'hint', title: 'Hint', text: q.hint });
    if (hero.id === 'sage') toast(hero.passive.name, hero.passive.text, { portrait: hero.portrait });
    draw();
  }

  function useSkill() {
    if (locked || charges === 0 || doubleXp) return;
    const message = applySkill(hero, q, {
      eliminated,
      notes,
      mastery: topicMastery(q.topicKey),
      timed: Boolean(deadline),
      addTime: (ms) => { deadline += ms; },
      armDoubleXp: () => { doubleXp = true; },
    });
    toast(hero.skill.name, message, { portrait: hero.portrait });
    charges -= 1;
    draw();
  }

  function next() {
    if (finished) return;
    if (index + 1 < questions.length) {
      index += 1;
      show();
    } else {
      finish();
    }
  }

  function finish() {
    if (finished) return;
    finished = true;
    stopTimer();
    // Unanswered questions (time ran out) count as wrong; Quiz answers are scored now.
    const items = questions.map((qq, i) => {
      const a = (answers[i] ||= { chosen: -1, correct: false, topicKey: qq.topicKey, topicName: qq.topicName });
      if (!practice) scorer.settle(a);
      return { ...qq, chosen: a.chosen, correct: a.correct };
    });
    go('results', scorer.results({ config, modeLabel: practice ? 'Practice' : 'Quiz', items, startedAt }));
  }

  function quit() {
    const kept = practice ? 'XP from answered questions is kept.' : 'This quiz will not be scored.';
    if (confirm(`Leave this session? ${kept}`)) go(config.origin);
  }

  function onKey(e) {
    if (e.target.matches('input, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toUpperCase();
    const pick = k.length === 1 && '1234'.includes(k) ? Number(k) - 1 : LETTERS.indexOf(k);
    if (!locked && pick >= 0 && !eliminated.has(pick)) {
      choose(pick, app.querySelectorAll('.option')[pick]);
    } else if (k === 'ENTER' && locked && practice) {
      e.preventDefault();
      next();
    } else if (k === 'H' && practice) {
      hint();
    } else if (k === 'S') {
      useSkill();
    }
  }

  const stopTimer = deadline
    ? startCountdown(() => deadline, {
      onExpire: () => {
        toast("Time's up!", 'Let’s see how you did.', { icon: '⏰', tone: 'danger' });
        finish();
      },
    })
    : () => {};

  document.addEventListener('keydown', onKey);
  show();

  return () => {
    finished = true;
    stopTimer();
    document.removeEventListener('keydown', onKey);
  };
}
