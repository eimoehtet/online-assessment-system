import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { Edit2, Trash2, UserPlus, UserKeyIcon } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState([false, null]);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState([false, null]);
  const initialFormData = {
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    gender: null,
    student_id: '',
    phone_number: '',
    date_of_birth: '',
    address: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);


  async function fetchUsers(page = 1) {
    try {
      const response = await apiRoutes.getUsers({ page });
      setUsers(response.data.data || []);
      setTotalPages(response.data.meta.totalPages || 1);
      setCurrentPage(response.data.meta.page || 1);
    } catch {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchUsers(page);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showModal[0] && showModal[1]) {
      setFormData({
        name: showModal[1].name,
        email: showModal[1].email,
        role: showModal[1].role,
        gender: showModal[1].gender || null,
        student_id: showModal[1].student_id || '',
        phone_number: showModal[1].phone_number || '',
        date_of_birth: showModal[1].date_of_birth ? showModal[1].date_of_birth.split('T')[0] : '',
        address: showModal[1].address || ''
      });
    } else {
      setFormData(initialFormData);
    }
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
      fetchUsers();
      setFormData(initialFormData);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await apiRoutes.deleteUser(id);
        fetchUsers();
      } catch {
        alert('Failed to delete user');
      }
    }
  };

  if (loading) return <div className="text-sm text-slate-600">Loading users...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">User Management</h1>
        <button onClick={() => setShowModal([true, null])} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">
          <UserPlus size={18} />
          Add User
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-4 py-4 font-medium text-slate-950">{user.name}</td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{user.email}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className={`rounded-md px-2 py-1 text-xs font-bold ${
                    user.role === 'ADMIN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : user.role === 'TEACHER'
                        ? 'bg-red-50 text-blue-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-slate-600">{user.student_id || '-'}</td>
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex gap-2">
                    <button onClick={() => setShowModal([true, user])} className="rounded-lg p-2 text-blue-600 transition hover:bg-red-50 cursor-pointer" title="Edit user">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 cursor-pointer" title="Delete user">
                      <Trash2 size={16} />
                    </button>
                    <button onClick={() => setShowResetPasswordModal([true, user])} className="rounded-lg p-2 text-yellow-600 transition hover:bg-yellow-50 cursor-pointer" title="Change password">
                      <UserKeyIcon size={16} />
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
            <h2 className="text-xl font-semibold text-slate-950">{showModal[1] ? 'Edit User' : 'Add New User'}</h2>
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
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                <select name="role" value={formData.role} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Student / Teacher ID </label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="student_id" value={formData.student_id} onChange={handleInputChange} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Date of Birth</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="text" name="address" value={formData.address} onChange={handleInputChange} required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">{showModal[1] ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showResetPasswordModal[0] && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">Change Password for {showResetPasswordModal[1].name}</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await apiRoutes.resetPassword(showResetPasswordModal[1].id, formData.password);
                setShowResetPasswordModal([false, null]);
                setFormData(initialFormData);
              } catch (err) {
                setError(err?.response?.data?.message || 'Failed to change password');
              }
            }} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New Password</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowResetPasswordModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">Change Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;