import { LoaderCircle } from 'lucide-react';

const LoadingIndicator = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex min-h-32 items-center justify-center gap-3 text-sm font-medium text-slate-600 ${className}`} role="status" aria-live="polite">
    <LoaderCircle className="h-5 w-5 animate-spin text-red-600" aria-hidden="true" />
    <span>{label}</span>
  </div>
);

export const TableLoadingRow = ({ colSpan, label = 'Loading…' }) => (
  <tr><td colSpan={colSpan} className="p-0"><LoadingIndicator label={label} /></td></tr>
);

export default LoadingIndicator;
