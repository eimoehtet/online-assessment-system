import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEditorAutosave } from './editorAutosave.js';

test('saves after five idle seconds and skips unchanged data', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const saver = createEditorAutosave({ initial: {}, version: 0, onStatus() {}, save: async (data, version) => { calls.push(data); return { version: version + 1 }; } });
  saver.update({ title: 'Draft' });
  t.mock.timers.tick(4999);
  assert.equal(calls.length, 0);
  t.mock.timers.tick(1);
  await saver.flush();
  assert.deepEqual(calls, [{ title: 'Draft' }]);
  saver.update({ title: 'Draft' });
  await saver.flush();
  assert.equal(calls.length, 1);
  saver.dispose();
});

test('continuous edits still save at thirty seconds', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const calls = [];
  const saver = createEditorAutosave({ initial: {}, version: 0, onStatus() {}, save: async data => { calls.push(data); return { version: 1 }; } });
  saver.update({ text: '0' });
  for (let i = 1; i <= 7; i++) { t.mock.timers.tick(4000); saver.update({ text: String(i) }); }
  assert.equal(calls.length, 0);
  t.mock.timers.tick(2000);
  await saver.flush();
  assert.deepEqual(calls, [{ text: '7' }]);
  saver.dispose();
});

test('serializes requests and saves newer edits with the returned version', async () => {
  const calls = [];
  let complete;
  const saver = createEditorAutosave({ initial: {}, version: 2, onStatus() {}, save: (data, version) => {
    calls.push({ data, version });
    return calls.length === 1 ? new Promise(resolve => { complete = resolve; }) : Promise.resolve({ version: 4 });
  } });
  saver.update({ text: 'first' });
  const pending = saver.flush();
  saver.update({ text: 'second' });
  assert.equal(calls.length, 1);
  complete({ version: 3 });
  await pending;
  assert.deepEqual(calls.map(c => c.version), [2, 3]);
  assert.equal(calls[1].data.text, 'second');
  assert.equal(saver.dirty, false);
  saver.dispose();
});

test('retains failed data and retries without advancing the version', async () => {
  let fail = true;
  const versions = [];
  const saver = createEditorAutosave({ initial: {}, version: 1, onStatus() {}, save: async (_data, version) => {
    versions.push(version);
    if (fail) throw new Error('Offline');
    return { version: 2 };
  } });
  saver.update({ text: 'Keep this' });
  await assert.rejects(saver.flush());
  assert.equal(saver.dirty, true);
  fail = false;
  await saver.flush();
  assert.deepEqual(versions, [1, 1]);
  saver.dispose();
});

test('stops automatic overwrites after a draft conflict', async () => {
  let calls = 0;
  const saver = createEditorAutosave({ initial: {}, version: 1, onStatus() {}, save: async () => {
    calls++;
    throw { response: { status: 409 } };
  } });
  saver.update({ text: 'Local' });
  await assert.rejects(saver.flush());
  saver.update({ text: 'More local edits' });
  await assert.rejects(saver.flush());
  assert.equal(calls, 1);
  assert.equal(saver.dirty, true);
  saver.dispose();
});
