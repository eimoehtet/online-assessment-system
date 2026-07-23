import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiRoutes } from '../../api/routes';
import { FileText, CheckSquare, PlusCircle } from 'lucide-react';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ quizzes: 0, submissions: 0 });
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  const fetchStats = async () => {
    try {
      const quizzesRes = await apiRoutes.getQuizzes();
      const submissionsRes = await apiRoutes.getSubmissions();
      setStats({
        quizzes: quizzesRes.data.data?.length || 0,
        submissions: submissionsRes.data.data?.length || 0
      });
    } catch (err) {
      console.error('Failed to fetch teacher stats', err);
    }
  };
  const fetchAssignedCourses = async () => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      setError("Teacher ID not found in local storage.");
      setLoading(false);
      return;
    }
    try {
      const response = await apiRoutes.getCourseByTeacherId(teacherId);
      setCourses(response.data.courses || []);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAssignedCourses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Teacher Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user?.name}! Manage your quizzes and view submissions.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-xl bg-red-50 p-4 text-blue-700">
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

        <Link to="/teacher/quizzes/new" className="flex items-center gap-5 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 p-6 text-slate-950 transition hover:border-blue-300 hover:bg-red-50/50">
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

      <div className="mt-10 bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="border-b border-slate-200 py-2 text-sm font-semibold text-slate-700">Assigned Courses</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td className="py-4 text-sm text-slate-600">No courses assigned.</td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="cursor-pointer hover:bg-slate-50" onClick={() => navigate(`/teacher/courses/${course.id}`)}>
                  <td className="py-4 text-sm text-slate-950">{course.name}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherDashboard;
