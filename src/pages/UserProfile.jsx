import { useNavigate } from 'react-router-dom';
import {
  AtSign, CalendarDays, ChevronRight, Fingerprint, KeyRound,
  MapPin, Phone, ShieldCheck, UserRound, UsersRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const displayValue = (value) => {
  if (value === null || value === undefined || String(value).trim() === '') return 'Not provided';
  return String(value);
};

const formatDate = (value) => {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return displayValue(value);
  return new Intl.DateTimeFormat('en', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(date);
};

const formatRole = (role) => role
  ? role.charAt(0) + role.slice(1).toLowerCase()
  : 'Member';

const getInitials = (name) => {
  if (!name?.trim()) return 'U';
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
};

const DetailItem = ({ icon: Icon, label, value, wide = false }) => {
  const isMissing = value === 'Not provided';
  return (
    <div className={`flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
        <Icon size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className={`mt-1 break-words text-sm font-medium ${isMissing ? 'italic text-slate-400' : 'text-slate-900'}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = formatRole(user?.role);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-7">
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">User profile</h1>
        <p className="mt-2 text-sm text-slate-600">View your account and personal information.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 px-5 py-8 sm:px-8 sm:py-10">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-red-500/10 blur-2xl" />
          <div className="absolute -bottom-24 right-24 size-52 rounded-full bg-blue-500/10 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-slate-900 shadow-lg ring-4 ring-white/10 sm:size-24 sm:text-3xl">
              {getInitials(user?.name)}
            </div>
            <div className="min-w-0">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90 backdrop-blur-sm">
                <ShieldCheck size={14} aria-hidden="true" />
                {role} account
              </div>
              <h2 className="truncate text-2xl font-bold text-white sm:text-3xl">{displayValue(user?.name)}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
                <AtSign size={15} aria-hidden="true" />
                <span className="truncate">{displayValue(user?.email)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Profile information</h2>
            <p className="mt-1 text-sm text-slate-500">The personal details associated with your account.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DetailItem icon={UserRound} label="Full name" value={displayValue(user?.name)} />
              <DetailItem icon={AtSign} label="Email address" value={displayValue(user?.email)} />
              <DetailItem icon={UsersRound} label="Role" value={role} />
              {user?.role === 'STUDENT' && <DetailItem icon={Fingerprint} label="Student ID" value={displayValue(user?.student_id)} />}
              <DetailItem icon={Phone} label="Phone number" value={displayValue(user?.phone_number)} />
              <DetailItem icon={CalendarDays} label="Date of birth" value={formatDate(user?.date_of_birth)} />
              <DetailItem icon={UserRound} label="Gender" value={displayValue(user?.gender)} />
              <DetailItem icon={MapPin} label="Address" value={displayValue(user?.address)} wide />
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 p-5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <KeyRound size={19} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-semibold text-slate-950">Password &amp; security</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Keep your account secure by using a strong, unique password.</p>
            <button
              type="button"
              onClick={() => navigate('/change-password')}
              className="mt-5 inline-flex w-full items-center justify-between rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
            >
              Change password
              <ChevronRight size={17} aria-hidden="true" />
            </button>
          </aside>
        </div>
      </section>
    </div>
  );
};

export default UserProfile;
