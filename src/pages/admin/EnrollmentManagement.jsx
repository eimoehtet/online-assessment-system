import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { Trash2, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const EnrollmentManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    course_ids: [],
    student_id: '',
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    gender: '',
    phone_number: '',
    date_of_birth: '',
    address: '',
  });
  const navigate = useNavigate();

  const handleCourseClick = (courseId) => {
    navigate(`/admin/enrollments/${courseId}`);
  };

  async function fetchData() {
    setLoading(true);
    try {
      const [coursesRes] = await Promise.all([
        apiRoutes.getCourses(),
      ]);
      setCourses(coursesRes.data.data || []);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, selectedOptions } = e.target;
    if (type === 'select-multiple') {
      const values = Array.from(selectedOptions).map(option => option.value);
      setFormData(prev => ({ ...prev, [name]: values }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { course_ids, student_id, ...rest } = formData;
      const payload = {
        ...rest,
        student_id: student_id ? parseInt(student_id, 10) : undefined,
        course_ids: course_ids.map(id => parseInt(id, 10))
      };
      await apiRoutes.createEnrollment(payload);
      setShowModal(false);
      fetchData();
      setFormData({
        course_ids: [],
        student_id: '',
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        gender: '',
        phone_number: '',
        date_of_birth: '',
        address: '',
      });
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to create enrollment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this enrollment?')) {
      try {
        await apiRoutes.deleteEnrollment(id);
        fetchData();
      } catch {
        alert('Failed to delete enrollment');
      }
    }
  };

  if (loading) return <div className="text-sm text-slate-600">Loading enrollments...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Course Enrollment Management</h1>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
          <UserPlus size={18} />
          Add Enrollment
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map(course => (
            <div onClick={() => handleCourseClick(course.id)} key={course.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer"><span>{course.name}</span></div>
        ))}
      </div>

      {showModal&& (
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
             <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <input className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" type="password" name="password" value={formData.password} onChange={handleInputChange} required />
              </div>
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
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assign Course</label>
                <select multiple name="course_ids" value={formData.course_ids} onChange={handleInputChange} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required>
                  <option value="" disabled>Select courses</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal([false, null])} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">{showModal[1] ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentManagement;
