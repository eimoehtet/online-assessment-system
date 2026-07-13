import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRoutes } from '../../api/routes';
import { BookOpen, CheckSquare } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ courses: 0, submissions: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const enrollRes = await apiRoutes.getEnrollments();
        const subRes = await apiRoutes.getSubmissions();
        setStats({
          courses: enrollRes.data.data?.length || 0,
          submissions: subRes.data.data?.length || 0
        });
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

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-blue-50 p-4 text-blue-700">
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
