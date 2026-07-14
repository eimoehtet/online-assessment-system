import React, { useEffect, useState } from 'react';
import { apiRoutes } from '../../api/routes';
import { useNavigate } from 'react-router-dom';

const AssignedCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const fetchAssignedCourses = async () => {
      const teacherId = localStorage.getItem("userId");
      if (!teacherId) {
        setError("Teacher ID not found in local storage.");
        setLoading(false);
        return;
      }
      try {
        const response = await apiRoutes.getCourseByTeacherId(teacherId);
        setCourses(response.data.courses || []);
      } catch (err) {
        setError(err.message || 'An error occurred while fetching courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignedCourses();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Assigned Courses</h1>
      <ul className='flex flex-wrap gap-4'>
        {courses?.map(course => (
          <li key={course.id} className='w-[300px] bg-gray-100 p-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition' onClick={() => navigate(`/admin/enrollments/${course.id}`)}>{course.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AssignedCourses;