import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRoutes } from '../../api/routes';
import { FileText, CheckSquare, PlusCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ quizzes: 0, submissions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const quizzesRes = await apiRoutes.getQuizzes();
        const submissionsRes = await apiRoutes.getSubmissions();
        setStats({
          quizzes: quizzesRes.data.data?.length || 0,
          submissions: submissionsRes.data.data?.length || 0
        });
      } catch {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Teacher Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user?.name}! Manage your quizzes and view submissions.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-4 text-blue-700">
            <FileText size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-950">{stats.quizzes}</h2>
            <p className="mt-1 text-sm text-slate-600">Active Quizzes</p>
          </div>
        </div>

        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
            <CheckSquare size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-950">{stats.submissions}</h2>
            <p className="mt-1 text-sm text-slate-600">Total Submissions</p>
          </div>
        </div>

        <Link to="/teacher/quizzes/new" className="flex items-center gap-5 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 p-6 text-slate-950 transition hover:border-blue-300 hover:bg-blue-50/50">
          <div className="rounded-xl bg-slate-100 p-4 text-blue-700">
            <PlusCircle size={32} />
          </div>
          <div>
            <h3 className="font-semibold">Create Quiz</h3>
            <p className="mt-1 text-sm text-slate-600">Add a new assessment</p>
          </div>
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold text-slate-950">Quick Actions</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Link to="/teacher/quizzes" className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
            Manage Quizzes
          </Link>
          <Link to="/teacher/submissions" className="inline-flex items-center justify-center rounded-lg border-2 border-red-600 bg-white/50 px-4 py-2.5 text-sm font-semiboldtransition hover:bg-red-50">
            View Submissions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
