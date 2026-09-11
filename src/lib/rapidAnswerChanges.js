export const RAPID_CHANGE_WINDOW_MS = 10_000;
export const RAPID_CHANGE_THRESHOLD = 3;

// Track option revisions only; text keystrokes are not answer revisions.
export function trackRapidAnswerChange(history, question, previousValue, value, now) {
  if (!['MCQ', 'TRUE_FALSE'].includes(question?.question_type)
    || previousValue == null || previousValue === '' || previousValue === value) return null;

  const previous = history.get(question.id) || { timestamps: [], lastReportedAt: null };
  const timestamps = previous.timestamps.filter((timestamp) => now - timestamp < RAPID_CHANGE_WINDOW_MS);
  timestamps.push(now);
  const shouldReport = timestamps.length >= RAPID_CHANGE_THRESHOLD
    && (previous.lastReportedAt === null || now - previous.lastReportedAt >= RAPID_CHANGE_WINDOW_MS);
  history.set(question.id, { timestamps, lastReportedAt: shouldReport ? now : previous.lastReportedAt });

  return shouldReport ? { change_count: timestamps.length, window_ms: RAPID_CHANGE_WINDOW_MS } : null;
}
