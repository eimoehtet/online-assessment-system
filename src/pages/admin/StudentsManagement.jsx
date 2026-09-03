import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { SquarePen, Trash2, UserPlus, KeyIcon, Eye, EyeOff } from 'lucide-react';
import { TableLoadingRow } from '../../components/ui/LoadingIndicator';

const StudentsManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState([false, null]);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState([false, null]);
  const [showPassword, setShowPassword] = useState(false);
  const initialFormData = {
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    gender: null,
    student_id: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
    status: 1, // Default to active

  };
  const [formData, setFormData] = useState(initialFormData);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [nameSearch, setNameSearch] = useState("");


  async function fetchStudents(page = 1) {
    try {
      const response = await apiRoutes.getStudents({ page, search: nameSearch || undefined });
      setStudents(response.data.data || []);
      console.log('Fetched students:', response.data.data);
      setTotalPages(response.data.meta.totalPages || 1);
      setTotalStudents(response.data.meta.total || 0);
      setCurrentPage(response.data.meta.page || 1);
    } catch {
      setError('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchStudents(page);
  };

  useEffect(() => {
    const timer = setTimeout(() => { setCurrentPage(1); fetchStudents(1); }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameSearch]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (showModal[0] && showModal[1]) {
      setFormData({
        name: showModal[1].name,
        email: showModal[1].email,
        role: showModal[1].role,
        gender: showModal[1].gender || null,
        student_id: showModal[1].student_id || '',
        phone_number: showModal[1].phone_number || '',
        date_of_birth: showModal[1].date_of_birth ? showModal[1].date_of_birth.split('T')[0] : '',
        address: showModal[1].address || '',
        status: showModal[1].status ?? 1,
      });
    } else {
      setFormData(initialFormData);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showModal[1]) {
        await apiRoutes.updateUser(showModal[1].id, formData);
      } else {
        await apiRoutes.createUser(formData);
      }
      setShowModal([false, null]);
      fetchStudents();
      setFormData(initialFormData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiRoutes.deleteUser(id);
        fetchStudents();
      } catch {
        alert('Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiRoutes.toggleUserStatus(id);
      fetchStudents();
    } catch {
      alert('Failed to toggle user status');
    };
  };

    const filteredStudents = students;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Students Management</h1>
        <button onClick={() => setShowModal([true, null])} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">
          <UserPlus size={18} />
          Add Student
        </button>
      </div>
      <div className="flex items-center space-x-4 mb-4 text-sm text-slate-600">
          <input
            type="text"
            placeholder="Search by name..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="border border-gray-300 p-2 bg-white rounded-md w-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm font-semibold text-slate-700">Total students: {totalStudents}</p>
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
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Courses</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {loading ? <TableLoadingRow colSpan={8} label="Loading students…" /> : filteredStudents.map((student, index) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{(currentPage - 1) * 10 + index + 1}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{student.name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.email}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                    student.role === 'ADMIN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : student.role === 'TEACHER'
                        ? 'bg-red-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {student.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{student.student_id || '-'}</td>
                <td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${student.status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{student.status === 1 ? 'Active' : 'Inactive'}</span></td>
                <td className="px-4 py-4 text-slate-600">{student._count?.enrollments || 0}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setShowModal([true, student])} className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 cursor-pointer" title="Edit user">
                      <SquarePen size={16} />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 cursor-pointer" title="Delete user">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setShowResetPasswordModal([true, student])} className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 cursor-pointer" title="Change password">
                      <KeyIcon size={16} />
                    </button>
                    {/* Toggle student status button */}
                    <button onClick={() => handleToggleStatus(student.id)} className="rounded-lg p-2 text-green-600 transition hover:bg-green-50 cursor-pointer" title="Toggle status">
                      <label className="switch">
                        <input type="checkbox" checked={student.status === 1} onChange={() => handleToggleStatus(student.id)} />
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

      {showModal[0] && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">{showModal[1] ? 'Edit Student' : 'Add New Student'}</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="email" name="email" value={formData.email} onChange={handleInputChange} required />
              </div>
             {!showModal[1] &&  <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
              </div>}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Gender</label>
                <select name="gender" value={formData.gender || ''} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Student ID </label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="student_id" value={formData.student_id} onChange={handleInputChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">{showModal[1] ? 'Update Student' : 'Create Student'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
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
                <div className="relative">
                  <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleInputChange} minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-700" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">At least 6 characters</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowResetPasswordModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">Reset Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
  /* The switch - the box around the slider */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

/* Hide default HTML checkbox */
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

/* The slider */
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  -webkit-transition: .4s;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 2px;
  background-color: white;
  -webkit-transition: .4s;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2196F3;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2196F3;
}

input:checked + .slider:before {
  -webkit-transform: translateX(20px);
  -ms-transform: translateX(20px);
  transform: translateX(20px);
}

/* Rounded sliders */
.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}
`}</style>

    </div>
  );
};

export default StudentsManagement;
