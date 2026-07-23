import { useAuth } from '../../context/AuthContext';
import {useNavigate} from 'react-router-dom';
import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coursesRes = await apiRoutes.getCourses();
        setTotalCourses(coursesRes.data.meta.total);

        const teachersRes = await apiRoutes.getTeachers();
        setTotalTeachers(teachersRes.data.data.length);

        const studentsRes = await apiRoutes.getStudents();
        console.log('Students Response:', studentsRes); // Log the entire response for debugging
        setTotalStudents(studentsRes.data.data.length);

        const quizzesRes = await apiRoutes.getQuizzes();
        setTotalQuizzes(quizzesRes.data.meta.total);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user?.name}! You have full control over the system.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{totalCourses}</h3>
          <p className="mt-2 text-sm text-slate-600">Courses</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{totalTeachers}</h3>
          <p className="mt-2 text-sm text-slate-600">Teachers</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{totalStudents}</h3>
          <p className="mt-2 text-sm text-slate-600">Students</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{totalQuizzes}</h3>
          <p className="mt-2 text-sm text-slate-600">Quizzes</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
