let items = [];
let nextId = 0;
const listeners = new Set();
const dismissTimers = new Map();
const emit = () => listeners.forEach((listener) => listener());

export const subscribeAlerts = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getAlerts = () => items;

export function dismissAlert(id) {
  clearTimeout(dismissTimers.get(id));
  dismissTimers.delete(id);
  items = items.filter((item) => item.id !== id);
  emit();
}

export function showAlert(message, { variant = 'info', title } = {}) {
  const id = ++nextId;
  items = [...items, { id, message, variant, title }];
  dismissTimers.set(id, setTimeout(() => dismissAlert(id), 5000));
  emit();
  return id;
}

export function confirmAlert(message) {
  return new Promise((resolve) => {
    items = [...items, { id: ++nextId, message, variant: 'warning', resolve }];
    emit();
  });
}
