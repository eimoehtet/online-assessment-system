import Alert from '../../components/ui/Alert';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, Search, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { apiRoutes } from '../../api/routes';
import { TableLoadingRow } from '../../components/ui/LoadingIndicator';

const CourseStudents = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [shift, setShift] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let active = true;
    const fetchRoster = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await apiRoutes.getCourseRoster(courseId, {
          page,
          search: search || undefined,
          shift: shift || undefined,
        });
        if (!active) return;
        setCourse(response.data.course);
        setStudents(response.data.data || []);
        setMeta(response.data.meta);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load the course roster.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchRoster();
    return () => { active = false; };
  }, [courseId, page, search, shift]);

  const changeShift = (event) => {
    setShift(event.target.value);
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl">
      <Link to="/teacher/classes" className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline">
        <ChevronLeft size={17} /> Back to My Classes
      </Link>

      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">{course?.name || 'Course Students'}</h1>
          {course && <p className="mt-2 text-slate-600">{course.code} · {course.shift.toLowerCase()} shift</p>}
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><Users size={18} /> {meta.total} enrolled students</div>
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <span className="sr-only">Search students</span>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or student ID…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="relative block sm:w-48">
          <span className="sr-only">Filter by shift</span>
          <select value={shift} onChange={changeShift} className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
            <option value="">All shifts</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
            <option value="EVENING">Evening</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </label>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">No</th><th className="px-4 py-3">Student ID</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Shift</th><th className="px-4 py-3">Gender</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {loading ? <TableLoadingRow colSpan={6} label="Loading students…" /> : students.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">{search || shift ? 'No students match the selected filters.' : 'No students are enrolled in this course.'}</td></tr>
              ) : students.map((enrollment, index) => (
                <tr key={enrollment.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 text-slate-500">{(meta.page - 1) * meta.limit + index + 1}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">{enrollment.student.student_id || '—'}</td>
                  <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{enrollment.student.name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-600">{enrollment.student.email}</td>
                  <td className="whitespace-nowrap px-4 py-4 capitalize text-slate-600">{enrollment.shift.toLowerCase()}</td>
                  <td className="whitespace-nowrap px-4 py-4 capitalize text-slate-600">{enrollment.student.gender?.toLowerCase() || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && meta.totalPages > 1 && (
          <div className="flex flex-wrap justify-center gap-2 border-t border-slate-200 p-4">
            {Array.from({ length: meta.totalPages }, (_, index) => index + 1).map((number) => (
              <button key={number} onClick={() => setPage(number)} disabled={page === number} className={`rounded-lg px-3 py-1 text-sm font-medium ${page === number ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{number}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseStudents;
