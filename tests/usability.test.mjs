import test from 'node:test';
import assert from 'node:assert/strict';
import {localDate,niceTicks,chartGeometry,leaderSummary} from '../dist/usability.mjs';
test('fallback date is valid local calendar date',()=>{assert.equal(localDate(new Date(2026,0,2,23)), '2026-01-02');});
test('chart ticks contain data and use uniform readable steps',()=>{
 for(const [low,high] of [[170,185],[-5,16],[0,0],[3600,4000],[-100,100]]){
  const t=niceTicks(low,high);assert.ok(t.min<=low&&t.max>=high&&t.max>t.min);
  const step=t.values[1]-t.values[0];assert.ok(step>=1);
  assert.ok(t.values.every((v,i)=>i===0||Math.abs(v-t.values[i-1]-step)<1e-9));
 }
});
test('light accent clears AA for small text on white and tinted surfaces',()=>{
 const rgb=h=>[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));
 const l=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
 const fg=rgb('6240d6');for(const base of ['ffffff','f0f4fa'])for(const alpha of [0,.05,.12]){
  const bg=rgb(base).map((v,i)=>v*(1-alpha)+fg[i]*alpha);assert.ok((l(bg)+.05)/(l(fg)+.05)>=4.5);
 }
});
test('gap ticks use minute-friendly steps for broad time ranges',()=>{
 for(const [a,b] of [[-80,200],[0,450],[-600,900],[0,36000]]){const t=niceTicks(a,b,'gap'),step=t.values[1]-t.values[0];assert.ok(step%30===0);assert.ok(t.min<=a&&t.max>=b);}
});
test('chart adapts height and staggers crowded end labels',()=>{
 for(const width of [300,480,520,560,580,600,620]){const g=chartGeometry(width);assert.notEqual(g.labelY(8),g.labelY(9));assert.notEqual(g.labelY(3),g.labelY(4));}
 assert.equal(chartGeometry(400).height,250);assert.ok(chartGeometry(1200).height>=300);
});
test('leader summary distinguishes zero gap ties from second place',()=>{
 const rows=[{gap:0,athlete:{name:'A'}},{gap:0,athlete:{name:'B'}},{gap:0,athlete:{name:'C'}},{gap:15,athlete:{name:'D'}}];
 assert.deepEqual(leaderSummary(rows),{count:3,tied:true,names:['A','B','C']});assert.equal(leaderSummary(rows.slice(0,1)).tied,false);assert.equal(leaderSummary([]).count,0);
});
