import { $,esc } from './dom.js';
import { icon } from './icons.js';
import { store,studentName } from '../store.js';
import { navigate } from '../router.js';
const PAGES=[
    {kind:'Page',icon:'grid',title:'Dashboard',route:'dashboard'},
    {kind:'Page',icon:'users',title:'Students',route:'students'},
    {kind:'Page',icon:'clipboard',title:'Clinic Visits',route:'visits'},
    {kind:'Page',icon:'pill',title:'Pharmacy',route:'pharmacy'},
    {kind:'Page',icon:'box',title:'Inventory',route:'inventory'},
    {kind:'Page',icon:'flask',title:'Lab Requests',route:'lab'},
    {kind:'Page',icon:'chart',title:'Reports',route:'reports'},
    {kind:'Page',icon:'history',title:'Audit Log',route:'audit'},
    {kind:'Page',icon:'gear',title:'Settings',route:'settings'}];
let open=false,idx=0,results=[];
export function init(){
    const root=$('#cmd-palette');
    root.addEventListener('click',e=>{if(e.target===root)close()});
    document.addEventListener('keydown',e=>{
        if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();toggle()}
        if(!open)return;
        if(e.key==='Escape')close();
        if(e.key==='ArrowDown'){e.preventDefault();move(1)}
        if(e.key==='ArrowUp'){e.preventDefault();move(-1)}
        if(e.key==='Enter'){e.preventDefault();pick()}});
}
export const toggle=()=>open?close():show();
function show(){
    open=true;const r=$('#cmd-palette');r.hidden=false;
    r.innerHTML='<div class="cmdk-box"><input class="cmdk-input" id="cmdk-input" placeholder="Search students, pages…" autocomplete="off"><div class="cmdk-results" id="cmdk-results"></div></div>';
    const inp=$('#cmdk-input');inp.focus();
    inp.addEventListener('input',()=>update(inp.value));update('');
}
function close(){open=false;$('#cmd-palette').hidden=true;$('#cmd-palette').innerHTML=''}
function update(q){
    const t=q.trim().toLowerCase();const out=[];
    PAGES.forEach(p=>{if(!t||p.title.toLowerCase().includes(t))out.push(p)});
    if(t){
        store.students.forEach(s=>{
            const hay=(s.firstName+' '+s.lastName+' '+s.studentId+' '+(s.department||'')).toLowerCase();
            if(hay.includes(t))out.push({kind:'Student',icon:'users',title:s.firstName+' '+s.lastName,
                sub:s.studentId+' · '+(s.department||''),route:'student',params:{id:s.id}});
        });
        store.visits.forEach(v=>{
            const hay=((v.diagnosis||'')+' '+v.complaint).toLowerCase();
            if(hay.includes(t))out.push({kind:'Visit',icon:'clipboard',title:v.diagnosis||v.complaint,
                sub:(v.student?studentName(v.student):'?')+' · '+v.date,route:'visits'});
        });
    }
    results=out.slice(0,30);idx=0;render();
}
function render(){
    const box=$('#cmdk-results');
    if(!results.length){box.innerHTML='<div class="cmdk-empty">No matches</div>';return}
    box.innerHTML=results.map((r,i)=>'<div class="cmdk-item '+(i===idx?'selected':'')+'" data-idx="'+i+'">'+icon(r.icon)+
        '<div class="cmdk-item-body"><div class="cmdk-item-title">'+esc(r.title)+'</div>'+
        (r.sub?'<div class="cmdk-item-sub">'+esc(r.sub)+'</div>':'')+'</div>'+
        '<span class="cmdk-kind">'+esc(r.kind)+'</span></div>').join('');
    box.querySelectorAll('.cmdk-item').forEach(el=>el.addEventListener('click',()=>{idx=+el.dataset.idx;pick()}));
}
function move(d){if(!results.length)return;idx=(idx+d+results.length)%results.length;render()}
function pick(){const r=results[idx];if(!r)return;close();navigate(r.route,r.params||{})}
