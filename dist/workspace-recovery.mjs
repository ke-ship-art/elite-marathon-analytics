import {demoRace, validateData} from './core.mjs';
import {restoredWorkspace} from './restored-workspace.mjs';

export const RECOVERY_MARKER='elite-marathon.london-recovery.v1';
const storageKey='elite-marathon.v1';
function comparable(value) {
  return JSON.stringify(value, (key, item) => key==='id' ? undefined : item);
}
export function recoverWorkspace(storage) {
  const raw=storage.getItem(storageKey);
  const existing=raw ? validateData(JSON.parse(raw)) : null;
  if(storage.getItem(RECOVERY_MARKER)) return existing;
  const restored=validateData(structuredClone(restoredWorkspace));
  const london=restored.races.find(r=>r.id==='8b7726d2-5e8c-4d58-9e49-ae4805794924');
  const defaults=comparable(demoRace());
  const races=existing?.races || [];
  // Preserve edited demo records and all user-created races. Only remove the unchanged starter.
  const kept=races.filter(r=>comparable(r)!==defaults);
  const hasLondon=kept.some(r=>r.id===london.id || (r.date===london.date && /2026 TCS London Marathon/i.test(r.name)));
  const result=validateData({version:1,races:hasLondon ? kept : [london,...kept]});
  if(raw) storage.setItem('elite-marathon.backup.before-london-recovery',raw);
  storage.setItem(storageKey,JSON.stringify(result));
  storage.setItem(RECOVERY_MARKER,'done');
  return result;
}
