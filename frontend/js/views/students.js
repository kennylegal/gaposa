import { store,deleteStudent } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { age,initials } from '../ui/format.js';
import { navigate } from '../router.js';
import { renderPaginator } from '../ui/paginator.js';
export const title='Students';
export const roles=['admin','doctor','nurse','pharmacist','receptionist'];
const state={q:'',faculty:'',level:'',page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
function params(){const p={page:state.page,page_size:state.page_size};
    if(state.q)p.search=state.q;if(state.faculty)p.faculty=state.faculty;
    if(state.level)p.level=state.level;p.ordering='last_name';return p}
export async function render(root){
    root.innerHTML='<div class="page-head"><div><h2>Student Records</h2>'+
        '<p class="muted" id="cnt">Loading…</p></div>'+
        '<div class="page-head-actions"><button class="btn primary" id="new">'+icon('plus')+' Register Student</button></div></div>'+
        '<div class="card"><div class="toolbar">'+
        '<div class="search">'+icon('search')+'<input class="input" id="q" placeholder="Search name, matric…" value="'+esc(state.q)+'"></div>'+
        '<select class="input" id="fac" style="max-width:180px"><option value="">All faculties</option></select>'+
        '<select class="input" id="lvl" style="max-width:140px"><option value="">All levels</option>'+
        ['100','200','300','400','500','600','Postgraduate'].map(l=>'<option'+(state.level===l?' selected':'')+'>'+l+'</option>').join('')+'</select>'+
        '<select class="input" id="sz" style="max-width:110px">'+
        [10,25,50,100].map(n=>'<option'+(state.page_size===n?' selected':'')+'>'+n+'</option>').join('')+'</select>'+
        '</div><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    // Populate faculty dropdown after first load so we can derive from results
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        tbl.innerHTML='<div class="empty"><strong>Loading…</strong></div>';
        try{
            let list;
            if(API_ENABLED){const res=await api.students.list(params());list=res.results;meta=res}
            else{
                const t=state.q.trim().toLowerCase();
                const all=store.students.filter(s=>{
                    const hay=(s.firstName+' '+s.lastName+' '+s.studentId+' '+s.department+' '+s.faculty).toLowerCase();
                    return (!t||hay.includes(t))&&(!state.faculty||s.faculty===state.faculty)&&(!state.level||s.level===state.level)});
                meta={count:all.length,page:state.page,pages:Math.ceil(all.length/state.page_size),page_size:state.page_size};
                const from=(state.page-1)*state.page_size;list=all.slice(from,from+state.page_size);
            }
            document.getElementById('cnt').textContent=meta.count+' student'+(meta.count===1?'':'s');
            tbl.innerHTML=list.length?'<table class="table"><thead><tr>'+
                '<th>Student</th><th>Matric</th><th>Faculty / Dept</th><th>Level</th><th>Blood</th><th>Visits</th><th></th></tr></thead><tbody>'+
                list.map(s=>'<tr><td><div class="cell-user"><div class="avatar">'+initials(s)+'</div>'+
                    '<div><strong>'+esc(s.firstName)+' '+esc(s.lastName)+'</strong>'+
                    '<div class="muted small">'+esc(s.gender)+' · '+age(s.dob)+' yrs</div></div></div></td>'+
                    '<td><code>'+esc(s.studentId)+'</code></td>'+
                    '<td>'+esc(s.faculty||'')+'<div class="muted small">'+esc(s.department||'')+'</div></td>'+
                    '<td><span class="badge badge-info">'+esc(s.level||'')+'L</span></td>'+
                    '<td>'+(s.bloodGroup||'—')+'</td>'+
                    '<td>—</td>'+
                    '<td class="right"><button class="icon-btn" data-view="'+s.id+'">'+icon('eye')+'</button></td></tr>').join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('users')+'</div><strong>No students found</strong></div>';
            tbl.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate('student',{id:b.dataset.view})));
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    let t;
    document.getElementById('q').addEventListener('input',e=>{clearTimeout(t);
        t=setTimeout(()=>{state.q=e.target.value;state.page=1;load()},250)});
    document.getElementById('fac').addEventListener('change',e=>{state.faculty=e.target.value;state.page=1;load()});
    document.getElementById('lvl').addEventListener('change',e=>{state.level=e.target.value;state.page=1;load()});
    document.getElementById('sz').addEventListener('change',e=>{state.page_size=+e.target.value;state.page=1;load()});
    document.getElementById('new').addEventListener('click',()=>import('../components/modals.js').then(m=>m.studentModal(null)));
    await load();
}
