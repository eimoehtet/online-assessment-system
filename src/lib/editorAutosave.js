export function createEditorAutosave({ initial, version: initialVersion, save, onStatus }) {
  let latest = JSON.stringify(initial);
  let saved = latest;
  let version = initialVersion;
  let idleTimer;
  let maxTimer;
  let pending;
  let paused = false;
  let disposed = false;
  let blocked = false;
  const cancel = () => { clearTimeout(idleTimer); clearTimeout(maxTimer); idleTimer = maxTimer = null; };
  const schedule = () => {
    if (paused || disposed || blocked || latest === saved) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => flush().catch(() => {}), 5000);
    if (!maxTimer) maxTimer = setTimeout(() => flush().catch(() => {}), 30000);
  };
  const flush = async () => {
    if (blocked) throw new Error('This draft changed in another tab or device. Reopen the editor before saving again.');
    if (pending) return pending;
    cancel();
    pending = (async () => {
      while (latest !== saved && !disposed) {
        const snapshot = latest;
        onStatus('Saving draft to server…');
        try {
          const result = await save(JSON.parse(snapshot), version);
          version = result.version;
          saved = snapshot;
          onStatus('Draft saved to server');
        } catch (error) {
          blocked = error?.response?.status === 409;
          onStatus(error?.response?.data?.message || 'Draft not saved to server. Keep this page open; autosave will retry.');
          throw error;
        }
      }
    })();
    try { await pending; } finally { pending = null; schedule(); }
  };
  return {
    update(payload) { latest = JSON.stringify(payload); if (latest !== saved) { if (!blocked) onStatus('Unsaved draft changes'); schedule(); } },
    flush,
    pause() { paused = true; cancel(); },
    resume() { paused = false; schedule(); },
    dispose() { disposed = true; cancel(); },
    get version() { return version; },
    get dirty() { return latest !== saved; },
  };
}
