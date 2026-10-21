import {validateData} from './core.mjs';
import {londonSplits} from './london-splits.mjs';
export const SPLIT_IMPORT_MARKER='elite-marathon.london-splits.v1';
export function importLondonSplits(storage,workspace){
 if(!workspace || storage.getItem(SPLIT_IMPORT_MARKER))return workspace;
 const updated=structuredClone(workspace);
 for(const r of updated.races){
  if(r.demo || !(r.id===londonSplits.id || (r.date==='2026-04-26' && /^2026 TCS London Marathon$/i.test(r.name))))continue;
  let added=0;
  for(const a of r.athletes){
   const source=londonSplits.athletes.find(s=>s.id===a.id || (s.name===a.name && s.group===a.group));
   if(!source)continue;
   const merged=[...a.splits,...source.splits.filter(s=>!a.splits.some(old=>old.distance===s.distance))].sort((a,b)=>a.distance-b.distance);
   // An existing manual value can conflict with an added checkpoint: preserve that athlete in full.
   try{validateData({version:1,races:[{...r,athletes:[{...a,splits:merged}]}]});}catch{continue;}
   added+=merged.length-a.splits.length;
   a.splits=merged;a.splitSourceUrl=source.splitSourceUrl;
  }
  if(added){
   r.sources=[...(r.sources||[]),...londonSplits.sources.filter(s=>!(r.sources||[]).some(old=>old.url===s.url))];
   r.sourceNote=londonSplits.sourceNote;r.splitSourceNotes=londonSplits.splitSourceNotes;
  }
 }
 validateData(updated);
 const raw=storage.getItem('elite-marathon.v1');
 if(raw)storage.setItem('elite-marathon.backup.before-split-import',raw);
 storage.setItem('elite-marathon.v1',JSON.stringify(updated));
 storage.setItem(SPLIT_IMPORT_MARKER,'done');
 return updated;
}
