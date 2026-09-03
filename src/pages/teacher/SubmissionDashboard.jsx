import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock, Search, ShieldAlert, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { apiRoutes } from '../../api/routes';
import { useAuth } from '../../context/AuthContext';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const workflows = [['NEEDS_GRADING', 'Needs grading'], ['READY_TO_RELEASE', 'Ready to release'], ['RELEASED', 'Released'], ['IN_PROGRESS', 'In progress'], ['ALL', 'All submissions']];
const statusStyles = { IN_PROGRESS: 'bg-slate-100 text-slate-700', SUBMITTED: 'bg-amber-50 text-amber-700', IN_REVIEW: 'bg-amber-50 text-amber-700', GRADED: 'bg-blue-50 text-blue-700', RELEASED: 'bg-emerald-50 text-emerald-700' };
const riskStyles = { LOW: 'bg-emerald-50 text-emerald-700', MEDIUM: 'bg-amber-50 text-amber-700', HIGH: 'bg-red-50 text-red-700' };

const SubmissionDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [submissions, setSubmissions] = useState([]);
  const [summary, setSummary] = useState({});
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [insights, setInsights] = useState(null);
  const [searchInput, setSearchInput] = useState(params.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const value = (key, fallback = '') => params.get(key) || fallback;
  const workflow = value('workflow', 'NEEDS_GRADING');
  const page = Number(value('page', '1'));

  const updateParams = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, nextValue]) => nextValue ? next.set(key, nextValue) : next.delete(key));
    if (!Object.prototype.hasOwnProperty.call(changes, 'page')) next.delete('page');
    setParams(next);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => updateParams({ search: searchInput.trim() }), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    Promise.all([apiRoutes.getCourseByTeacherId(user.id, { limit: 100 }), apiRoutes.getQuizzesByTeacherId(user.id)])
      .then(([courseRes, quizRes]) => {
        if (!active) return;
        setCourses(courseRes.data.data || courseRes.data.courses || []);
        setQuizzes(quizRes.data.data || []);
      }).catch(() => {});
    return () => { active = false; };
  }, [user.id]);

  useEffect(() => {
    let active = true;
    const quizId = params.get('quiz_id');
    if (!quizId) {
      const timer = window.setTimeout(() => setInsights(null), 0);
      return () => { active = false; window.clearTimeout(timer); };
    }
    apiRoutes.getQuizSubmissionInsights(quizId)
      .then((response) => { if (active) setInsights(response.data); })
      .catch(() => { if (active) setInsights(null); });
    return () => { active = false; };
  }, [params]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiRoutes.getSubmissions(Object.fromEntries(params.entries()));
      setSubmissions(response.data.data || []);
      setMeta(response.data.meta);
      setSummary(response.data.summary || {});
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load submissions.');
    } finally { setLoading(false); }
  }, [params]);

  useEffect(() => {
    const timer = window.setTimeout(fetchSubmissions, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSubmissions]);

  const filteredQuizzes = value('course_id') ? quizzes.filter((quiz) => String(quiz.course?.id || quiz.course_id) === value('course_id')) : quizzes;
  const hasFilters = ['search', 'course_id', 'quiz_id', 'risk_level', 'submitted_from', 'submitted_to'].some((key) => params.has(key));
  const openSubmission = (id) => navigate(`/teacher/submissions/${id}?${params.toString()}`);
  const applyWorkflow = (next) => updateParams({ workflow: next === 'ALL' ? '' : next });

  return <div className="mx-auto max-w-7xl">
    <div className="mb-7"><h1 className="text-3xl font-bold tracking-tight text-slate-950">Submission Review</h1><p className="mt-2 text-slate-600">Grade student work, release results, and review integrity signals.</p></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        ['NEEDS_GRADING', 'Needs grading', summary.needs_grading, AlertTriangle, 'text-amber-600'],
        ['READY_TO_RELEASE', 'Ready to release', summary.ready_to_release, Clock, 'text-blue-700'],
        ['RELEASED', 'Released', summary.released, CheckCircle2, 'text-emerald-600'],
        ['HIGH_RISK', 'High integrity signal', summary.high_risk, ShieldAlert, 'text-red-600'],
      ].map(([key, label, count, Icon, color]) => <button key={key} onClick={() => key === 'HIGH_RISK' ? updateParams({ risk_level: 'HIGH', workflow: '' }) : applyWorkflow(key)} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300"><Icon className={color} size={24} /><span><span className="block text-2xl font-bold text-slate-950">{count || 0}</span><span className="text-xs text-slate-500">{label}</span></span></button>)}
    </div>
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Submission workflow">{workflows.map(([key, label]) => <button key={key} onClick={() => applyWorkflow(key)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${workflow === key ? 'bg-red-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{label}</button>)}</div>
    <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="relative block xl:col-span-2"><span className="sr-only">Search submissions</span><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search student name, ID, or email…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>
        <Select label="Course" value={value('course_id')} onChange={(next) => updateParams({ course_id: next, quiz_id: '' })}><option value="">All courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} — {course.name}</option>)}</Select>
        <Select label="Quiz" value={value('quiz_id')} onChange={(next) => updateParams({ quiz_id: next })}><option value="">All quizzes</option>{filteredQuizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}</Select>
        <Select label="Integrity signal" value={value('risk_level')} onChange={(next) => updateParams({ risk_level: next })}><option value="">All integrity signals</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></Select>
        <Select label="Sort submissions" value={`${value('sort', 'submitted_at')}:${value('order', 'desc')}`} onChange={(next) => { const [sort, order] = next.split(':'); updateParams({ sort, order }); }}><option value="submitted_at:desc">Newest first</option><option value="submitted_at:asc">Oldest first</option><option value="student:asc">Student A–Z</option><option value="score:desc">Highest score</option><option value="risk:desc">Highest integrity signal</option></Select>
        <label className="text-xs font-semibold text-slate-600">From<input type="date" value={value('submitted_from')} onChange={(event) => updateParams({ submitted_from: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
        <label className="text-xs font-semibold text-slate-600">To<input type="date" value={value('submitted_to')} onChange={(event) => updateParams({ submitted_to: event.target.value })} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-normal" /></label>
      </div>
      {hasFilters && <button onClick={() => { setSearchInput(''); setParams(new URLSearchParams({ workflow })); }} className="mt-3 text-sm font-semibold text-blue-700 hover:underline">Clear filters</button>}
    </div>
    {error && <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"><span>{error}</span><button onClick={fetchSubmissions} className="underline">Retry</button></div>}
    {insights && <QuizInsights insights={insights} />}
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {loading ? <LoadingIndicator label="Loading submissions…" /> : submissions.length === 0 ? <div className="p-12 text-center"><p className="font-semibold text-slate-800">{workflow === 'NEEDS_GRADING' ? 'Nothing needs grading' : hasFilters ? 'No submissions match these filters' : 'No submissions yet'}</p><p className="mt-1 text-sm text-slate-500">{hasFilters ? 'Try clearing or changing the current filters.' : 'Student attempts will appear here.'}</p></div> : <>
        <div className="hidden overflow-x-auto md:block"><SubmissionTable submissions={submissions} openSubmission={openSubmission} /></div>
        <div className="divide-y divide-slate-200 md:hidden">{submissions.map((submission) => <SubmissionCard key={submission.id} submission={submission} onOpen={() => openSubmission(submission.id)} />)}</div>
        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 p-4 sm:flex-row"><p className="text-sm text-slate-500">Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</p><div className="flex gap-2"><button disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button><button disabled={page >= meta.totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div>
      </>}
    </div>
  </div>;
};

const Select = ({ label, value, onChange, children }) => <label className="relative block"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /></label>;
const Score = ({ submission }) => <div><div className="font-semibold text-slate-950">{submission.current_score} / {submission.quiz?.maximum_score || 0}{submission.percentage !== null ? ` (${submission.percentage}%)` : ''}</div><div className="text-xs text-slate-500">{submission.status === 'RELEASED' ? 'Released' : 'Not released'}{submission.manual_grading?.remaining ? ` · ${submission.manual_grading.remaining} to grade` : ''}</div></div>;
const Integrity = ({ submission }) => { const risk = submission.behaviorSummary || { risk_level: 'LOW', suspicious_events: 0 }; return <div><span title="Integrity signals require teacher review; they are not proof of misconduct." className={`rounded-full px-2.5 py-1 text-xs font-semibold ${riskStyles[risk.risk_level]}`}>{risk.risk_level}</span><div className="mt-1 text-xs text-slate-500">{risk.suspicious_events} suspicious events</div></div>; };
const submittedDate = (submission) => new Date(submission.completed_at || submission.submitted_at);
const SubmissionTable = ({ submissions, openSubmission }) => <table className="min-w-full divide-y divide-slate-200 text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Quiz</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Score</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Integrity signal</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{submissions.map((submission) => <tr key={submission.id} className="cursor-pointer hover:bg-slate-50" onClick={() => openSubmission(submission.id)}><td className="px-4 py-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-red-50 text-blue-700"><User size={16} /></span><div><div className="font-medium text-slate-950">{submission.student?.name}</div><div className="text-xs text-slate-500">{submission.student?.student_id || submission.student?.email}</div></div></div></td><td className="px-4 py-4"><div className="font-medium text-slate-700">{submission.quiz?.title}</div><div className="text-xs text-slate-500">{submission.quiz?.course?.code}</div></td><td className="px-4 py-4 text-slate-600" title={format(submittedDate(submission), 'PPP pp')}>{formatDistanceToNow(submittedDate(submission), { addSuffix: true })}</td><td className="px-4 py-4"><Score submission={submission} /></td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[submission.status]}`}>{submission.status.replaceAll('_', ' ')}</span></td><td className="px-4 py-4"><Integrity submission={submission} /></td><td className="px-4 py-4 text-right"><button onClick={(event) => { event.stopPropagation(); openSubmission(submission.id); }} className="rounded-lg bg-slate-100 px-3 py-2 font-semibold hover:bg-slate-200">{submission.status === 'IN_REVIEW' ? 'Continue' : 'Review'}</button></td></tr>)}</tbody></table>;
const SubmissionCard = ({ submission, onOpen }) => <button onClick={onOpen} className="block w-full p-4 text-left"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-slate-950">{submission.student?.name}</div><div className="text-xs text-slate-500">{submission.student?.student_id || submission.student?.email}</div></div><span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[submission.status]}`}>{submission.status.replaceAll('_', ' ')}</span></div><div className="mt-3 text-sm font-medium text-slate-700">{submission.quiz?.title} · {submission.quiz?.course?.code}</div><div className="mt-3 flex items-end justify-between gap-3"><Score submission={submission} /><Integrity submission={submission} /></div></button>;

const QuizInsights = ({ insights }) => <details className="mb-5 rounded-xl border border-blue-200 bg-blue-50/40 p-4" open><summary className="cursor-pointer font-semibold text-slate-950">Quiz insights: {insights.quiz.title}</summary><div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">{[['Completion', `${insights.participation.completion_rate}%`], ['Students attempted', insights.participation.unique_students], ['No attempt', insights.participation.no_attempt], ['Total attempts', insights.participation.total_attempts], ['Average score', insights.scores.average ?? '—'], ['Awaiting grading', insights.awaiting_grading]].map(([label, metric]) => <div key={label} className="rounded-lg bg-white p-3"><div className="text-xl font-bold text-slate-950">{metric}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div><div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-2">Question</th><th className="p-2">Answered</th><th className="p-2">Correct rate</th><th className="p-2">Average points</th><th className="p-2">Awaiting grading</th></tr></thead><tbody>{insights.questions.map((question) => <tr key={question.id} className="border-t border-blue-100"><td className="p-2 font-medium text-slate-800">{question.question_order}. {question.question_text.length > 70 ? `${question.question_text.slice(0, 70)}…` : question.question_text}</td><td className="p-2">{question.answered}</td><td className="p-2">{question.correct_rate === null ? 'Manual' : `${question.correct_rate}%`}</td><td className="p-2">{question.average_points ?? '—'} / {question.points || 0}</td><td className="p-2">{question.awaiting_grading}</td></tr>)}</tbody></table></div></details>;

export default SubmissionDashboard;
