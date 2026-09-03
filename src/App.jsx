import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';

// Pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AdminDashboard from './pages/admin/Dashboard';
import TeachersManagement from './pages/admin/TeachersManagement';
import StudentsManagement from './pages/admin/StudentsManagement';
import Reports from './pages/admin/Reports';
import CourseManagement from './pages/admin/CourseManagement';
import TeacherDashboard from './pages/teacher/Dashboard';
import QuizManagement from './pages/teacher/QuizManagement';
import QuizEditor from './pages/teacher/QuizEditor';
import SubmissionDashboard from './pages/teacher/SubmissionDashboard';
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/StudentCourses';
import StudentQuizzes from './pages/student/StudentQuizzes';
import QuizTake from './pages/student/QuizTake';
import StudentResults from './pages/student/StudentResults';
import EnrollmentDetail from './pages/admin/EnrollmentDetail';
import UserProfile from './pages/UserProfile';
import ChangePasswordForm from './pages/ChangePasswordForm';
import StudentList from './pages/teacher/StudentList';
import TeacherClasses from './pages/teacher/TeacherClasses';
import CourseStudents from './pages/teacher/CourseStudents';
import QuizReportDetails from './pages/admin/QuizReportDetails';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/teachers" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TeachersManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/students" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <StudentsManagement />
              </ProtectedRoute>
            } />    
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <CourseManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses/:courseId/students" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <EnrollmentDetail />
              </ProtectedRoute>
            } />
            
            <Route path="/admin/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/admin/reports/:quizId" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <QuizReportDetails />
              </ProtectedRoute>
            } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          } />

          <Route path="/change-password" element={
            <ProtectedRoute>
              <ChangePasswordForm />
            </ProtectedRoute>
          } />

            {/* Teacher Routes */}
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/quizzes" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <QuizManagement />
              </ProtectedRoute>
            } />
            <Route path="/teacher/quizzes/new" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <QuizEditor />
              </ProtectedRoute>
            } />
            <Route path="/teacher/quizzes/edit/:id" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <QuizEditor />
              </ProtectedRoute>
            } />
            <Route path="/teacher/submissions" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <SubmissionDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher/classes" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherClasses />
              </ProtectedRoute>
            } />
            <Route path="/teacher/classes/:courseId/students" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <CourseStudents />
              </ProtectedRoute>
            } />
            <Route path="/teacher/quizzes/students/:quizId" element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <StudentList />
              </ProtectedRoute>
            } />

            {/* Student Routes */}
            <Route path="/student" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/student/courses" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentCourses />
              </ProtectedRoute>
            } />
            <Route path="/student/courses/:courseId/quizzes" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentQuizzes />
              </ProtectedRoute>
            } />
            <Route path="/student/results" element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentResults />
              </ProtectedRoute>
            } />
          </Route>
          
          {/* Specialized Quiz Take Route (Likely outside MainLayout for full control) */}
          <Route path="/student/quiz/take/:submissionId" element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <QuizTake />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
