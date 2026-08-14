import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ArrowRight, Book } from 'lucide-react';

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id;

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const res = await apiRoutes.getEnrollmentsByStudent(studentId);
        setEnrollments(res.data.data || []);
      } catch {
        setError('Failed to fetch your courses');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [studentId]);

  if (loading) return <div className="text-sm text-slate-600">Loading courses...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Courses</h1>
        <p className="mt-2 text-slate-600">Select a course to view available quizzes.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {enrollments.length === 0 ? (
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
              </div>
              <button
                onClick={() => navigate(`/student/courses/${enrollment.course_id}/quizzes`)}
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer"
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
