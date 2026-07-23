import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { CheckCircle2, CheckSquare, Trophy, FileText, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const StudentResults = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [reviewLoading, setReviewLoading] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await apiRoutes.getSubmissions();
        setSubmissions(res.data.data || []);
      } catch {
        setError('Failed to fetch your quiz results');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const toggleAnswers = async (submissionId) => {
    if (reviewAnswers[submissionId]) {
      setReviewAnswers((current) => ({ ...current, [submissionId]: null }));
      return;
    }
    setReviewLoading(submissionId);
    try {
      const res = await apiRoutes.getSubmissionAnswers(submissionId);
      setReviewAnswers((current) => ({ ...current, [submissionId]: res.data || [] }));
    } catch {
      setError('Failed to load submitted answers');
    } finally {
      setReviewLoading(null);
    }
  };

  const isWrittenQuestion = (answer) => ['SHORT_Q', 'LONG_Q'].includes(answer.question?.question_type);
  const earnedPoints = (answer) => isWrittenQuestion(answer)
    ? (answer.teacher_points_awarded ?? 0)
    : (answer.points_awarded ?? 0);

  if (loading) return <div className="text-sm text-slate-600">Loading your results...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Quiz Results</h1>
        <p className="mt-2 text-slate-600">Review your performance and behavioral feedback.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="space-y-5">
        {submissions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <Trophy size={48} className="mx-auto mb-4" />
            <p className="text-sm">You haven't completed any quizzes yet.</p>
          </div>
        ) : (
          submissions.map(sub => (
            <div key={sub.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-950">{sub.quiz?.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Submitted on {format(new Date(sub.completed_at || sub.submitted_at), 'PPP pp')}</p>
                </div>
                <div className="sm:text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {sub.status === 'RELEASED' ? `${sub.total_score} Pts` : 'Awaiting review'}
                  </div>
                  <p className="text-xs text-slate-500">{sub.status === 'RELEASED' ? 'Total Score' : 'Score is hidden until released'}</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-slate-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">{sub._count?.answers || 0}</div>
                    <div className="text-xs text-slate-500">Questions Answered</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckSquare size={18} className="text-emerald-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">{sub.status === 'RELEASED' ? 'Released' : 'Hidden'}</div>
                    <div className="text-xs text-slate-500">Automatic marks</div>
                  </div>
                </div>
                {/* Behavioral Alert if any */}
                <div className="flex items-center gap-3">
                  <AlertCircle size={18} className="text-amber-500" />
                  <div>
                    <div className="text-sm font-bold text-slate-950">Monitored</div>
                    <div className="text-xs text-slate-500">Integrity Logs Saved</div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => toggleAnswers(sub.id)}
                  disabled={reviewLoading === sub.id}
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                >
                  {reviewLoading === sub.id ? 'Loading answers...' : reviewAnswers[sub.id] ? 'Hide submitted answers' : 'Review submitted answers'}
                </button>
                {reviewAnswers[sub.id] && (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    {reviewAnswers[sub.id].map((answer) => (
                      <article key={answer.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{answer.question?.question_type}</p>
                            <h4 className="mt-1 font-semibold text-slate-950">{answer.question?.question_text}</h4>
                          </div>
                          {sub.status === 'RELEASED' && (
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                              {!isWrittenQuestion(answer) && answer.is_correct === true && <CheckCircle2 size={18} className="text-emerald-600" />}
                              {!isWrittenQuestion(answer) && answer.is_correct === false && <XCircle size={18} className="text-red-600" />}
                              <span>{earnedPoints(answer)} / {answer.question?.points ?? 0} pts</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                          {answer.student_answer || <span className="text-slate-400">No answer submitted</span>}
                        </div>
                        {sub.status === 'RELEASED' && !isWrittenQuestion(answer) && (
                          <p className={`mt-3 text-sm font-semibold ${answer.is_correct ? 'text-emerald-700' : 'text-red-700'}`}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </p>
                        )}
                        {sub.status === 'RELEASED' && isWrittenQuestion(answer) && answer.teacher_feedback && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                            <span className="font-semibold">Teacher feedback: </span>{answer.teacher_feedback}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentResults;
