import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Save, ShieldAlert, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { apiRoutes } from '../../api/routes';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const writtenTypes = ['SHORT_Q', 'LONG_Q'];
const eventLabels = { TAB_SWITCH: 'Tab switch', COPY_ATTEMPT: 'Copy attempt', PASTE_ATTEMPT: 'Paste attempt', RAPID_ANSWER_CHANGE: 'Rapid answer change', FULLSCREEN_EXIT: 'Fullscreen exit', TIME_SPENT_PER_Q: 'Time recorded' };

const SubmissionReview = () => {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [integrity, setIntegrity] = useState(null);
  const [logs, setLogs] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [dirty, setDirty] = useState(new Set());
  const [saving, setSaving] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [neighbors, setNeighbors] = useState({ previous: null, next: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const query = Object.fromEntries(searchParams.entries());
      const [detailRes, answerRes, integrityRes, logRes, listRes] = await Promise.all([
        apiRoutes.getSubmissionById(submissionId), apiRoutes.getSubmissionAnswers(submissionId),
        apiRoutes.getBehaviorSummary(submissionId), apiRoutes.getBehaviorLogs(submissionId, { limit: 100 }),
        apiRoutes.getSubmissions({ ...query, limit: 100 }),
      ]);
      const detail = detailRes.data;
      const loadedAnswers = (answerRes.data || []).sort((a, b) => (a.question?.question_order || 0) - (b.question?.question_order || 0));
      setSubmission(detail);
      setAnswers(loadedAnswers);
      setIntegrity(integrityRes.data);
      setLogs(logRes.data.data || []);
      setOverallFeedback(detail.feedback || '');
      setDrafts(Object.fromEntries(loadedAnswers.map((answer) => [answer.id, { score: answer.teacher_points_awarded ?? '', feedback: answer.teacher_feedback || '' }])));
      setDirty(new Set());
      const ids = (listRes.data.data || []).map((item) => item.id);
      const index = ids.indexOf(Number(submissionId));
      setNeighbors({ previous: index > 0 ? ids[index - 1] : null, next: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this submission.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissionId]);

  useEffect(() => {
    const warn = (event) => { if (dirty.size) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const writtenAnswers = useMemo(() => answers.filter((answer) => writtenTypes.includes(answer.question?.question_type)), [answers]);
  const remaining = writtenAnswers.filter((answer) => answer.teacher_points_awarded === null).length;
  const maximumScore = submission?.quiz?.questions?.reduce((sum, question) => sum + (question.points || 0), 0) || 0;
  const currentScore = (submission?.auto_score || 0) + (submission?.manual_score || 0);

  const setDraft = (answerId, key, value) => {
    setDrafts((current) => ({ ...current, [answerId]: { ...current[answerId], [key]: value } }));
    setDirty((current) => new Set(current).add(answerId));
  };

  const saveAnswer = async (answer) => {
    const draft = drafts[answer.id];
    const score = Number(draft.score);
    if (!Number.isInteger(score) || score < 0 || score > (answer.question?.points || 0)) {
      setError(`Question ${answer.question?.question_order}: enter a whole score from 0 to ${answer.question?.points || 0}.`);
      return;
    }
    setSaving(answer.id); setError(''); setNotice('');
    try {
      const response = await apiRoutes.gradeSubmissionAnswer(submission.id, answer.id, { teacher_points_awarded: score, teacher_feedback: draft.feedback });
      setAnswers((current) => current.map((item) => item.id === answer.id ? response.data : item));
      setDirty((current) => { const next = new Set(current); next.delete(answer.id); return next; });
      const detail = await apiRoutes.getSubmissionById(submission.id);
      setSubmission(detail.data);
      setNotice(`Question ${answer.question?.question_order} saved.`);
    } catch (err) { setError(err.response?.data?.message || 'Failed to save this grade.'); }
    finally { setSaving(null); }
  };

  const completeReview = async () => {
    if (dirty.size || remaining) return;
    setActionLoading(true); setError('');
    try { const response = await apiRoutes.completeSubmissionReview(submission.id, { feedback: overallFeedback }); setSubmission((current) => ({ ...current, ...response.data })); setNotice('Review completed. The score is ready to release.'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to complete review.'); }
    finally { setActionLoading(false); }
  };

  const release = async () => {
    if (!window.confirm('Release this score and feedback to the student? This makes the result visible immediately.')) return;
    setActionLoading(true); setError('');
    try { const response = await apiRoutes.releaseSubmissionScore(submission.id); setSubmission((current) => ({ ...current, ...response.data })); setNotice('Score released to the student.'); }
    catch (err) { setError(err.response?.data?.message || 'Failed to release the score.'); }
    finally { setActionLoading(false); }
  };

  const goTo = (id) => {
    if (dirty.size && !window.confirm('Discard unsaved grading changes?')) return;
    navigate(`/teacher/submissions/${id}?${searchParams.toString()}`);
  };

  const nextUngraded = writtenAnswers.find((answer) => answer.teacher_points_awarded === null);
  if (loading) return <LoadingIndicator label="Loading submission…" />;
  if (!submission) return <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error || 'Submission not found.'}</div>;

  return <div className="mx-auto max-w-5xl pb-24">
    <Link to={`/teacher/submissions?${searchParams.toString()}`} className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"><ArrowLeft size={17} /> Back to submissions</Link>
    <header className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-blue-700">{submission.quiz?.course?.code} · {submission.quiz?.course?.name}</p><h1 className="mt-1 text-2xl font-bold text-slate-950">{submission.quiz?.title}</h1><p className="mt-2 text-sm text-slate-600">{submission.student?.name} · {submission.student?.student_id || submission.student?.email}</p><p className="mt-1 text-xs text-slate-500">Submitted {format(new Date(submission.completed_at || submission.submitted_at), 'PPP pp')}</p></div><span className="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{submission.status.replaceAll('_', ' ')}</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-4"><Metric label="Current score" value={`${currentScore} / ${maximumScore}`} /><Metric label="Percentage" value={maximumScore ? `${Math.round(currentScore / maximumScore * 1000) / 10}%` : '—'} /><Metric label="Score breakdown" value={`${submission.auto_score || 0} auto + ${submission.manual_score || 0} manual`} /><Metric label="Grading progress" value={`${writtenAnswers.length - remaining} / ${writtenAnswers.length}`} /></div>
    </header>
    {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</div>}
    {notice && <div aria-live="polite" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">{notice}</div>}
    <section className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 p-4"><div><h2 className="font-semibold text-slate-950">Integrity signals</h2><p className="text-xs text-slate-500">Signals support teacher review and are not proof of misconduct.</p></div><span className="flex items-center gap-2 text-sm font-bold text-slate-700"><ShieldAlert size={18} /> {integrity?.risk_level || 'LOW'} · {integrity?.risk_score || 0}</span></div><div className="grid gap-3 p-4 sm:grid-cols-3">{Object.entries(integrity?.event_counts || {}).filter(([type]) => type !== 'TIME_SPENT_PER_Q').map(([type, count]) => <Metric key={type} label={eventLabels[type] || type.replaceAll('_', ' ')} value={count} />)}{(integrity?.total_events || 0) === 0 && <p className="text-sm text-slate-500">No suspicious events recorded.</p>}</div>{logs.filter((log) => log.event_type !== 'TIME_SPENT_PER_Q').length > 0 && <details className="border-t border-slate-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-blue-700">View event timeline</summary><div className="mt-3 space-y-2">{logs.filter((log) => log.event_type !== 'TIME_SPENT_PER_Q').map((log) => <div key={log.id} className="flex justify-between gap-4 rounded-lg bg-slate-50 p-3 text-sm"><span>{eventLabels[log.event_type] || log.event_type} · Question {log.submission_answer?.question_id}</span><time className="text-slate-500">{format(new Date(log.timestamp), 'PPp')}</time></div>)}</div></details>}</section>
    <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-950">Answers</h2>{nextUngraded && <button onClick={() => document.getElementById(`answer-${nextUngraded.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="text-sm font-semibold text-blue-700 hover:underline">Next ungraded answer</button>}</div>
    <div className="space-y-4">{answers.map((answer) => { const written = writtenTypes.includes(answer.question?.question_type); const draft = drafts[answer.id] || {}; return <article id={`answer-${answer.id}`} key={answer.id} className={`rounded-xl border bg-white p-5 shadow-sm ${written && answer.teacher_points_awarded === null ? 'border-amber-300' : 'border-slate-200'}`}><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-700">Question {answer.question?.question_order} · {answer.question?.question_type.replaceAll('_', ' ')}</p><h3 className="mt-1 font-semibold text-slate-950">{answer.question?.question_text}</h3></div>{!written && <div className="flex items-center gap-2 font-semibold">{answer.is_correct ? <CheckCircle2 className="text-emerald-600" size={19} /> : <XCircle className="text-red-600" size={19} />}{answer.points_awarded || 0} / {answer.question?.points || 0}</div>}</div><div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{answer.student_answer || <span className="text-slate-400">No answer submitted</span>}</div>{written && <div className="mt-4 grid gap-3 sm:grid-cols-[9rem_1fr_auto]"><label className="text-xs font-semibold text-slate-600">Score<input type="number" min="0" max={answer.question?.points || 0} value={draft.score} disabled={submission.status === 'RELEASED'} onChange={(event) => setDraft(answer.id, 'score', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold text-slate-600">Feedback<textarea value={draft.feedback} disabled={submission.status === 'RELEASED'} onChange={(event) => setDraft(answer.id, 'feedback', event.target.value)} rows="2" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label><button onClick={() => saveAnswer(answer)} disabled={!dirty.has(answer.id) || saving === answer.id || submission.status === 'RELEASED'} className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white disabled:opacity-40"><Save size={16} /> {saving === answer.id ? 'Saving…' : 'Save'}</button></div>}</article>; })}</div>
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur md:left-64"><div className="mx-auto flex max-w-5xl flex-col justify-between gap-3 sm:flex-row sm:items-center"><div className="flex gap-2"><button disabled={!neighbors.previous} onClick={() => goTo(neighbors.previous)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40"><ChevronLeft size={16} /> Previous</button><button disabled={!neighbors.next} onClick={() => goTo(neighbors.next)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next <ChevronRight size={16} /></button></div><div className="flex items-center justify-end gap-3">{['SUBMITTED', 'IN_REVIEW'].includes(submission.status) && <><span className="text-xs text-slate-500">{dirty.size ? `${dirty.size} unsaved` : remaining ? `${remaining} answers remaining` : 'Ready to complete'}</span><button title={dirty.size || remaining ? 'Save and grade every written answer first.' : ''} disabled={actionLoading || dirty.size > 0 || remaining > 0} onClick={completeReview} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Complete Review</button></>}{submission.status === 'GRADED' && <button disabled={actionLoading} onClick={release} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Release Score</button>}</div></div></div>
    {['SUBMITTED', 'IN_REVIEW'].includes(submission.status) && <label className="mt-6 block text-sm font-semibold text-slate-700">Overall feedback<textarea value={overallFeedback} onChange={(event) => setOverallFeedback(event.target.value)} rows="4" placeholder="Feedback shown to the student after release…" className="mt-2 w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>}
  </div>;
};

const Metric = ({ label, value }) => <div className="rounded-lg bg-slate-50 p-3"><div className="text-xl font-bold text-slate-950">{value}</div><div className="text-xs text-slate-500">{label}</div></div>;
export default SubmissionReview;
