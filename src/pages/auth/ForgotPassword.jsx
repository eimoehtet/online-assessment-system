import { useState } from 'react';
import { Link } from 'react-router-dom';
import ppiuLogo from '../../assets/ppiu-logo.png';
import { apiRoutes } from '../../api/routes';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await apiRoutes.forgotPassword(email);
      setMessage(response.data.message || 'If an account exists, a password reset link has been sent to your email.');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to send password reset email. Please try again.');
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

        <h2 className="text-xl font-bold text-slate-800 text-center mb-1">
          Forgot Password?
        </h2>
        <p className="mb-6 text-sm text-slate-500 text-center">
          Enter your registered email address or student ID and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-800">
              <CheckCircle className="mx-auto mb-2 text-green-600" size={32} />
              <p>{message}</p>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Please check your email inbox (and spam folder) for instructions.
            </p>
            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
              >
                <ArrowLeft size={16} className="mr-1" /> Back to Log In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email or Student ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-sm rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  required
                />
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 hover:underline"
              >
                <ArrowLeft size={16} className="mr-1" /> Back to Log In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
