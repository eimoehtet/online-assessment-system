import React from 'react';
import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { SquarePen, Trash2, UserPlus, KeyIcon, ChevronDown } from 'lucide-react';
import { useParams } from 'react-router-dom';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResetPasswordModal, setShowResetPasswordModal] = useState([false, null]);
  const [attendance, setAttendance] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [nameSearch, setNameSearch] = useState("");
  const teacherId = localStorage.getItem('userId');
  const { quizId } = useParams();


  async function fetchStudents() {
    try {
      const response = await apiRoutes.getStudentsByQuizIdAndTeacherId(quizId, teacherId, { page: currentPage });
      setStudents(response.data.data || []);
      setTotalPages(response.data.meta.totalPages || 1);
      setCurrentPage(response.data.meta.page || 1);
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
    fetchStudents();
  };

  useEffect(() => {
    getAttendance(quizId);
    fetchStudents();
  }, []);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggleStatus = async (student_id, status) => {
    try {
      await apiRoutes.updateQuizAttendance({ quiz_id: quizId, student_id, status });
      fetchStudents();
      getAttendance(quizId);
    } catch {
      alert('Failed to toggle user status');
    };
  };

  if (loading) return <div className="text-sm text-slate-600">Loading students...</div>;

  const filteredStudents = students?.filter((student) => {
    const nameMatch = student.student.name?.toLowerCase()
      .includes(nameSearch.toLowerCase());
    return nameMatch;
  });

  const attendanceMap = new Map(
  attendance.map(a => [a.student_id, a.status])
);

const mergedStudents = students.map(student => {
  return {
    ...student,
    attendanceStatus: attendanceMap.get(student.student_id) || false,
  };
});

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

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
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
            {mergedStudents.map(student => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{mergedStudents.indexOf(student) + 1}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{student.student.name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.student.email}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.student.student_id || '-'}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setShowModal([true, student])} className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 cursor-pointer" title="Edit user">
                      <SquarePen size={16} />
                    </button>
                    <button onClick={() => handleDelete(student.student.id)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 cursor-pointer" title="Delete user">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setShowResetPasswordModal([true, student])} className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 cursor-pointer" title="Change password">
                      <KeyIcon size={16} />
                    </button>
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
      {showResetPasswordModal[0] && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">Reset Password for {showResetPasswordModal[1].name}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRoutes.resetPassword(showResetPasswordModal[1].id, formData.password);
                setShowResetPasswordModal([false, null]);
                setFormData(initialFormData);
              } catch (err) {
                setError(err?.response?.data?.message || 'Failed to reset password');
              }
            }} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowResetPasswordModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentList;
