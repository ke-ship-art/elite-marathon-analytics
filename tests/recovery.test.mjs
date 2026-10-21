import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverWorkspace,RECOVERY_MARKER} from '../dist/workspace-recovery.mjs';
import {demoRace} from '../dist/core.mjs';
const key='elite-marathon.v1';
function store(data){const values=new Map(data?[[key,JSON.stringify(data)]]:[]);return {getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)};}
test('fresh browser restores London with four men and four women',()=>{
 const s=store(),d=recoverWorkspace(s);assert.equal(d.races.length,1);
 for(const g of ['men','women'])assert.equal(d.races[0].athletes.filter(a=>a.group===g).length,4);
 assert.equal(s.getItem(RECOVERY_MARKER),'done');
});
test('unchanged starter is backed up and replaced',()=>{
 const old={version:1,races:[demoRace()]},s=store(old),d=recoverWorkspace(s);
 assert.equal(d.races.length,1);assert.equal(d.races[0].demo,false);
 assert.deepEqual(JSON.parse(s.getItem('elite-marathon.backup.before-london-recovery')),old);
});
test('user edits survive and deleted restored race is not resurrected',()=>{
 const r=demoRace();r.name='My race';const s=store({version:1,races:[r]});
 const d=recoverWorkspace(s);assert.equal(d.races.length,2);assert.deepEqual(d.races[1],r);
 s.setItem(key,JSON.stringify({version:1,races:[r]}));assert.deepEqual(recoverWorkspace(s).races,[r]);
});
test('existing London changes and corrupt storage are preserved',()=>{
 const s=store();const d=recoverWorkspace(s);d.races[0].athletes.pop();
 const other=store(d);assert.equal(recoverWorkspace(other).races[0].athletes.length,7);
 const corrupt=store();corrupt.setItem(key,'broken');assert.throws(()=>recoverWorkspace(corrupt));assert.equal(corrupt.getItem(key),'broken');
});
