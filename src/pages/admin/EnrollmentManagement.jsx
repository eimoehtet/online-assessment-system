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
    course_id: '',
    student_id: ''
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRoutes.createEnrollment({
        course_id: parseInt(formData.course_id),
        student_id: parseInt(formData.student_id)
      });
      setShowModal(false);
      fetchData();
      setFormData({ course_id: '', student_id: '' });
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
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Enrollment Management</h1>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
          <UserPlus size={18} />
          Add Enrollment
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="w-full mb-4 rounded-lg flex justify-between flex-wrap gap-2 px-4 py-3 text-sm font-medium text-slate-700">
        {courses.map(course => (
            <div onClick={() => handleCourseClick(course.id)} key={course.id} className="w-1/4 h-[100px] text-center text-2xl flex justify-center items-center px-2 py-1 cursor-pointer rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><span>{course.name}</span></div>
        ))}
      </div>
    </div>
  );
};

export default EnrollmentManagement;
