import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackRapidAnswerChange as track } from './rapidAnswerChanges.js';
const q = { id: 1, question_type: 'MCQ' };
test('counts revisions, excludes initial selection, and limits repeated reports', () => {
  const history = new Map();
  assert.equal(track(history, q, null, 'A', 0), null);
  assert.equal(track(history, q, 'A', 'B', 100), null);
  assert.equal(track(history, q, 'B', 'A', 200), null);
  assert.deepEqual(track(history, q, 'A', 'B', 300), { change_count: 3, window_ms: 10000 });
  assert.equal(track(history, q, 'B', 'A', 400), null);
  assert.equal(track(history, { ...q, id: 2 }, 'A', 'B', 500), null);
  assert.equal(track(history, q, 'A', 'B', 11000), null);
});
test('typing and unchanged selections do not count as rapid revisions', () => {
  const history = new Map();
  for (let i = 0; i < 10; i++) {
    assert.equal(track(history, { ...q, question_type: 'LONG_Q' }, 'a', 'ab', i), null);
    assert.equal(track(history, q, 'A', 'A', i), null);
  }
  assert.equal(history.size, 0);
});
