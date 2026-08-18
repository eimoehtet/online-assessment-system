import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRoutes } from '../../api/routes';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Search,
  ShieldAlert,
  User,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const riskStyles = {
  LOW: 'bg-emerald-50 text-emerald-700',
  MEDIUM: 'bg-amber-50 text-amber-700',
  HIGH: 'bg-red-50 text-red-700'
};

const getRiskStyle = (riskLevel) => riskStyles[riskLevel] || 'bg-slate-100 text-slate-600';

const SubmissionDashboard = () => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailError, setDetailError] = useState('');
  const [gradingAnswerId, setGradingAnswerId] = useState(null);
  const [reviewActionLoading, setReviewActionLoading] = useState(false);
  const [quizFilter, setQuizFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchSubmissions = useCallback(async () => {
    try {
      setError('');
      const res = await apiRoutes.getSubmissions();
      const baseSubmissions = res.data.data || [];

      const withRisk = await Promise.all(baseSubmissions.map(async (submission) => {
        try {
          const summaryRes = await apiRoutes.getBehaviorSummary(submission.id);

          return {
            ...submission,
            behaviorSummary: summaryRes.data
          };
        } catch {
          return {
            ...submission,
            behaviorSummary: null
          };
        }
      }));

      setSubmissions(withRisk);
    } catch {
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchTimer = setTimeout(fetchSubmissions, 0);

    return () => clearTimeout(fetchTimer);
  }, [fetchSubmissions]);

  const quizzes = useMemo(() => {
    const quizMap = new Map();

    submissions.forEach((submission) => {
      if (submission.quiz?.id) {
        quizMap.set(submission.quiz.id, submission.quiz);
      }
    });

    return Array.from(quizMap.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return submissions.filter((submission) => {
      const matchesQuiz = quizFilter === 'ALL' || String(submission.quiz_id) === quizFilter;
      const riskLevel = submission.behaviorSummary?.risk_level || 'LOW';
      const matchesRisk = riskFilter === 'ALL' || riskLevel === riskFilter;
      const searchableText = [
        submission.student?.name,
        submission.student?.email,
        submission.quiz?.title
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesQuiz && matchesRisk && matchesSearch;
    });
  }, [quizFilter, riskFilter, searchTerm, submissions]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const pendingManual = submissions.filter((submission) => submission.total_score === null).length;
    const highRisk = submissions.filter((submission) => submission.behaviorSummary?.risk_level === 'HIGH').length;
    const answered = submissions.reduce((sum, submission) => sum + (submission._count?.answers || 0), 0);

    return { total, pendingManual, highRisk, answered };
  }, [submissions]);

  const openSubmission = async (submission) => {
    setSelectedSubmission(submission);
    setSelectedAnswers([]);
    setSelectedLoading(true);
    setDetailError('');

    try {
      const answersRes = await apiRoutes.getSubmissionAnswers(submission.id);
      setSelectedAnswers(answersRes.data || []);
    } catch {
      setDetailError('Failed to load submission answers');
    } finally {
      setSelectedLoading(false);
    }
  };

  const syncSubmission = (updated) => {
    setSelectedSubmission((current) => current ? { ...current, ...updated } : current);
    setSubmissions((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
  };

  const saveManualScore = async (answer, value) => {
    const score = Number(value);
    if (!Number.isInteger(score) || score < 0 || score > (answer.question?.points ?? 0)) {
      setDetailError(`Enter a whole number from 0 to ${answer.question?.points ?? 0}.`);
      return;
    }
    setGradingAnswerId(answer.id);
    setDetailError('');
    try {
      const res = await apiRoutes.gradeSubmissionAnswer(selectedSubmission.id, answer.id, { teacher_points_awarded: score });
      setSelectedAnswers((current) => current.map((item) => item.id === answer.id ? res.data : item));
      const details = await apiRoutes.getSubmissionById(selectedSubmission.id);
      syncSubmission(details.data);
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Failed to save manual score.');
    } finally {
      setGradingAnswerId(null);
    }
  };

  const completeReview = async () => {
    setReviewActionLoading(true);
    setDetailError('');
    try {
      const res = await apiRoutes.completeSubmissionReview(selectedSubmission.id);
      syncSubmission(res.data);
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Failed to complete review.');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const releaseScore = async () => {
    setReviewActionLoading(true);
    setDetailError('');
    try {
      const res = await apiRoutes.releaseSubmissionScore(selectedSubmission.id);
      syncSubmission(res.data);
    } catch (err) {
      setDetailError(err?.response?.data?.message || 'Failed to release score.');
    } finally {
      setReviewActionLoading(false);
    }
  };

  const closeSubmission = () => {
    setSelectedSubmission(null);
    setSelectedAnswers([]);
    setDetailError('');
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Submissions</h1>
        <p className="mt-2 text-slate-600">Review student attempts, scores, answers, and integrity signals.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <ClipboardList className="text-blue-700" size={24} />
          <div>
            <div className="text-2xl font-bold text-slate-950">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Submissions</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FileText className="text-slate-600" size={24} />
          <div>
            <div className="text-2xl font-bold text-slate-950">{stats.answered}</div>
            <div className="text-xs text-slate-500">Answers Saved</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <AlertTriangle className="text-amber-600" size={24} />
          <div>
            <div className="text-2xl font-bold text-slate-950">{stats.pendingManual}</div>
            <div className="text-xs text-slate-500">Pending Score</div>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <ShieldAlert className="text-red-600" size={24} />
          <div>
            <div className="text-2xl font-bold text-slate-950">{stats.highRisk}</div>
            <div className="text-xs text-slate-500">High Risk</div>
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by student, email, or quiz..."
            className="w-full rounded-lg bg-white border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <div className="relative">
          <select
            value={quizFilter}
            onChange={(event) => setQuizFilter(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-56"
          >
            <option value="ALL">All quizzes</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
        <div className="relative">
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-44"
          >
            <option value="ALL">All risk levels</option>
            <option value="LOW">Low risk</option>
            <option value="MEDIUM">Medium risk</option>
            <option value="HIGH">High risk</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? <LoadingIndicator label="Loading submissions…" /> : filteredSubmissions.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">No submissions match the current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Student</th>
                  <th className="px-4 py-3 font-semibold">Quiz</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Review</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((submission) => {
                  const riskLevel = submission.behaviorSummary?.risk_level || 'LOW';

                  return (
                    <tr key={submission.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-blue-700">
                            <User size={16} />
                          </span>
                          <div>
                            <div className="font-medium text-slate-950">{submission.student?.name || 'Unknown student'}</div>
                            <div className="text-xs text-slate-500">{submission.student?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-700">{submission.quiz?.title || 'Untitled quiz'}</div>
                        {submission.quiz?.course?.code && (
                          <div className="text-xs text-slate-500">{submission.quiz.course.code}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{format(new Date(submission.submitted_at), 'PPp')}</td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-slate-950">
                          {submission.status === 'RELEASED' ? `${submission.total_score} pts` : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{submission.status?.replaceAll('_', ' ') || 'IN PROGRESS'}</span></td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getRiskStyle(riskLevel)}`}>
                          {riskLevel}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => openSubmission(submission)}
                          className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white p-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{selectedSubmission.quiz?.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedSubmission.student?.name} · {format(new Date(selectedSubmission.submitted_at), 'PPP pp')}
                </p>
              </div>
              <button
                onClick={closeSubmission}
                className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                title="Close"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {selectedSubmission.status === 'RELEASED' ? `${selectedSubmission.total_score} pts` : `${(selectedSubmission.auto_score || 0) + (selectedSubmission.manual_score || 0)} pts`}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">Auto {selectedSubmission.auto_score || 0} + Manual {selectedSubmission.manual_score || 0}</div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Integrity Events</div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {selectedSubmission.behaviorSummary?.total_events || 0}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Score</div>
                  <div className="mt-1 text-xl font-bold text-slate-950">
                    {selectedSubmission.behaviorSummary?.risk_score || 0}
                  </div>
                </div>
              </div>

              {detailError && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{detailError}</div>}

              <div className="mb-5 rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950">Integrity Summary</div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(selectedSubmission.behaviorSummary?.event_counts || {}).length === 0 ? (
                    <p className="text-sm text-slate-500">No suspicious behavior events recorded.</p>
                  ) : (
                    Object.entries(selectedSubmission.behaviorSummary.event_counts).map(([eventType, count]) => (
                      <div key={eventType} className="rounded-lg bg-slate-50 px-3 py-2">
                        <div className="text-sm font-semibold text-slate-950">{count}</div>
                        <div className="text-xs text-slate-500">{eventType.replaceAll('_', ' ')}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Answers</h3>
                {selectedLoading ? (
                  <LoadingIndicator label="Loading answers…" />
                ) : selectedAnswers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No answers saved for this submission.</div>
                ) : (
                  selectedAnswers.map((answer) => (
                    <article key={answer.id} className="rounded-lg border border-slate-200 p-4">
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-blue-600">{answer.question?.question_type}</div>
                          <h4 className="mt-1 font-semibold text-slate-950">{answer.question?.question_text}</h4>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {answer.is_correct === true && <CheckCircle2 className="text-emerald-600" size={18} />}
                          {answer.is_correct === false && <XCircle className="text-red-600" size={18} />}
                          {['SHORT_Q', 'LONG_Q'].includes(answer.question?.question_type) ? (
                            <label className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={answer.question?.points ?? 0}
                                defaultValue={answer.teacher_points_awarded ?? ''}
                                disabled={!['SUBMITTED', 'IN_REVIEW', 'GRADED'].includes(selectedSubmission.status) || gradingAnswerId === answer.id}
                                onBlur={(event) => {
                                  if (event.target.value !== '') saveManualScore(answer, event.target.value);
                                }}
                                className="w-16 rounded border border-slate-300 px-2 py-1 text-right disabled:bg-slate-100"
                                aria-label="Manual score"
                              />
                              <span>/ {answer.question?.points ?? 0} pts</span>
                            </label>
                          ) : <span>{answer.points_awarded ?? 0} / {answer.question?.points ?? 0} pts</span>}
                        </div>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                        {answer.student_answer || <span className="text-slate-400">No answer provided</span>}
                      </div>
                    </article>
                  ))
                )}
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
                {['SUBMITTED', 'IN_REVIEW'].includes(selectedSubmission.status) && (
                  <button onClick={completeReview} disabled={reviewActionLoading} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {reviewActionLoading ? 'Saving...' : 'Mark Review Complete'}
                  </button>
                )}
                {selectedSubmission.status === 'GRADED' && (
                  <button onClick={releaseScore} disabled={reviewActionLoading} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                    {reviewActionLoading ? 'Releasing...' : 'Release Score to Student'}
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default SubmissionDashboard;
