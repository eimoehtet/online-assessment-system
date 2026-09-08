import Alert from '../../components/ui/Alert';
import { confirmAlert } from '../../lib/alerts';
import { showAlert } from '../../lib/alerts';
import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import { SquarePen, Trash2, BookPlus, BookOpen, Users, FileText, Search, ChevronDown } from 'lucide-react';
import { Link } from "react-router-dom";
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    teacher_id: '',
    shift: ''
  });

  async function fetchData() {
    setLoading(true);
    try {
      const [coursesRes, usersRes] = await Promise.all([
        apiRoutes.getCourses({ limit: 100, search: search || undefined, status: statusFilter || undefined, shift: shiftFilter || undefined }),
        apiRoutes.getTeachers({ limit: 100 })
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
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, shiftFilter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setEditingCourse(null);
    setFormData({ name: '', code: '', teacher_id: '', shift: '' });
    setShowModal(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      teacher_id: course.teacher_id.toString(),
      shift: course.shift
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
        showAlert('Course updated successfully.', { variant: 'success' });
      } else {
        await apiRoutes.createCourse(data);
        showAlert('Course created successfully.', { variant: 'success' });
      }
      
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (await confirmAlert('Are you sure you want to delete this course?')) {
      try {
        await apiRoutes.deleteCourse(id);
        showAlert('Course deleted successfully.', { variant: 'success' });
        fetchData();
      } catch {
        showAlert('Failed to delete course', { variant: 'error' });
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await apiRoutes.toggleCourseStatus(id);
      showAlert('Course status updated successfully.', { variant: 'success' });
      fetchData();
    } catch {
      showAlert('Failed to toggle course status', { variant: 'error' });
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Course Management</h1>
        <button onClick={openAddModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 cursor-pointer">
          <BookPlus size={18} />
          Add Course
        </button>
      </div>

      {error && <Alert className="mb-4">{error}</Alert>}

      <div className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <label className="relative"><span className="sr-only">Search courses</span><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or code…" className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm" /></label>
        <Filter value={shiftFilter} onChange={setShiftFilter} label="Filter by shift"><option value="">All shifts</option><option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option><option value="EVENING">Evening</option></Filter>
        <Filter value={statusFilter} onChange={setStatusFilter} label="Filter by status"><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></Filter>
      </div>
      {loading ? <LoadingIndicator label="Loading courses…" /> : courses.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"><BookOpen className="mx-auto text-slate-400" size={42} /><h2 className="mt-3 font-semibold text-slate-800">No courses found</h2><p className="mt-1 text-sm text-slate-500">Try changing the filters or create a new course.</p></div> : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => (
          <article key={course.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between"><div className="rounded-xl bg-red-50 p-3 text-blue-700"><BookOpen size={24} /></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${course.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{course.status ? 'Active' : 'Inactive'}</span></div>
            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-blue-700">{course.code}</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{course.name}</h2>
            <div className="mt-4 space-y-2 text-sm text-slate-600"><p>Teacher: <span className="font-medium text-slate-800">{course.teacher?.name || 'Unassigned'}</span>{course.teacher?.status === 0 && <span className="ml-2 text-xs font-semibold text-amber-700">Inactive</span>}</p><p>Shift: <span className="font-medium capitalize text-slate-800">{course.shift?.toLowerCase()}</span></p></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><Stat icon={<Users size={18} />} value={course._count?.enrollments || 0} label="Students" /><Stat icon={<FileText size={18} />} value={course._count?.quizzes || 0} label="Quizzes" /></div>
            <div className="mt-6 grid grid-cols-2 gap-2"><Link to={`/admin/courses/${course.id}/students`} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-500">Manage Students</Link><button onClick={() => openEditModal(course)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"><SquarePen size={16} /> Edit</button></div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3"><label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={course.status} onChange={() => handleToggleStatus(course.id)} className="size-4 accent-blue-700" /> {course.status ? 'Active' : 'Inactive'}</label><button onClick={() => handleDelete(course.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"><Trash2 size={14} /> Delete</button></div>
          </article>
        ))}</div>
      )}

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
                      {teacher.name} 
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Shift</label>
                <select
                  name="shift"
                  value={formData.shift}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                >
                  <option value="">Select a shift</option>
                  <option value="MORNING">Morning</option>
                  <option value="AFTERNOON">Afternoon</option>
                  <option value="EVENING">Evening</option>
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

const Filter = ({ value, onChange, label, children }) => <label className="relative"><span className="sr-only">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-2.5 pl-3 pr-9 text-sm">{children}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /></label>;
const Stat = ({ icon, value, label }) => <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-blue-700">{icon}<div><div className="font-bold text-slate-950">{value}</div><div className="text-xs text-slate-500">{label}</div></div></div>;

export default CourseManagement;
