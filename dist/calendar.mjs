import {calendarDays,shiftMonth} from './core.mjs';
export function mountCalendar(root) {
  const input=root.querySelector('[name="date"]'),toggle=root.querySelector('#date-toggle'),panel=root.querySelector('#date-calendar');
  let year,month;
  const iso=day=>`${String(year).padStart(4,'0')}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const close=()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');};
  function draw(focus) {
    const {offset,count}=calendarDays(year,month);
    panel.innerHTML=`<div class="calendar-heading"><strong id="calendar-month" aria-live="polite">${year} 年 ${month+1} 月</strong><div><button type="button" data-month="-1" aria-label="月份减少" title="上一个月" ${year===1&&month===0?'disabled':''}>−</button><button type="button" data-month="1" aria-label="月份增加" title="下一个月" ${year===9999&&month===11?'disabled':''}>+</button></div></div><div class="calendar-grid">${['日','一','二','三','四','五','六'].map(x=>`<span class="weekday">${x}</span>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:count},(_,i)=>`<button type="button" data-day="${i+1}" aria-label="${year}年${month+1}月${i+1}日" aria-pressed="${input.value===iso(i+1)}" class="${input.value===iso(i+1)?'selected':''}">${i+1}</button>`).join('')}</div><div class="calendar-footer"><button type="button" id="calendar-today">今天</button><button type="button" id="calendar-close">收起</button></div>`;
    panel.querySelectorAll('[data-month]').forEach(button=>button.onclick=()=>{const next=shiftMonth(year,month,Number(button.dataset.month));year=next.year;month=next.month;draw(`[data-month="${button.dataset.month}"]`);});
    panel.querySelectorAll('[data-day]').forEach(button=>{button.onclick=()=>{input.value=iso(Number(button.dataset.day));input.dispatchEvent(new Event('change',{bubbles:true}));close();toggle.focus();};button.onkeydown=e=>{const offsets={ArrowLeft:-1,ArrowRight:1,ArrowUp:-7,ArrowDown:7};if(e.key in offsets){e.preventDefault();panel.querySelector(`[data-day="${Math.max(1,Math.min(count,Number(button.dataset.day)+offsets[e.key]))}"]`)?.focus();}};});
    panel.querySelector('#calendar-today').onclick=()=>{const today=new Date();year=today.getFullYear();month=today.getMonth();input.value=iso(today.getDate());input.dispatchEvent(new Event('change',{bubbles:true}));close();toggle.focus();};
    panel.querySelector('#calendar-close').onclick=()=>{close();toggle.focus();};
    if(focus)panel.querySelector(focus)?.focus();
  }
  toggle.onclick=()=>{if(!panel.hidden){close();return;}const match=/^(\d{4})-(\d{2})-\d{2}$/.exec(input.value);const today=new Date();year=match?Math.max(1,Number(match[1])):today.getFullYear();month=match?Math.max(0,Math.min(11,Number(match[2])-1)):today.getMonth();panel.hidden=false;toggle.setAttribute('aria-expanded','true');draw();};
  root.addEventListener('click',e=>{if(!e.composedPath().some(el=>el.classList?.contains('date-control')))close();});
  const dialog=root.closest('dialog');
  if(dialog)dialog.oncancel=e=>{if(!panel.hidden){e.preventDefault();close();toggle.focus();}};
}
