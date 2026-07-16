import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role}</p>

      {user?.role === 'STUDENT' && <p>Student ID: {user?.student_id}</p>}
      <p>Phone Number: {user?.phone_number}</p>
      <p>Date of Birth: {user?.date_of_birth}</p>
      <p>Gender: {user?.gender}</p>
      <p>Address: {user?.address}</p>

      <button className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition" onClick={() => navigate('/change-password')}>Change Password</button>
    </div>
  );
};

export default UserProfile;