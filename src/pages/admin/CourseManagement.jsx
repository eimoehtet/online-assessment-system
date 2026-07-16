import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { Edit2, Trash2, BookPlus } from 'lucide-react';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: ''
  });

  async function fetchData() {
    setLoading(true);
    try {
      const [coursesRes, usersRes] = await Promise.all([
        apiRoutes.getCourses(),
        apiRoutes.getTeachers()
      ]);
      setCourses(coursesRes.data.data || []);
      const allTeachers = (usersRes.data.data || []);
      setTeachers(allTeachers);
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ name: '', code: '', teacher_id: '' });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      teacher_id: course.teacher_id.toString()
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        teacher_id: parseInt(formData.teacher_id)
      };

      if (editingCourse) {
        await apiRoutes.updateCourse(editingCourse.id, data);
      } else {
        await apiRoutes.createCourse(data);
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await apiRoutes.deleteCourse(id);
        fetchData();
      } catch {
        alert('Failed to delete course');
      }
    }
  };

  if (loading) return <div className="text-sm text-slate-600">Loading courses...</div>;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Course Management</h1>
        <button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">
          <BookPlus size={18} />
          Add Course
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead>
            <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Teacher</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-sm">
            {courses.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-10 text-center text-slate-500">No courses found.</td></tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-950">{course.code}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-700">{course.name}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <div className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                        {course.teacher?.name?.charAt(0)}
                      </div>
                      <span>{course.teacher?.name || 'Unassigned'}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => openEditModal(course)} className="rounded-lg p-2 text-blue-600 transition hover:bg-red-50 cursor-pointer" title="Edit course">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(course.id)} className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 cursor-pointer" title="Delete course">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-950">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Course Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. CS101"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Course Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Introduction to Programming"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assign Teacher</label>
                <select
                  name="teacher_id"
                  value={formData.teacher_id}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
