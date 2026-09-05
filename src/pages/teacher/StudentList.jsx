import Alert from '../../components/ui/Alert';
import { showAlert } from '../../lib/alerts';
import { useState, useEffect, useRef } from 'react';
import { apiRoutes } from '../../api/routes';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TableLoadingRow } from '../../components/ui/LoadingIndicator';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [nameSearch, setNameSearch] = useState("");
  const { user } = useAuth();
  const teacherId = user?.id;
  const { quizId } = useParams();
  const studentRequestId = useRef(0);


  async function fetchStudents(page) {
    const requestId = ++studentRequestId.current;
    try {
      const response = await apiRoutes.getStudentsByQuizIdAndTeacherId(quizId, teacherId, { page });
      if (requestId !== studentRequestId.current) return;
      setStudents(response.data.data || []);
      setTotalPages(response.data.meta.totalPages || 1);
    } catch {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }

  async function getAttendance(quizId) {
    try {
      const response = await apiRoutes.getQuizAttendance(quizId);
      setAttendance(response.data.data || []);
      return response.data.data || [];
    } catch {
      setError('Failed to fetch attendance');
      return [];
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    // The async fetch updates state only after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    getAttendance(quizId);
  }, [quizId]);

  useEffect(() => {
    // The request-id guard prevents stale async responses from updating this page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (teacherId) fetchStudents(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, quizId, teacherId]);


  const handleToggleStatus = async (student_id, status) => {
    try {
      await apiRoutes.updateQuizAttendance({ quiz_id: quizId, student_id, status });
      await Promise.all([fetchStudents(currentPage), getAttendance(quizId)]);
    } catch {
      showAlert('Failed to toggle user status', { variant: 'error' });
    };
  };

  const attendanceMap = new Map(
  attendance.map(a => [a.student_id, a.status])
);

const mergedStudents = students.map(student => {
  return {
    ...student,
    attendanceStatus: attendanceMap.get(student.student_id) || false,
  };
});

  const filteredStudents = mergedStudents.filter((student) =>
    student.student.name?.toLowerCase().includes(nameSearch.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Students List</h1>
      </div>
      <div className="flex items-center space-x-4 mb-4 text-sm text-slate-600">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded-md w-[300px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      {error && <Alert className="mb-4">{error}</Alert>}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? <TableLoadingRow colSpan={5} label="Loading students…" /> : filteredStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{mergedStudents.indexOf(student) + 1}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{student.student.name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.student.email}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.student.student_id || '-'}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-2">
                    {/* Checkbox */}
                    <button title="Toggle status">
                      <label className="checkbox">
                        <input type="checkbox" className='mt-1 w-[15px] h-[15px]' checked={student?.attendanceStatus} onChange={() => handleToggleStatus(student?.student.id, student?.attendanceStatus)} />
                        <span className="slider round"></span>
                      </label>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Numbers Pagination Controls */}
        <div className="flex justify-center gap-2 p-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              disabled={currentPage === page}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition ${
                page === currentPage ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
