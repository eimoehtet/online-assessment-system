export const quizDraftKey = (teacherId, quizId) => `light-lms:quiz-draft:v1:${teacherId}:${quizId || 'new'}`;

export function readQuizDraft(storage, key) {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const draft = JSON.parse(raw);
  if (draft.version !== 1 || !draft.formData || typeof draft.formData.title !== 'string'
    || !Array.isArray(draft.formData.questions)
    || !draft.formData.questions.every((q) => q && typeof q.question_text === 'string' && Array.isArray(q.options))) {
    throw new Error('Invalid quiz draft');
  }
  return draft;
}

export function writeQuizDraft(storage, key, formData, quizId) {
  storage.setItem(key, JSON.stringify({ version: 1, formData, quizId: quizId || null, savedAt: Date.now() }));
}
