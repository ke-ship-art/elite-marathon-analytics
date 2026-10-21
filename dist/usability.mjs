export function localDate(now=new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}
export function niceTicks(low,high,kind='pace') {
  const range=Math.max(high-low,10),raw=range/4;
  const magnitude=10**Math.floor(Math.log10(raw));
  const timeSteps=[1,2,5,10,15,30,60,120,300,600,900,1800,3600,7200,14400,21600,43200,86400];
  const step=kind==='pace'?[1,2,5,10].map(n=>n*magnitude).find(n=>n>=raw):(timeSteps.find(n=>n>=raw)||Math.ceil(raw/86400)*86400);
  const min=Math.floor((low-range*.1)/step)*step,max=Math.ceil((high+range*.1)/step)*step;
  return {min,max,values:Array.from({length:Math.round((max-min)/step)+1},(_,i)=>min+i*step)};
}
export function chartGeometry(width) {
  const height=Math.max(250,Math.min(320,Math.round(width*.28)));
  return {height,plotHeight:height-65,labelY:index=>width<640?(index%2===1?height-4:height-20):(index===4?height-4:height-20)};
}
export function leaderSummary(rows) {
  const count=rows.filter(row=>row.gap===0).length;
  return {count,tied:count>1,names:rows.filter(row=>row.gap===0).map(row=>row.athlete.name)};
}
export function focusSelector(element) {
  if(!element || element===document.body)return null;
  if(element.id)return '#'+CSS.escape(element.id);
  for(const attribute of ['data-page','data-group','data-mode','data-visible','data-tick','data-athlete','data-chart-scope','data-edit']) {
    if(element.hasAttribute(attribute))return `[${attribute}="${CSS.escape(element.getAttribute(attribute))}"]`+(attribute==='data-edit'&&element.hasAttribute('data-distance')?`[data-distance="${CSS.escape(element.getAttribute('data-distance'))}"]`:'');
  }
  return null;
}
export function restoreFocus(selector) {
  if(selector)document.querySelector(selector)?.focus({preventScroll:true});
}
