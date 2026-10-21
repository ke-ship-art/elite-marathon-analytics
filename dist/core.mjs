export const DISTANCE = 42.195;
export const POINTS = [5,10,15,20,21.0975,25,30,35,40,DISTANCE];
export const COLORS = ['#b5ed63','#6fafff','#b699ff','#ffb46c','#ff7296','#50d8ca','#d1c551','#db8be8'];
export const uid = () => crypto.randomUUID();
export const label = d => d === DISTANCE ? '终点' : d === 21.0975 ? '半程' : `${d}K`;
export const GROUPS = {men:'男子精英组',women:'女子精英组',open:'未分组'};
export const groupAthletes = (athletes,group) => athletes.filter(a=>(a.group||'open')===group);
export function shiftMonth(year,month,amount) {
  const total=year*12+month+amount;
  return {year:Math.floor(total/12),month:((total%12)+12)%12};
}
export function calendarDays(year,month) {
  const first=new Date(0);first.setUTCFullYear(year,month,1);first.setUTCHours(0,0,0,0);
  const count=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  return {offset:first.getUTCDay(),count};
}
export function parseTime(input) {
  if (typeof input !== 'string' || !/^(?:\d{1,3}:\d{2}:\d{2}|\d{1,3}:\d{2})$/.test(input.trim())) throw Error('请输入 H:MM:SS 或 MM:SS 格式');
  const p = input.trim().split(':').map(Number);
  if (p.at(-1) >= 60 || (p.length === 3 && p[1] >= 60)) throw Error('分、秒必须小于 60');
  const seconds = p.length === 3 ? p[0]*3600+p[1]*60+p[2] : p[0]*60+p[1];
  if (seconds <= 0 || seconds > 48*3600) throw Error('用时必须大于 0 且不超过 48 小时');
  return seconds;
}
export function time(s) {
  if (!Number.isFinite(s)) return '—';
  s = Math.round(Math.abs(s));
  return `${Math.floor(s/3600)}:${String(Math.floor(s/60)%60).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
export function pace(s) {
  if (!Number.isFinite(s)) return '—';
  s = Math.round(Math.abs(s));
  return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
}
export function delta(s) { return Number.isFinite(s) ? `${s < 0 ? '−' : '+'}${pace(s)}` : '—'; }
export function validateSplits(splits) {
  if (!Array.isArray(splits)) throw Error('计时数据必须是数组');
  let prev = 0, dist = 0;
  for (const s of splits) {
    if (!POINTS.includes(s.distance) || s.distance <= dist) throw Error('计时点必须按标准距离递增，且不能重复');
    if (!Number.isFinite(s.seconds) || s.seconds <= prev || s.seconds > 48*3600) throw Error(`${label(s.distance)} 累计用时必须大于前一计时点，且不超过 48 小时`);
    dist = s.distance; prev = s.seconds;
  }
  return splits;
}
export function metrics(splits, target = null) {
  validateSplits(splits);
  let prevD = 0, prevT = 0, prevP = null;
  return splits.map(s => {
    const segment = (s.seconds-prevT)/(s.distance-prevD);
    const row = {...s, from:prevD, segment, average:s.seconds/s.distance, change:prevP === null ? null : segment-prevP,
      projected:s.seconds/s.distance*DISTANCE, targetGap:target ? s.seconds-target*s.distance/DISTANCE : null};
    prevD=s.distance; prevT=s.seconds; prevP=segment;
    return row;
  });
}
export function standings(athletes, distance) {
  return athletes.map(a=>({athlete:a, record:metrics(a.splits,a.target).find(s=>s.distance===distance)})).filter(x=>x.record)
    .sort((a,b)=>a.record.seconds-b.record.seconds).map((x,i,all)=>({...x,rank:all.findIndex(y=>y.record.seconds===x.record.seconds)+1,gap:x.record.seconds-all[0].record.seconds}));
}
export function validateData(data) {
  if (!data || data.version !== 1 || !Array.isArray(data.races) || !data.races.length || data.races.length > 100) throw Error('需要 version: 1 且含 1–100 场赛事的 JSON');
  const ids = new Set();
  const str = (s,max) => typeof s==='string' && s.trim().length>0 && s.length<=max;
  for (const r of data.races) {
    if (!str(r.id,100)||ids.has(r.id)||!str(r.name,100)||typeof r.demo!=='boolean'||!Array.isArray(r.athletes)||r.athletes.length>200) throw Error('赛事字段无效、ID 重复或选手超过 200 人');
    ids.add(r.id);
    if (typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date))||new Date(r.date).toISOString().slice(0,10)!==r.date) throw Error('赛事日期格式无效');
    const athleteIds=new Set();
    for (const a of r.athletes) {
      if (!str(a.id,100)||athleteIds.has(a.id)||!str(a.name,80)||typeof a.bib!=='string'||a.bib.length>20||typeof a.country!=='string'||a.country.length>20||!/^#[a-f0-9]{6}$/i.test(a.color)) throw Error('选手字段无效或 ID 重复');
      athleteIds.add(a.id);
      if(a.group!==undefined&&!Object.hasOwn(GROUPS,a.group))throw Error('选手组别无效');
      if (a.target!==null && (!Number.isFinite(a.target)||a.target<=0||a.target>48*3600)) throw Error('目标成绩无效');
      validateSplits(a.splits);
    }
  }
  return data;
}
const LEGACY_HEADER=['race_id','race_name','date','demo','athlete_id','athlete_name','bib','country','color','target_seconds','distance_km','cumulative_seconds'];
const HEADER=[...LEGACY_HEADER,'group'];
// Leading formula characters are escaped for spreadsheet applications, and reversed on import.
const escapeCell = v => { let s=String(v??''); if (/^[=+\-@\t\r]/.test(s)) s="'"+s; return '"'+s.replaceAll('"','""')+'"'; };
export function toCSV(data) {
  const rows=[HEADER];
  for (const r of data.races) {
    const base=[r.id,r.name,r.date,String(r.demo)];
    if (!r.athletes.length) rows.push([...base,...Array(9).fill('')]);
    for (const a of r.athletes) for (const s of a.splits.length?a.splits:[null]) rows.push([...base,a.id,a.name,a.bib,a.country,a.color,a.target??'',s?.distance??'',s?.seconds??'',a.group??'']);
  }
  return '\uFEFF'+rows.map(row=>row.map(escapeCell).join(',')).join('\r\n');
}
export function parseCSV(text) {
  text=text.replace(/^\uFEFF/,'');
  const rows=[];let row=[],cell='',quoted=false,closed=false;
  for (let i=0;i<text.length;i++) {
    const c=text[i];
    if (quoted) { if(c==='"') {if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c; }
    else if(c==='"' && cell==='' && !closed) quoted=true;
    else if(c===','||c==='\n'||c==='\r') {
      row.push(cell.replace(/^'(?=[=+\-@\t\r])/,'') );cell='';closed=false;
      if(c!==','){if(c==='\r'&&text[i+1]==='\n')i++;if(row.some(x=>x!==''))rows.push(row);row=[];}
    } else {if(closed||c==='"')throw Error('CSV 引号格式无效');cell+=c;}
  }
  if(quoted)throw Error('CSV 引号未闭合');
  if(cell||row.length){row.push(cell.replace(/^'(?=[=+\-@\t\r])/,''));rows.push(row);}
  return rows;
}
export function fromCSV(text) {
  const rows=parseCSV(text);
  const header=rows.shift();
  if (![HEADER,LEGACY_HEADER].some(h=>JSON.stringify(header)===JSON.stringify(h))) throw Error('CSV 列名不匹配，请先导出模板');
  const races=[];
  for (const row of rows) {
    if(row.length!==header.length)throw Error('CSV 列数错误');
    const [id,name,date,demo,aid,aname,bib,country,color,target,distance,seconds,group]=row;
    if(!['true','false'].includes(demo))throw Error('demo 只能是 true 或 false');
    let r=races.find(r=>r.id===id);
    if(!r){r={id,name,date,demo:demo==='true',athletes:[]};races.push(r);}
    if(r.name!==name||r.date!==date||r.demo!==(demo==='true'))throw Error('同一赛事的元数据冲突');
    if(!aid){if(row.slice(4).some(Boolean))throw Error('空赛事行无效');continue;}
    let a=r.athletes.find(a=>a.id===aid);
    if(!a){a={id:aid,name:aname,bib,country,color,target:target===''?null:Number(target),splits:[],...(group?{group}:{})};r.athletes.push(a);}
    if((a.group||'')!==(group||''))throw Error('同一选手的组别冲突');
    if(a.name!==aname||a.bib!==bib||a.country!==country||a.color!==color||a.target!==(target===''?null:Number(target)))throw Error('同一选手的元数据冲突');
    if(distance!==''&&seconds!=='')a.splits.push({distance:Number(distance),seconds:Number(seconds)});
    else if(distance!==''||seconds!=='')throw Error('距离与累计用时必须同时填写');
  }
  for(const r of races)for(const a of r.athletes)a.splits.sort((a,b)=>a.distance-b.distance);
  return validateData({version:1,races});
}
export function demoRace() {
  const specs=[['Elias Kiprono','001','KEN',[880,1756,2621,3496,3689,4370,5230,6080]],['Daniel Bekele','002','ETH',[883,1759,2626,3500,3694,4381,5249,6102]],['Noah Kamau','003','KEN',[880,1757,2625,3503,3699,4394,5273,6138]],['Lucas Martin','004','FRA',[889,1779,2660,3544,3738,4435,5321,6201]],['Haruto Aoki','005','JPN',[892,1783,2678,3570,3767,4453,5350,6245]]];
  return {id:uid(),name:'城市精英马拉松 · 模拟赛',date:'2026-10-18',demo:true,athletes:specs.map(([name,bib,country,ss],i)=>({id:uid(),name,bib,country,color:COLORS[i],target: i<3?7380:7500,splits:ss.map((seconds,j)=>({distance:POINTS[j],seconds}))}))};
}
