/**
 * Question bank loading. Banks are plain JSON in /data so teachers can edit or
 * replace them without touching code (see README → "Editing questions").
 */
import { shuffle } from './ui.js';

const cache = new Map();

async function getJson(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path).then((res) => {
      if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
      return res.json();
    }));
  }
  return cache.get(path);
}

export const loadCurriculumIndex = () => getJson('data/curriculum/index.json');
export const loadCourse = (id) => getJson(`data/curriculum/${id}.json`);
export const loadSat = () => getJson('data/sat.json');

/**
 * Turn raw bank questions into playable items: options shuffled (answer index
 * remapped) and tagged with their topic for stats and insights.
 */
export function prepareQuestions(topics, { limit = Infinity } = {}) {
  const items = topics.flatMap((topic) => topic.questions.map((q) => {
    const order = shuffle(q.options.map((_, i) => i));
    return {
      ...q,
      options: order.map((i) => q.options[i]),
      answer: order.indexOf(q.answer),
      topicKey: topic.key,
      topicName: topic.name,
    };
  }));
  return shuffle(items).slice(0, limit);
}
