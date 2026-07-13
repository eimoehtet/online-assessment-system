import { useAuth } from '../../context/AuthContext';
import {useNavigate} from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Admin Dashboard</h1>
        <p className="mt-2 text-slate-600">Welcome, {user?.name}! You have full control over the system.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer" onClick={() => navigate('/admin/users')}>
          <h3 className="text-lg font-semibold text-slate-950">Users</h3>
          <p className="mt-2 text-sm text-slate-600">Manage teachers and students.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm cursor-pointer" onClick={() => navigate('/admin/courses')}>
          <h3 className="text-lg font-semibold text-slate-950">Courses</h3>
          <p className="mt-2 text-sm text-slate-600">Create and assign courses.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
