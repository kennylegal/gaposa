import { store,deleteVisit } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { fmtDate } from '../ui/format.js';
import { renderPaginator } from '../ui/paginator.js';
import { confirmDialog } from '../ui/modal.js';
import { toast } from '../ui/toast.js';
import { currentRole } from '../auth.js';
export const title='Clinic Visits';
export const roles=['admin','doctor','nurse','pharmacist','receptionist'];
const state={q:'',status:'',page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
export async function render(root){
    const role=currentRole();
    if(!state.status&&(role==='doctor'||role==='nurse'))state.status='awaiting_doctor';
    const canCreate=role==='nurse'||role==='admin';
    root.innerHTML='<div class="page-head"><div><h2>Clinic Visits</h2>'+
        '<p class="muted" id="cnt">Loading…</p></div>'+
        '<div class="page-head-actions">'+(canCreate?'<button class="btn primary" id="new">'+icon('plus')+' Record New Visit</button>':'')+'</div></div>'+
        '<div class="card"><div class="toolbar">'+
        '<div class="search">'+icon('search')+'<input class="input" id="q" placeholder="Search student, complaint…" value="'+esc(state.q)+'"></div>'+
        '<select class="input" id="st" style="max-width:210px">'+
        '<option value="">All statuses</option>'+
        '<option value="awaiting_doctor"'+(state.status==='awaiting_doctor'?' selected':'')+'>Awaiting doctor</option>'+
        '<option value="completed"'+(state.status==='completed'?' selected':'')+'>Completed</option>'+
        '<option value="referred"'+(state.status==='referred'?' selected':'')+'>Referred</option>'+
        '</select></div><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        tbl.innerHTML='<div class="empty"><strong>Loading…</strong></div>';
        try{
            let list;
            if(API_ENABLED){const p={page:state.page,page_size:state.page_size,ordering:'-date'};
                if(state.q)p.search=state.q;if(state.status)p.status=state.status;
                const res=await api.visits.list(p);list=res.results;meta=res;
            } else {
                const t=state.q.trim().toLowerCase();
                const all=store.visits.filter(v=>{const s=store.students.find(x=>String(x.id)===String(v.studentId));
                    const hay=((s?s.firstName+' '+s.lastName:'')+' '+(v.diagnosis||'')+' '+v.complaint+' '+v.attending).toLowerCase();
                    return (!t||hay.includes(t))&&(!state.status||v.status===state.status)})
                    .sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
                meta={count:all.length,page:state.page,pages:Math.ceil(all.length/state.page_size),page_size:state.page_size};
                const from=(state.page-1)*state.page_size;list=all.slice(from,from+state.page_size);
            }
            document.getElementById('cnt').textContent=meta.count+' consultation'+(meta.count===1?'':'s');
            tbl.innerHTML=list.length?'<table class="table"><thead><tr>'+
                '<th>Date</th><th>Student</th><th>Complaint</th><th>Vitals</th><th>Diagnosis</th><th>Status</th><th></th></tr></thead><tbody>'+
                list.map(v=>{
                    // Prefer embedded student; fall back to store (local mode)
                    const s=v.student||store.students.find(x=>String(x.id)===String(v.studentId));
                    const cls=v.status==='completed'?'success':v.status==='referred'?'info':'warn';
                    const lbl=v.status==='completed'?'Completed':v.status==='referred'?'Referred':'Awaiting doctor';
                    const v_t=v.vitals||{};
                    const vitals='BP '+esc(v_t.bp||'—')+' · '+esc(v_t.temp||'—')+'°C · '+esc(v_t.pulse||'—')+' bpm';
                    const dg=v.diagnosis?esc(v.diagnosis):'<span class="muted small">Pending</span>';
                    let action='';
                    if(v.status==='awaiting_doctor'){
                        if(role==='doctor'||role==='admin')action='<button class="btn sm primary" data-consult="'+v.id+'">Consult</button>';
                        else if(role==='nurse')action='<button class="icon-btn" data-edit="'+v.id+'" title="Edit">'+icon('edit')+'</button>';
                    }
                    action+='<button class="icon-btn" data-print="'+v.id+'" title="Print">'+icon('print')+'</button>';
                    if(role==='admin')action+='<button class="icon-btn danger" data-del="'+v.id+'">'+icon('trash')+'</button>';
                    return '<tr><td><strong>'+fmtDate(v.date)+'</strong><div class="muted small">'+esc(v.time)+'</div></td>'+
                        '<td><div class="cell-user"><div class="avatar sm">'+((s?.firstName?.[0]||'?')+(s?.lastName?.[0]||'')).toUpperCase()+'</div>'+
                        '<div><strong>'+(s?esc(s.firstName)+' '+esc(s.lastName):'?')+'</strong>'+
                        '<div class="muted small">'+(s?esc(s.studentId):'')+'</div></div></div></td>'+
                        '<td style="max-width:220px">'+esc(v.complaint)+'</td>'+
                        '<td class="muted small">'+vitals+'</td>'+
                        '<td>'+dg+'</td>'+
                        '<td><span class="badge badge-'+cls+'">'+lbl+'</span></td>'+
                        '<td class="right">'+action+'</td></tr>';
                }).join('')+'</tbody></table>':
                '<div class="empty"><div class="empty-ico">'+icon('clipboard')+'</div><strong>No visits found</strong></div>';
            tbl.querySelectorAll('[data-consult]').forEach(b=>b.addEventListener('click',()=>{
                const v=store.visits.find(x=>String(x.id)===String(b.dataset.consult));
                // In API mode, ensure we have a fresh visit with embedded student
                const target=v||{id:b.dataset.consult};
                import('../components/modals.js').then(m=>m.doctorConsultModal(target,()=>load()))}));
            tbl.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>{
                const v=store.visits.find(x=>String(x.id)===String(b.dataset.edit));
                import('../components/modals.js').then(m=>m.nurseVisitModal(v||{id:b.dataset.edit},()=>load()))}));
            tbl.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>{
                const v=store.visits.find(x=>String(x.id)===String(b.dataset.print));
                if(v)import('../print.js').then(m=>m.printVisit(v.id));
                else import('../print.js').then(async m=>{
                    // Fetch visit then print
                    try{const x=await api.visits.get(b.dataset.print);store.visits.push(x);m.printVisit(x.id)}
                    catch(e){toast(e.message,'error')}})}));
            tbl.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
                confirmDialog('Delete visit?','Moves to Trash.','Delete',async()=>{
                    try{await deleteVisit(b.dataset.del);toast('Trashed.','warn');load()}
                    catch(e){toast(e.message,'error')}})}));
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    let t;
    document.getElementById('q').addEventListener('input',e=>{clearTimeout(t);
        t=setTimeout(()=>{state.q=e.target.value;state.page=1;load()},250)});
    document.getElementById('st').addEventListener('change',e=>{state.status=e.target.value;state.page=1;load()});
    const nb=document.getElementById('new');
    if(nb)nb.addEventListener('click',()=>import('../components/modals.js').then(m=>m.nurseVisitModal(null,()=>load())));
    await load();
}
