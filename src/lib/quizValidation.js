export function validateQuiz(form) {
  if (!form.title.trim()) return 'Enter a quiz title.';
  if (!form.course_id) return 'Select a course.';
  if (!form.end_date || Number.isNaN(new Date(form.end_date).getTime())) return 'Select a valid deadline date and time.';
  if (form.time_limit !== '' && (!Number.isInteger(Number(form.time_limit)) || Number(form.time_limit) < 1)) return 'Enter a whole time limit of at least 1 minute, or leave it empty.';
  if (form.status === 'PUBLISHED' && !form.questions.length) return 'Add at least one question before publishing, or save the quiz as a draft.';
  if (form.questions.reduce((sum, q) => sum + Number(q.points), 0) > 100) return 'The total points for a quiz should not exceed 100.';
  for (const [index, question] of form.questions.entries()) {
    const prefix = `Question ${index + 1}: `;
    if (!question.question_text.trim()) return prefix + 'enter the question text, or remove this question.';
    if (question.points === '' || !Number.isInteger(Number(question.points)) || Number(question.points) < 0) return prefix + 'enter a whole number of points, 0 or more.';
    if (['MCQ', 'TRUE_FALSE'].includes(question.question_type)) {
      if (question.options.length < 2) return prefix + 'add at least two answer choices.';
      if (question.options.some((option) => !option.option_text.trim())) return prefix + 'fill in every answer choice, or remove empty choices.';
      if (question.options.filter((option) => option.is_correct).length !== 1) return prefix + 'select one correct answer.';
    }
  }
  return '';
}
