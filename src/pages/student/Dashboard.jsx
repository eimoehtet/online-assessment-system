import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRoutes } from '../../api/routes';
import { BookOpen, CheckSquare, Clock, FileText, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, submissions: 0, upcoming_quizzes: [], recent_results: [], course_summaries: [] });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiRoutes.getDashboardStats();
        setStats(response.data.data);
      } catch {
        console.error('Failed to fetch student stats');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Student Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user?.name}! Ready to continue your learning?</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-red-50 p-4 text-blue-700">
            <BookOpen size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-950">{stats.courses}</h2>
            <p className="mt-1 text-sm text-slate-600">Enrolled Courses</p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckSquare size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-950">{stats.submissions}</h2>
            <p className="mt-1 text-sm text-slate-600">Completed Quizzes</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="rounded-xl bg-amber-50 p-4 text-amber-700"><Clock size={32} /></div><div><h2 className="text-3xl font-bold text-slate-950">{stats.available_quizzes || 0}</h2><p className="mt-1 text-sm text-slate-600">Available Quizzes</p></div></div>
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="rounded-xl bg-blue-50 p-4 text-blue-700"><FileText size={32} /></div><div><h2 className="text-3xl font-bold text-slate-950">{stats.awaiting_review || 0}</h2><p className="mt-1 text-sm text-slate-600">Awaiting Review</p></div></div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section><h2 className="text-xl font-semibold text-slate-950">Upcoming quizzes</h2><div className="mt-4 space-y-3">{stats.upcoming_quizzes?.length ? stats.upcoming_quizzes.map((quiz) => <Link key={quiz.id} to={`/student/courses/${quiz.course.id}/quizzes`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"><div><p className="text-xs font-bold uppercase text-blue-700">{quiz.course.code} · {quiz.course.name}</p><h3 className="mt-1 font-semibold text-slate-950">{quiz.title}</h3><p className="mt-1 text-xs text-slate-500">Due {formatDistanceToNow(new Date(quiz.end_date), { addSuffix: true })}{quiz.time_limit ? ` · ${quiz.time_limit} minutes` : ''}</p></div><ArrowRight className="shrink-0 text-slate-400" size={20} /></Link>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No quizzes need your attention right now.</div>}</div></section>
        <section><h2 className="text-xl font-semibold text-slate-950">Recently released results</h2><div className="mt-4 space-y-3">{stats.recent_results?.length ? stats.recent_results.map((result) => <Link key={result.id} to={`/student/results/${result.id}`} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300"><div><p className="text-xs font-bold uppercase text-blue-700">{result.quiz.course.code} · {result.quiz.course.name}</p><h3 className="mt-1 font-semibold text-slate-950">{result.quiz.title}</h3></div><div className="text-right"><div className="text-lg font-bold text-blue-700">{result.total_score} / {result.maximum_score}</div>{result.maximum_score > 0 && <div className="text-xs text-slate-500">{Math.round(result.total_score / result.maximum_score * 1000) / 10}%</div>}</div></Link>) : <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Released quiz results will appear here.</div>}</div></section>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-slate-950">Quick Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/student/courses" className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
            Browse My Courses
          </Link>
          <Link to="/student/results" className="inline-flex items-center justify-center rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300">
            View My Results
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
