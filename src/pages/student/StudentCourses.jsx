import Alert from '../../components/ui/Alert';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { BookOpen, ArrowRight, Book } from 'lucide-react';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const response = await apiRoutes.getMyCourses();
        setEnrollments(response.data.data || []);
      } catch {
        setError('Failed to fetch your courses');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Courses</h1>
        <p className="mt-2 text-slate-600">Select a course to view available quizzes.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? <LoadingIndicator label="Loading courses…" className="col-span-full" /> : enrollments.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            <Book size={48} className="mx-auto mb-4" />
            <p className="text-sm">You are not enrolled in any courses yet.</p>
          </div>
        ) : (
          enrollments.map(enrollment => (
            <div key={enrollment.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="w-fit rounded-lg bg-red-50 p-3 text-blue-700">
                <BookOpen size={24} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wide text-blue-600">{enrollment.course.code}</span>
                <h3 className="mt-1 font-semibold text-slate-950">{enrollment.course.name}</h3>
                <p className="mt-2 text-sm text-slate-600">Teacher: {enrollment.course.teacher?.name}</p>
                <p className="mt-1 text-sm capitalize text-slate-600">Shift: {enrollment.shift?.toLowerCase()}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{enrollment.quiz_summary?.available || 0} available</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{enrollment.quiz_summary?.completed || 0} completed</span>
                </div>
                {enrollment.quiz_summary?.nearest_deadline && <p className="mt-3 text-xs text-slate-500">Nearest deadline: {new Date(enrollment.quiz_summary.nearest_deadline).toLocaleString()}</p>}
              </div>
              <button
                onClick={() => navigate(`/student/courses/${enrollment.course.id}/quizzes`)}
                className="mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                  View Quizzes
                  <ArrowRight size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentCourses;
