import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quizDraftKey, readQuizDraft, writeQuizDraft } from './quizDraft.js';

const storage = () => {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
};
const incomplete = {
  title: '', course_id: '', end_date: '', status: 'DRAFT',
  questions: [{ question_text: 'Unfinished question', points: '', question_type: 'MCQ', options: [
    { option_text: '', is_correct: true, option_order: 1 },
    { option_text: 'Second option', is_correct: false, option_order: 2 },
  ] }],
};

test('incomplete questions and options survive a draft round trip without validation', () => {
  const local = storage();
  const key = quizDraftKey(1);
  writeQuizDraft(local, key, incomplete);
  assert.deepEqual(readQuizDraft(local, key).formData, incomplete);
});

test('drafts are isolated by teacher and quiz', () => {
  const local = storage();
  writeQuizDraft(local, quizDraftKey(1, 10), incomplete, 10);
  for (const key of [quizDraftKey(2, 10), quizDraftKey(1, 11), quizDraftKey(1)]) {
    assert.equal(readQuizDraft(local, key), null);
  }
});

test('latest edits, removals, order and partial server-save IDs survive reload', () => {
  const local = storage();
  const key = quizDraftKey(1);
  writeQuizDraft(local, key, incomplete);
  const edited = { ...incomplete, questions: [
    { ...incomplete.questions[0], id: 99, question_text: 'Updated' },
    { ...incomplete.questions[0], question_text: 'Another question' },
  ].reverse() };
  writeQuizDraft(local, key, edited, 42);
  assert.deepEqual(readQuizDraft(local, key).formData, edited);
  assert.equal(readQuizDraft(local, key).quizId, 42);
  writeQuizDraft(local, key, { ...edited, questions: [] }, 42);
  assert.deepEqual(readQuizDraft(local, key).formData.questions, []);
  local.removeItem(key);
  assert.equal(readQuizDraft(local, key), null);
});

test('corrupt drafts and storage failures are surfaced instead of claiming success', () => {
  const local = storage();
  for (const value of ['{broken', JSON.stringify({ version: 2 }), JSON.stringify({ version: 1, formData: { title: '', questions: [null] } })]) {
    local.setItem('draft', value);
    assert.throws(() => readQuizDraft(local, 'draft'));
  }
  assert.throws(() => writeQuizDraft({ setItem() { throw new Error('Quota exceeded'); } }, 'draft', incomplete), /Quota exceeded/);
  assert.throws(() => readQuizDraft({ getItem() { throw new Error('Storage blocked'); } }, 'draft'), /Storage blocked/);
});
