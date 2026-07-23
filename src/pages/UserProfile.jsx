import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  return (
    <div className="p-4 max-w-[500px] bg-white shadow-md rounded-lg text-slate-600 p-6">
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <div className="mb-4 grid grid-cols-2"><div>Name:</div> <div>{user?.name}</div></div>
      <div className="mb-4 grid grid-cols-2"><div>Email:</div> <div>{user?.email}</div></div>
      <div className="mb-4 grid grid-cols-2"><div>Role:</div> <div>{user?.role}</div></div>

      {user?.role === 'STUDENT' && (
        <div className="mb-4 grid grid-cols-2">
          <div>Student ID:</div>
          <div>{user?.student_id}</div>
        </div>
      )}
      <div className="mb-4 grid grid-cols-2">
        <div>Phone Number:</div>
        <div>{user?.phone_number}</div>
      </div>
      <div className="mb-4 grid grid-cols-2">
        <div>Date of Birth:</div>
        <div>{user?.date_of_birth}</div>
      </div>
      <div className="mb-4 grid grid-cols-2">
        <div>Gender:</div>
        <div>{user?.gender}</div>
      </div>
      <div className="mb-4 grid grid-cols-2">
        <div>Address:</div>
        <div>{user?.address}</div>
      </div>

      <button className="py-2 text-red-500 rounded hover:underline hover:text-red-600 transition" onClick={() => navigate('/change-password')}>Change Password</button>
    </div>
  );
};

export default UserProfile;