import Alert from '../components/ui/Alert';
import { useState } from 'react';
import {apiRoutes} from '../api/routes';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ChangePasswordForm = () => {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    try {
      const response = await apiRoutes.changePassword(currentPassword, newPassword);
      if (response.data.success) {
        setSuccessMessage('Password changed successfully. Please sign in again.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        await logout();
      } else {
        setError(response.data.message || 'Failed to change password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while changing the password.');
    }
  };

  return (
    <div className="max-w-md mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
      {error && <Alert className="mb-4">{error}</Alert>}
      {successMessage && <Alert variant="success" className="mb-4">{successMessage}</Alert>}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Current Password</label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmNewPassword"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-500 transition cursor-pointer"
        >
          Change Password
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
