import test from 'node:test';
import assert from 'node:assert/strict';
import {restoredWorkspace} from '../dist/restored-workspace.mjs';
import {importLondonSplits} from '../dist/split-import.mjs';
import {POINTS,metrics,validateData} from '../dist/core.mjs';
const key='elite-marathon.v1';
function storage(d){const m=new Map([[key,JSON.stringify(d)]]);return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
test('adds 72 sourced checkpoints, preserves original finish and backs up',()=>{
 const d=structuredClone(restoredWorkspace),s=storage(d),r=importLondonSplits(s,d);
 assert.deepEqual(JSON.parse(s.getItem('elite-marathon.backup.before-split-import')),d);
 r.races[0].athletes.forEach((a,i)=>{
  assert.deepEqual(a.splits.map(p=>p.distance),POINTS);
  assert.deepEqual(a.splits.at(-1),d.races[0].athletes[i].splits[0]);
  assert.equal(metrics(a.splits,a.target).length,10);
 });
 assert.equal(r.races[0].athletes[0].splits[4].seconds,3629);
 assert.equal(r.races[0].athletes[7].splits[4].seconds,4099);
 assert.equal(r.races[0].sourceNote.includes('第三方'),true);validateData(r);
});
test('manual values stay unchanged; deleted athletes and races not recreated',()=>{
 const d=structuredClone(restoredWorkspace);d.races[0].athletes.pop();
 d.races[0].athletes[0].splits.unshift({distance:5,seconds:855});
 const r=importLondonSplits(storage(d),d);assert.equal(r.races[0].athletes.length,7);assert.equal(r.races[0].athletes[0].splits[0].seconds,855);
 d.races[0].name='Other';d.races[0].id='other';assert.deepEqual(importLondonSplits(storage(d),d),d);
});
test('one-time import respects later deletions and skips conflicting athlete',()=>{
 const d=structuredClone(restoredWorkspace),s=storage(d),r=importLondonSplits(s,d);
 r.races[0].athletes[0].splits.shift();assert.deepEqual(importLondonSplits(s,r),r);
 d.races[0].athletes[0].splits.unshift({distance:5,seconds:3000});
 const conflict=importLondonSplits(storage(d),d);assert.deepEqual(conflict.races[0].athletes[0],d.races[0].athletes[0]);
 assert.equal(conflict.races[0].athletes[1].splits.length,10);
});
