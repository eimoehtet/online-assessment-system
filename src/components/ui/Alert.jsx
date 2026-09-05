import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

const variants = {
  error: { style: 'border-red-200 bg-red-50 text-red-800', Icon: CircleAlert },
  success: { style: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CircleCheck },
  warning: { style: 'border-amber-200 bg-amber-50 text-amber-900', Icon: TriangleAlert },
  info: { style: 'border-blue-200 bg-blue-50 text-blue-900', Icon: Info },
};

export default function Alert({ children, variant = 'error', title, onDismiss, className = '' }) {
  const { style, Icon } = variants[variant] || variants.info;
  return <div role={variant === 'error' ? 'alert' : 'status'} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${style} ${className}`}>
    <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 flex-1 break-words">
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="whitespace-pre-wrap">{children}</div>
    </div>
    {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss alert" className="shrink-0 rounded p-1 hover:bg-black/5 focus-visible:outline-2"><X size={18} /></button>}
  </div>;
}
