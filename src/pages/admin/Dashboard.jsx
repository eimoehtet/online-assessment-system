import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { apiRoutes } from '../../api/routes';
import dateFormat from "../dateFormat";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [publishedQuizzes, setPublishedQuizzes] = useState([]);
  const [allQuizzes, setAllQuizzes] = useState([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiRoutes.getDashboardStats();
        const stats = response.data.data;
        setTotalCourses(stats.courses);
        setTotalTeachers(stats.teachers);
        setTotalStudents(stats.students);
        setTotalQuizzes(stats.quizzes);
        setPublishedQuizzes(stats.publishedQuizzes || []);
        setAllQuizzes(stats.recentQuizzes || []);
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
        <p className="mt-2 text-slate-600">Welcome, {user?.name}!</p>
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

      {/* List all published Quizzes with course name and teacher name */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Published Quizzes</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Quiz Title</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Course Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Teacher Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Start Date</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-t border-slate-200">
              {Array.isArray(publishedQuizzes) && publishedQuizzes.length > 0 ? (
                publishedQuizzes.map((quiz, index) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 text-slate-950">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.title}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.course?.name}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.teacher?.name}</td>
                    <td className="px-6 py-4 text-slate-950"> {dateFormat(quiz.start_date, "mmmm d, yyyy")} </td>
                    <td className="px-6 py-4 text-slate-950"> {dateFormat(quiz.end_date, "mmmm d, yyyy")} </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-slate-600">No published quizzes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* List all quizzes */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">All Quizzes</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">No</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Quiz Title</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Course Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Teacher Name</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">Start Date</th>
                <th scope="col" className="px-6 py-3 text-left font-semibold text-slate-900">End Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-t border-slate-200">
              {Array.isArray(allQuizzes) && allQuizzes.length > 0 ? (
                allQuizzes.map((quiz, index) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 text-slate-950">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.title}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.course?.name}</td>
                    <td className="px-6 py-4 text-slate-950">{quiz.teacher?.name}</td>
                    <td className="px-6 py-4 text-slate-950"> {dateFormat(quiz.start_date, "mmmm d, yyyy")} </td>
                    <td className="px-6 py-4 text-slate-950"> {dateFormat(quiz.end_date, "mmmm d, yyyy")} </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-slate-600">No quizzes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
