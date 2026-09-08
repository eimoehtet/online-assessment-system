import { useEffect, useRef, useSyncExternalStore } from 'react';
import Alert from './Alert';
import { dismissAlert, getAlerts, subscribeAlerts } from '../../lib/alerts';

function Confirmation({ item }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  const finish = (accepted) => {
    dismissAlert(item.id);
    item.resolve(accepted);
  };
  return <dialog ref={dialog} aria-labelledby="confirmation-title" aria-describedby="confirmation-message" onCancel={(event) => { event.preventDefault(); finish(false); }} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-6 shadow-xl backdrop:bg-slate-950/40">
    <h2 id="confirmation-title" className="mb-4 text-lg font-semibold text-slate-950">Please confirm</h2>
    <span id="confirmation-message" className='text-sm'>{item.message}</span>
    <div className="mt-4 flex justify-end gap-3">
      <button autoFocus type="button" onClick={() => finish(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button>
      <button type="button" onClick={() => finish(true)} className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white">Confirm</button>
    </div>
  </dialog>;
}

export default function AlertHost() {
  const items = useSyncExternalStore(subscribeAlerts, getAlerts);
  const confirmation = items.find((item) => item.resolve);
  return <>
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex max-h-[80vh] w-[calc(100%-2rem)] max-w-md flex-col gap-3 overflow-y-auto">
      {items.filter((item) => !item.resolve).map((item) => <Alert key={item.id} variant={item.variant} title={item.title} onDismiss={() => dismissAlert(item.id)} className="pointer-events-auto shadow-lg">{item.message}</Alert>)}
    </div>
    {confirmation && <Confirmation key={confirmation.id} item={confirmation} />}
  </>;
}
