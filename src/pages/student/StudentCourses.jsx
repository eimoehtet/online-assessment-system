import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, ArrowRight, Book } from 'lucide-react';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const StudentCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [coursesWithPendingQuizzes, setCoursesWithPendingQuizzes] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const studentId = user?.id;

  useEffect(() => {
    const fetchEnrollments = async () => {
      try {
        const [enrollmentRes, quizRes, submissionRes] = await Promise.all([
          apiRoutes.getEnrollmentsByStudent(studentId, { limit: 100 }),
          apiRoutes.getQuizzes({ limit: 100 }),
          apiRoutes.getSubmissions({ limit: 100 })
        ]);
        const studentEnrollments = enrollmentRes.data.data || [];
        const submittedQuizIds = new Set(
          (submissionRes.data.data || [])
            .filter(submission => submission.status !== 'IN_PROGRESS')
            .map(submission => submission.quiz_id)
        );
        const now = Date.now();
        const pendingCourseIds = new Set(
          (quizRes.data.data || [])
            .filter(quiz => (
              quiz.status === 'PUBLISHED'
              && new Date(quiz.end_date).getTime() > now
              && !submittedQuizIds.has(quiz.id)
            ))
            .map(quiz => quiz.course_id)
        );

        setEnrollments(studentEnrollments);
        setCoursesWithPendingQuizzes(pendingCourseIds);
      } catch {
        setError('Failed to fetch your courses');
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [studentId]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Courses</h1>
        <p className="mt-2 text-slate-600">Select a course to view available quizzes.</p>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

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
              </div>
              <button
                onClick={() => navigate(`/student/courses/${enrollment.course_id}/quizzes`)}
                className={`mt-auto inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition ${
                  coursesWithPendingQuizzes.has(enrollment.course_id)
                    ? 'bg-green-600 hover:bg-green-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
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
