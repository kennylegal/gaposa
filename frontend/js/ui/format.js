export const todayISO=()=>new Date().toISOString().slice(0,10);
export const dayOffset=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
export const fmtDate=d=>d?new Date(d+'T00:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—';
export const age=dob=>{if(!dob)return '—';const b=new Date(dob),n=new Date();let a=n.getFullYear()-b.getFullYear();
const m=n.getMonth()-b.getMonth();if(m<0||(m===0&&n.getDate()<b.getDate()))a--;return a};
export const initials=s=>((s?.firstName?.[0]||'?')+(s?.lastName?.[0]||'')).toUpperCase();
export const money=n=>'₦'+Number(n||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
export const daysUntil=d=>Math.ceil((new Date(d)-new Date(todayISO()))/86400000);
