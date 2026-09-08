import Alert from '../../components/ui/Alert';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ppiuLogo from '../../assets/ppiu-logo.png';
import { Eye, EyeOff } from 'lucide-react';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading) {
    return <LoadingIndicator label="Restoring your session…" className="min-h-screen bg-slate-50" />;
  }

  if (user) {
    return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      navigate(`/${user.role.toLowerCase()}`, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <img src={ppiuLogo} alt="Logo" className="mx-auto h-18 w-auto" />
        </div>
        <p className="mb-6 text-slate-600 text-center">
          Log in to your account
        </p>

        {error && <Alert className="mb-4">{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
            </div>
          </div>
          {/* <div className="text-right">
            <Link to="/forgot-password" className="text-xs text-slate-500 hover:text-red-600 hover:underline transition-colors font-medium">Forgot password?</Link>
          </div> */}
          <button
            type="submit"
            className="w-full text-sm rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
