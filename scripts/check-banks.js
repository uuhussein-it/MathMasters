/**
 * Validates every question bank in public/data. Run with `npm run check`
 * after editing questions; it exits with an error if anything is malformed.
 */
const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'public', 'data');
const errors = [];
let count = 0;

function checkQuestion(q, where) {
  count += 1;
  const at = `${where} → "${String(q.q).slice(0, 50)}"`;
  if (!q.id || !q.q) errors.push(`${at}: missing id or question text`);
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push(`${at}: needs exactly 4 options`);
  else if (new Set(q.options).size !== 4) errors.push(`${at}: options must be different`);
  if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errors.push(`${at}: answer must be 0-3`);
  if (!q.hint || !q.explanation) errors.push(`${at}: needs a hint and an explanation`);
}

const index = JSON.parse(fs.readFileSync(path.join(DATA, 'curriculum', 'index.json'), 'utf8'));
for (const meta of index.courses) {
  const course = JSON.parse(fs.readFileSync(path.join(DATA, 'curriculum', `${meta.id}.json`), 'utf8'));
  for (const topic of course.topics) {
    topic.questions.forEach((q) => checkQuestion(q, `${meta.id}/${topic.id}`));
    const listed = meta.topics.find((t) => t.id === topic.id);
    if (!listed || listed.count !== topic.questions.length) errors.push(`index.json: topic count for ${meta.id}/${topic.id} is out of date`);
  }
}

const sat = JSON.parse(fs.readFileSync(path.join(DATA, 'sat.json'), 'utf8'));
for (const topic of sat.topics) {
  if (!sat.sections[topic.section]) errors.push(`sat.json: topic ${topic.id} has unknown section "${topic.section}"`);
  topic.questions.forEach((q) => checkQuestion(q, `sat/${topic.id}`));
}

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log(`✓ ${count} questions look good.`);
