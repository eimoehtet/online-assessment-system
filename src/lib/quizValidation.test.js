import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateQuiz } from './quizValidation.js';

const draft = { title: 'Quiz', course_id: 1, end_date: '2026-12-01T12:00', time_limit: '', status: 'DRAFT', questions: [] };
const question = { question_text: 'Choose one', question_type: 'MCQ', points: 1, options: [{ option_text: 'A', is_correct: true }, { option_text: 'B', is_correct: false }] };

test('empty drafts are allowed but empty published quizzes are rejected', () => {
  assert.equal(validateQuiz(draft), '');
  assert.match(validateQuiz({ ...draft, status: 'PUBLISHED' }), /at least one question/);
});
test('blank default question and empty answer choices produce actionable messages', () => {
  assert.match(validateQuiz({ ...draft, questions: [{ ...question, question_text: '' }] }), /Question 1: enter the question text/);
  assert.match(validateQuiz({ ...draft, questions: [{ ...question, options: [{ option_text: ' ', is_correct: true }, question.options[1]] }] }), /fill in every answer choice/);
});
test('valid questions pass and invalid scores and missing correct choices fail', () => {
  assert.equal(validateQuiz({ ...draft, questions: [question] }), '');
  assert.match(validateQuiz({ ...draft, questions: [{ ...question, points: 1.5 }] }), /whole number/);
  assert.match(validateQuiz({ ...draft, questions: [{ ...question, options: question.options.map(o => ({ ...o, is_correct: false })) }] }), /select one correct answer/);
});
