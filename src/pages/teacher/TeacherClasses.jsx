import Alert from '../../components/ui/Alert';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { apiRoutes } from '../../api/routes';
import { useAuth } from '../../context/AuthContext';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const TeacherClasses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchCourses = async () => {
      try {
        const response = await apiRoutes.getCourseByTeacherId(user.id, { limit: 100 });
        if (active) setCourses(response.data.courses || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load your classes.');
      } finally {
        if (active) setLoading(false);
      }
    };

    if (user?.id) fetchCourses();
    return () => { active = false; };
  }, [user?.id]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">My Classes</h1>
        <p className="mt-2 text-slate-600">View students enrolled in each of your assigned courses.</p>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      {loading ? (
        <LoadingIndicator label="Loading classes…" />
      ) : courses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <BookOpen className="mx-auto text-slate-400" size={36} />
          <h2 className="mt-3 font-semibold text-slate-900">No classes assigned</h2>
          <p className="mt-1 text-sm text-slate-500">Your assigned courses will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-blue-600">{course.code}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{course.name}</h2>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {course.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mt-5 space-y-2 text-sm text-slate-600">
                <p>Shift: <span className="font-medium capitalize text-slate-800">{course.shift?.toLowerCase()}</span></p>
                <p className="flex items-center gap-2"><Users size={16} /> {course._count?.enrollments || 0} students</p>
              </div>
              <Link
                to={`/teacher/classes/${course.id}/students`}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                View Students
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherClasses;
