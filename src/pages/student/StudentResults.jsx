import { useCallback, useEffect, useState } from 'react';
import { BookOpen, ChevronDown, Clock, Trophy } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { apiRoutes } from '../../api/routes';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentResults = () => {
  const [params, setParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [courses, setCourses] = useState([]);
  const [summary, setSummary] = useState({});
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const value = (key, fallback = '') => params.get(key) || fallback;
  const page = Number(value('page', '1'));
  const update = (changes) => { const next = new URLSearchParams(params); Object.entries(changes).forEach(([key, val]) => val ? next.set(key, val) : next.delete(key)); if (!('page' in changes)) next.delete('page'); setParams(next); };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const query = { ...Object.fromEntries(params.entries()), workflow: value('workflow', 'COMPLETED'), limit: 10 };
      const [resultRes, courseRes] = await Promise.all([apiRoutes.getSubmissions(query), apiRoutes.getMyCourses()]);
      setResults(resultRes.data.data || []); setMeta(resultRes.data.meta); setSummary(resultRes.data.summary || {}); setCourses(courseRes.data.data || []);
    } catch (err) { setError(err.response?.data?.message || 'Failed to load your results.'); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, [load]);
  return <div className="mx-auto max-w-6xl">
    <div className="mb-7"><h1 className="text-3xl font-bold tracking-tight text-slate-950">My Results</h1><p className="mt-2 text-slate-600">Track completed quizzes, released scores, and teacher feedback by subject.</p></div>
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Completed attempts', summary.total || 0], ['Awaiting review', summary.awaiting_review || 0], ['Average score', summary.released_average === null || summary.released_average === undefined ? '—' : `${summary.released_average}%`], ['Highest score', summary.released_highest === null || summary.released_highest === undefined ? '—' : `${summary.released_highest}%`]].map(([label, metric]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-2xl font-bold text-slate-950">{metric}</div><div className="text-xs text-slate-500">{label}</div></div>)}</div>
    <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
      <Select label="Subject" value={value('course_id')} onChange={(val) => update({ course_id: val, quiz_id: '' })}><option value="">All subjects</option>{courses.map((row) => <option key={row.course.id} value={row.course.id}>{row.course.code} — {row.course.name}</option>)}</Select>
      <Select label="Result status" value={value('workflow', 'COMPLETED')} onChange={(val) => update({ workflow: val })}><option value="COMPLETED">All completed</option><option value="AWAITING_REVIEW">Awaiting review</option><option value="RELEASED">Released</option></Select>
      <Select label="Sort results" value={`${value('sort', 'submitted_at')}:${value('order', 'desc')}`} onChange={(val) => { const [sort, order] = val.split(':'); update({ sort, order }); }}><option value="submitted_at:desc">Newest first</option><option value="submitted_at:asc">Oldest first</option><option value="score:desc">Highest score</option><option value="score:asc">Lowest score</option></Select>
    </div>
    {error && <div className="mb-4 flex justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><span>{error}</span><button onClick={load} className="font-semibold underline">Retry</button></div>}
    {loading ? <LoadingIndicator label="Loading results…" /> : results.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500"><Trophy className="mx-auto mb-3" size={42} /><p className="font-semibold text-slate-700">No results found</p><p className="mt-1 text-sm">Complete a quiz or change the current filters.</p></div> : <div className="space-y-4">{results.map((result) => { const released = result.status === 'RELEASED'; return <article key={result.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-blue-700"><BookOpen size={15} /> {result.quiz?.course?.code} · {result.quiz?.course?.name}</div><h2 className="mt-2 text-xl font-semibold text-slate-950">{result.quiz?.title}</h2><p className="mt-1 text-sm text-slate-500">Teacher: {result.quiz?.course?.teacher?.name || '—'}</p></div><div className="sm:text-right"><div className={`text-2xl font-bold ${released ? 'text-blue-700' : 'text-slate-700'}`}>{released ? `${result.total_score} / ${result.quiz?.maximum_score || 0}` : 'Awaiting review'}</div>{released && <div className="text-sm font-semibold text-slate-500">{result.percentage}%</div>}</div></div><div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm text-slate-600"><span className="flex items-center gap-1"><Clock size={15} /> {format(new Date(result.completed_at || result.submitted_at), 'PPP pp')}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">Attempt {result.attempt_number} of {result.quiz?.allowed_attempts}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${released ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{released ? 'Result released' : result.status === 'GRADED' ? 'Review complete' : 'Awaiting review'}</span><Link to={`/student/results/${result.id}?${params.toString()}`} className="ml-auto rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-500">View details</Link></div></article>; })}<div className="flex items-center justify-between py-3"><span className="text-sm text-slate-500">Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Previous</button><button disabled={page >= meta.totalPages} onClick={() => update({ page: String(page + 1) })} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Next</button></div></div></div>}
  </div>;
};

const Select = ({ label, value, onChange, children }) => <label className="relative"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /></label>;
export default StudentResults;
