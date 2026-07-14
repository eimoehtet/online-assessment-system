import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LogOut,
  User,
  BookOpen,
  Users,
  LayoutDashboard,
  FileText,
  CheckSquare
} from 'lucide-react';

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = {
    ADMIN: [
      { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard size={20} /> },
      { label: 'Users', path: '/admin/users', icon: <Users size={20} /> },
      { label: 'Courses', path: '/admin/courses', icon: <BookOpen size={20} /> },
      { label: 'Enrollments', path: '/admin/enrollments', icon: <Users size={20} /> },
    ],
    TEACHER: [
      { label: 'Dashboard', path: '/teacher', icon: <LayoutDashboard size={20} /> },
      { label: 'Assigned Courses', path: '/teacher/assigned-courses', icon: <BookOpen size={20} /> },
      { label: 'Quizzes', path: '/teacher/quizzes', icon: <FileText size={20} /> },
      { label: 'Submissions', path: '/teacher/submissions', icon: <CheckSquare size={20} /> },
    ],
    STUDENT: [
      { label: 'Dashboard', path: '/student', icon: <LayoutDashboard size={20} /> },
      { label: 'My Courses', path: '/student/courses', icon: <BookOpen size={20} /> },
      { label: 'My Results', path: '/student/results', icon: <CheckSquare size={20} /> },
    ],
  };

  const items = navItems[user?.role] || [];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:sticky md:inset-auto md:top-0 md:h-screen md:w-64 md:shrink-0 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-5 md:py-6">
        <div className="min-w-0 md:mb-8">
          <div className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <User size={16} />
            </span>
            <div className="min-w-0">
              <span className="block truncate font-medium text-slate-900">{user?.name}</span>
              <small className="block text-xs uppercase tracking-wide text-slate-500">{user?.role}</small>
            </div>
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto md:flex-1 md:flex-col md:items-stretch md:gap-2 md:overflow-visible">
          {items.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700 md:px-4 md:py-3"
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="md:border-t md:border-slate-200 md:pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600 md:justify-start md:px-4 md:py-3"
          >
            <LogOut size={20} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 pb-8 pt-24 sm:px-6 lg:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
